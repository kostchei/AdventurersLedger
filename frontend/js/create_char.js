/**
 * Character Creation - Adventurers Ledger
 * Uses local game data API instead of Open5e for 2024 Faerun campaign
 */

// Global state for selection
let selectedSpecies = null;
let selectedClass = null;
let gameData = {
    species: [],
    classes: [],
    backgrounds: []
};

// Archetype Definitions (updated for Faerun species)
const ARCHETYPES = [
    { name: 'Warrior', desc: 'Strong front-line fighter', class: 'Fighter', species: 'Human' },
    { name: 'Mage', desc: 'Master of arcane arts', class: 'Wizard', species: 'Elf' },
    { name: 'Scout', desc: 'Stealthy explorer', class: 'Rogue', species: 'Halfling' },
    { name: 'Priest', desc: 'Divine healer', class: 'Cleric', species: 'Dwarf' },
    { name: 'Brute', desc: 'Towering berserker', class: 'Barbarian', species: 'Half-Ogre' },
    { name: 'Mystic', desc: 'Celestial champion', class: 'Paladin', species: 'Aasimar' }
];

/**
 * Fetch game data from local API
 */
async function loadGameData() {
    try {
        const [speciesRes, classesRes, backgroundsRes] = await Promise.all([
            fetch('/api/characters/game-data/species'),
            fetch('/api/characters/game-data/classes'),
            fetch('/api/characters/game-data/backgrounds')
        ]);

        const speciesData = await speciesRes.json();
        const classesData = await classesRes.json();
        const backgroundsData = await backgroundsRes.json();

        gameData.species = speciesData.species || [];
        gameData.classes = classesData.classes || [];
        gameData.backgrounds = backgroundsData.backgrounds || [];

        return gameData;
    } catch (e) {
        console.error("Failed to load game data:", e);
        return gameData;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Live update for name
    const nameInput = document.getElementById('char-name');
    if (nameInput) {
        nameInput.addEventListener('input', updateSummary);
    }

    // Populate Archetype List
    const archList = document.getElementById('archetype-list');
    if (archList) {
        ARCHETYPES.forEach(arch => {
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.innerHTML = `<h3>${arch.name}</h3><div class="desc-text">${arch.desc}</div>`;
            card.onclick = () => selectArchetype(arch);
            archList.appendChild(card);
        });
    }

    // Load Game Data from local API
    await loadGameData();

    const speciesList = document.getElementById('species-list');
    const classList = document.getElementById('class-list');
    const backgroundSelect = document.getElementById('char-background');

    // Populate Species
    if (speciesList && gameData.species.length) {
        speciesList.innerHTML = '';
        gameData.species.forEach(s => {
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.innerHTML = `<h3>${s.name}</h3><div class="desc-text">${s.description || ''}</div>`;
            card.onclick = () => {
                document.querySelectorAll('#species-list .selection-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectSpecies(s.name);
            };
            speciesList.appendChild(card);
        });
    }

    // Populate Classes
    if (classList && gameData.classes.length) {
        classList.innerHTML = '';
        gameData.classes.forEach(c => {
            const card = document.createElement('div');
            card.className = 'selection-card';
            const subclassText = c.subclasses && c.subclasses.length > 0
                ? `<div class="subclass-preview">${c.subclasses.length} subclasses</div>`
                : '';
            card.innerHTML = `<h3>${c.name}</h3><div class="desc-text">Hit Die: ${c.hit_die}</div>${subclassText}`;
            card.onclick = () => {
                document.querySelectorAll('#class-list .selection-card').forEach(el => el.classList.remove('selected'));
                card.classList.add('selected');
                selectClass(c.name);
            };
            classList.appendChild(card);
        });
    }

    // Populate Backgrounds dropdown
    if (backgroundSelect && gameData.backgrounds.length) {
        // Clear existing options except first placeholder
        while (backgroundSelect.options.length > 1) {
            backgroundSelect.remove(1);
        }
        gameData.backgrounds.forEach(bg => {
            const option = document.createElement('option');
            option.value = bg.name;
            option.textContent = bg.name;
            backgroundSelect.appendChild(option);
        });
    }

    // Handle Form Submit
    document.getElementById('create-char-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const characterData = {
            name: document.getElementById('char-name').value,
            background: document.getElementById('char-background').value,
            species: document.getElementById('char-species').value,
            class_name: document.getElementById('char-class').value,
            level: 1,
            stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }
        };

        try {
            const response = await fetch('/api/characters/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(characterData)
            });

            if (response.ok) {
                const createdChar = await response.json();
                // Redirect to character sheet
                window.location.href = `/character/${createdChar.id}`;
            } else {
                const err = await response.json();
                console.error("Creation Error:", err);
                alert('Error creating character: ' + (err.detail || JSON.stringify(err)));
            }
        } catch (error) {
            console.error("Network/System Error:", error);
            alert('System error: ' + error.message);
        }
    });
});

// Helper functions to update state and summary
function selectSpecies(name) {
    selectedSpecies = name;
    document.getElementById('char-species').value = name;
    updateSummary();
}

function selectClass(name) {
    selectedClass = name;
    document.getElementById('char-class').value = name;
    updateSummary();
}

function updateSummary() {
    document.getElementById('summary-name').innerText = "Name: " + document.getElementById('char-name').value;
    document.getElementById('summary-species').innerText = "Species: " + (selectedSpecies || 'Not selected');
    document.getElementById('summary-class').innerText = "Class: " + (selectedClass || 'Not selected');
    document.getElementById('summary-background').innerText = "Background: " + document.getElementById('char-background').value;
}

// Mode Handling
window.setGenMode = async function (mode) {
    if (mode === 'handcrafted') {
        window.nextStep(1); // Go to identity
    } else if (mode === 'random') {
        await generateRandom();
    } else if (mode === 'archetype') {
        document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
        document.getElementById('step-0-5').classList.add('active');
    }
};


window.selectArchetype = function (arch) {
    // Auto-fill
    selectSpecies(arch.species);
    selectClass(arch.class);
    // Auto-name if empty
    if (!document.getElementById('char-name').value) {
        document.getElementById('char-name').value = "New " + arch.name;
    }
    // Skip to review (Step 4)
    window.nextStep(4);
};

window.generateRandom = async function () {
    // Use cached game data
    if (gameData.species.length && gameData.classes.length) {
        const s = gameData.species[Math.floor(Math.random() * gameData.species.length)];
        const c = gameData.classes[Math.floor(Math.random() * gameData.classes.length)];

        selectSpecies(s.name);
        selectClass(c.name);

        // Random background too
        if (gameData.backgrounds.length) {
            const bg = gameData.backgrounds[Math.floor(Math.random() * gameData.backgrounds.length)];
            document.getElementById('char-background').value = bg.name;
        }

        if (!document.getElementById('char-name').value) {
            document.getElementById('char-name').value = "Random Hero";
        }

        window.nextStep(4); // Jump to Review
    } else {
        alert("Data still loading, please wait...");
    }
};

window.updateSummary = updateSummary;
