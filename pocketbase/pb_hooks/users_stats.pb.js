/// <reference path="../pb_data/types.d.ts" />

/**
 * Collection Hook for users_stats
 * Sanitizes incoming data before record creation to prevent validation errors.
 * Refactored for PocketBase v0.26 compatibility.
 */
app.onRecordBeforeCreateRequest((e) => {
    const defaults = {
        character_name: "Unnamed Hero",
        class_name: "Commoners",
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

    for (let key in defaults) {
        let val = e.record.get(key);
        if (val === null || val === undefined || val === "") {
            e.record.set(key, defaults[key]);
        }
    }

    // Special handling for the user field
    if (!e.record.get("user") && e.httpContext) {
        const authRecord = e.httpContext.get("authRecord");
        if (authRecord) {
            e.record.set("user", authRecord.id);
        }
    }

    // console.log('users_stats record sanitized');
    return e.next();
}, "users_stats");
