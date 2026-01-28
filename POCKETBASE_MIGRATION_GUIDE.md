
# PocketBase v0.23+ Schema Migration: The "Proper Way" Guide

This document records the hard-won lessons from migrating a TaleKeeper schema to PocketBase v0.23+. Follow these rules to avoid validation hell.

## What Failed (The "Why it Broke")

### 1. The "Sparse Field" Rejection
PocketBase v0.23 is extremely pedantic. In previous versions, you could omit optional field properties (like `autogeneratePattern`, `hidden`, `presentable`). v0.23+ will reject any schema import that doesn't define the **entire** property set for every field type. 
- **Symptom:** "Invalid collections configuration" with no specific field pointers.
- **Fix:** Every field definition must be "Super Verbose," matching the server's internal model 1:1.

### 2. Rule Syntax: The Great Renaming
Two major breaking changes occurred in API rules:
- **`@request.data` is DEAD:** You must use `@request.body` to access submitted fields in `createRule` and `updateRule`.
- **The Arrow is Gone:** Accessing fields on a relation using `->` (e.g., `campaign->dmId`) now causes an `invalid number "-"` error. 
- **Fix:** Use dot-notation: `campaign.dmId`.

### 3. Rule Quoting & Escaping
Using escaped double quotes (`\"PLAYER\"`) inside a JSON rule string is brittle.
- **Fix:** Use single quotes for strings inside rules: `'PLAYER'`. It prevents parsing errors during the JSON-to-Go transition inside PocketBase.

---

## The "Do it Properly" Workflow

### Step 1: Export the Baseline
NEVER start from a handcrafted JSON. Always:
1. Go to your target PocketBase instance.
2. **Settings > Export Collections**.
3. Use this file as your structural template for IDs and system field names (like `tokenKey` and `emailVisibility`).

### Step 2: Use a "Strict" Generator
Don't write the JSON manually. Use a script that enforces the verbose format. 
- Ensure every `text` field has `autogeneratePattern: ""`, `primaryKey: false`, etc.
- Ensure every `autodate` has `onCreate: true`, `onUpdate: false`.

### Step 3: Rule Migration Checklist
Before importing, grep your schema for these "red flags":
- [ ] Check for `->` (Replace with `.`)
- [ ] Check for `@request.data` (Replace with `@request.body`)
- [ ] Check for `\"` inside rules (Replace with `'`)

### Step 4: Verification
Run a verification check:
```bash
grep "->" pb_schema.json
grep "@request.data" pb_schema.json
```
If either returns a result, the import **will fail**.

---

## Summary of the "Golden" Merge Strategy
When merging TaleKeeper custom collections into a vanilla server:
1. Load the server's `_superusers` and `users` exactly as they are.
2. Manually append your custom fields to `users` using the **verbose** format.
3. Add custom collections using pre-defined **verbose templates** for each field type (`text`, `number`, `relation`, etc.).
4. Explicitly run a "cleanup" pass on all rules to ensure dot-notation and `@request.body` compliance.
