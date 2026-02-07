migrate(
  (app) => {
    try {
      let collection = app.findCollectionByNameOrId("campaign_logs");
      if (!collection) {
        const campaigns = app.findCollectionByNameOrId("campaigns");
        const users = app.findCollectionByNameOrId("_pb_users_auth_");

        // v0.26+ supports collection creation from a plain config object via app.createCollection.
        // Keep definitions explicit to avoid strict schema validation failures.
        collection = app.createCollection({
          name: "campaign_logs",
          type: "base",
          listRule:
            "@request.auth.id != '' && (campaign.dmId = @request.auth.id || created_by = @request.auth.id || @request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN')",
          viewRule:
            "@request.auth.id != '' && (campaign.dmId = @request.auth.id || created_by = @request.auth.id || @request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN')",
          createRule:
            "@request.auth.id != '' && @request.data.created_by = @request.auth.id",
          updateRule:
            "@request.auth.id != '' && (campaign.dmId = @request.auth.id || created_by = @request.auth.id || @request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN')",
          deleteRule:
            "@request.auth.id != '' && (campaign.dmId = @request.auth.id || created_by = @request.auth.id || @request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN')",
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

        return collection;
      }

      // Best-effort hardening if collection already exists.
      const ensureRule =
        "@request.auth.id != '' && (campaign.dmId = @request.auth.id || created_by = @request.auth.id || @request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN')";

      collection.listRule = ensureRule;
      collection.viewRule = ensureRule;
      collection.createRule =
        "@request.auth.id != '' && @request.data.created_by = @request.auth.id";
      collection.updateRule = ensureRule;
      collection.deleteRule = ensureRule;

      collection.indexes = collection.indexes || [];
      const idx1 =
        "CREATE INDEX `campaign_logs_campaign_happened_idx` ON `campaign_logs` (`campaign`,`happened_on`)";
      const idx2 =
        "CREATE INDEX `campaign_logs_created_by_idx` ON `campaign_logs` (`created_by`)";
      if (!collection.indexes.includes(idx1)) collection.indexes.push(idx1);
      if (!collection.indexes.includes(idx2)) collection.indexes.push(idx2);

      return app.saveCollection(collection);
    } catch (e) {
      console.log("Migration 1770800000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("campaign_logs");
      if (!collection) return null;
      return app.deleteCollection(collection);
    } catch (e) {
      console.log("Migration 1770800000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);
