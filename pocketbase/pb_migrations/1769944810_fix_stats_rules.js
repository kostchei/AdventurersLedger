/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("users_stats");

    // Allow authenticated users to create records
    // And ensure they can only create records linked to themselves
    collection.createRule = "@request.auth.id != '' && @request.data.user = @request.auth.id";

    // Allow users to view/update/delete their own stats
    collection.listRule = "@request.auth.id != ''";
    collection.viewRule = "@request.auth.id != ''";
    collection.updateRule = "@request.auth.id = user";
    collection.deleteRule = "@request.auth.id = user";

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("users_stats");

    // Revert to stricter rules (Admin only) or previous state
    collection.createRule = null;
    collection.listRule = null;
    collection.viewRule = null;
    collection.updateRule = null;
    collection.deleteRule = null;

    return app.save(collection);
})
