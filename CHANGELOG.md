# Changelog

All notable changes to the Adventurers Ledger project will be documented in this file.

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
