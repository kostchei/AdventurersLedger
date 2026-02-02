migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("users_stats");
        if (!collection) {
            return null;
        }

        collection.listRule = "@request.auth.id != ''";
        collection.viewRule = "@request.auth.id != ''";

        return app.saveCollection(collection);
    } catch (e) {
        console.log("Migration 1770100000 failed (failing soft): " + e);
        return null;
    }
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("users_stats");
        if (!collection) {
            return null;
        }

        collection.listRule = "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || campaign.campaign_memberships_via_campaign.user ?= @request.auth.id)";
        collection.viewRule = "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || campaign.campaign_memberships_via_campaign.user ?= @request.auth.id)";

        return app.saveCollection(collection);
    } catch (e) {
        console.log("Migration 1770100000 rollback failed (failing soft): " + e);
        return null;
    }
})
