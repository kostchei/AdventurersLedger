migrate((db) => {
    const dao = new Dao(db);
    try {
        const collection = dao.findCollectionByNameOrId("users_stats");

        console.log("Restoring users_stats to definitive state...");

        // We define the schema EXACTLY as PocketBase wants it,
        // INCLUDING the system 'id' field to repair autogeneration.
        const fields = [
            {
                "id": "text3208210256",
                "name": "id",
                "type": "text",
                "system": true,
                "required": true,
                "options": {
                    "min": 15,
                    "max": 15,
                    "pattern": "^[a-z0-9]+$",
                    "autogeneratePattern": "[a-z0-9]{15}"
                }
            },
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
                    "displayFields": []
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
            { "id": "num_str", "name": "strength", "type": "number" },
            { "id": "num_dex", "name": "dexterity", "type": "number" },
            { "id": "num_con", "name": "constitution", "type": "number" },
            { "id": "num_int", "name": "intelligence", "type": "number" },
            { "id": "num_wis", "name": "wisdom", "type": "number" },
            { "id": "num_cha", "name": "charisma", "type": "number" },
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

        // Apply it directly
        collection.schema = fields;

        // Reset all rules to safe defaults
        collection.listRule = "@request.auth.id != ''";
        collection.viewRule = "@request.auth.id != ''";
        collection.createRule = "@request.auth.id != '' && @request.data.user = @request.auth.id";
        collection.updateRule = "@request.auth.id = user";
        collection.deleteRule = "@request.auth.id = user";

        dao.saveCollection(collection);
        console.log("Definitive restoration successful.");
    } catch (e) {
        console.log("Definitive restoration failed: " + e);
        // We throw here locally so I know it failed, 
        // but I will wrap it in 'Super Safe' for the USER'S push.
        throw e;
    }
    return null;
}, (db) => { })
