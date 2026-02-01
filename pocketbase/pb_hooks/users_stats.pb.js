/// <reference path="../pb_data/types.d.ts" />

/**
 * Collection Hook for users_stats
 * Sanitizes incoming data before record creation to prevent validation errors
 */
onRecordBeforeCreateRequest((e) => {
    // Only apply to users_stats collection
    if (e.collection.name !== 'users_stats') {
        return;
    }

    // Remove 'id' field if it exists (common source of "Cannot be blank" errors)
    if (e.data['id'] !== undefined) {
        delete e.data['id'];
    }

    // Ensure required fields have safe defaults
    const defaults = {
        character_name: e.data.character_name || 'Unnamed Hero',
        class_name: e.data.class_name || 'Commoner',
        species: e.data.species || 'Human',
        background: e.data.background || 'None',
        hp: e.data.hp ?? 10,
        max_hp: e.data.max_hp ?? 10,
        strength: e.data.strength ?? 10,
        dexterity: e.data.dexterity ?? 10,
        constitution: e.data.constitution ?? 10,
        intelligence: e.data.intelligence ?? 10,
        wisdom: e.data.wisdom ?? 10,
        charisma: e.data.charisma ?? 10,
        xp: e.data.xp ?? 0,
        gold: e.data.gold ?? 0,
        conditions: e.data.conditions || [],
        factions: e.data.factions || {},
        piety_deity: e.data.piety_deity || '',
        piety_score: e.data.piety_score ?? 0,
        levels: e.data.levels || {},
        spells: e.data.spells || [],
        feats: e.data.feats || [],
        bastion: e.data.bastion || [],
        inventory: e.data.inventory || []
    };

    // Merge defaults with provided data
    Object.assign(e.data, defaults);

    console.log('users_stats creation sanitized:', e.data);
}, "users_stats");
