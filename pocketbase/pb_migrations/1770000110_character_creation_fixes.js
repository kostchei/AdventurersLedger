migrate((db) => {
    const dao = new Dao(db);

    try {
        const collection = dao.findCollectionByNameOrId("users_stats");

        console.log("Applying character creation fixes to users_stats...");

        // 1. Update rules for campaign visibility and NPC support
        collection.listRule = "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || campaign.campaign_memberships_via_campaign.user ?= @request.auth.id)";
        collection.viewRule = "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || campaign.campaign_memberships_via_campaign.user ?= @request.auth.id)";
        collection.createRule = "@request.auth.id != '' && (campaign.dmId = @request.auth.id || (campaign.campaign_memberships_via_campaign.user ?= @request.auth.id && @request.data.user = @request.auth.id))";
        collection.updateRule = "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id)";
        collection.deleteRule = "@request.auth.id != '' && campaign.dmId = @request.auth.id";

        // 2. Add the 'campaign' field if it doesn't exist
        let schema = collection.schema;
        let hasCampaign = false;
        let userField = null;

        for (let i = 0; i < schema.length; i++) {
            if (schema[i].name === "campaign") {
                hasCampaign = true;
            }
            if (schema[i].name === "user") {
                userField = schema[i];
            }
        }

        if (!hasCampaign) {
            const newFields = [];
            for (let i = 0; i < schema.length; i++) {
                newFields.push(schema[i]);
            }
            newFields.push({
                "id": "rel_campaign_stats",
                "name": "campaign",
                "type": "relation",
                "system": false,
                "required": false,
                "options": {
                    "collectionId": "pbc_camp_001",
                    "cascadeDelete": true,
                    "minSelect": 0,
                    "maxSelect": 1,
                    "displayFields": []
                }
            });
            collection.schema = newFields;
        }

        // 3. Make 'user' optional for NPC support
        if (userField) {
            userField.required = false;
            collection.schema = schema;
        }

        dao.saveCollection(collection);
        console.log("Character creation fixes applied successfully.");
    } catch (e) {
        console.log("Character creation fixes migration FAILED (failing soft): " + e);
        // Soft fail to prevent bootstrap lock
        return null;
    }

    return null;
}, (db) => {
    // Reverse logic if needed, but for addition we usually skip or just log
    return null;
})
