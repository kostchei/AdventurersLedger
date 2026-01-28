"""
D&D 5e 2024 Game Data
Extracted from SRD_CC_v5.2.1.md

Contains class proficiencies, background skill grants, and equipment data.
"""

# Saving throw proficiencies by class (from SRD Section: Core [Class] Traits)
CLASS_SAVE_PROFICIENCIES = {
    "Barbarian": ["strength", "constitution"],
    "Bard": ["dexterity", "charisma"],
    "Cleric": ["wisdom", "charisma"],
    "Druid": ["intelligence", "wisdom"],
    "Fighter": ["strength", "constitution"],
    "Monk": ["strength", "dexterity"],
    "Paladin": ["wisdom", "charisma"],
    "Ranger": ["strength", "dexterity"],
    "Rogue": ["dexterity", "intelligence"],
    "Sorcerer": ["constitution", "charisma"],
    "Warlock": ["wisdom", "charisma"],
    "Wizard": ["intelligence", "wisdom"]
}

# Skill choices available by class (player must choose from these)
CLASS_SKILL_CHOICES = {
    "Barbarian": {
        "choose": 2,
        "from": ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"]
    },
    "Bard": {
        "choose": 3,
        "from": "any"  # Bards can choose any 3 skills
    },
    "Cleric": {
        "choose": 2,
        "from": ["History", "Insight", "Medicine", "Persuasion", "Religion"]
    },
    "Druid": {
        "choose": 2,
        "from": ["Animal Handling", "Arcana", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"]
    },
    "Fighter": {
        "choose": 2,
        "from": ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Persuasion", "Survival"]
    },
    "Monk": {
        "choose": 2,
        "from": ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"]
    },
    "Paladin": {
        "choose": 2,
        "from": ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"]
    },
    "Ranger": {
        "choose": 3,
        "from": ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"]
    },
    "Rogue": {
        "choose": 4,
        "from": ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Persuasion", "Sleight of Hand", "Stealth"]
    },
    "Sorcerer": {
        "choose": 2,
        "from": ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"]
    },
    "Warlock": {
        "choose": 2,
        "from": ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"]
    },
    "Wizard": {
        "choose": 2,
        "from": ["Arcana", "History", "Insight", "Investigation", "Medicine", "Nature", "Religion"]
    }
}

# Hit dice per class
CLASS_HIT_DICE = {
    "Barbarian": "d12",
    "Bard": "d8",
    "Cleric": "d8",
    "Druid": "d8",
    "Fighter": "d10",
    "Monk": "d8",
    "Paladin": "d10",
    "Ranger": "d10",
    "Rogue": "d8",
    "Sorcerer": "d6",
    "Warlock": "d8",
    "Wizard": "d6"
}

# Armor proficiencies by class
CLASS_ARMOR_PROFICIENCIES = {
    "Barbarian": ["light", "medium", "shields"],
    "Bard": ["light"],
    "Cleric": ["light", "medium", "shields"],
    "Druid": ["light", "shields"],
    "Fighter": ["light", "medium", "heavy", "shields"],
    "Monk": [],
    "Paladin": ["light", "medium", "heavy", "shields"],
    "Ranger": ["light", "medium", "shields"],
    "Rogue": ["light"],
    "Sorcerer": [],
    "Warlock": ["light"],
    "Wizard": []
}

# Weapon proficiencies by class
CLASS_WEAPON_PROFICIENCIES = {
    "Barbarian": ["simple", "martial"],
    "Bard": ["simple"],
    "Cleric": ["simple"],
    "Druid": ["simple"],
    "Fighter": ["simple", "martial"],
    "Monk": ["simple", "martial_light"],  # Martial with Light property
    "Paladin": ["simple", "martial"],
    "Ranger": ["simple", "martial"],
    "Rogue": ["simple", "martial_finesse_light"],  # Martial with Finesse or Light
    "Sorcerer": ["simple"],
    "Warlock": ["simple"],
    "Wizard": ["simple"]
}

# Background skill proficiencies (common backgrounds from 2024 PHB/SRD)
BACKGROUND_SKILL_PROFICIENCIES = {
    "Acolyte": ["Insight", "Religion"],
    "Artisan": ["Investigation", "Persuasion"],
    "Charlatan": ["Deception", "Sleight of Hand"],
    "Criminal": ["Stealth", "Sleight of Hand"],
    "Entertainer": ["Acrobatics", "Performance"],
    "Farmer": ["Animal Handling", "Nature"],
    "Folk Hero": ["Animal Handling", "Survival"],
    "Guard": ["Athletics", "Perception"],
    "Guide": ["Stealth", "Survival"],
    "Hermit": ["Medicine", "Religion"],
    "Merchant": ["Investigation", "Persuasion"],
    "Noble": ["History", "Persuasion"],
    "Sage": ["Arcana", "History"],
    "Sailor": ["Acrobatics", "Perception"],
    "Scribe": ["History", "Investigation"],
    "Soldier": ["Athletics", "Intimidation"],
    "Wayfarer": ["Insight", "Stealth"]
}

# Skills mapped to their governing ability
SKILL_ABILITIES = {
    "Acrobatics": "dexterity",
    "Animal Handling": "wisdom",
    "Arcana": "intelligence",
    "Athletics": "strength",
    "Deception": "charisma",
    "History": "intelligence",
    "Insight": "wisdom",
    "Intimidation": "charisma",
    "Investigation": "intelligence",
    "Medicine": "wisdom",
    "Nature": "intelligence",
    "Perception": "wisdom",
    "Performance": "charisma",
    "Persuasion": "charisma",
    "Religion": "intelligence",
    "Sleight of Hand": "dexterity",
    "Stealth": "dexterity",
    "Survival": "wisdom"
}

# All skills list
ALL_SKILLS = list(SKILL_ABILITIES.keys())

# Proficiency bonus by level
def get_proficiency_bonus(level: int) -> int:
    """Calculate proficiency bonus from character level"""
    if level < 1:
        return 2
    return ((level - 1) // 4) + 2

# Ability modifier calculation
def calc_modifier(score: int) -> int:
    """Calculate ability modifier from score (D&D 5e formula)"""
    return (score - 10) // 2

# Starting HP calculation
def calc_starting_hp(class_name: str, con_modifier: int) -> int:
    """Calculate starting HP at level 1"""
    hit_die_max = {
        "d6": 6, "d8": 8, "d10": 10, "d12": 12
    }
    die = CLASS_HIT_DICE.get(class_name, "d8")
    return hit_die_max.get(die, 8) + con_modifier

# HP gain per level (average)
def calc_hp_per_level(class_name: str, con_modifier: int) -> int:
    """Calculate HP gained per level (using average)"""
    hit_die_avg = {
        "d6": 4, "d8": 5, "d10": 6, "d12": 7
    }
    die = CLASS_HIT_DICE.get(class_name, "d8")
    return hit_die_avg.get(die, 5) + con_modifier

# ============== SPECIES DATA (2024 Faerun Campaign) ==============

# Custom species list for Faerun campaign
SPECIES_LIST = [
    {
        "name": "Human",
        "speed": 30,
        "size": "Medium",
        "description": "Versatile and ambitious, humans are the most widespread species in Faerun."
    },
    {
        "name": "Elf",
        "speed": 30,
        "size": "Medium",
        "description": "Graceful and long-lived, elves possess keen senses and affinity for magic."
    },
    {
        "name": "Dwarf",
        "speed": 25,
        "size": "Medium",
        "description": "Short and stout, dwarves are known for their resilience and craftsmanship."
    },
    {
        "name": "Halfling",
        "speed": 25,
        "size": "Small",
        "description": "Small and nimble, halflings are known for their luck and bravery."
    },
    {
        "name": "Aasimar",
        "speed": 30,
        "size": "Medium",
        "description": "Celestial-touched beings with divine heritage and radiant abilities."
    },
    {
        "name": "Tiefling",
        "speed": 30,
        "size": "Medium",
        "description": "Infernal-touched beings bearing the mark of fiendish ancestry."
    },
    {
        "name": "Genasi",
        "speed": 30,
        "size": "Medium",
        "description": "Elemental-touched beings infused with the power of the Inner Planes."
    },
    {
        "name": "Half-Ogre",
        "speed": 30,
        "size": "Medium",
        "description": "Powerful and intimidating, half-ogres combine human cunning with ogre strength."
    },
    {
        "name": "Centaur",
        "speed": 40,
        "size": "Medium",
        "description": "Noble beings with the upper body of a humanoid and lower body of a horse."
    },
    {
        "name": "Lizardfolk",
        "speed": 30,
        "size": "Medium",
        "description": "Cold-blooded reptilian hunters with natural armor and primal instincts."
    },
    {
        "name": "Atomie",
        "speed": 25,
        "size": "Small",
        "description": "Tiny fey creatures with gossamer wings and mischievous spirits."
    }
]

# Species base speed lookup
SPECIES_BASE_SPEED = {s["name"]: s["speed"] for s in SPECIES_LIST}

def get_species_speed(species: str) -> int:
    """Get base speed for a species, default 30"""
    return SPECIES_BASE_SPEED.get(species, 30)

def get_species_list() -> list:
    """Get full species list with details"""
    return SPECIES_LIST


# ============== SUBCLASS DATA (PHB 2024 + Faerun Expansion + UA) ==============

CLASS_SUBCLASSES = {
    "Barbarian": [
        # PHB 2024
        {"name": "Path of the Berserker", "source": "PHB 2024", "level": 3},
        {"name": "Path of the Totem Warrior", "source": "PHB 2024", "level": 3},
        {"name": "Path of the Ancestral Guardian", "source": "PHB 2024", "level": 3},
        {"name": "Path of the Zealot", "source": "PHB 2024", "level": 3},
        {"name": "Path of Wild Heart", "source": "PHB 2024", "level": 3},
        {"name": "Path of the World Tree", "source": "PHB 2024", "level": 3},
    ],
    "Bard": [
        {"name": "College of Lore", "source": "PHB 2024", "level": 3},
        {"name": "College of Valor", "source": "PHB 2024", "level": 3},
        {"name": "College of Glamour", "source": "PHB 2024", "level": 3},
        {"name": "College of Dance", "source": "PHB 2024", "level": 3},
    ],
    "Cleric": [
        {"name": "Life Domain", "source": "PHB 2024", "level": 3},
        {"name": "Light Domain", "source": "PHB 2024", "level": 3},
        {"name": "Trickery Domain", "source": "PHB 2024", "level": 3},
        {"name": "War Domain", "source": "PHB 2024", "level": 3},
        {"name": "Knowledge Domain", "source": "Faerun Expansion", "level": 3},
    ],
    "Druid": [
        {"name": "Circle of the Land", "source": "PHB 2024", "level": 3},
        {"name": "Circle of the Moon", "source": "PHB 2024", "level": 3},
        {"name": "Circle of the Sea", "source": "PHB 2024", "level": 3},
        {"name": "Circle of Stars", "source": "PHB 2024", "level": 3},
    ],
    "Fighter": [
        {"name": "Champion", "source": "PHB 2024", "level": 3},
        {"name": "Battle Master", "source": "PHB 2024", "level": 3},
        {"name": "Eldritch Knight", "source": "PHB 2024", "level": 3},
        {"name": "Psi Warrior", "source": "PHB 2024", "level": 3},
        {"name": "Gladiator", "source": "Faerun Expansion", "level": 3},
        {"name": "Purple Dragon Knight (Banneret)", "source": "Faerun Expansion", "level": 3},
    ],
    "Monk": [
        {"name": "Way of the Open Hand", "source": "PHB 2024", "level": 3},
        {"name": "Way of Shadow", "source": "PHB 2024", "level": 3},
        {"name": "Way of the Four Elements", "source": "PHB 2024", "level": 3},
        {"name": "Way of Mercy", "source": "PHB 2024", "level": 3},
    ],
    "Paladin": [
        {"name": "Oath of Devotion", "source": "PHB 2024", "level": 3},
        {"name": "Oath of the Ancients", "source": "PHB 2024", "level": 3},
        {"name": "Oath of Vengeance", "source": "PHB 2024", "level": 3},
        {"name": "Oath of Glory", "source": "PHB 2024", "level": 3},
        {"name": "Oath of the Noble Genie", "source": "Faerun Expansion", "level": 3},
    ],
    "Ranger": [
        {"name": "Hunter", "source": "PHB 2024", "level": 3},
        {"name": "Beast Master", "source": "PHB 2024", "level": 3},
        {"name": "Gloom Stalker", "source": "PHB 2024", "level": 3},
        {"name": "Fey Wanderer", "source": "PHB 2024", "level": 3},
        {"name": "Winter Walker", "source": "Faerun Expansion", "level": 3},
    ],
    "Rogue": [
        {"name": "Thief", "source": "PHB 2024", "level": 3},
        {"name": "Assassin", "source": "PHB 2024", "level": 3},
        {"name": "Arcane Trickster", "source": "PHB 2024", "level": 3},
        {"name": "Soulknife", "source": "PHB 2024", "level": 3},
    ],
    "Sorcerer": [
        {"name": "Draconic Bloodline", "source": "PHB 2024", "level": 3},
        {"name": "Wild Magic", "source": "PHB 2024", "level": 3},
        {"name": "Aberrant Mind", "source": "PHB 2024", "level": 3},
        {"name": "Clockwork Soul", "source": "PHB 2024", "level": 3},
        {"name": "Spellfire Wielder", "source": "Faerun Expansion", "level": 3},
    ],
    "Warlock": [
        {"name": "The Archfey", "source": "PHB 2024", "level": 3},
        {"name": "The Fiend", "source": "PHB 2024", "level": 3},
        {"name": "The Great Old One", "source": "PHB 2024", "level": 3},
        {"name": "The Celestial", "source": "PHB 2024", "level": 3},
        {"name": "The Inquisitor", "source": "Faerun Expansion", "level": 3},
    ],
    "Wizard": [
        {"name": "School of Evocation", "source": "PHB 2024", "level": 3},
        {"name": "School of Abjuration", "source": "PHB 2024", "level": 3},
        {"name": "School of Illusion", "source": "PHB 2024", "level": 3},
        {"name": "School of Divination", "source": "PHB 2024", "level": 3},
        {"name": "Bladesinging", "source": "Faerun Expansion", "level": 3},
    ]
}

def get_subclasses(class_name: str) -> list:
    """Get available subclasses for a class"""
    return CLASS_SUBCLASSES.get(class_name, [])

