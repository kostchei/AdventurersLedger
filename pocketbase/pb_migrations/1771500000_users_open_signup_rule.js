migrate(
  (app) => {
    // Allow unauthenticated creation of users records so OAuth2 can create a new
    // account on first sign-in. Role safety is enforced in hooks.
    let collection = null;
    collection =
      collection ||
      (() => {
        try {
          return app.findCollectionByNameOrId("_pb_users_auth_");
        } catch (_) {
          return null;
        }
      })();
    collection =
      collection ||
      (() => {
        try {
          return app.findCollectionByNameOrId("users");
        } catch (_) {
          return null;
        }
      })();

    if (!collection) return null;

    // PocketBase rules are strings; empty string means "no rule".
    collection.createRule = "";

    // Ensure OAuth2 is enabled for the collection.
    if (collection.oauth2) {
      collection.oauth2.enabled = true;
    }

    // Keep password auth as-is; do not change it here.
    return app.save(collection);
  },
  (app) => {
    // Revert to invite-only / admin-created user records.
    let collection = null;
    collection =
      collection ||
      (() => {
        try {
          return app.findCollectionByNameOrId("_pb_users_auth_");
        } catch (_) {
          return null;
        }
      })();
    collection =
      collection ||
      (() => {
        try {
          return app.findCollectionByNameOrId("users");
        } catch (_) {
          return null;
        }
      })();

    if (!collection) return null;

    collection.createRule = "@request.auth.id != ''";
    return app.save(collection);
  }
);

