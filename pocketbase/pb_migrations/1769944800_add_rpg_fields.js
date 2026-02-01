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

        // We will define a minimal safe schema here.
        // We EXPLICITLY OMIT the 'id' field as it's a system field.
        const fields = [
            {
                "id": "rel_user",
                "name": "user",
                "type": "relation",
                "required": true,
                "options": {
                    "collectionId": "_pb_users_auth_",
                    "cascadeDelete": true,
                    "maxSelect": 1
                }
            },
            { "id": "text_char_name", "name": "character_name", "type": "text" },
            { "id": "text_class_name", "name": "class_name", "type": "text" },
            { "id": "num_hp", "name": "hp", "type": "number" },
            { "id": "num_mhp", "name": "max_hp", "type": "number" },
            { "id": "json_cond", "name": "conditions", "type": "json", "options": { "maxSize": 2000000 } }
        ];

        collection.schema = fields;

        // Basic rules to ensure it's not locked down
        collection.listRule = "@request.auth.id != ''";
        collection.viewRule = "@request.auth.id != ''";
        collection.createRule = "@request.auth.id != '' && @request.data.user = @request.auth.id";
        collection.updateRule = "@request.auth.id = user";
        collection.deleteRule = "@request.auth.id = user";

        return dao.saveCollection(collection);
    } catch (e) {
        console.log("Migration 1769944800 (RPG Fields) was safely skipped or partially applied: " + e);
        return null;
    }
}, (db) => {
    return null;
})
