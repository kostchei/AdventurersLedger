migrate(
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("users_stats");
      if (!collection) return null;

      // Ensure campaign is a required relation to campaigns
      let campaign = collection.fields.getByName("campaign");
      if (!campaign) {
        campaign = {
          name: "campaign",
          type: "relation",
          required: true,
          options: {
            collectionId: "pbc_camp_001",
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        };
        collection.fields.add(campaign);
      } else {
        campaign.required = true;
        campaign.options = campaign.options || {};
        campaign.options.minSelect = 1;
        campaign.options.maxSelect = 1;
      }

      // Ensure user is required.
      const userField = collection.fields.getByName("user");
      if (userField) {
        userField.required = true;
      }

      // Visibility rules:
      // - Owners can see their own.
      // - Campaign DM can see all in the campaign.
      // - Global GMs/Admins can see all (system-wide), while the UI still scopes to the current campaign.
      const canViewAll = "@request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN'";
      collection.listRule =
        `@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || ${canViewAll})`;
      collection.viewRule =
        `@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || ${canViewAll})`;

      // Enforce campaign presence on create to prevent orphaned cross-campaign records.
      collection.createRule =
        "@request.auth.id != '' && @request.data.campaign != '' && (campaign.dmId = @request.auth.id || (campaign.campaign_memberships_via_campaign.user ?= @request.auth.id && @request.data.user = @request.auth.id))";

      collection.updateRule =
        `@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || ${canViewAll})`;

      // Index for faster campaign filtering (PocketBase expects raw SQL strings here).
      collection.indexes = collection.indexes || [];
      const campaignIdx =
        "CREATE INDEX `users_stats_campaign_idx` ON `users_stats` (`campaign`)";
      if (!collection.indexes.includes(campaignIdx)) {
        collection.indexes.push(campaignIdx);
      }

      return app.saveCollection(collection);
    } catch (e) {
      console.log("Migration 1770500000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("users_stats");
      if (!collection) return null;

      // Roll back: make campaign optional again and relax createRule
      const campaign = collection.fields.getByName("campaign");
      if (campaign) {
        campaign.required = false;
        campaign.options = campaign.options || {};
        campaign.options.minSelect = 0;
      }

      // Revert user required flag to optional (historical behavior).
      const userField = collection.fields.getByName("user");
      if (userField) {
        userField.required = false;
      }

      collection.createRule =
        "@request.auth.id != '' && (campaign.dmId = @request.auth.id || (campaign.campaign_memberships_via_campaign.user ?= @request.auth.id && @request.data.user = @request.auth.id))";

      // Restore older restrictive visibility rules (owner or campaign DM).
      collection.listRule =
        "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id)";
      collection.viewRule =
        "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id)";
      collection.updateRule =
        "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id)";

      if (Array.isArray(collection.indexes)) {
        const campaignIdx =
          "CREATE INDEX `users_stats_campaign_idx` ON `users_stats` (`campaign`)";
        collection.indexes = collection.indexes.filter((x) => x !== campaignIdx);
      }

      return app.saveCollection(collection);
    } catch (e) {
      console.log("Migration 1770500000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);
