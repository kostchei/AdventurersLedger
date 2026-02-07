migrate(
  (app) => {
    try {
      // PocketBase v0.23+ `findCollectionByNameOrId` throws when missing.
      /** @type {any} */
      let collection = null;
      try {
        collection = app.findCollectionByNameOrId("campaign_logs");
      } catch (_) {
        collection = null;
      }

      if (!collection) {
        let campaigns = null;
        let users = null;
        try {
          campaigns = app.findCollectionByNameOrId("campaigns");
        } catch (_) {
          campaigns = null;
        }
        try {
          users = app.findCollectionByNameOrId("_pb_users_auth_");
        } catch (_) {
          users = null;
        }

        const isAuthed = "@request.auth.id != ''";
        const isGlobalGM =
          "@request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN'";
        const isCampaignDM = "campaign.dmId = @request.auth.id";
        const isCampaignMember =
          "campaign.campaign_memberships_via_campaign.user ?= @request.auth.id";

        // Read/write rules:
        // - Read: any campaign member, campaign DM, or global GM/ADMIN.
        // - Create: must be campaign member/DM/global and `created_by` must match auth user.
        // - Update/delete: campaign DM, log creator, or global GM/ADMIN.
        const canRead = `${isAuthed} && (${isCampaignDM} || ${isCampaignMember} || ${isGlobalGM})`;
        const canMutate = `${isAuthed} && (${isCampaignDM} || created_by = @request.auth.id || ${isGlobalGM})`;
        // Note: PocketBase v0.36+ uses `@request.body` in rules (not `@request.data`).
        const canCreate = `${isAuthed} && @request.body.campaign != '' && @request.body.created_by = @request.auth.id && (${isCampaignDM} || ${isCampaignMember} || ${isGlobalGM})`;

        // PB v0.23+ supports creating collections from a config object + `$app.save(...)`.
        // Keep definitions explicit to avoid strict schema validation failures.
        collection = new Collection({
          name: "campaign_logs",
          type: "base",
          listRule: canRead,
          viewRule: canRead,
          createRule: canCreate,
          updateRule: canMutate,
          deleteRule: canMutate,
          fields: [
            {
              name: "campaign",
              type: "relation",
              required: true,
              presentable: false,
              hidden: false,
              system: false,
              minSelect: 0,
              maxSelect: 1,
              collectionId: campaigns ? campaigns.id : "pbc_camp_001",
              cascadeDelete: true,
            },
            {
              name: "created_by",
              type: "relation",
              required: true,
              presentable: false,
              hidden: false,
              system: false,
              minSelect: 0,
              maxSelect: 1,
              collectionId: users ? users.id : "_pb_users_auth_",
              cascadeDelete: true,
            },
            {
              name: "happened_on",
              type: "date",
              required: true,
              presentable: false,
              hidden: false,
              system: false,
              min: "",
              max: "",
            },
            {
              name: "activity_text",
              type: "text",
              required: true,
              presentable: false,
              hidden: false,
              system: false,
              min: 1,
              max: 8000,
              pattern: "",
              autogeneratePattern: "",
              primaryKey: false,
            },
          ],
          indexes: [
            "CREATE INDEX `campaign_logs_campaign_happened_idx` ON `campaign_logs` (`campaign`,`happened_on`)",
            "CREATE INDEX `campaign_logs_created_by_idx` ON `campaign_logs` (`created_by`)",
          ],
        });

        return app.save(collection);
      }

      // Best-effort hardening if collection already exists.
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

      collection.indexes = collection.indexes || [];
      const idx1 =
        "CREATE INDEX `campaign_logs_campaign_happened_idx` ON `campaign_logs` (`campaign`,`happened_on`)";
      const idx2 =
        "CREATE INDEX `campaign_logs_created_by_idx` ON `campaign_logs` (`created_by`)";
      if (!collection.indexes.includes(idx1)) collection.indexes.push(idx1);
      if (!collection.indexes.includes(idx2)) collection.indexes.push(idx2);

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1770800000 failed (failing soft): " + e);
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
      return app.delete(collection);
    } catch (e) {
      console.log("Migration 1770800000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);
