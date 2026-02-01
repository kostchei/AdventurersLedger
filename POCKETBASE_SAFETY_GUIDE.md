# PocketBase Migration Safety Guide 🛡️

This guide documents the "Hard Lessons" learned from the February 1st production outage. Use these rules to ensure any future schema changes do not crash the production server.

## 1. The "Bootstrap Lock" 🚨
Unlike web frameworks that crash only on request, **PocketBase runs migrations as part of its startup sequence.**
-   **If a migration throws an error, the server will NOT start.**
-   This means the API goes offline, causing 504/CORS errors in the frontend.

### Safety Rule: The Silent Fail-Safe
Always wrap the content of `migrate()` in a `try-catch`. 
```javascript
migrate((db) => {
    try {
        // ... your logic ...
    } catch (e) {
        // LOG IT but don't THROW IT
        console.log("Migration failed: " + e);
        return null; // Returning null/void allows the server to finish starting
    }
}, (db) => { /* revert */ })
```

## 2. JSVM Limitations 🛑
The PocketBase JavaScript VM (JSVM) is not a full Node.js environment.
-   **Avoid `unmarshal()`**: This is a Go-internal function not exposed to the JSVM global scope.
-   **Method:** Assign directly to `collection.schema` using a raw array of objects.

## 3. System Fields Corruption 💾
The `id`, `created`, and `updated` fields are managed by PocketBase.
-   **WARNING**: Never include a manually defined `id` field in your schema list unless you are explicitly changing its constraints (dangerous).
-   **Symptom**: If you see `400 Bad Request: id: Cannot be blank`, it means a migration has corrupted the system field and disabled autogeneration.
-   **Fix**: Use the `Ultimate Repair` pattern to wipe the `schema` array and let PocketBase re-diff the system fields.

## 4. Environment Parity 🌍
Local and Production environments may have slight differences (e.g. Windows vs Linux). 
-   **Raw Data First**: Use standard JS arrays and objects instead of helper classes (`new SchemaField`) when in doubt. 
-   **Idempotency**: Always wrap lookups in `try { dao.findCollectionByNameOrId(...) } catch { ... }` to handle cases where a collection might not exist yet.
