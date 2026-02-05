migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("campaigns");
        if (!collection) {
            console.log("Migration: campaigns collection not found");
            return null;
        }

        // Add dndbeyond_link text field (type: url)
        // Check if field exists first to avoid error
        const existing = collection.fields.getByName("dndbeyond_link");
        if (existing) {
            console.log("Migration: dndbeyond_link already exists");
            return null;
        }

        collection.fields.add({
            name: "dndbeyond_link",
            type: "url",
            required: false,
            presentable: false,
            hidden: false,
            exceptDomains: null,
            onlyDomains: ["dndbeyond.com"],
            system: false,
        });

        return app.saveCollection(collection);
    } catch (e) {
        console.log("Migration 1770200000 failed (failing soft): " + e);
        return null;
    }
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("campaigns");
        if (!collection) {
            return null;
        }

        // Remove dndbeyond_link field
        const field = collection.fields.getByName("dndbeyond_link");
        if (field) {
            collection.fields.remove(field);
            return app.saveCollection(collection);
        }
        return null;
    } catch (e) {
        console.log("Migration 1770200000 rollback failed (failing soft): " + e);
        return null;
    }
})
