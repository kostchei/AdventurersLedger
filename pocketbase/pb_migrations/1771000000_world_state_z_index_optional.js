migrate(
  (app) => {
    try {
      let collection = null;
      try {
        collection = app.findCollectionByNameOrId("world_state");
      } catch (_) {
        collection = null;
      }
      if (!collection) return null;

      // Robustly find the field across PB versions.
      let zField = null;
      try {
        if (collection.fields && typeof collection.fields.getByName === "function") {
          zField = collection.fields.getByName("z_index");
        }
      } catch (_) {
        zField = null;
      }
      if (!zField && Array.isArray(collection.fields)) {
        zField = collection.fields.find((f) => f && f.name === "z_index") || null;
      }
      if (!zField && Array.isArray(collection.schema)) {
        zField = collection.schema.find((f) => f && f.name === "z_index") || null;
      }

      // If it doesn't exist, nothing to do.
      if (!zField) return null;

      zField.required = false;
      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771000000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      let collection = null;
      try {
        collection = app.findCollectionByNameOrId("world_state");
      } catch (_) {
        collection = null;
      }
      if (!collection) return null;

      let zField = null;
      try {
        if (collection.fields && typeof collection.fields.getByName === "function") {
          zField = collection.fields.getByName("z_index");
        }
      } catch (_) {
        zField = null;
      }
      if (!zField && Array.isArray(collection.fields)) {
        zField = collection.fields.find((f) => f && f.name === "z_index") || null;
      }
      if (!zField && Array.isArray(collection.schema)) {
        zField = collection.schema.find((f) => f && f.name === "z_index") || null;
      }
      if (!zField) return null;

      zField.required = true;
      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771000000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);

