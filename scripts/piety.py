#!/usr/bin/env python3
"""
Generate Piety sections for all Gods of Faerun using the Anthropic API.
Processes gods in batches, with retry logic and progress tracking.
Appends Champions, Favor, Ideals, Earning/Losing Piety, and Piety Tier
sections to each god's existing entry.
"""

import anthropic
import json
import re
import time
import os
import sys

# --- Configuration ---
MODEL = "claude-sonnet-4-5-20250929"
MAX_TOKENS = 4096
INPUT_FILE = "/mnt/user-data/uploads/Gods_of_Faerun.txt"
PIETY_EXAMPLES_FILE = "/mnt/user-data/uploads/Piety_Examples.txt"
OUTPUT_FILE = "/home/claude/Gods_of_Faerun_with_Piety.txt"
PROGRESS_FILE = "/home/claude/piety_progress.json"
RETRY_DELAY = 5
MAX_RETRIES = 3

# --- God metadata for accurate generation ---
# Each god: (name, domain_summary, alignment_tendency, suggested_classes, cleric_domains, backgrounds, ability_scores_for_50)
GOD_DATA = {
    "Amaunator": {
        "domain": "sun, law, order, oaths, contracts",
        "alignment": "Usually lawful, often neutral",
        "classes": "Cleric, paladin, fighter, wizard",
        "cleric_domains": "Light, Order",
        "backgrounds": "Acolyte, noble, sage, soldier",
        "ability_50": "Intelligence or Wisdom",
        "earn_themes": "upholding law, enforcing contracts, exposing corruption, bringing light to darkness",
        "lose_themes": "breaking oaths, subverting law, aiding chaos or deception",
        "spell_3": "guiding bolt",
        "spell_10": "daylight",
        "trait_25": "When you succeed on a saving throw against being charmed or frightened, you can use your reaction to reflect the effect back on the caster. The caster must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + your Wisdom modifier) or be affected by the same condition until the end of their next turn.",
        "title_50": "Champion of the Eternal Sun"
    },
    "Asmodeus": {
        "domain": "indulgence, deals, contracts, ambition, the Nine Hells",
        "alignment": "Usually lawful, often evil",
        "classes": "Warlock, rogue, bard, paladin",
        "cleric_domains": "Trickery, Order",
        "backgrounds": "Charlatan, criminal, noble, courtier",
        "ability_50": "Charisma or Intelligence",
        "earn_themes": "brokering deals that favor Asmodeus, corrupting the virtuous, gaining power through manipulation",
        "lose_themes": "breaking a contract, showing weakness or mercy without strategic advantage, acting selflessly",
        "spell_3": "charm person",
        "spell_10": "suggestion",
        "trait_25": "When you make a Charisma (Persuasion) or Charisma (Deception) check to negotiate a deal or contract, you can treat a roll of 9 or lower on the d20 as a 10.",
        "title_50": "Champion of the Nine"
    },
    "Auril": {
        "domain": "winter, cold, ice, preservation through frost",
        "alignment": "Usually neutral, often evil",
        "classes": "Cleric, druid, ranger, warlock",
        "cleric_domains": "Nature, Tempest",
        "backgrounds": "Hermit, outlander, sailor, urchin",
        "ability_50": "Constitution or Wisdom",
        "earn_themes": "making sacrifices to stave off winter's wrath, preserving things in ice, enduring extreme cold without complaint",
        "lose_themes": "using fire to destroy ice or frozen landscapes, refusing to make offerings, sheltering others from cold without cost",
        "spell_3": "armor of Agathys",
        "spell_10": "sleet storm",
        "trait_25": "You have resistance to cold damage, and you ignore difficult terrain created by ice or snow.",
        "title_50": "Champion of the Everlasting Rime"
    },
    "Azuth": {
        "domain": "wizardry, spellcraft, the Art, magical innovation",
        "alignment": "Usually lawful, often neutral",
        "classes": "Wizard, sorcerer, cleric, artificer",
        "cleric_domains": "Arcana, Knowledge",
        "backgrounds": "Sage, acolyte, guild artisan, hermit",
        "ability_50": "Intelligence or Wisdom",
        "earn_themes": "creating new spells, teaching magic responsibly, preserving magical knowledge, enforcing the magebond",
        "lose_themes": "destroying magical knowledge, using magic recklessly in public, refusing to teach those with potential",
        "spell_3": "detect magic",
        "spell_10": "counterspell",
        "trait_25": "When you cast a spell of 3rd level or lower that targets only one creature and doesn't have a range of self, you can choose to also target a second creature within range with the same spell. Once you use this trait, you can't do so again until you finish a long rest.",
        "title_50": "Champion of the Art"
    },
    "Bane": {
        "domain": "tyranny, ambition, conquest, control",
        "alignment": "Usually lawful, often evil",
        "classes": "Fighter, cleric, paladin, warlock",
        "cleric_domains": "Order, War",
        "backgrounds": "Soldier, noble, criminal, acolyte",
        "ability_50": "Strength or Charisma",
        "earn_themes": "conquering territory, bringing order through strength, deposing weak rulers, crushing dissent",
        "lose_themes": "showing weakness, allowing rebellion to succeed, submitting to another's authority without gaining advantage",
        "spell_3": "command",
        "spell_10": "fear",
        "trait_25": "When you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your level, and each creature of your choice within 30 feet of you that can see you must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + your Charisma modifier) or be frightened of you until the end of your next turn.",
        "title_50": "Champion of the Black Hand"
    },
    "Beshaba": {
        "domain": "misfortune, bad luck, accidents, calamity",
        "alignment": "Usually chaotic, often evil",
        "classes": "Rogue, warlock, bard, sorcerer",
        "cleric_domains": "Trickery, Grave",
        "backgrounds": "Charlatan, criminal, urchin, entertainer",
        "ability_50": "Charisma or Dexterity",
        "earn_themes": "spreading misfortune among enemies, performing propitiation rites, cursing the lucky, thriving amid chaos",
        "lose_themes": "granting good fortune to others, averting disasters without demanding tribute, ignoring bad omens",
        "spell_3": "bane",
        "spell_10": "bestow curse",
        "trait_25": "When a creature you can see within 30 feet of you succeeds on an attack roll, ability check, or saving throw, you can use your reaction to force it to reroll and use the lower result. Once you use this trait, you can't do so again until you finish a short or long rest.",
        "title_50": "Champion of Misfortune"
    },
    "Bhaal": {
        "domain": "murder, violence, ritualistic killing, fear",
        "alignment": "Usually neutral, often evil",
        "classes": "Rogue, fighter, ranger, warlock",
        "cleric_domains": "Death, Trickery",
        "backgrounds": "Criminal, charlatan, outlander, urchin",
        "ability_50": "Dexterity or Constitution",
        "earn_themes": "committing calculated murders that inspire dread, performing ritualistic killings, spreading fear of death",
        "lose_themes": "showing mercy to a marked target, preventing a murder, acting openly without inspiring fear",
        "spell_3": "inflict wounds",
        "spell_10": "phantasmal killer",
        "trait_25": "When you hit a creature that is surprised or that hasn't taken a turn yet in combat, the attack deals an extra 2d6 damage. This extra damage increases to 3d6 at 11th level and 4d6 at 17th level.",
        "title_50": "Champion of Murder"
    },
    "Chauntea": {
        "domain": "agriculture, hearth, home, fertility, harvest",
        "alignment": "Usually neutral, often good",
        "classes": "Cleric, druid, ranger, paladin",
        "cleric_domains": "Life, Nature",
        "backgrounds": "Acolyte, folk hero, guild artisan, hermit",
        "ability_50": "Wisdom or Constitution",
        "earn_themes": "nurturing crops, defending farmland, feeding the hungry, planting where things were destroyed",
        "lose_themes": "burning fields, poisoning soil or water, wasting the bounty of the land, hoarding food from the hungry",
        "spell_3": "goodberry",
        "spell_10": "plant growth",
        "trait_25": "You and any allies within 30 feet of you have advantage on saving throws against poison and disease. In addition, nonmagical plants in a 60-foot radius centered on you grow twice as fast.",
        "title_50": "Champion of the Harvest"
    },
    "Cyric": {
        "domain": "lies, chaos, strife, deception",
        "alignment": "Usually chaotic, often evil",
        "classes": "Rogue, warlock, bard, sorcerer",
        "cleric_domains": "Trickery, War",
        "backgrounds": "Charlatan, criminal, noble, hermit",
        "ability_50": "Charisma or Dexterity",
        "earn_themes": "sowing discord among allies, spreading lies that cause real harm, destabilizing organizations, making blood sacrifices",
        "lose_themes": "telling the truth when a lie would serve better, creating lasting peace, aiding Kelemvor or Mystra",
        "spell_3": "disguise self",
        "spell_10": "major image",
        "trait_25": "You are immune to any spell or effect that would determine if you are lying (such as zone of truth). You can choose what a Detect Thoughts spell or similar magic reveals about your thoughts and intentions.",
        "title_50": "Champion of the Dark Sun"
    },
    "Deneir": {
        "domain": "writing, literacy, glyphs, illustration, knowledge preservation",
        "alignment": "Usually neutral, often good",
        "classes": "Wizard, bard, cleric, artificer",
        "cleric_domains": "Arcana, Knowledge",
        "backgrounds": "Sage, acolyte, guild artisan, hermit",
        "ability_50": "Intelligence or Wisdom",
        "earn_themes": "teaching someone to read, preserving written works, creating illuminated manuscripts, deciphering ancient texts",
        "lose_themes": "destroying books or written records, spreading illiteracy, forging documents to deceive",
        "spell_3": "comprehend languages",
        "spell_10": "glyph of warding",
        "trait_25": "You can read all writing, including magical script and coded messages, as though you had cast comprehend languages. Additionally, when you cast a spell with a verbal component, you can instead trace a glyph in the air, replacing the verbal component with a somatic one.",
        "title_50": "Champion of the Written Word"
    },
    "Eilistraee": {
        "domain": "song, moonlight, dance, swordplay, freedom, beauty",
        "alignment": "Usually chaotic, often good",
        "classes": "Bard, fighter, ranger, cleric",
        "cleric_domains": "Life, Light",
        "backgrounds": "Entertainer, acolyte, outlander, folk hero",
        "ability_50": "Dexterity or Charisma",
        "earn_themes": "freeing drow from Lolth's grip, performing moonlit dances, protecting those fleeing oppression, fostering harmony between drow and surface folk",
        "lose_themes": "aiding Lolth's worshipers, suppressing artistic expression, perpetuating drow isolation",
        "spell_3": "faerie fire",
        "spell_10": "moonbeam",
        "trait_25": "While you are in moonlight, you gain a +2 bonus to AC and saving throws, and your melee weapon attacks deal an extra 1d8 radiant damage.",
        "title_50": "Champion of the Dark Maiden"
    },
    "Eldath": {
        "domain": "peace, comfort, healing, still waters, serenity",
        "alignment": "Usually neutral, often good",
        "classes": "Cleric, druid, monk, ranger",
        "cleric_domains": "Life, Nature",
        "backgrounds": "Acolyte, hermit, folk hero, sage",
        "ability_50": "Wisdom or Charisma",
        "earn_themes": "brokering peace between warring parties, healing the wounded, protecting sacred groves and waters, discarding weapons as offerings",
        "lose_themes": "instigating violence, polluting or desecrating water sources, refusing to offer comfort to the dying",
        "spell_3": "sanctuary",
        "spell_10": "calm emotions",
        "trait_25": "Creatures within 30 feet of you have disadvantage on attack rolls against targets other than you while you are conscious and not incapacitated. As an action, you can end one effect causing a creature within 60 feet to be charmed or frightened.",
        "title_50": "Champion of Serenity"
    },
    "Gond": {
        "domain": "craft, invention, innovation, engineering, smithing",
        "alignment": "Usually neutral, often neutral",
        "classes": "Artificer, wizard, cleric, fighter",
        "cleric_domains": "Forge, Knowledge",
        "backgrounds": "Guild artisan, sage, acolyte, soldier",
        "ability_50": "Intelligence or Dexterity",
        "earn_themes": "inventing something new, teaching crafting techniques, recovering lost technology, improving existing designs",
        "lose_themes": "destroying useful inventions wantonly, hoarding knowledge of craft for personal gain, sabotaging another's work",
        "spell_3": "identify",
        "spell_10": "fabricate",
        "trait_25": "You can spend 10 minutes with any nonmagical object to learn its exact construction and how to replicate it. You also have advantage on all ability checks made to craft, repair, or disassemble objects.",
        "title_50": "Champion of Invention"
    },
    "Helm": {
        "domain": "vigilance, protection, guardianship, watchfulness",
        "alignment": "Usually lawful, often neutral",
        "classes": "Fighter, paladin, cleric, ranger",
        "cleric_domains": "Life, War",
        "backgrounds": "Soldier, acolyte, folk hero, noble",
        "ability_50": "Constitution or Wisdom",
        "earn_themes": "standing guard against overwhelming threats, protecting those in your charge, maintaining vigilance when others rest",
        "lose_themes": "abandoning a post or charge, sleeping when you should be watchful, allowing harm through negligence",
        "spell_3": "shield of faith",
        "spell_10": "warding bond",
        "trait_25": "You cannot be surprised. Additionally, when a creature within 5 feet of you is hit by an attack, you can use your reaction to become the target of the attack instead, using your own AC.",
        "title_50": "Champion of the Vigilant"
    },
    "Ilmater": {
        "domain": "suffering, martyrdom, endurance, compassion, perseverance",
        "alignment": "Usually lawful, often good",
        "classes": "Cleric, monk, paladin, fighter",
        "cleric_domains": "Life, Twilight",
        "backgrounds": "Acolyte, folk hero, hermit, urchin",
        "ability_50": "Constitution or Wisdom",
        "earn_themes": "enduring suffering on behalf of others, sheltering the oppressed, healing without expectation of reward, confronting torturers",
        "lose_themes": "inflicting unnecessary suffering, ignoring the pain of others, refusing to sacrifice comfort for those in need",
        "spell_3": "cure wounds",
        "spell_10": "beacon of hope",
        "trait_25": "When a creature within 30 feet of you takes damage, you can use your reaction to take that damage instead (this damage can't be reduced or prevented). You then gain temporary hit points equal to the damage taken.",
        "title_50": "Champion of Endurance"
    },
    "Kelemvor": {
        "domain": "death (natural), the dead, funerals, mourning, opposing undead",
        "alignment": "Usually lawful, often neutral",
        "classes": "Cleric, paladin, fighter, ranger",
        "cleric_domains": "Death, Grave",
        "backgrounds": "Acolyte, hermit, soldier, sage",
        "ability_50": "Wisdom or Constitution",
        "earn_themes": "performing funeral rites, destroying undead, easing someone into a peaceful death, preventing untimely deaths",
        "lose_themes": "creating undead, disturbing the rest of the dead, fleeing from undead instead of confronting them",
        "spell_3": "gentle repose",
        "spell_10": "speak with dead",
        "trait_25": "You have advantage on attack rolls against undead, and undead have disadvantage on saving throws against your spells and abilities. When you reduce an undead to 0 hit points, you regain hit points equal to your Wisdom modifier.",
        "title_50": "Champion of the Eternal Order"
    },
    "Lathander": {
        "domain": "dawn, renewal, beginnings, spring, creativity, youth",
        "alignment": "Usually neutral, often good",
        "classes": "Cleric, paladin, bard, fighter",
        "cleric_domains": "Life, Light",
        "backgrounds": "Acolyte, entertainer, folk hero, noble",
        "ability_50": "Charisma or Wisdom",
        "earn_themes": "beginning new ventures, helping someone start anew, destroying undead, bringing hope to the hopeless",
        "lose_themes": "crushing someone's hope, refusing to aid new beginnings, creating or aiding undead",
        "spell_3": "color spray",
        "spell_10": "aura of vitality",
        "trait_25": "At dawn each day, you and each ally within 60 feet regain hit points equal to your level. Additionally, you have advantage on death saving throws.",
        "title_50": "Champion of the Dawn"
    },
    "Leira": {
        "domain": "illusion, disguise, deception, mystery, misdirection",
        "alignment": "Usually chaotic, often neutral",
        "classes": "Bard, rogue, wizard, sorcerer",
        "cleric_domains": "Trickery, Knowledge",
        "backgrounds": "Charlatan, criminal, entertainer, sage",
        "ability_50": "Charisma or Intelligence",
        "earn_themes": "maintaining an elaborate deception, creating illusions that protect the innocent, keeping vital secrets, unmasking Cyric's more harmful lies",
        "lose_themes": "revealing secrets unnecessarily, failing to maintain a disguise, being caught in an artless lie",
        "spell_3": "silent image",
        "spell_10": "major image",
        "trait_25": "Illusion spells you cast appear real to all forms of mundane investigation. Creatures have disadvantage on Intelligence (Investigation) checks to discern your illusions. Additionally, you can change your appearance at will as though you had cast disguise self.",
        "title_50": "Champion of Illusions"
    },
    "Lliira": {
        "domain": "joy, dance, freedom, contentment, festivals, celebration",
        "alignment": "Usually chaotic, often good",
        "classes": "Bard, cleric, monk, sorcerer",
        "cleric_domains": "Life, Light",
        "backgrounds": "Entertainer, acolyte, folk hero, guild artisan",
        "ability_50": "Charisma or Dexterity",
        "earn_themes": "bringing joy to the sorrowful, hosting celebrations, freeing those in bondage, performing dances of devotion",
        "lose_themes": "spreading misery, suppressing celebration, using joy as a weapon to manipulate",
        "spell_3": "Tasha's hideous laughter",
        "spell_10": "hypnotic pattern",
        "trait_25": "You and allies within 30 feet of you are immune to the frightened condition while you are conscious. As an action, you can end the frightened or charmed condition on any creature you can touch.",
        "title_50": "Champion of Joy"
    },
    "Lolth": {
        "domain": "spiders, drow domination, treachery, darkness, manipulation",
        "alignment": "Usually chaotic, often evil",
        "classes": "Cleric, warlock, rogue, wizard",
        "cleric_domains": "Trickery, War",
        "backgrounds": "Acolyte, criminal, noble, spy",
        "ability_50": "Charisma or Wisdom",
        "earn_themes": "betraying rivals to advance, sacrificing to Lolth, subjugating enemies, hunting drow who worship other gods",
        "lose_themes": "showing mercy to Lolth's enemies, aiding followers of Eilistraee, failing in a power play, showing weakness",
        "spell_3": "web",
        "spell_10": "conjure animals (spiders only)",
        "trait_25": "You can climb difficult surfaces, including ceilings, without needing to make an ability check. You have blindsight out to 30 feet while in darkness. Additionally, spiders never attack you unless magically compelled.",
        "title_50": "Champion of the Spider Queen"
    },
    "Loviatar": {
        "domain": "pain, agony, suffering (as transcendence), domination, cruelty",
        "alignment": "Usually lawful, often evil",
        "classes": "Cleric, warlock, fighter, monk",
        "cleric_domains": "Death, Order",
        "backgrounds": "Acolyte, criminal, noble, hermit",
        "ability_50": "Constitution or Wisdom",
        "earn_themes": "enduring great pain without flinching, inflicting suffering that breaks someone's will, dominating others through fear",
        "lose_themes": "showing compassion or alleviating pain without purpose, submitting to another's dominance, fleeing from pain",
        "spell_3": "cause fear",
        "spell_10": "hold person",
        "trait_25": "When you take damage, you can use your reaction to gain a bonus to your next attack roll or spell save DC equal to half the damage taken (maximum +5). This bonus lasts until the end of your next turn.",
        "title_50": "Champion of Agony"
    },
    "Malar": {
        "domain": "hunting, blood, predation, savagery, lycanthropy",
        "alignment": "Usually chaotic, often evil",
        "classes": "Barbarian, ranger, druid, fighter",
        "cleric_domains": "Nature, War",
        "backgrounds": "Outlander, criminal, hermit, soldier",
        "ability_50": "Strength or Constitution",
        "earn_themes": "hunting and slaying powerful beasts, performing the ritual of the High Hunt, reveling in bloodlust",
        "lose_themes": "letting prey escape out of pity, refusing to hunt, showing cowardice before a predator",
        "spell_3": "hunter's mark",
        "spell_10": "conjure animals",
        "trait_25": "You have advantage on attack rolls against any creature below its hit point maximum. When you score a critical hit, you can immediately make one additional weapon attack as part of the same action.",
        "title_50": "Champion of the Wild Hunt"
    },
    "Mask": {
        "domain": "thieves, shadows, stealth, intrigue, subterfuge",
        "alignment": "Usually chaotic, often neutral",
        "classes": "Rogue, bard, ranger, warlock",
        "cleric_domains": "Trickery, Twilight",
        "backgrounds": "Criminal, charlatan, spy, urchin",
        "ability_50": "Dexterity or Charisma",
        "earn_themes": "pulling off daring heists, operating unseen, protecting Mask's purse tradition, outsmarting rivals through cunning",
        "lose_themes": "being caught stealing through clumsiness, betraying fellow thieves without cause, acting openly when subtlety is possible",
        "spell_3": "disguise self",
        "spell_10": "pass without trace",
        "trait_25": "While in dim light or darkness, you are invisible to darkvision and have advantage on Dexterity (Stealth) checks. You can also see normally in magical darkness to a range of 60 feet.",
        "title_50": "Champion of Shadows"
    },
    "Mielikki": {
        "domain": "forests, woodland creatures, rangers, the natural balance",
        "alignment": "Usually neutral, often good",
        "classes": "Ranger, druid, cleric, fighter",
        "cleric_domains": "Life, Nature",
        "backgrounds": "Outlander, acolyte, folk hero, hermit",
        "ability_50": "Wisdom or Dexterity",
        "earn_themes": "defending forests from destruction, caring for woodland creatures, establishing protected groves, opposing followers of Malar",
        "lose_themes": "felling trees without need, harming forest creatures wantonly, allowing forests to be destroyed through inaction",
        "spell_3": "animal friendship",
        "spell_10": "conjure woodland beings",
        "trait_25": "Beasts and plants within 60 feet of you are friendly to you unless magically compelled otherwise. You can communicate simple ideas to beasts and plants and understand their replies. You leave no tracks in natural terrain and can't be tracked except by magical means.",
        "title_50": "Champion of the Forest"
    },
    "Milil": {
        "domain": "poetry, song, eloquence, inspiration, creativity",
        "alignment": "Usually neutral, often good",
        "classes": "Bard, cleric, wizard, sorcerer",
        "cleric_domains": "Knowledge, Light",
        "backgrounds": "Entertainer, acolyte, noble, sage",
        "ability_50": "Charisma or Wisdom",
        "earn_themes": "composing masterworks, inspiring audiences, preserving songs and poems, performing at great celebrations",
        "lose_themes": "silencing musicians, destroying works of art, using performance to spread deliberate falsehoods",
        "spell_3": "heroism",
        "spell_10": "enthrall",
        "trait_25": "Your performance or oration can inspire greatness. When you finish a performance lasting at least 1 minute, up to 6 creatures who heard you gain temporary hit points equal to your level and have advantage on their next ability check, attack roll, or saving throw within the next hour.",
        "title_50": "Champion of Song"
    },
    "Myrkul": {
        "domain": "death, decay, old age, exhaustion, corpses, necromancy",
        "alignment": "Usually neutral, often evil",
        "classes": "Wizard, cleric, warlock, sorcerer",
        "cleric_domains": "Death, Grave",
        "backgrounds": "Hermit, sage, acolyte, criminal",
        "ability_50": "Intelligence or Wisdom",
        "earn_themes": "binding souls to learn their secrets, creating or commanding undead, uncovering forbidden knowledge of death, spreading dread",
        "lose_themes": "destroying undead without cause, showing disrespect to corpses, sharing necromantic secrets with the unworthy",
        "spell_3": "false life",
        "spell_10": "animate dead",
        "trait_25": "Undead you create or summon have additional hit points equal to your level, and they add your proficiency bonus to their damage rolls. Additionally, you can command up to twice the normal number of undead.",
        "title_50": "Champion of the Reaper"
    },
    "Mystra": {
        "domain": "magic, the Weave, spellcasting, magical innovation",
        "alignment": "Usually neutral, often good",
        "classes": "Wizard, sorcerer, cleric, bard",
        "cleric_domains": "Arcana, Knowledge",
        "backgrounds": "Sage, acolyte, hermit, noble",
        "ability_50": "Intelligence or Charisma",
        "earn_themes": "preserving magical knowledge, mentoring new spellcasters, defending the Weave, opposing those who abuse magic",
        "lose_themes": "using magic to cause wanton destruction, hoarding magic selfishly, aiding Cyric or Shar",
        "spell_3": "detect magic",
        "spell_10": "dispel magic",
        "trait_25": "When you cast a spell, you can choose to cast it without verbal, somatic, or material components (provided the material components don't have a gold cost). Once you use this trait, you can't do so again until you finish a long rest.",
        "title_50": "Champion of the Weave"
    },
    "Oghma": {
        "domain": "knowledge, thought, ideas, learning, scholarship",
        "alignment": "Usually neutral, often neutral",
        "classes": "Wizard, bard, cleric, monk",
        "cleric_domains": "Knowledge, Arcana",
        "backgrounds": "Sage, acolyte, hermit, guild artisan",
        "ability_50": "Intelligence or Wisdom",
        "earn_themes": "discovering lost knowledge, teaching others, building or restoring libraries, writing treatises on new ideas",
        "lose_themes": "destroying books or records, keeping people ignorant, hoarding knowledge that could benefit many",
        "spell_3": "identify",
        "spell_10": "legend lore",
        "trait_25": "You can cast identify at will, without expending a spell slot or material components. Additionally, when you make an Intelligence check to recall information, you can treat a roll of 9 or lower on the d20 as a 10.",
        "title_50": "Champion of Knowledge"
    },
    "Red Knight": {
        "domain": "strategy, tactics, planning, war games, military genius",
        "alignment": "Usually lawful, often neutral",
        "classes": "Fighter, paladin, wizard, cleric",
        "cleric_domains": "War, Knowledge",
        "backgrounds": "Soldier, sage, noble, acolyte",
        "ability_50": "Intelligence or Wisdom",
        "earn_themes": "devising strategies that save lives, winning battles through superior tactics, teaching military strategy, playing lanceboard masterfully",
        "lose_themes": "acting recklessly without planning, losing a battle through incompetence, ignoring intelligence reports",
        "spell_3": "faerie fire",
        "spell_10": "haste",
        "trait_25": "You and allies within 30 feet of you can't be surprised, and you each gain a +2 bonus to initiative rolls. Additionally, on the first round of combat, you and those allies have advantage on attack rolls.",
        "title_50": "Champion of Strategy"
    },
    "Selûne": {
        "domain": "the moon, stars, navigation, motherhood, cycles, lycanthropes",
        "alignment": "Usually chaotic, often good",
        "classes": "Cleric, ranger, paladin, druid",
        "cleric_domains": "Knowledge, Twilight",
        "backgrounds": "Acolyte, sailor, hermit, outlander",
        "ability_50": "Wisdom or Charisma",
        "earn_themes": "protecting travelers at night, guiding the lost, aiding benevolent lycanthropes, opposing Shar's agents",
        "lose_themes": "aiding Shar, dousing lights in the darkness to endanger travelers, hunting lycanthropes indiscriminately",
        "spell_3": "moonbeam",
        "spell_10": "beacon of hope",
        "trait_25": "You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet. While under moonlight, you have advantage on Wisdom (Perception) checks and Wisdom saving throws.",
        "title_50": "Champion of the Moon"
    },
    "Shar": {
        "domain": "darkness, night, secrets, loss, forgetfulness, hidden pain",
        "alignment": "Usually neutral, often evil",
        "classes": "Cleric, rogue, warlock, monk",
        "cleric_domains": "Death, Trickery",
        "backgrounds": "Hermit, acolyte, criminal, sage",
        "ability_50": "Wisdom or Charisma",
        "earn_themes": "bringing darkness to places of light, helping people forget their pain through devotion, uncovering and keeping secrets, opposing Selûne",
        "lose_themes": "revealing secrets, bringing light to sacred darkness, restoring memories that Shar has claimed, aiding Selûne",
        "spell_3": "darkness",
        "spell_10": "nondetection",
        "trait_25": "While in darkness, you have resistance to all damage except radiant. You can cast modify memory once without expending a spell slot. You regain this ability when you finish a long rest.",
        "title_50": "Champion of the Night"
    },
    "Shaundakul": {
        "domain": "travel, journeys, exploration, portals, the wind",
        "alignment": "Usually chaotic, often neutral",
        "classes": "Ranger, bard, rogue, cleric",
        "cleric_domains": "Nature, Tempest",
        "backgrounds": "Outlander, sailor, hermit, folk hero",
        "ability_50": "Dexterity or Wisdom",
        "earn_themes": "discovering or restoring portal-shrines, protecting travelers on dangerous roads, exploring uncharted territories",
        "lose_themes": "refusing to aid a lost traveler, destroying portals or paths, remaining in one place when the road calls",
        "spell_3": "longstrider",
        "spell_10": "wind wall",
        "trait_25": "Your walking speed increases by 10 feet, and you aren't affected by difficult terrain. Once per long rest, you can cast misty step without expending a spell slot. Additionally, you always know which direction is north and can't become lost except by magical means.",
        "title_50": "Champion of the Wind"
    },
    "Silvanus": {
        "domain": "wild nature, forests, balance of nature, the natural order",
        "alignment": "Usually neutral, often neutral",
        "classes": "Druid, ranger, barbarian, cleric",
        "cleric_domains": "Nature, Tempest",
        "backgrounds": "Outlander, hermit, acolyte, folk hero",
        "ability_50": "Wisdom or Constitution",
        "earn_themes": "defending wild places from civilization's encroachment, restoring damaged ecosystems, maintaining the balance of predator and prey",
        "lose_themes": "needlessly destroying wild places, disrupting the natural order, creating undead (a perversion of nature)",
        "spell_3": "speak with animals",
        "spell_10": "plant growth",
        "trait_25": "You can communicate with beasts and plants as though you shared a language. While in natural terrain, you can't be tracked, you leave no trail, and you can't be surprised. Natural plants and beasts will not willingly harm you.",
        "title_50": "Champion of the Wild"
    },
    "Sune": {
        "domain": "love, beauty, passion, sensual pleasure, art, desire",
        "alignment": "Usually chaotic, often good",
        "classes": "Bard, cleric, paladin, sorcerer",
        "cleric_domains": "Life, Light",
        "backgrounds": "Entertainer, acolyte, noble, guild artisan",
        "ability_50": "Charisma or Wisdom",
        "earn_themes": "creating works of beauty, defending beautiful things from destruction, fostering true love, acting as a patron of the arts",
        "lose_themes": "wantonly destroying beautiful things, breaking hearts callously, ignoring beauty in all its forms",
        "spell_3": "charm person",
        "spell_10": "enthrall",
        "trait_25": "You gain a +2 bonus to Charisma checks and Charisma saving throws. When a creature attempts to attack you for the first time in combat, it must make a Wisdom saving throw (DC 8 + your proficiency bonus + your Charisma modifier). On a failure, it can't attack you that turn and must choose a different target or waste the attack.",
        "title_50": "Champion of Beauty"
    },
    "Talona": {
        "domain": "poison, disease, plague, suffering through illness",
        "alignment": "Usually chaotic, often evil",
        "classes": "Cleric, druid, warlock, rogue",
        "cleric_domains": "Death, Nature",
        "backgrounds": "Hermit, acolyte, outlander, urchin",
        "ability_50": "Constitution or Wisdom",
        "earn_themes": "spreading disease in Talona's name, propitiating Talona with offerings, tending to the plague-stricken, brewing poisons",
        "lose_themes": "curing disease without offering thanks to Talona, neglecting her shrines, wasting poisons",
        "spell_3": "ray of sickness",
        "spell_10": "stinking cloud",
        "trait_25": "You are immune to poison damage and the poisoned condition. When a creature within 5 feet of you hits you with a melee attack, the attacker takes poison damage equal to your Wisdom modifier.",
        "title_50": "Champion of Plague"
    },
    "Talos": {
        "domain": "storms, destruction, natural disasters, rage, chaos",
        "alignment": "Usually chaotic, often evil",
        "classes": "Barbarian, cleric, druid, sorcerer",
        "cleric_domains": "Tempest, War",
        "backgrounds": "Outlander, criminal, acolyte, sailor",
        "ability_50": "Strength or Constitution",
        "earn_themes": "calling storms upon settlements, destroying in Talos's name, demanding tribute under threat of annihilation, seizing what you want by force",
        "lose_themes": "calming storms, protecting buildings from natural disaster, submitting peacefully when you could fight",
        "spell_3": "thunderwave",
        "spell_10": "call lightning",
        "trait_25": "You have resistance to lightning and thunder damage. When you deal lightning or thunder damage, you can add your Constitution modifier to the damage roll. Additionally, your attacks with weapons and spells that deal lightning or thunder damage ignore resistance.",
        "title_50": "Champion of the Storm"
    },
    "Tempus": {
        "domain": "war, battle, bravery, honorable combat, martial prowess",
        "alignment": "Usually chaotic, often neutral",
        "classes": "Fighter, barbarian, cleric, paladin",
        "cleric_domains": "War, Twilight",
        "backgrounds": "Soldier, acolyte, outlander, folk hero",
        "ability_50": "Strength or Constitution",
        "earn_themes": "fighting bravely in battle, arming those who need weapons, following Tempus's Honor, training others for war",
        "lose_themes": "engaging in cowardice, poisoning wells or killing noncombatants, torturing prisoners, refusing to fight when battle is warranted",
        "spell_3": "heroism",
        "spell_10": "spirit guardians",
        "trait_25": "You have advantage on attack rolls in the first round of any combat. When you reduce a creature to 0 hit points with a melee weapon attack, you can make one additional melee weapon attack as part of the same action. Once per long rest, you can choose to succeed on a death saving throw instead of rolling.",
        "title_50": "Champion of Battle"
    },
    "Torm": {
        "domain": "courage, self-sacrifice, duty, devotion, righteousness",
        "alignment": "Usually lawful, often good",
        "classes": "Paladin, fighter, cleric, monk",
        "cleric_domains": "War, Life",
        "backgrounds": "Soldier, acolyte, noble, folk hero",
        "ability_50": "Strength or Charisma",
        "earn_themes": "acts of brave service, defending the weak, opposing Bane, maintaining peace and order, standing against corruption",
        "lose_themes": "dereliction of duty, acting out of cowardice, persecuting the faithful of other good gods, allowing corruption to stand",
        "spell_3": "shield of faith",
        "spell_10": "crusader's mantle",
        "trait_25": "When you use the Help action to aid an ally, the ally gains advantage on the next two ability checks or attack rolls (rather than one) related to the task you're helping with. Additionally, when you take damage that would reduce you to 0 hit points, you can drop to 1 hit point instead. Once you use this ability, you can't do so again until you finish a long rest.",
        "title_50": "Champion of Righteousness"
    },
    "Tymora": {
        "domain": "good fortune, luck, daring, adventurers, risk-takers",
        "alignment": "Usually chaotic, often good",
        "classes": "Rogue, bard, ranger, fighter",
        "cleric_domains": "Trickery, Life",
        "backgrounds": "Charlatan, entertainer, folk hero, urchin",
        "ability_50": "Charisma or Dexterity",
        "earn_themes": "taking bold risks that pay off, tossing coins to strangers in Tymora's name, gambling with skill and daring, aiding fellow adventurers",
        "lose_themes": "refusing a daring challenge out of cowardice, cheating at games of chance, hoarding luck by avoiding risk",
        "spell_3": "bless",
        "spell_10": "freedom of movement",
        "trait_25": "When you or a creature you can see within 30 feet of you makes an attack roll, ability check, or saving throw with disadvantage, you can use your reaction to remove the disadvantage. You can use this trait a number of times equal to your proficiency bonus, and you regain all uses when you finish a long rest.",
        "title_50": "Champion of Fortune"
    },
    "Tyr": {
        "domain": "justice, law, truth, punishment of the guilty, righteous judgment",
        "alignment": "Usually lawful, often good",
        "classes": "Paladin, cleric, fighter, monk",
        "cleric_domains": "Order, War",
        "backgrounds": "Acolyte, noble, sage, soldier",
        "ability_50": "Wisdom or Strength",
        "earn_themes": "delivering justice, punishing the guilty, righting wrongs, discovering the truth in a dispute",
        "lose_themes": "allowing injustice to stand, punishing the innocent, bearing false witness, perverting the course of justice",
        "spell_3": "command",
        "spell_10": "zone of truth",
        "trait_25": "You have advantage on Wisdom (Insight) checks to determine if someone is lying. When you hit a creature with a weapon attack, you can choose to deal an extra 2d8 radiant damage if the creature has attacked an innocent or broken a law known to you within the last 24 hours. Once you use this extra damage, you can't do so again until you finish a short or long rest.",
        "title_50": "Champion of Justice"
    },
    "Umberlee": {
        "domain": "the sea, storms at sea, waves, marine creatures, sailors' dread",
        "alignment": "Usually chaotic, often evil",
        "classes": "Cleric, druid, warlock, ranger",
        "cleric_domains": "Tempest, Nature",
        "backgrounds": "Sailor, outlander, acolyte, criminal",
        "ability_50": "Constitution or Wisdom",
        "earn_themes": "offering gems to calm storms, demanding tribute from sailors, sinking ships of those who offend Umberlee, drowning foes",
        "lose_themes": "calming seas without demanding tribute, protecting sailors without cost, disrespecting the ocean",
        "spell_3": "create or destroy water",
        "spell_10": "tidal wave",
        "trait_25": "You can breathe water and have a swimming speed equal to your walking speed. While in water, you have advantage on attack rolls and saving throws. Additionally, you can cast control water once without expending a spell slot, regaining this ability when you finish a long rest.",
        "title_50": "Champion of the Depths"
    },
    "Waukeen": {
        "domain": "wealth, trade, commerce, deals, prosperity, industry",
        "alignment": "Usually neutral, often neutral",
        "classes": "Rogue, bard, cleric, wizard",
        "cleric_domains": "Knowledge, Trickery",
        "backgrounds": "Guild artisan, noble, charlatan, sailor",
        "ability_50": "Charisma or Intelligence",
        "earn_themes": "opening new trade routes, funding struggling businesses, increasing the flow of commerce, opposing monopolies",
        "lose_themes": "breaking trade agreements, hoarding wealth as a miser, deliberately sabotaging trade, stealing from honest merchants",
        "spell_3": "unseen servant",
        "spell_10": "Leomund's secret chest",
        "trait_25": "You can accurately appraise the value of any object or service instantly. You have advantage on all Charisma checks related to commerce or negotiation. When you spend gold, there is a 10% chance (roll a d10; on a 1) that the gold magically returns to your purse within a day.",
        "title_50": "Champion of Commerce"
    },
}


