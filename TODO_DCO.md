# Adventurers Ledger: TODO / DCO (Work Arcs)

Goal: add campaign-specific configuration (gods/factions/species/background/class/subclass), explain piety/renown levels, track bastion turns, support D&D Beyond character links, restore Fog of War in map tools, and add a random name generator.

Constraints:
- Do not break existing infra (PocketBase migrations + Azure SWA frontend deploy).
- Do not remove or invalidate existing characters or campaigns.
- Changes should be incremental, migration-safe, and testable locally before merging to `main`.

## Arc 0: Safety Rails (Baseline)

Deliverables:
- A repeatable local test workflow that exercises schema + UI without touching production.
- Guardrails to ensure new schema fields are optional and UI has fallbacks.

Tasks:
- Use a fresh local PB data dir for migration validation (`pocketbase/pb_data_*` style).
- Run frontend integration tests against local PB (currently expect PB at `http://127.0.0.1:8090`).
- Add/extend tests when touching access rules or collections.

Definition of done:
- `pocketbase.exe serve` boots cleanly with migrations applied.
- `frontend` builds and runs.
- Existing characters still load and render.

## Arc 1: Campaign Configuration (Data Model + Access)

Deliverables:
- Campaign-specific config stored in PocketBase (no code redeploy needed for content tweaks).
- Readable by players; writable by campaign DM / global GM/ADMIN.

Approach (minimal risk):
- Store config directly on `campaigns` as optional `json` fields.
- UI must fall back to built-in defaults if config is missing or malformed.

Data (suggested fields on `campaigns`):
- `species_options` (json: string[])
- `background_options` (json: string[])
- `class_options` (json: string[])
- `subclass_options` (json: Record<class,string[]>)
- `deities` (json: {name, domain?, worshipers?, plane?}[])
- `factions` (json: string[] or {name, description?}[])
- `piety_ranks` (json: {min, title, description?, color?}[])
- `renown_ranks` (json: {min, title, description?, color?}[])
- `name_generator` (json: optional structure, see Arc 3)

Definition of done:
- Migrations add fields without requiring backfills.
- App can read config and use defaults when unset.

## Arc 2: Gods/Factions + “What Levels Mean”

Deliverables:
- Deity list becomes campaign-specific.
- Faction list becomes campaign-specific.
- Piety and Renown UI shows rank ladder + meaning/description (campaign-configurable).

Tasks:
- Replace hard-coded lists in:
  - `frontend/src/components/DivinePiety.tsx`
  - `frontend/src/components/FactionRenown.tsx`
- Add UI section: “Rank Ladder” showing thresholds + descriptions.
- Ensure existing characters with legacy deity/faction values still render.

Definition of done:
- Players see correct list/ranks for their campaign.
- DM (or character owner) can still adjust values; no crashes if config missing.

## Arc 3: Character Links + Name Generator + Campaign Dropdowns

Deliverables:
- Link a character sheet to a D&D Beyond character (“toon”) URL.
- Random name generator (campaign-aware when configured).
- Campaign-specific dropdowns for:
  - Species
  - Background
  - Class
  - Subclass (dependent on Class)

Tasks:
- Add `users_stats` optional fields:
  - `dndbeyond_character_link` (url)
  - `subclass` (text)
- Update character details editor:
  - Prefer dropdown when options exist; allow custom entry to preserve legacy values.
  - Add “Random Name” button.
  - Display D&D Beyond character link (clickable) + allow edit for owner/DM.

Definition of done:
- No existing character is forced into the dropdown set.
- Creating/updating a character never clears fields unintentionally.

## Arc 4: Bastion Turns Tracker

Deliverables:
- A structured way to track bastion turns per character, without losing existing “Bastion features” list.

Approach:
- Add new `users_stats` optional `json` field `bastion_turns` that stores a turn log:
  - Example shape: `[{ turn: 1, happenedOn: '2026-02-07', notes: '...' }, ...]`
- Keep existing `bastion` list (features/facilities) unchanged for backwards compatibility.

Definition of done:
- Users can add/remove/edit bastion turn entries.
- Existing `bastion` data is untouched.

Note:
- The “SRD 5.5 bastion turn” rules should be referenced in docs/UI copy, not hard-coded as business logic initially.

## Arc 5: Fog Of War Back On Map Tools

Deliverables:
- Map viewer supports hex grid + fog masking for players; DM sees full map.
- Layer (z-index) selection works if multiple world_state map layers exist.

Tasks:
- Switch campaign map viewer from `ImageMapViewer` back to a hex-aware viewer (`HexMapViewer`).
- Ensure map layer fetch uses stored `world_state` fields (`hex_columns`, `hex_rows`, `z_index`, etc.).
- Add `world_state.hex_orientation` (select: `flat|pointy`) if missing.
- Draw fog overlay based on `fog_of_war` for the current user and z-layer.

Follow-ups (optional, later):
- DM reveal tools (bulk reveal, reveal for selected player).
- Add campaign/map scoping to `fog_of_war` (currently user+q+r+z only).

Definition of done:
- Players see fog; DM does not.
- No map crashes when hex metadata is missing (show “needs calibration” message).

## Arc 6: Testing + Release Workflow

Recommended workflow:
1. Create a feature branch.
2. Run PocketBase locally with a clean PB data dir and apply migrations.
3. Run frontend dev locally and validate:
   - Campaign hub
   - Character page editing
   - Map viewer (fog on/off)
4. Run `frontend` tests (`npm test` or `npm run test`).
5. Merge to `main`.
6. Push to remote (triggers Azure deploy and PB migration deploy).

Definition of done:
- All local checks pass.
- Deployed migrations are additive/optional and do not require manual production edits.

