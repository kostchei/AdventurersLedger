migrate(
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("users_stats");
      if (!collection) return null;

      // Allow owner OR campaign DM to delete character records.
      collection.deleteRule =
        "@request.auth.id != '' && (user = @request.auth.id || campaign.dmId = @request.auth.id || @request.auth.global_role = 'GM' || @request.auth.global_role = 'ADMIN')";

      return app.saveCollection(collection);
    } catch (e) {
      console.log("Migration 1770600000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("users_stats");
      if (!collection) return null;

      // Roll back to DM-only deletes (matches prior intent in v0.26 fix migration).
      collection.deleteRule =
        "@request.auth.id != '' && campaign.dmId = @request.auth.id";

      return app.saveCollection(collection);
    } catch (e) {
      console.log("Migration 1770600000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);