def load_file(path):
    """Load a text file."""
    with open(path, 'r', encoding='utf-8-sig') as f:
        return f.read()


def parse_gods(text):
    """
    Parse the Gods of Faerun text into individual god entries.
    Returns a list of (god_name, entry_text) tuples.
    """
    # Find where the table ends and content begins
    # The table is followed by blank lines then "Amaunator"
    lines = text.split('\n')

    # Find the start of detailed entries (first god heading after table)
    god_names = list(GOD_DATA.keys())

    # Split by god names appearing as standalone headings
    entries = []
    current_god = None
    current_lines = []

    # Find where each detailed god entry starts
    # God entries start with just the god name on its own line, after the table
    in_table = True
    for i, line in enumerate(lines):
        stripped = line.strip()

        # Skip the initial table section
        if in_table:
            if stripped == "Amaunator" and i > 100:  # First detailed entry
                in_table = False
                current_god = "Amaunator"
                current_lines = [line]
            continue

        # Check if this line starts a new god entry
        found_new_god = False
        for gname in god_names:
            if stripped == gname and gname != current_god:
                # Save previous god
                if current_god:
                    entries.append((current_god, '\n'.join(current_lines)))
                current_god = gname
                current_lines = [line]
                found_new_god = True
                break

        if not found_new_god:
            current_lines.append(line)

    # Don't forget the last god
    if current_god:
        entries.append((current_god, '\n'.join(current_lines)))

    return entries


