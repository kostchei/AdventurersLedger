migrate(
  (app) => {
    try {
      let collection = null;
      try {
        collection = app.findCollectionByNameOrId("_pb_users_auth_");
      } catch (_) {
        collection = null;
      }
      if (!collection) {
        try {
          collection = app.findCollectionByNameOrId("users");
        } catch (_) {
          collection = null;
        }
      }
      if (!collection) return null;

      // Allow Google signups to create new users.
      // Role safety is enforced in `pocketbase/pb_hooks/users.pb.js`.
      collection.createRule = null;

      // Auth collection options are top-level properties on the collection model in PB v0.36+.
      if (collection.oauth2) {
        collection.oauth2.enabled = true;
      }

      // Keep the flow "Google sign-in only" by disabling password authentication.
      if (collection.passwordAuth) {
        collection.passwordAuth.enabled = false;
      }

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771400000 failed (failing soft): " + e);
      return null;
    }
  },
  (app) => {
    try {
      let collection = null;
      try {
        collection = app.findCollectionByNameOrId("_pb_users_auth_");
      } catch (_) {
        collection = null;
      }
      if (!collection) {
        try {
          collection = app.findCollectionByNameOrId("users");
        } catch (_) {
          collection = null;
        }
      }
      if (!collection) return null;

      // Revert to invite-only / admin-created user records.
      collection.createRule = "@request.auth.id != ''";
      if (collection.passwordAuth) {
        collection.passwordAuth.enabled = true;
      }

      return app.save(collection);
    } catch (e) {
      console.log("Migration 1771400000 rollback failed (failing soft): " + e);
      return null;
    }
  }
);

