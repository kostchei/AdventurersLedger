/// <reference path="../pb_data/types.d.ts" />

// Custom endpoint to create a minimal character record reliably.
// This bypasses client-side schema/rule issues and centralizes defaults.
routerAdd(
    "POST",
    "/api/characters/create",
    (e) => {
        try {
            const info = e.requestInfo();
            const auth = info?.auth;
            if (!auth) {
                return e.json(401, { message: "Unauthorized." });
            }

            const body = info?.body || {};
            const campaignId = body.campaign || body.campaignId || "";
            if (!campaignId) {
                return e.json(400, { message: "campaignId is required." });
            }

            const collection = typeof $app.findCollectionByNameOrId === "function"
                ? $app.findCollectionByNameOrId("users_stats")
                : $app.dao().findCollectionByNameOrId("users_stats");
            const record = new Record(collection);

            // If schema expects a manual id, ensure one exists.
            if (!record.id) {
                record.set("id", $security.randomStringWithAlphabet(15, "abcdefghijklmnopqrstuvwxyz0123456789"));
            }

            const defaults = {
                user: auth.id,
                campaign: campaignId,
                character_name: "Unnamed Hero",
                class_name: "Commoner",
                species: "Human",
                background: "None",
                hp: 10,
                max_hp: 10,
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
                xp: 0,
                gold: 0,
                conditions: [],
                factions: {},
                piety_deity: "",
                piety_score: 0,
                levels: {},
                spells: [],
                feats: [],
                bastion: [],
                inventory: []
            };

            const form = new RecordUpsertForm($app, record);
            form.load(defaults);
            form.submit();

            return e.json(200, record);
        } catch (err) {
            const message = err?.message || "Failed to create character.";
            const data = err?.data || {};
            return e.json(400, { message, data });
        }
    },
    $apis.requireAuth()
);
