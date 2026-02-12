/// <reference path="../pb_data/types.d.ts" />

// Adds an optional world_state.hex_orientation select field.
// HexMapViewer assumes 'flat' when missing.
migrate(
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("world_state");
      if (!collection) return null;

      const existing = collection.fields.getByName("hex_orientation");
      if (existing) return null;

      collection.fields.add(
        new SelectField({
        name: "hex_orientation",
        type: "select",
        required: false,
        presentable: false,
        hidden: false,
        system: false,
        maxSelect: 1,
        values: ["flat", "pointy"],
        })
      );

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771720000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("world_state");
      if (!collection) return null;

      const field = collection.fields.getByName("hex_orientation");
      if (!field) return null;
      collection.fields.remove(field);
      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771720000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);
