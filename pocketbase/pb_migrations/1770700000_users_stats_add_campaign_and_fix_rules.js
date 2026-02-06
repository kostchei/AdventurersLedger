migrate(
  (app) => {
    try {
      const usersStats = app.findCollectionByNameOrId("users_stats");
      if (!usersStats) return null;

      const campaigns = app.findCollectionByNameOrId("campaigns");
      const users = app.findCollectionByNameOrId("_pb_users_auth_");

      // Ensure the `campaign` relation field exists and points at the real campaigns collection id.
      // This unblocks `filter: campaign = "<id>"` and prevents rule evaluation panics on some installs.
      let campaignField = usersStats.fields.getByName("campaign");
      if (!campaignField) {
        usersStats.fields.add({
          name: "campaign",
          type: "relation",
          required: false, // don't break existing records; createRule enforces presence
          options: {
            collectionId: campaigns ? campaigns.id : "pbc_camp_001",
            cascadeDelete: true,
            minSelect: 0,
            maxSelect: 1,
          },
        });
      } else {
        campaignField.options = campaignField.options || {};
        if (campaigns && campaignField.options.collectionId !== campaigns.id) {
          campaignField.options.collectionId = campaigns.id;
        }
        if (campaignField.options.maxSelect == null) campaignField.options.maxSelect = 1;
      }

      // Ensure the `user` relation field exists and points at the real users auth collection id.
      let userField = usersStats.fields.getByName("user");
      if (!userField) {
        usersStats.fields.add({
          name: "user",
          type: "relation",
          required: true,
          options: {
            collectionId: users ? users.id : "_pb_users_auth_",
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        });
      } else {
        userField.required = true;
        userField.options = userField.options || {};
        if (users && userField.options.collectionId !== users.id) {
          userField.options.collectionId = users.id;
        }
        if (userField.options.minSelect == null) userField.options.minSelect = 1;
        if (userField.options.maxSelect == null) userField.options.maxSelect = 1;
      }

      // Defensive rules: always guard on auth id first to avoid 400s for unauthenticated requests.
      // Security model:
      // - Players can see/update/delete their own characters.
      // - Campaign DM (campaigns.dmId) can see/update/delete all characters in that campaign.
      // - Global GM/ADMIN can see/update/delete all.
      // - The UI additionally scopes lists to the opened campaign.
      const isAuthed = "@request.auth.id != ''";
      const isGlobalGM = "@request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN'";
      const isOwner = "user = @request.auth.id";
      const isCampaignDM = "campaign.dmId = @request.auth.id";

      usersStats.listRule = `${isAuthed} && (${isOwner} || ${isCampaignDM} || ${isGlobalGM})`;
      usersStats.viewRule = `${isAuthed} && (${isOwner} || ${isCampaignDM} || ${isGlobalGM})`;
      usersStats.updateRule = `${isAuthed} && (${isOwner} || ${isCampaignDM} || ${isGlobalGM})`;
      usersStats.deleteRule = `${isAuthed} && (${isOwner} || ${isCampaignDM} || ${isGlobalGM})`;

      // Allow any authenticated player to create their own character, but require a campaign.
      // (Campaign membership enforcement happens at the UI/flow level for now.)
      usersStats.createRule = `${isAuthed} && @request.data.user = @request.auth.id && @request.data.campaign != ''`;

      // Index for faster campaign filtering.
      usersStats.indexes = usersStats.indexes || [];
      const campaignIdx =
        "CREATE INDEX `users_stats_campaign_idx` ON `users_stats` (`campaign`)";
      if (!usersStats.indexes.includes(campaignIdx)) {
        usersStats.indexes.push(campaignIdx);
      }

      return app.saveCollection(usersStats);
    } catch (e) {
      console.log("Migration 1770700000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      const usersStats = app.findCollectionByNameOrId("users_stats");
      if (!usersStats) return null;

      // Rollback: remove campaign index and revert to the previous simpler rules (best-effort).
      if (Array.isArray(usersStats.indexes)) {
        const campaignIdx =
          "CREATE INDEX `users_stats_campaign_idx` ON `users_stats` (`campaign`)";
        usersStats.indexes = usersStats.indexes.filter((x) => x !== campaignIdx);
      }

      // Keep campaign field (data-preserving); revert rules to owner/GM only without auth guard (legacy).
      usersStats.listRule =
        "user = @request.auth.id || @request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN'";
      usersStats.viewRule = usersStats.listRule;
      usersStats.createRule = usersStats.listRule;
      usersStats.updateRule = usersStats.listRule;
      usersStats.deleteRule = null;

      return app.saveCollection(usersStats);
    } catch (e) {
      console.log("Migration 1770700000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);
