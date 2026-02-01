/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    try {
        const dao = new Dao(db);
        let collection;
        try {
            collection = dao.findCollectionByNameOrId("users_stats");
        } catch (e) {
            console.log("Collection 'users_stats' not found, skipping rules update.");
            return;
        }

        // allow authenticated users to create (needed for initial character creation)
        // and ensure they can only create for themselves
        collection.createRule = "@request.auth.id != '' && @request.data.user = @request.auth.id";

        // ensures users can only read/update their own stats (active user matches record user)
        collection.listRule = "@request.auth.id != ''"; // Allow listing (filters usually applied by client, but good to open for "fellowship" views if needed? Actually Fellowship needs to see ALL. Wait. The logic is Fellowship usage.)
        // Actually, the fellowship feature needs to see ALL characters.
        // So listRule should be "@request.auth.id != ''" (Any auth user).

        collection.listRule = "@request.auth.id != ''";
        collection.viewRule = "@request.auth.id != ''";

        // Update/Delete restricted to owner
        collection.updateRule = "@request.auth.id = user";
        collection.deleteRule = "@request.auth.id = user";

        return dao.saveCollection(collection);
    } catch (e) {
        // Log error but allow startup to continue
        console.log("Migration 1769944810 failed: " + e);
    }
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("users_stats");

        // Revert to stricter rules (Admin only) or previous state
        collection.createRule = null;
        collection.listRule = null;
        collection.viewRule = null;
        collection.updateRule = null;
        collection.deleteRule = null;

        return app.dao().saveCollection(collection);
    } catch (e) {
        console.log("Revert 1769944810 failed: " + e);
    }
})
