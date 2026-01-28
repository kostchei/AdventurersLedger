from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    characters = relationship("Character", back_populates="owner")

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Core Identity
    name = Column(String, index=True)
    level = Column(Integer, default=1)
    species = Column(String) # Human, Elf, etc.
    class_name = Column(String) # Fighter, Wizard, etc.
    subclass = Column(String, nullable=True)
    background = Column(String)
    alignment = Column(String, nullable=True)
    
    # Stats & Mechanics (Flexible JSON storage)
    stats = Column(JSON, default={
        "strength": 10, "dexterity": 10, "constitution": 10,
        "intelligence": 10, "wisdom": 10, "charisma": 10
    })
    
    # Vitals
    hp_current = Column(Integer)
    hp_max = Column(Integer)
    temp_hp = Column(Integer, default=0)
    hit_dice_current = Column(Integer)
    hit_dice_max = Column(Integer) # Usually equal to level
    
    # Progression
    xp = Column(Integer, default=0)
    
    # Specialized Trackers (JSON for flexibility)
    renown = Column(JSON, default={}) # {"Harpers": 5, "Zhentarim": 0}
    piety = Column(JSON, default={}) # {"Tyr": 3}
    bastion = Column(JSON, default={}) # {"turns": [], "facilities": []}
    
    # Inventory & Spells (Can be normalized later, but JSON is good for MVP)
    inventory = Column(JSON, default=[])
    spells = Column(JSON, default={"known": [], "prepared": [], "slots": {}})
    
    # Proficiencies (skills, saves, weapons, armor, tools)
    proficiencies = Column(JSON, default={
        "skills": [],           # ["Perception", "Stealth"]
        "saves": [],            # ["strength", "constitution"]
        "tools": [],            # ["Thieves' Tools"]
        "weapons": [],          # ["simple", "martial"]
        "armor": []             # ["light", "medium", "shields"]
    })
    
    # Combat stats
    armor_class = Column(Integer, default=10)  # Base AC (before DEX)
    speed = Column(Integer, default=30)        # Base speed in feet

    owner = relationship("User", back_populates="characters")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
