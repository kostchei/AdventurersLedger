/**
 * Character Sheet JavaScript
 * Handles data loading, display, and inline editing
 */

// Skills mapping to abilities
const SKILLS = [
    { name: 'Acrobatics', ability: 'dexterity' },
    { name: 'Animal Handling', ability: 'wisdom' },
    { name: 'Arcana', ability: 'intelligence' },
    { name: 'Athletics', ability: 'strength' },
    { name: 'Deception', ability: 'charisma' },
    { name: 'History', ability: 'intelligence' },
    { name: 'Insight', ability: 'wisdom' },
    { name: 'Intimidation', ability: 'charisma' },
    { name: 'Investigation', ability: 'intelligence' },
    { name: 'Medicine', ability: 'wisdom' },
    { name: 'Nature', ability: 'intelligence' },
    { name: 'Perception', ability: 'wisdom' },
    { name: 'Performance', ability: 'charisma' },
    { name: 'Persuasion', ability: 'charisma' },
    { name: 'Religion', ability: 'intelligence' },
    { name: 'Sleight of Hand', ability: 'dexterity' },
    { name: 'Stealth', ability: 'dexterity' },
    { name: 'Survival', ability: 'wisdom' }
];

const ABILITY_NAMES = {
    strength: 'STR',
    dexterity: 'DEX',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'WIS',
    charisma: 'CHA'
};

let currentCharacter = null;
let characterId = null;

// Get character ID from URL
function getCharacterIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/character\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

