migrate((db) => {
    const dao = new Dao(db);
    try {
        const collection = dao.findCollectionByNameOrId("users_stats");
        let found = false;

        // iterate and remove field with name 'id'
        const fields = collection.schema.fields();
        for (let f of fields) {
            if (f.name === 'id') {
                console.log("Found field 'id' with internal ID: " + f.id);
                collection.schema.removeField(f.id);
                found = true;
            }
        }

        if (found) {
            console.log("Saving collection after 'id' removal...");
            dao.saveCollection(collection);
            console.log("Save successful.");
        } else {
            console.log("No manual 'id' field found in schema.");
        }
    } catch (e) {
        console.log("Remove for 'id' failed: " + e);
    }
    return null;
}, (db) => { })
