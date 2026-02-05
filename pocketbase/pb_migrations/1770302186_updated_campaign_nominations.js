/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_camp_nom_001")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = campaign.dmId",
    "deleteRule": "@request.auth.id = campaign.dmId",
    "listRule": "@request.auth.id = nominated_player || @request.auth.id = nominated_by || @request.auth.id = campaign.dmId",
    "updateRule": "@request.auth.id = nominated_player || @request.auth.id = campaign.dmId",
    "viewRule": "@request.auth.id = nominated_player || @request.auth.id = nominated_by || @request.auth.id = campaign.dmId"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_camp_nom_001")

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
