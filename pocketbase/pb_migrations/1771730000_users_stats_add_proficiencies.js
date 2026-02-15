/// <reference path="../pb_data/types.d.ts" />

// Adds:
// - users_stats.proficiencies (json)
migrate(
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("users_stats");
      if (!collection) return null;

      const existing = collection.fields.getByName("proficiencies");
      if (!existing) {
        collection.fields.add(
          new JSONField({
            name: "proficiencies",
            type: "json",
            required: false,
            presentable: false,
            hidden: false,
            system: false,
            maxSize: 0,
          })
        );
      }

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771730000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("users_stats");
      if (!collection) return null;

      const field = collection.fields.getByName("proficiencies");
      if (field) collection.fields.remove(field);

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771730000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);

