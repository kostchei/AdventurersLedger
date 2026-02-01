

migrate((db) => {
    try {
        const dao = new Dao(db);
        const collection = dao.findCollectionByNameOrId("users_stats");

        // Re-define absolute field list to ensure consistency and add new ones
        const fields = [
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text3208210256",
                "max": 0,
                "min": 0,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "cascadeDelete": true,
                "collectionId": "_pb_users_auth_",
                "hidden": false,
                "id": "rel_user",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "user",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "hidden": false,
                "id": "num_hp",
                "max": null,
                "min": null,
                "name": "hp",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "num_mhp",
                "max": null,
                "min": null,
                "name": "max_hp",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "num_gold",
                "max": null,
                "min": null,
                "name": "gold",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "num_xp",
                "max": null,
                "min": null,
                "name": "xp",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "json_cond",
                "maxSize": 0,
                "name": "conditions",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "json"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            // --- NEW FIELDS ---
            {
                "hidden": false,
                "id": "json_inventory",
                "maxSize": 0,
                "name": "inventory",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "json"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text_character_name",
                "max": 0,
                "min": 0,
                "name": "character_name",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text_class_name",
                "max": 0,
                "min": 0,
                "name": "class_name",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text_species",
                "max": 0,
                "min": 0,
                "name": "species",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text_background",
                "max": 0,
                "min": 0,
                "name": "background",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "json_spells",
                "maxSize": 0,
                "name": "spells",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "json"
            },
            {
                "hidden": false,
                "id": "json_feats",
                "maxSize": 0,
                "name": "feats",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "json"
            },
            {
                "hidden": false,
                "id": "json_bastion",
                "maxSize": 0,
                "name": "bastion",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "json"
            },
            // --- ATTRIBUTES ---
            {
                "hidden": false,
                "id": "num_str",
                "max": null,
                "min": null,
                "name": "strength",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "num_dex",
                "max": null,
                "min": null,
                "name": "dexterity",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "num_con",
                "max": null,
                "min": null,
                "name": "constitution",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "num_int",
                "max": null,
                "min": null,
                "name": "intelligence",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "num_wis",
                "max": null,
                "min": null,
                "name": "wisdom",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "num_cha",
                "max": null,
                "min": null,
                "name": "charisma",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            },
            // --- EXTRA RPG FIELDS ---
            {
                "hidden": false,
                "id": "json_factions",
                "maxSize": 0,
                "name": "factions",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "json"
            },
            {
                "hidden": false,
                "id": "json_levels",
                "maxSize": 0,
                "name": "levels",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "json"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text_piety_deity",
                "max": 0,
                "min": 0,
                "name": "piety_deity",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "num_piety_score",
                "max": null,
                "min": null,
                "name": "piety_score",
                "onlyInt": false,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
            }
        ];

        unmarshal({
            "fields": fields
        }, collection);

        return dao.saveCollection(collection);
    } catch (e) {
        console.log("Migration 1769944800 failed: " + e);
    }
}, (db) => {
    try {
        const dao = new Dao(db);
        const collection = dao.findCollectionByNameOrId("users_stats");
        // revert logic omitted for safety
        return dao.saveCollection(collection);
    } catch (e) {
        console.log("Revert 1769944800 failed: " + e);
    }
})
