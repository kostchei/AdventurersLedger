/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_camp_members_001")

  // update collection data
  unmarshal({
    "createRule": "(@request.auth.id = campaign.dmId) || (@request.auth.id = user && @request.body.role = 'PLAYER')",
    "deleteRule": "(@request.auth.id = user) || (@request.auth.id = campaign.dmId)",
    "listRule": "@request.auth.id = user || @request.auth.id = campaign.dmId",
    "updateRule": "(@request.auth.id = user) || (@request.auth.id = campaign.dmId)",
    "viewRule": "@request.auth.id = user || @request.auth.id = campaign.dmId"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_camp_members_001")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