def load_progress():
    """Load progress from disk."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_progress(progress):
    """Save progress to disk."""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)


def generate_piety_for_god(client, god_name, god_entry, piety_examples, god_meta):
    """
    Call the Anthropic API to generate a piety section for a single god.
    """
    prompt = f"""You are creating D&D 5e piety content for the Faerûnian god {god_name}. 
You must follow the EXACT format from the Theros piety examples below, but adapted for the Forgotten Realms setting.

Here is the existing lore entry for {god_name}:
<existing_entry>
{god_entry}
</existing_entry>

Here are examples from Theros showing the exact format to follow (Athreos and Erebos):
<piety_examples>
{piety_examples}
</piety_examples>

Now generate the following sections for {god_name}, using the metadata below for mechanical accuracy:

GOD METADATA:
- Domain: {god_meta['domain']}
- Alignment tendency: {god_meta['alignment']}
- Suggested Classes: {god_meta['classes']}
- Suggested Cleric Domains: {god_meta['cleric_domains']}
- Suggested Backgrounds: {god_meta['backgrounds']}
- Piety 3+ spell: {god_meta['spell_3']}
- Piety 10+ spell: {god_meta['spell_10']}
- Piety 25+ ability: {god_meta['trait_25']}
- Piety 50+ title: {god_meta['title_50']}
- Ability score increase at 50+: {god_meta['ability_50']}
- Themes for earning piety: {god_meta['earn_themes']}
- Themes for losing piety: {god_meta['lose_themes']}

