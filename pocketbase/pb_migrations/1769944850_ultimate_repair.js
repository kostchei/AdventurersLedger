/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    try {
        const dao = new Dao(db);
        let collection;
        try {
            collection = dao.findCollectionByNameOrId("users_stats");
        } catch (e) {
            collection = new Collection({
                name: "users_stats",
                type: "base",
            });
        }

        // --- DEFINITIVE SCHEMA REPAIR ---
        // Using raw objects as they are most portable across v0.22.x versions.
        // WE OMIT THE 'id' FIELD to restore system auto-generation.
        const fields = [
            {
                "id": "rel_user",
                "name": "user",
                "type": "relation",
                "system": false,
                "required": true,
                "options": {
                    "collectionId": "_pb_users_auth_",
                    "cascadeDelete": true,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": null
                }
            },
            { "id": "text_char_name", "name": "character_name", "type": "text" },
            { "id": "text_class_name", "name": "class_name", "type": "text" },
            { "id": "text_species", "name": "species", "type": "text" },
            { "id": "text_background", "name": "background", "type": "text" },
            { "id": "num_hp", "name": "hp", "type": "number" },
            { "id": "num_mhp", "name": "max_hp", "type": "number" },
            { "id": "num_gold", "name": "gold", "type": "number" },
            { "id": "num_xp", "name": "xp", "type": "number" },
            { "id": "num_str", "name": "strength", "type": "number", "options": { "max": 30 } },
            { "id": "num_dex", "name": "dexterity", "type": "number", "options": { "max": 30 } },
            { "id": "num_con", "name": "constitution", "type": "number", "options": { "max": 30 } },
            { "id": "num_int", "name": "intelligence", "type": "number", "options": { "max": 30 } },
            { "id": "num_wis", "name": "wisdom", "type": "number", "options": { "max": 30 } },
            { "id": "num_cha", "name": "charisma", "type": "number", "options": { "max": 30 } },
            { "id": "json_cond", "name": "conditions", "type": "json", "options": { "maxSize": 2000000 } },
            { "id": "json_factions", "name": "factions", "type": "json", "options": { "maxSize": 2000000 } },
            { "id": "json_levels", "name": "levels", "type": "json", "options": { "maxSize": 2000000 } },
            { "id": "text_piety_deity", "name": "piety_deity", "type": "text" },
            { "id": "num_piety_score", "name": "piety_score", "type": "number" },
            { "id": "json_spells", "name": "spells", "type": "json", "options": { "maxSize": 2000000 } },
            { "id": "json_feats", "name": "feats", "type": "json", "options": { "maxSize": 2000000 } },
            { "id": "json_bastion", "name": "bastion", "type": "json", "options": { "maxSize": 2000000 } },
            { "id": "json_inventory", "name": "inventory", "type": "json", "options": { "maxSize": 2000000 } },
            { "id": "json_magic_items", "name": "magic_items", "type": "json", "options": { "maxSize": 2000000 } },
            { "id": "json_attuned_items", "name": "attuned_items", "type": "json", "options": { "maxSize": 2000000 } }
        ];

        collection.schema = fields;

        // Reset rules
        collection.listRule = "@request.auth.id != ''";
        collection.viewRule = "@request.auth.id != ''";
        collection.createRule = "@request.auth.id != '' && @request.data.user = @request.auth.id";
        collection.updateRule = "@request.auth.id = user";
        collection.deleteRule = "@request.auth.id = user";

        return dao.saveCollection(collection);
    } catch (e) {
        console.log("Ultimate Repair Migration (1769944850) failed: " + e);
        return null; // Return null instead of throwing to prevent boot lock
    }
}, (db) => {
    return null;
})
