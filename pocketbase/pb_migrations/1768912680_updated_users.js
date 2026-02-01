migrate((app) => {
  try {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_")
    collection.oauth2.enabled = true;
    return app.saveCollection(collection)
  } catch (e) {
    console.log("Migration 1768912680 failed (skipped): " + e);
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_")
    collection.oauth2.enabled = false;
    return app.saveCollection(collection)
  } catch (e) {
    console.log("Migration 1768912680 rollback failed: " + e);
  }
})
