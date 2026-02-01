/// <reference path="../pb_data/types.d.ts" />

/**
 * Collection Hook for users_stats
 * Sanitizes incoming data before record creation to prevent validation errors.
 * Compatible with PocketBase v0.22+ JSVM
 */
onRecordBeforeCreateRequest((e) => {
    // Already filtered by the second argument of onRecordBeforeCreateRequest,
    // but good to have for absolute certainty.
    if (e.collection.name !== 'users_stats') {
        return;
    }

    // If 'id' is present in the request data but empty, it triggers "Cannot be blank".
    // We can't easily 'delete' from the record object like a plain JS object,
    // but we can check if it's dirty and clear it if it's problematic.
    // However, the most robust way in a hook is to just let PocketBase handle it
    // if we don't explicitly need a specific ID.

    // Instead of complex ID manipulation, let's just focus on ensuring 
    // all fields are present and valid, which usually fixes these types of cascade errors.

    const defaults = {
        character_name: "Unnamed Hero",
        class_name: "Commoner",
        species: "Human",
        background: "None",
        hp: 10,
        max_hp: 10,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        xp: 0,
        gold: 0,
        conditions: [],
        factions: {},
        piety_deity: "",
        piety_score: 0,
        levels: {},
        spells: [],
        feats: [],
        bastion: [],
        inventory: []
    };

    // Use e.record.get() and e.record.set() for v0.22+
    for (let key in defaults) {
        let val = e.record.get(key);
        // If the value is "empty" (null, undefined, or empty string for text fields), apply default
        if (val === null || val === undefined || val === "") {
            e.record.set(key, defaults[key]);
        }
    }

    // Special handling for the user field - it MUST be present
    if (!e.record.get("user")) {
        // If we're in an auth context, default to the current user
        const authRecord = e.httpContext.get("authRecord");
        if (authRecord) {
            e.record.set("user", authRecord.id);
        }
    }

    console.log('users_stats record sanitized for user:', e.record.get("user"));
}, "users_stats");
