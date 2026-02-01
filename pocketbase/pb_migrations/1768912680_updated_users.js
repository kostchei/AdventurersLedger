/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  try {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

    // update collection data
    unmarshal({
      "oauth2": {
        "enabled": true
      }
    }, collection)

    return dao.saveCollection(collection)
  } catch (e) {
    console.log("Migration 1768912680 failed (skipped): " + e);
  }
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "oauth2": {
      "enabled": false
    }
  }, collection)

  return dao.saveCollection(collection)
})