Generate EXACTLY these sections in this order. Use the god's actual lore, personality, and themes from the existing entry. Write evocative, setting-appropriate flavor text that feels authentic to Forgotten Realms:

1. **{god_name}'s Champions** - alignment line, suggested classes, suggested cleric domains, suggested backgrounds, then a paragraph about what kind of champions this god attracts

2. **{god_name}'s Favor** - introductory paragraph, then a d6 table of circumstances (how did you come to this god's attention?)

3. **Devotion to {god_name}** - a brief intro paragraph, then:
   **{god_name}'s Ideals** - d6 table with format: "number  Ideal. Description (Alignment)"
   - Entry 1 is always "Devotion. My devotion to my god is more important to me than what [he/she/they] stands for. (Any)"
   - Entries 2-6 should reflect the god's actual themes and values

4. **Earning and Losing Piety** - exactly match the Theros format:
   - "You increase your piety score to {god_name} when you..." with 3-4 bullet examples
   - "Your piety score to {god_name} decreases if you..." with 3-4 bullet examples

5. **Piety Benefits** - four tiers, each with a trait name, piety threshold, and mechanical description:
   - **{god_name}'s Devotee** (Piety 3+): grants the ability to cast {god_meta['spell_3']} using the provided spell
   - **{god_name}'s Votary** (Piety 10+): grants the ability to cast {god_meta['spell_10']}
   - **{god_name}'s Disciple** (Piety 25+): a passive or reactive ability as described
   - **{god_meta['title_50']}** (Piety 50+): increase {god_meta['ability_50']} score by 2 and maximum by 2

