migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("users_stats");
        if (!collection) {
            console.log("Migration: users_stats collection not found");
            return null;
        }

        const campaignField = collection.fields.getByName("campaign");
        if (!campaignField) {
            console.log("Migration: adding missing campaign relation field to users_stats");
            collection.fields.add({
                name: "campaign",
                type: "relation",
                required: false,
                presentable: false,
                hidden: false,
                collectionId: "pbc_camp_001",
                cascadeDelete: true,
                minSelect: 0,
                maxSelect: 1,
                system: false,
            });
        }

        // Require campaign during direct client creates while keeping existing records valid.
        collection.createRule = "@request.auth.id != '' && @request.data.campaign != '' && (campaign.dmId = @request.auth.id || (campaign.campaign_memberships_via_campaign.user ?= @request.auth.id && @request.data.user = @request.auth.id))";

        const campaignIndexName = "users_stats_campaign_idx";
        const indexSql = "CREATE INDEX `users_stats_campaign_idx` ON `users_stats` (`campaign`)";
        const hasCampaignIndex = (collection.indexes || []).some((idx) => idx.includes(campaignIndexName));
        if (!hasCampaignIndex) {
            collection.indexes = [...(collection.indexes || []), indexSql];
        }

        return app.saveCollection(collection);
    } catch (e) {
        console.log("Migration 1770500000 failed (failing soft): " + e);
        return null;
    }
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("users_stats");
        if (!collection) return null;

        collection.createRule = "@request.auth.id != '' && (campaign.dmId = @request.auth.id || (campaign.campaign_memberships_via_campaign.user ?= @request.auth.id && @request.data.user = @request.auth.id))";
        collection.indexes = (collection.indexes || []).filter((idx) => !idx.includes("users_stats_campaign_idx"));

        return app.saveCollection(collection);
    } catch (e) {
        console.log("Migration 1770500000 rollback failed: " + e);
        return null;
    }
})
