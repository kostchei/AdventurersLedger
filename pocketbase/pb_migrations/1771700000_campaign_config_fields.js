/// <reference path="../pb_data/types.d.ts" />

// Adds optional per-campaign configuration fields (stored as JSON) so content can be
// customized without redeploying the frontend.
migrate(
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("campaigns");
      if (!collection) return null;

      const ensureJsonField = (name) => {
        const existing = collection.fields.getByName(name);
        if (existing) return;
        collection.fields.add(
          new JSONField({
          name,
          type: "json",
          required: false,
          presentable: false,
          hidden: false,
          system: false,
          maxSize: 0,
          })
        );
      };

      // Dropdown data
      ensureJsonField("species_options");
      ensureJsonField("background_options");
      ensureJsonField("class_options");
      ensureJsonField("subclass_options");

      // Gods/factions
      ensureJsonField("deities");
      ensureJsonField("factions");

      // Rank ladders (meaning of levels)
      ensureJsonField("piety_ranks");
      ensureJsonField("renown_ranks");

      // Optional name generator configuration
      ensureJsonField("name_generator");

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771700000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("campaigns");
      if (!collection) return null;

      const removeIfExists = (name) => {
        const field = collection.fields.getByName(name);
        if (field) collection.fields.remove(field);
      };

      removeIfExists("species_options");
      removeIfExists("background_options");
      removeIfExists("class_options");
      removeIfExists("subclass_options");
      removeIfExists("deities");
      removeIfExists("factions");
      removeIfExists("piety_ranks");
      removeIfExists("renown_ranks");
      removeIfExists("name_generator");

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771700000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);
