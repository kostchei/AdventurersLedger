migrate((db) => {
    const dao = new Dao(db);
    try {
        const records = dao.findRecordsByFilter("users_stats", "1=1", "", 1, 0);
        console.log("USERS_STATS RECORD COUNT (approx): " + records.length);
    } catch (e) {
        console.log("Count failed: " + e);
    }
    return null;
}, (db) => { })
