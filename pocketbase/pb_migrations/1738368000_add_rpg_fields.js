/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("users_stats");

    // 1. Rename existing fields (if needed) or update logic
    // "Vitality", "Fortune", "Journey" are mostly UI changes, but let's default new fields.

    // 2. Add New Fields
    const fieldsToAdd = [
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
        }
    ];

    // Helper to check if field exists
    const existingFieldNames = collection.schema.map(f => f.name);

    fieldsToAdd.forEach(field => {
        if (!existingFieldNames.includes(field.name)) {
            collection.schema.addField(new SchemaField(field));
        }
    });

    return dao.saveCollection(collection);
}, (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("users_stats");

    // Revert: remove the fields
    const fieldsToRemove = ["inventory", "character_name", "class_name", "species", "background", "spells", "feats", "bastion"];

    fieldsToRemove.forEach(name => {
        const field = collection.schema.getFieldByName(name);
        if (field) {
            collection.schema.removeField(name);
        }
    });

    return dao.saveCollection(collection);
})
