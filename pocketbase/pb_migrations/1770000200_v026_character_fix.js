migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("users_stats");

        console.log("Applying v0.26 compatible character creation fixes...");

        // 1. Update rules
        collection.listRule = "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || campaign.campaign_memberships_via_campaign.user ?= @request.auth.id)";
        collection.viewRule = "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || campaign.campaign_memberships_via_campaign.user ?= @request.auth.id)";
        collection.createRule = "@request.auth.id != '' && (campaign.dmId = @request.auth.id || (campaign.campaign_memberships_via_campaign.user ?= @request.auth.id && @request.data.user = @request.auth.id))";
        collection.updateRule = "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id)";
        collection.deleteRule = "@request.auth.id != '' && campaign.dmId = @request.auth.id";

        // 2. Add 'campaign' field if missing
        const campaignField = collection.fields.getByName("campaign");
        if (!campaignField) {
            collection.fields.add({
                name: "campaign",
                type: "relation",
                required: false,
                options: {
                    collectionId: "pbc_camp_001",
                    cascadeDelete: true,
                    minSelect: 0,
                    maxSelect: 1,
                }
            });
        }

        // 3. Make 'user' optional
        const userField = collection.fields.getByName("user");
        if (userField) {
            userField.required = false;
        }

        return app.saveCollection(collection);
    } catch (e) {
        console.log("Migration 1770000200 failed (failing soft): " + e);
        return null;
    }
}, (app) => {
    return null;
})
