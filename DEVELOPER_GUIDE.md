# Developer Guide

This guide covers the standards, workflows, and roadmap for contributing to the Adventurers Ledger (Codex).

## 1. Local Development Setup

### Prerequisites
-   **Node.js 22+**
-   **PocketBase** (Running locally on port 8090)
-   **Git**

### Quick Start
```bash
# 1. Backend (PocketBase)
cd pocketbase
./pocketbase serve --http=0.0.0.0:8090

# 2. Frontend
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

## 2. Database Schema Guidelines (CRITICAL)

**PocketBase v0.23+ Strictness:**
The modern PocketBase version is extremely strict about schema definitions.
-   **All Fields Required**: When defining schema in JS migration files, you MUST provide all field properties (`autogeneratePattern`, `hidden`, `min`, `max`, etc.) even if they are empty/default. Sparse definitions will cause "Invalid collections configuration" errors.
-   **Type Safety**: Always add `/// <reference path="../pb_data/types.d.ts" />` at the top of migration files (for editor support).

### Migration Patterns
We use a "GitOps" flow. **NEVER** edit the production schema manually.
1.  **Modify Locally**: Make changes in your local Admin UI (`localhost:8090/_/`).
2.  **Generate Migration**: PocketBase creates a file in `pocketbase/pb_migrations`.
3.  **Review**: Check the file. Ensure it isn't a delete/create operation if you renamed a field.
4.  **Commit**: Push to `main`. The CI/CD pipeline will apply it.

### 2.1 Zero-Downtime Migration Rules (AI & Manual)

To prevent the "Bootstrap Lock" (where the server fails to start because of a bad migration), follow these hard rules for JSVM:

1.  **NO POSH GLOBALS**: Functions like `unmarshal()` are NOT available in the JSVM environment. Use direct assignment: `collection.schema = [ ... ]`.
2.  **STRICT SIGNATURES**: Always use `migrate((db) => { ... }, (db) => { ... })`. The `(app)` signature is deprecated and can cause panics.
3.  **TRUST NO ONE**: Wrap all migration logic in a `try-catch` block.
    *   **FAIL LOUD** in logs: `console.log("Migration failed: " + e)`.
    *   **FAIL SOFT** in execution: `return null` (instead of throwing). This allows the server to finish booting so the API stays online.
4.  **RAW OBJECTS PREFERRED**: While `new SchemaField()` exists, raw JSON-like arrays are more portable across PocketBase minor versions (v0.22 vs v0.23).
5.  **SYSTEM FIELDS ARE SACRED**: Never redefine the `id` field in a manual migration unless you are a PocketBase wizard. Redefining `id` often breaks autogeneration and causes "Cannot be blank" errors on creation.

## 3. Project Roadmap

### Completed Phases
-   [x] **Phase 1: Backend Alignment** (Schema setup, Users stats).
-   [x] **Phase 2: Auth** (Google OAuth, Server Status checks).
-   [x] **Phase 3: Fog of War** (Hex grid system, Session-based visibility).
-   [x] **Phase 4: Character Stats** (Attributes, HP, Conditions, Piety, Factions).

### Active / Next Phases
-   [ ] **Phase 5: Economy** (Magical Items Vault, Gold transactions).
-   [ ] **Phase 6: Global World State** (Dungeon progress, Ecological impact).
-   [ ] **Phase 7: Real-Time** (Optimistic updates for high-latency actions).
-   [ ] **Phase 8: GM Tools** (Map uploader, Bulk reveal tools).

## 4. AI Agent Operational Rules

When using AI Agents (like Antigravity/Gemini) to edit this codebase, enforce these rules:

### The "Read-Before-Write" Mandate
-   **Context**: Agents must read the specific line range before editing to ensure precise targeting.
-   **Whitespace**: Be suspicious of indentation. Use unique string anchors.

### Handling Failures
-   **Strike Two Rule**: If an edit fails twice, **STOP** trying to patch it. Switch to `write_to_file` to overwrite the entire file (for files < 800 lines) to guarantee integrity.

---
*Reference Materials:*
-   [SRD 5.2.1](./SRD_CC_v5.2.1.md) - Game Rules Reference