CRITICAL FORMATTING RULES:
- Use the EXACT same text formatting as the Theros examples (plain text, same heading styles, same table formatting with tab-separated columns)
- d6 tables use format: "1        Description text here"
- Piety benefit headers use format: "God's Devotee\\nPiety 3+ God trait"
- Keep paragraphs concise - match the brevity of the Theros examples
- No markdown formatting (no **, no ##, no bullet points with -). Use plain text only.
- For bullet-style lists under Earning/Losing piety, just start each item on a new line with no bullet character
- Output ONLY the new sections. Do not repeat the existing entry.
"""

    for attempt in range(MAX_RETRIES):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            print(f"  Attempt {attempt + 1} failed for {god_name}: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
            else:
                return f"[ERROR: Failed to generate piety for {god_name} after {MAX_RETRIES} attempts: {e}]"


def main():
    print("=" * 60)
    print("GODS OF FAERUN - PIETY GENERATOR")
    print("=" * 60)

    # Load source files
    print("\nLoading source files...")
    gods_text = load_file(INPUT_FILE)
    piety_text = load_file(PIETY_EXAMPLES_FILE)

    # Parse god entries
    print("Parsing god entries...")
    god_entries = parse_gods(gods_text)
    print(f"Found {len(god_entries)} god entries")

    # Load progress
    progress = load_progress()
    completed = progress.get("completed", {})
    print(f"Previously completed: {len(completed)} gods")

    # Initialize API client
    client = anthropic.Anthropic()

    # Extract the relevant piety examples (Athreos + Erebos for two complete references)
    # We'll send both as examples
    piety_examples = piety_text

    # Process each god
    total = len(god_entries)
    for idx, (god_name, god_entry) in enumerate(god_entries):
        if god_name in completed:
            print(f"[{idx+1}/{total}] {god_name} - ALREADY DONE (skipping)")
            continue

        if god_name not in GOD_DATA:
            print(f"[{idx+1}/{total}] {god_name} - NO METADATA (skipping)")
            continue

        print(f"[{idx+1}/{total}] Generating piety for {god_name}...")
        god_meta = GOD_DATA[god_name]

        piety_section = generate_piety_for_god(
            client, god_name, god_entry, piety_examples, god_meta
        )

        completed[god_name] = piety_section
        progress["completed"] = completed
        save_progress(progress)
        print(f"  ✓ {god_name} complete ({len(piety_section)} chars)")

        # Small delay between API calls to be polite
        if idx < total - 1:
            time.sleep(1)

    # Now assemble the final document
    print("\n" + "=" * 60)
    print("ASSEMBLING FINAL DOCUMENT")
    print("=" * 60)

    # Get the header/table section (everything before the first detailed entry)
    lines = gods_text.split('\n')
    header_lines = []
    for i, line in enumerate(lines):
        if line.strip() == "Amaunator" and i > 100:
            break
        header_lines.append(line)

    output_parts = ['\n'.join(header_lines)]

    for god_name, god_entry in god_entries:
        output_parts.append(god_entry)
        if god_name in completed:
            output_parts.append("\n\n" + completed[god_name])
        output_parts.append("\n\n")

    final_text = '\n'.join(output_parts)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(final_text)

    print(f"\nFinal document written to {OUTPUT_FILE}")
    print(f"Total gods processed: {len(completed)}/{total}")
    print(f"Document size: {len(final_text):,} characters")

    # Copy to output
    import shutil
    output_path = "/mnt/user-data/outputs/Gods_of_Faerun_with_Piety.txt"
    shutil.copy2(OUTPUT_FILE, output_path)
    print(f"Copied to {output_path}")


if __name__ == "__main__":
    main()