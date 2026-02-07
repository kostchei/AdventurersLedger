# Changelog

All notable changes to the Adventurers Ledger project will be documented in this file.

## [v0.2.0-readonly-beta] - 2026-02-07

### Added
- **Google OAuth**: Sign in / sign up via Google OAuth and automatic join-link sign-in flow.
- **Campaign Activity Timeline**: `campaign_logs` collection + UI timeline on the campaign page.

### Changed
- **Campaign Maps**: Simplified map upload to image-only (removed hex calibration / survey step).
- **World State**: Made `z_index` optional and removed remaining client-side dependencies.

### Fixed
- **Join Campaign**: Fixed `campaign_memberships` create failures (`is_primary_dm` required) and button pending state affecting all campaigns.
- **Stability**: Prevented crashes when `cleared_dungeons_list` is missing from `world_state` records.

## [v0.1.0-alpha] - 2026-02-01

### Added
- **Character Sheet**:
    - Full attribute support (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma).
    - Divine Piety system with 42 deities and rank tracking.
    - Faction Renown tracking for major organizations.
    - Class Level management (multiclassing support).
    - Conditions/Afflictions tracking system.
- **Backend Schema**:
    - Migrated `users_stats` collection to support full character JSON structures (`levels`, `factions`, `spells`, `feats`, `inventory`).
    - Automated schema migration pipeline via GitHub Actions.

### Fixed
- **Persistence**: Resolved issue where Hit Points, Attributes, and Piety scores would reset or fail to save.
- **Migration**: Fixed "missing types.d.ts" lint errors in migration files.
- **Deployment**: Established "Golden Rules" for safe schema updates to preventing production data loss.
- **Character Creation**: Resolved "400 Bad Request: id: Cannot be blank" error by repairing `users_stats` collection schema and restoring system ID autogeneration.
- **Downtime Prevention**: Standardized PocketBase migrations to use fail-safe JSVM syntax and added [POCKETBASE_SAFETY_GUIDE.md](./POCKETBASE_SAFETY_GUIDE.md).