// Format modifier for display (+X or -X)
function formatModifier(mod) {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Calculate proficiency bonus from level
function getProficiencyBonus(level) {
    return Math.floor((level - 1) / 4) + 2;
}

// Load character data from API
async function loadCharacter() {
    characterId = getCharacterIdFromUrl();

    if (!characterId) {
        alert('Invalid character ID');
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch(`/api/characters/${characterId}`);

        if (!response.ok) {
            if (response.status === 401) {
                alert('Please log in to view this character');
                window.location.href = '/';
                return;
            }
            throw new Error('Character not found');
        }

        currentCharacter = await response.json();
        renderCharacter();

    } catch (error) {
        console.error('Error loading character:', error);
        alert('Failed to load character: ' + error.message);
        window.location.href = '/';
    }
}

// Render all character data to the page
function renderCharacter() {
    const char = currentCharacter;

    // Hide loading, show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('sheet-header').style.display = 'block';
    document.getElementById('sheet-content').style.display = 'block';

    // Header
    document.getElementById('char-name').textContent = char.name;
    document.getElementById('char-level').textContent = `Level ${char.level}`;
    document.getElementById('char-species-class').textContent = `${char.species} ${char.class_name}`;
    document.getElementById('char-background').textContent = `(${char.background})`;

    // Combat stats
    const profBonus = getProficiencyBonus(char.level);
    const dexMod = char.modifiers.dexterity || 0;

    document.getElementById('stat-ac').textContent = 10 + dexMod; // Base AC
    document.getElementById('hp-current').value = char.hp_current || char.hp_max || 10;
    document.getElementById('hp-max').textContent = char.hp_max || 10;
    document.getElementById('stat-speed').textContent = '30 ft'; // Default, could be species-based
    document.getElementById('stat-initiative').textContent = formatModifier(dexMod);
    document.getElementById('stat-proficiency').textContent = formatModifier(profBonus);

    // Ability Scores
    renderAbilities(char);

    // Saving Throws
    renderSavingThrows(char, profBonus);

    // Skills
    renderSkills(char, profBonus);

    // Inventory
    renderInventory(char);

    // Trackers (Renown, Piety)
    renderTrackers(char);

    // Setup HP auto-save
    setupHpEditing();
}

// Render ability score blocks
function renderAbilities(char) {
    const grid = document.getElementById('ability-grid');
    grid.innerHTML = '';

    const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

    abilities.forEach(ability => {
        const score = char.stats[ability] || 10;
        const mod = char.modifiers[ability] || 0;

        const block = document.createElement('div');
        block.className = 'ability-block';
        block.innerHTML = `
            <div class="name">${ABILITY_NAMES[ability]}</div>
            <div class="modifier">${formatModifier(mod)}</div>
            <div class="score">${score}</div>
        `;
        grid.appendChild(block);
    });
}

// Render saving throws
function renderSavingThrows(char, profBonus) {
    const grid = document.getElementById('saves-grid');
    grid.innerHTML = '';

    // For MVP, no proficiency data stored - just show base mods
    const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

    abilities.forEach(ability => {
        const mod = char.modifiers[ability] || 0;
        // TODO: Check if character has save proficiency (based on class)
        const isProficient = false;
        const total = isProficient ? mod + profBonus : mod;

        const row = document.createElement('div');
        row.className = `save-row ${isProficient ? 'proficient' : ''}`;
        row.innerHTML = `
            <div class="proficiency"></div>
            <div class="bonus">${formatModifier(total)}</div>
            <div class="save-name">${ABILITY_NAMES[ability]}</div>
        `;
        grid.appendChild(row);
    });
}

// Render skills list
function renderSkills(char, profBonus) {
    const list = document.getElementById('skills-list');
    list.innerHTML = '';

    SKILLS.forEach(skill => {
        const mod = char.modifiers[skill.ability] || 0;
        // TODO: Check if character has skill proficiency
        const isProficient = false;
        const total = isProficient ? mod + profBonus : mod;

        const row = document.createElement('div');
        row.className = `skill-row ${isProficient ? 'proficient' : ''}`;
        row.innerHTML = `
            <div class="proficiency"></div>
            <div class="bonus">${formatModifier(total)}</div>
            <div class="skill-name">${skill.name}</div>
            <div class="ability-tag">${ABILITY_NAMES[skill.ability]}</div>
        `;
        list.appendChild(row);
    });
}

// Render inventory
function renderInventory(char) {
    const list = document.getElementById('inventory-list');
    const inventory = char.inventory || [];

    if (inventory.length === 0) {
        list.innerHTML = '<div class="empty-state">No items in inventory.</div>';
        return;
    }

    list.innerHTML = '';
    inventory.forEach(item => {
        const li = document.createElement('li');
        li.className = 'inventory-item';
        li.innerHTML = `
            <span class="item-name">${item.name || item}</span>
            ${item.quantity ? `<span class="item-qty">×${item.quantity}</span>` : ''}
        `;
        list.appendChild(li);
    });
}

// Render trackers (Renown, Piety)
function renderTrackers(char) {
    const container = document.getElementById('trackers-content');
    const renown = char.renown || {};
    const piety = char.piety || {};

    const hasRenown = Object.keys(renown).length > 0;
    const hasPiety = Object.keys(piety).length > 0;

    if (!hasRenown && !hasPiety) {
        container.innerHTML = '<div class="empty-state">No faction affiliations or piety tracked.</div>';
        return;
    }

    let html = '';

    if (hasRenown) {
        html += '<h3 style="font-size: 0.85rem; margin-bottom: 8px; color: var(--sheet-accent);">Renown</h3>';
        html += '<ul class="inventory-list">';
        for (const [faction, value] of Object.entries(renown)) {
            html += `<li class="inventory-item"><span class="item-name">${faction}</span><span class="item-qty">${value}</span></li>`;
        }
        html += '</ul>';
    }

    if (hasPiety) {
        html += '<h3 style="font-size: 0.85rem; margin: 12px 0 8px; color: var(--sheet-accent);">Piety</h3>';
        html += '<ul class="inventory-list">';
        for (const [deity, value] of Object.entries(piety)) {
            html += `<li class="inventory-item"><span class="item-name">${deity}</span><span class="item-qty">${value}</span></li>`;
        }
        html += '</ul>';
    }

    container.innerHTML = html;
}

// Setup HP inline editing with auto-save
function setupHpEditing() {
    const hpInput = document.getElementById('hp-current');
    let saveTimeout = null;

    hpInput.addEventListener('input', () => {
        // Debounce save
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveHpChange(parseInt(hpInput.value) || 0);
        }, 500);
    });

    hpInput.addEventListener('blur', () => {
        // Immediate save on blur
        if (saveTimeout) clearTimeout(saveTimeout);
        saveHpChange(parseInt(hpInput.value) || 0);
    });
}

// Save HP change to server
async function saveHpChange(newHp) {
    if (!characterId) return;

    try {
        const response = await fetch(`/api/characters/${characterId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hp_current: newHp })
        });

        if (!response.ok) {
            console.error('Failed to save HP');
        }
    } catch (error) {
        console.error('Error saving HP:', error);
    }
}

// Toggle section collapse
window.toggleSection = function (sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('collapsed');
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadCharacter);
