from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database import get_db
from backend.models import Character, User
from backend.auth import get_current_user
from backend.game_data import (
    CLASS_SAVE_PROFICIENCIES, CLASS_ARMOR_PROFICIENCIES, CLASS_WEAPON_PROFICIENCIES,
    BACKGROUND_SKILL_PROFICIENCIES, SKILL_ABILITIES, calc_modifier,
    calc_starting_hp, get_species_speed, get_proficiency_bonus, get_species_list,
    get_subclasses, CLASS_SKILL_CHOICES
)

router = APIRouter(prefix="/api/characters", tags=["characters"])

# Pydantic Models for Request/Response
class CharacterBase(BaseModel):
    name: str
    species: str
    class_name: str
    background: str
    level: int = 1
    stats: dict = {}
    skill_choices: List[str] = []  # For class skill selections

class CharacterCreate(CharacterBase):
    pass

class CharacterResponse(CharacterBase):
    id: int
    user_id: int
    hp_current: Optional[int]
    hp_max: Optional[int]
    
    class Config:
        orm_mode = True

@router.post("/", response_model=CharacterResponse)
def create_character(char: CharacterCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_email = current_user.get('email')
    db_user = db.query(User).filter(User.email == user_email).first()
    
    if not db_user:
        # Auto-create user record if missing (first time action)
        db_user = User(
            email=user_email,
            name=current_user.get('name'),
            google_id=current_user.get('sub')
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    # Get stats with defaults
    stats = char.stats or {
        "strength": 10, "dexterity": 10, "constitution": 10,
        "intelligence": 10, "wisdom": 10, "charisma": 10
    }
    con_mod = calc_modifier(stats.get("constitution", 10))
    
    # Calculate HP based on class hit die
    hp = calc_starting_hp(char.class_name, con_mod)
    
    # Auto-apply proficiencies from class and background
    class_saves = CLASS_SAVE_PROFICIENCIES.get(char.class_name, [])
    class_armor = CLASS_ARMOR_PROFICIENCIES.get(char.class_name, [])
    class_weapons = CLASS_WEAPON_PROFICIENCIES.get(char.class_name, [])
    bg_skills = BACKGROUND_SKILL_PROFICIENCIES.get(char.background, [])
    
    # Combine background skills with any class skill choices provided
    all_skills = list(set(bg_skills + char.skill_choices))
    
    proficiencies = {
        "skills": all_skills,
        "saves": class_saves,
        "tools": [],
        "weapons": class_weapons,
        "armor": class_armor
    }
    
    # Get species speed
    speed = get_species_speed(char.species)
    
    new_char = Character(
        user_id=db_user.id,
        name=char.name,
        species=char.species,
        class_name=char.class_name,
        background=char.background,
        level=char.level,
        stats=stats,
        hp_max=hp,
        hp_current=hp,
        hit_dice_max=char.level,
        hit_dice_current=char.level,
        proficiencies=proficiencies,
        speed=speed
    )
    
    db.add(new_char)
    db.commit()
    db.refresh(new_char)
    return new_char

@router.get("/", response_model=List[CharacterResponse])
def get_my_characters(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_email = current_user.get('email')
    db_user = db.query(User).filter(User.email == user_email).first()
    
    if not db_user:
        return []
        
    return db_user.characters


# Helper function for ability modifier calculation
def calc_modifier(score: int) -> int:
    """Calculate ability modifier from score (D&D 5e formula)"""
    return (score - 10) // 2


class CharacterDetailResponse(CharacterBase):
    """Extended response model with all character details"""
    id: int
    user_id: int
    subclass: Optional[str]
    alignment: Optional[str]
    hp_current: Optional[int]
    hp_max: Optional[int]
    temp_hp: int = 0
    hit_dice_current: Optional[int]
    hit_dice_max: Optional[int]
    xp: int = 0
    renown: dict = {}
    piety: dict = {}
    bastion: dict = {}
    inventory: list = []
    spells: dict = {}
    # Computed modifiers
    modifiers: dict = {}
    
    class Config:
        orm_mode = True


class CharacterUpdate(BaseModel):
    """Partial update model - all fields optional"""
    name: Optional[str] = None
    level: Optional[int] = None
    hp_current: Optional[int] = None
    hp_max: Optional[int] = None
    temp_hp: Optional[int] = None
    hit_dice_current: Optional[int] = None
    xp: Optional[int] = None
    stats: Optional[dict] = None
    inventory: Optional[list] = None
    spells: Optional[dict] = None
    renown: Optional[dict] = None
    piety: Optional[dict] = None
    bastion: Optional[dict] = None
    subclass: Optional[str] = None
    alignment: Optional[str] = None


@router.get("/{character_id}")
def get_character(character_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get a single character by ID with computed modifiers"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_email = current_user.get('email')
    db_user = db.query(User).filter(User.email == user_email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    character = db.query(Character).filter(
        Character.id == character_id,
        Character.user_id == db_user.id
    ).first()
    
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Build response with computed modifiers
    stats = character.stats or {}
    modifiers = {
        ability: calc_modifier(stats.get(ability, 10))
        for ability in ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
    }
    
    return {
        "id": character.id,
        "user_id": character.user_id,
        "name": character.name,
        "level": character.level,
        "species": character.species,
        "class_name": character.class_name,
        "subclass": character.subclass,
        "background": character.background,
        "alignment": character.alignment,
        "stats": stats,
        "modifiers": modifiers,
        "proficiency_bonus": get_proficiency_bonus(character.level),
        "proficiencies": character.proficiencies or {"skills": [], "saves": [], "tools": [], "weapons": [], "armor": []},
        "hp_current": character.hp_current,
        "hp_max": character.hp_max,
        "temp_hp": character.temp_hp or 0,
        "hit_dice_current": character.hit_dice_current,
        "hit_dice_max": character.hit_dice_max,
        "armor_class": (character.armor_class or 10) + modifiers.get("dexterity", 0),
        "speed": character.speed or 30,
        "xp": character.xp or 0,
        "renown": character.renown or {},
        "piety": character.piety or {},
        "bastion": character.bastion or {},
        "inventory": character.inventory or [],
        "spells": character.spells or {}
    }


@router.put("/{character_id}")
def update_character(character_id: int, update: CharacterUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Update a character's fields (partial update)"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_email = current_user.get('email')
    db_user = db.query(User).filter(User.email == user_email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    character = db.query(Character).filter(
        Character.id == character_id,
        Character.user_id == db_user.id
    ).first()
    
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Update only provided fields
    update_data = update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(character, field, value)
    
    db.commit()
    db.refresh(character)
    
    # Return updated character with modifiers
    return get_character(character_id, db, current_user)


# ============== ROLL CALCULATION ENDPOINTS ==============

def _get_character_for_user(character_id: int, db: Session, current_user: dict) -> Character:
    """Helper to fetch character with ownership check"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_email = current_user.get('email')
    db_user = db.query(User).filter(User.email == user_email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    character = db.query(Character).filter(
        Character.id == character_id,
        Character.user_id == db_user.id
    ).first()
    
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    return character


@router.get("/{character_id}/roll/skill/{skill_name}")
def calc_skill_check(character_id: int, skill_name: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Calculate skill check modifier for a given skill"""
    character = _get_character_for_user(character_id, db, current_user)
    
    # Get the ability for this skill
    ability = SKILL_ABILITIES.get(skill_name)
    if not ability:
        raise HTTPException(status_code=400, detail=f"Unknown skill: {skill_name}")
    
    stats = character.stats or {}
    ability_mod = calc_modifier(stats.get(ability, 10))
    
    # Check if proficient
    proficiencies = character.proficiencies or {}
    skill_profs = proficiencies.get("skills", [])
    is_proficient = skill_name in skill_profs
    
    prof_bonus = get_proficiency_bonus(character.level) if is_proficient else 0
    total_modifier = ability_mod + prof_bonus
    
    return {
        "skill": skill_name,
        "ability": ability,
        "ability_modifier": ability_mod,
        "proficient": is_proficient,
        "proficiency_bonus": prof_bonus,
        "total_modifier": total_modifier,
        "display": f"+{total_modifier}" if total_modifier >= 0 else str(total_modifier)
    }


@router.get("/{character_id}/roll/save/{ability}")
def calc_saving_throw(character_id: int, ability: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Calculate saving throw modifier for a given ability"""
    character = _get_character_for_user(character_id, db, current_user)
    
    valid_abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
    ability = ability.lower()
    if ability not in valid_abilities:
        raise HTTPException(status_code=400, detail=f"Invalid ability: {ability}")
    
    stats = character.stats or {}
    ability_mod = calc_modifier(stats.get(ability, 10))
    
    # Check if proficient in this save
    proficiencies = character.proficiencies or {}
    save_profs = proficiencies.get("saves", [])
    is_proficient = ability in save_profs
    
    prof_bonus = get_proficiency_bonus(character.level) if is_proficient else 0
    total_modifier = ability_mod + prof_bonus
    
    return {
        "ability": ability,
        "ability_modifier": ability_mod,
        "proficient": is_proficient,
        "proficiency_bonus": prof_bonus,
        "total_modifier": total_modifier,
        "display": f"+{total_modifier}" if total_modifier >= 0 else str(total_modifier)
    }


@router.get("/{character_id}/roll/attack")
def calc_attack_roll(character_id: int, weapon_type: str = "melee", use_dex: bool = False, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Calculate attack roll modifier (generic, not weapon-specific yet)"""
    character = _get_character_for_user(character_id, db, current_user)
    
    stats = character.stats or {}
    
    # Determine ability modifier (STR for melee, DEX for ranged, or Finesse)
    if use_dex or weapon_type.lower() == "ranged":
        ability = "dexterity"
    else:
        ability = "strength"
    
    ability_mod = calc_modifier(stats.get(ability, 10))
    prof_bonus = get_proficiency_bonus(character.level)  # Assume proficient with equipped weapons
    
    to_hit = ability_mod + prof_bonus
    
    return {
        "weapon_type": weapon_type,
        "ability": ability,
        "ability_modifier": ability_mod,
        "proficiency_bonus": prof_bonus,
        "to_hit": to_hit,
        "display": f"+{to_hit}" if to_hit >= 0 else str(to_hit),
        "damage_bonus": ability_mod  # Damage uses same ability mod
    }


@router.get("/{character_id}/skills")
def get_all_skills(character_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get all 18 skills with their modifiers for a character"""
    character = _get_character_for_user(character_id, db, current_user)
    
    stats = character.stats or {}
    proficiencies = character.proficiencies or {}
    skill_profs = proficiencies.get("skills", [])
    prof_bonus = get_proficiency_bonus(character.level)
    
    skills = []
    for skill_name, ability in SKILL_ABILITIES.items():
        ability_mod = calc_modifier(stats.get(ability, 10))
        is_proficient = skill_name in skill_profs
        total = ability_mod + (prof_bonus if is_proficient else 0)
        
        skills.append({
            "name": skill_name,
            "ability": ability,
            "modifier": total,
            "proficient": is_proficient
        })
    
    return {"skills": skills}


# ========== GAME DATA ENDPOINTS ==========

@router.get("/game-data/species")
def get_all_species():
    """Get all available species for character creation"""
    return {"species": get_species_list()}


@router.get("/game-data/classes")
def get_all_classes():
    """Get all available classes with their skill choices"""
    classes = list(CLASS_SAVE_PROFICIENCIES.keys())
    class_data = []
    for class_name in classes:
        class_data.append({
            "name": class_name,
            "hit_die": "d12" if class_name == "Barbarian" else "d10" if class_name in ["Fighter", "Paladin", "Ranger"] else "d8" if class_name in ["Bard", "Cleric", "Druid", "Monk", "Warlock"] else "d6",
            "skill_choices": CLASS_SKILL_CHOICES.get(class_name, {"choose": 0, "from": []}),
            "subclasses": get_subclasses(class_name)
        })
    return {"classes": class_data}


@router.get("/game-data/subclasses/{class_name}")
def get_class_subclasses(class_name: str):
    """Get subclasses available for a specific class"""
    subclasses = get_subclasses(class_name)
    if not subclasses:
        raise HTTPException(status_code=404, detail=f"No subclasses found for class: {class_name}")
    return {"class_name": class_name, "subclasses": subclasses}


@router.get("/game-data/backgrounds")
def get_all_backgrounds():
    """Get all available backgrounds with their skill proficiencies"""
    backgrounds = []
    for name, skills in BACKGROUND_SKILL_PROFICIENCIES.items():
        backgrounds.append({
            "name": name,
            "skill_proficiencies": skills
        })
    return {"backgrounds": backgrounds}

