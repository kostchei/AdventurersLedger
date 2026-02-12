/// <reference path="../pb_data/types.d.ts" />

// Adds:
// - users_stats.subclass (text)
// - users_stats.dndbeyond_character_link (url)
// - users_stats.bastion_turns (json)
migrate(
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("users_stats");
      if (!collection) return null;

      const ensureTextField = (name) => {
        const existing = collection.fields.getByName(name);
        if (existing) return;
        collection.fields.add(
          new TextField({
          name,
          type: "text",
          required: false,
          presentable: false,
          hidden: false,
          system: false,
          min: 0,
          max: 0,
          pattern: "",
          autogeneratePattern: "",
          primaryKey: false,
          })
        );
      };

      const ensureUrlField = (name, onlyDomains) => {
        const existing = collection.fields.getByName(name);
        if (existing) return;
        collection.fields.add(
          new URLField({
          name,
          type: "url",
          required: false,
          presentable: false,
          hidden: false,
          system: false,
          exceptDomains: null,
          onlyDomains,
          })
        );
      };

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

      ensureTextField("subclass");
      ensureUrlField("dndbeyond_character_link", ["dndbeyond.com"]);
      ensureJsonField("bastion_turns");

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771710000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("users_stats");
      if (!collection) return null;

      const removeIfExists = (name) => {
        const field = collection.fields.getByName(name);
        if (field) collection.fields.remove(field);
      };

      removeIfExists("subclass");
      removeIfExists("dndbeyond_character_link");
      removeIfExists("bastion_turns");

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771710000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);
