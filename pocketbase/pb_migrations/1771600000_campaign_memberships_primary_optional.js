migrate(
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("campaign_memberships");
      if (!collection?.fields || typeof collection.fields.getByName !== "function") {
        return null;
      }

      const field = collection.fields.getByName("is_primary_dm");
      if (field) {
        field.required = false;
      }

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771600000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("campaign_memberships");
      if (!collection?.fields || typeof collection.fields.getByName !== "function") {
        return null;
      }

      const field = collection.fields.getByName("is_primary_dm");
      if (field) {
        field.required = true;
      }

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771600000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);

