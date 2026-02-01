/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    try {
        const dao = new Dao(db);
        let collection;
        try {
            collection = dao.findCollectionByNameOrId("users_stats");
        } catch (e) {
            return null;
        }

        collection.createRule = "@request.auth.id != '' && @request.data.user = @request.auth.id";
        collection.listRule = "@request.auth.id != ''";
        collection.viewRule = "@request.auth.id != ''";
        collection.updateRule = "@request.auth.id = user";
        collection.deleteRule = "@request.auth.id = user";

        return dao.saveCollection(collection);
    } catch (e) {
        console.log("Migration 1769944810 safely ignored: " + e);
        return null;
    }
}, (db) => {
    return null;
})
