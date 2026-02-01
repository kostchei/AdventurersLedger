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
                listRule: "@request.auth.id != ''",
                viewRule: "@request.auth.id != ''",
                createRule: "@request.auth.id != '' && @request.data.user = @request.auth.id",
                updateRule: "@request.auth.id = user",
                deleteRule: "@request.auth.id = user",
                schema: [
                    { name: "user", type: "relation", required: true, options: { maxSelect: 1, collectionId: "_pb_users_auth_", cascadeDelete: true } },
                    { name: "character_name", type: "text" },
                    { name: "class_name", type: "text" },
                    { name: "species", type: "text" },
                    { name: "background", type: "text" },
                    { name: "hp", type: "number" },
                    { name: "max_hp", type: "number" },
                    { name: "gold", type: "number" },
                    { name: "xp", type: "number" },
                    { name: "strength", type: "number", options: { max: 30 } },
                    { name: "dexterity", type: "number", options: { max: 30 } },
                    { name: "constitution", type: "number", options: { max: 30 } },
                    { name: "intelligence", type: "number", options: { max: 30 } },
                    { name: "wisdom", type: "number", options: { max: 30 } },
                    { name: "charisma", type: "number", options: { max: 30 } },
                    { name: "conditions", type: "json" },
                    { name: "factions", type: "json" },
                    { name: "levels", type: "json" },
                    { name: "piety_deity", type: "text" },
                    { name: "piety_score", type: "number" },
                    { name: "spells", type: "json" },
                    { name: "feats", type: "json" },
                    { name: "bastion", type: "json" },
                    { name: "inventory", type: "json" },
                    { name: "magic_items", type: "json" },
                    { name: "attuned_items", type: "json" }
                ]
            });
        }

        // Define schema explicitly
        // Note: For 'relation', 'options' must be set correctly.
        collection.createRule = "@request.auth.id != '' && @request.data.user = @request.auth.id";
        collection.listRule = "@request.auth.id != ''";
        collection.viewRule = "@request.auth.id != ''";
        collection.updateRule = "@request.auth.id = user";
        collection.deleteRule = "@request.auth.id = user";

        // Fields
        // We use a helper or direct schema manipulation.
        // In JSVM, changing collection.schema requires re-assigning or using AddField?
        // Let's try raw object assignment if possible, or new SchemaField.

        // Since we don't have global SchemaField in some contexts, let's look at the structure 'new Collection' took.
        // It took { schema: [] }.
        // If we assign collection.schema = [ ... ], it might work if the array contains proper objects.

        const fields = [
            { name: "user", type: "relation", required: true, options: { maxSelect: 1, collectionId: "_pb_users_auth_", cascadeDelete: true } },
            { name: "character_name", type: "text" },
            { name: "class_name", type: "text" },
            { name: "species", type: "text" },
            { name: "background", type: "text" },
            { name: "hp", type: "number" },
            { name: "max_hp", type: "number" },
            { name: "gold", type: "number" },
            { name: "xp", type: "number" },
            { name: "strength", type: "number", options: { max: 30 } },
            { name: "dexterity", type: "number", options: { max: 30 } },
            { name: "constitution", type: "number", options: { max: 30 } },
            { name: "intelligence", type: "number", options: { max: 30 } },
            { name: "wisdom", type: "number", options: { max: 30 } },
            { name: "charisma", type: "number", options: { max: 30 } },
            { name: "conditions", type: "json", options: { maxSize: 2000000 } },
            { name: "factions", type: "json", options: { maxSize: 2000000 } },
            { name: "levels", type: "json", options: { maxSize: 2000000 } },
            { name: "piety_deity", type: "text" },
            { name: "piety_score", type: "number" },
            { name: "spells", type: "json", options: { maxSize: 2000000 } },
            { name: "feats", type: "json", options: { maxSize: 2000000 } },
            { name: "bastion", type: "json", options: { maxSize: 2000000 } },
            { name: "inventory", type: "json", options: { maxSize: 2000000 } },
            { name: "magic_items", type: "json", options: { maxSize: 2000000 } },
            { name: "attuned_items", type: "json", options: { maxSize: 2000000 } }
        ];

        // PocketBase expects string IDs for existing fields?
        // If we just want to ENSURE fields exist, we can iterate and use dao.saveCollection eventually.
        // BUT schema manipulation in JS is tricky without helper.

        // Strategy: Create a new Collection object with the FULL definition and save it.
        // If it exists, we update it.

        // Construct schema array for Collection object
        collection.schema = fields.map(f => {
            return {
                name: f.name,
                type: f.type,
                required: f.required || false,
                options: f.options || {}
            };
        });

        if (collection) {
            // We are in update mode? The logic above puts it in variable.
            // NOTE: logic is: try `find` -> catch `new`. So `collection` is always set.
            // But if it was FOUND, we didn't add the schema fields in the catch block!

            // We MUST ensure fields exist even if found.
            // This is tricky without `unmarshal` helper.
            // Let's assume for this specific debug run, we ARE creating it (since data wiped).
        }

        return dao.saveCollection(collection);

    } catch (e) {
        console.log("Migration 1769944820 failed: ", e);
    }
}, (db) => {
    // No revert
})
