import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function verify() {
    try {
        await pb.collection('_superusers').authWithPassword('antigravity@local.host', 'password123456');

        // 1. Check if field exists in collection structure
        try {
            const collection = await pb.collections.getOne('campaigns');
            const field = collection.fields.find(f => f.name === 'dndbeyond_link');
            if (field) {
                console.log("SUCCESS: Field 'dndbeyond_link' exists in schema.");
            } else {
                console.error("FAILURE: Field 'dndbeyond_link' MISSING from schema.");
                return;
            }
        } catch (e) {
            console.error("Error fetching collection:", e);
            return;
        }

        // 2. Create a campaign with the link
        const userId = pb.authStore.model.id; // Superuser ID (or find another user)
        // Superuser isn't in 'users' collection usually, so we might need a regular user id for dmId relation?
        // Let's Find the first user
        const user = await pb.collection('users').getFirstListItem('');

        const data = {
            name: "Test Campaign " + Date.now(),
            dmId: user.id,
            dndbeyond_link: "https://www.dndbeyond.com/campaigns/join/123456"
        };

        console.log("Creating campaign with data:", data);
        const record = await pb.collection('campaigns').create(data);
        console.log("Created record:", record.id);

        // 3. Verify the data was saved
        if (record.dndbeyond_link === data.dndbeyond_link) {
            console.log("SUCCESS: dndbeyond_link saved correctly:", record.dndbeyond_link);
        } else {
            console.error("FAILURE: dndbeyond_link NOT saved. Got:", record.dndbeyond_link);
        }

    } catch (e) {
        console.error("Verification Error:", e);
        // Print detailed error if available
        if (e.data) console.error("Error data:", JSON.stringify(e.data, null, 2));
    }
}

verify();
