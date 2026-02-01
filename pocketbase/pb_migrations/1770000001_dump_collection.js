migrate((db) => {
    const dao = new Dao(db);
    try {
        const collection = dao.findCollectionByNameOrId("users_stats");
        console.log("Dumping users_stats collection (Direct Access)...");

        const dump = {
            id: collection.id,
            name: collection.name,
            type: collection.type,
            system: collection.system,
            listRule: collection.listRule,
            viewRule: collection.viewRule,
            createRule: collection.createRule,
            updateRule: collection.updateRule,
            deleteRule: collection.deleteRule,
            options: collection.options
        };

        const fields = [];
        collection.schema.fields().forEach(f => {
            fields.push({
                id: f.id,
                name: f.name,
                type: f.type,
                system: f.system,
                required: f.required,
                options: f.options
            });
        });
        dump.schemaFields = fields;

        const fs = require('fs');
        fs.writeFileSync('collection_dump.json', JSON.stringify(dump, null, 2));
        console.log("Dump successful: collection_dump.json");
    } catch (e) {
        console.log("Dump failed: " + e);
    }
    return null;
}, (db) => { })
