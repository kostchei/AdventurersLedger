migrate(
  (app) => {
    try {
      let collection = null;
      try {
        collection = app.findCollectionByNameOrId("campaign_logs");
      } catch (_) {
        collection = null;
      }
      if (!collection) return null;

      const isAuthed = "@request.auth.id != ''";
      const isGlobalGM =
        "@request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN'";
      const isCampaignDM = "campaign.dmId = @request.auth.id";
      const isCampaignMember =
        "campaign.campaign_memberships_via_campaign.user ?= @request.auth.id";
      const isCreator = "created_by = @request.auth.id";

      // Read/write rules:
      // - Read: campaign DM, any campaign member, the log creator, or global GM/ADMIN.
      // - Create: authed, creator bound, and must be campaign member/DM/global.
      // - Update/delete: campaign DM, the log creator, or global GM/ADMIN.
      const canRead = `${isAuthed} && (${isCampaignDM} || ${isCampaignMember} || ${isCreator} || ${isGlobalGM})`;
      const canMutate = `${isAuthed} && (${isCampaignDM} || ${isCreator} || ${isGlobalGM})`;
      const canCreate = `${isAuthed} && @request.body.campaign != '' && @request.body.created_by = @request.auth.id && (${isCampaignDM} || ${isCampaignMember} || ${isGlobalGM})`;

      collection.listRule = canRead;
      collection.viewRule = canRead;
      collection.createRule = canCreate;
      collection.updateRule = canMutate;
      collection.deleteRule = canMutate;

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1770900000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      let collection = null;
      try {
        collection = app.findCollectionByNameOrId("campaign_logs");
      } catch (_) {
        collection = null;
      }
      if (!collection) return null;

      // Roll back to member/DM/global-only reads (no creator exception).
      const isAuthed = "@request.auth.id != ''";
      const isGlobalGM =
        "@request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN'";
      const isCampaignDM = "campaign.dmId = @request.auth.id";
      const isCampaignMember =
        "campaign.campaign_memberships_via_campaign.user ?= @request.auth.id";

      const canRead = `${isAuthed} && (${isCampaignDM} || ${isCampaignMember} || ${isGlobalGM})`;
      const canMutate = `${isAuthed} && (${isCampaignDM} || created_by = @request.auth.id || ${isGlobalGM})`;
      const canCreate = `${isAuthed} && @request.body.campaign != '' && @request.body.created_by = @request.auth.id && (${isCampaignDM} || ${isCampaignMember} || ${isGlobalGM})`;

      collection.listRule = canRead;
      collection.viewRule = canRead;
      collection.createRule = canCreate;
      collection.updateRule = canMutate;
      collection.deleteRule = canMutate;

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1770900000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);

