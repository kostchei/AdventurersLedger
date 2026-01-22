# Project Codex (Tale-Keeper) - Development Plan

## Current State Summary

The codebase has a solid foundation with:
- **Backend**: Express + Prisma + PostgreSQL (fully functional)
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Real-time**: Socket.io + PocketBase subscriptions
- **Auth**: Google OAuth via Passport.js
- **Maps**: Canvas-based hex rendering with fog of war

---

## Development Phases

### Phase 1: PocketBase Schema Alignment (Backend Consolidation)

The PRD specifies PocketBase as the primary backend. We need to align the PocketBase collections with the PRD requirements.

---

#### 1.1 PocketBase Collection Setup

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| PB-001 | Create `users_stats` collection schema | Define collection with fields: user_id, hp, max_hp, stats_json, gold, xp, conditions | PocketBase Admin UI |
| PB-002 | Set `users_stats` access rules | Configure Owner-Only access policy | PocketBase Admin UI |
| PB-003 | Verify `fog_of_war` collection schema | Ensure fields: user_id, q, r, z, timestamp exist | PocketBase Admin UI |
| PB-004 | Set `fog_of_war` access rules | Configure Owner-Only access policy | PocketBase Admin UI |
| PB-005 | Create `world_state` collection schema | Define: layer_id, z_index, map_url, cleared_dungeons_list | PocketBase Admin UI |
| PB-006 | Set `world_state` access rules | Configure Authenticated Users (Read) policy | PocketBase Admin UI |
| PB-007 | Verify `decals` collection schema | Ensure fields: site_name, q, r, z, image_url, is_visible | PocketBase Admin UI |
| PB-008 | Set `decals` access rules | Configure Authenticated Users (Read) policy | PocketBase Admin UI |
| PB-009 | Add `global_role` to `users` | Add select field (USER, GM, ADMIN) to users | [Completed] |
| PB-010 | Restrict Campaign Creation | Update `campaigns` createRule to require global_role=GM | [Completed] |
| PB-011 | Configure Role Promotion | Update `users` updateRule to allow GMs to promote | [Completed] |

---

#### 1.2 PocketBase TypeScript Types

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| TS-001 | Create `UserStats` interface | Define TypeScript interface for users_stats collection | `frontend/src/types/pocketbase.ts` |
| TS-002 | Create `FogOfWar` interface | Define TypeScript interface for fog_of_war collection | `frontend/src/types/pocketbase.ts` |
| TS-003 | Create `WorldState` interface | Define TypeScript interface for world_state collection | `frontend/src/types/pocketbase.ts` |
| TS-004 | Create `Decal` interface | Define TypeScript interface for decals collection | `frontend/src/types/pocketbase.ts` |
| TS-005 | Create PocketBase typed client wrapper | Create helper functions with proper typing | `frontend/src/lib/pbClient.ts` |

---

### Phase 2: Authentication & Server Status

---

#### 2.1 OAuth Integration Enhancement

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| AUTH-001 | Verify Google OAuth config | Ensure Google OAuth is correctly configured in PocketBase | PocketBase Admin UI |
| AUTH-002 | Enhancement Login UI | Improve Login page visual appeal | `frontend/src/pages/Login.tsx` |

---

#### 2.2 Server Status Detection

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| SRV-001 | Create `useServerStatus` hook | Hook to ping PocketBase and check availability | `frontend/src/hooks/useServerStatus.ts` |
| SRV-002 | Create `ServerOffline` component | Display "Campaign Resting" message | `frontend/src/components/ServerOffline.tsx` |
| SRV-003 | Add server check to App initialization | Ping server before rendering main content | `frontend/src/App.tsx` |
| SRV-004 | Create retry mechanism for server check | Auto-retry with exponential backoff | `frontend/src/hooks/useServerStatus.ts` |
| SRV-005 | Add manual "Try Again" button | Allow user to manually retry connection | `frontend/src/components/ServerOffline.tsx` |

---

### Phase 3: Personal Fog of War (3D System)

---

#### 3.1 Z-Axis Data Layer

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| FOW-001 | Add z-coordinate to hex grid utility | Update HexGrid class to support z-axis | `frontend/src/utils/hexGrid.ts` |
| FOW-002 | Create `Hex3D` type | Define type for (q, r, z) coordinates | `frontend/src/types/hex.ts` |
| FOW-003 | Update `useFogOfWar` to filter by z | Filter revealed hexes by current z-layer | `frontend/src/hooks/useFogOfWar.ts` |
| FOW-004 | Add z-parameter to revealHex function | Include z when revealing hexes | `frontend/src/hooks/useFogOfWar.ts` |

---

#### 3.2 Layer Navigation UI

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| FOW-005 | Create `LayerSelector` component | Dropdown/buttons to switch z-layers | `frontend/src/components/LayerSelector.tsx` |
| FOW-006 | Add layer names/labels support | Display "Surface", "Dungeon Level 1" etc. | `frontend/src/components/LayerSelector.tsx` |
| FOW-007 | Create `useCurrentLayer` hook | Manage current z-layer state | `frontend/src/hooks/useCurrentLayer.ts` |
| FOW-008 | Integrate LayerSelector into CampaignPage | Add layer switcher to map view | `frontend/src/pages/CampaignPage.tsx` |
| FOW-009 | Connect HexMapViewer to current layer | Pass current z-layer to map viewer | `frontend/src/components/HexMapViewer.tsx` |

---

#### 3.3 Fog Rendering Enhancement

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| FOW-010 | Create fog overlay canvas layer | Separate canvas for fog rendering | `frontend/src/components/HexMapViewer.tsx` |
| FOW-011 | Implement "punch holes" algorithm | Clear fog at revealed hex positions | `frontend/src/components/HexMapViewer.tsx` |
| FOW-012 | Add fog edge softening | Blur edges of revealed areas | `frontend/src/components/HexMapViewer.tsx` |
| FOW-013 | Optimize fog rendering with caching | Cache fog layer, only update on changes | `frontend/src/components/HexMapViewer.tsx` |

---

### Phase 4: Character Vitality & Statistics

---

#### 4.1 Stats Data Layer

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| CHAR-001 | Create `useCharacterStats` hook | Fetch/subscribe to users_stats collection | `frontend/src/hooks/useCharacterStats.ts` |
| CHAR-002 | Create `updateStats` function | Update character stats in PocketBase | `frontend/src/lib/characterApi.ts` |
| CHAR-003 | Create `updateHP` function | Dedicated HP update function | `frontend/src/lib/characterApi.ts` |
| CHAR-004 | Create `addCondition` function | Add status effect to character | `frontend/src/lib/characterApi.ts` |
| CHAR-005 | Create `removeCondition` function | Remove status effect from character | `frontend/src/lib/characterApi.ts` |

---

#### 4.2 Character Stats UI

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| CHAR-006 | Create `AbilityScore` component | Display single ability (STR, DEX, etc.) | `frontend/src/components/character/AbilityScore.tsx` |
| CHAR-007 | Create `AbilityScoreGrid` component | 6-stat grid display | `frontend/src/components/character/AbilityScoreGrid.tsx` |
| CHAR-008 | Create `HPBar` component | Visual HP current/max display | `frontend/src/components/character/HPBar.tsx` |
| CHAR-009 | Create `HPEditor` component | Editable HP input (GM only) | `frontend/src/components/character/HPEditor.tsx` |
| CHAR-010 | Create `ConditionBadge` component | Single condition status badge | `frontend/src/components/character/ConditionBadge.tsx` |
| CHAR-011 | Create `ConditionsList` component | List of active conditions | `frontend/src/components/character/ConditionsList.tsx` |
| CHAR-012 | Create `ConditionSelector` component | Add condition dropdown (GM only) | `frontend/src/components/character/ConditionSelector.tsx` |
| CHAR-013 | Update `CharacterStats` component | Integrate all stat sub-components | `frontend/src/components/CharacterStats.tsx` |

---

#### 4.3 Conditions System

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| CHAR-014 | Create conditions constant list | Define all D&D 5e conditions | `frontend/src/constants/conditions.ts` |
| CHAR-015 | Add condition icons/colors | Visual styling for each condition | `frontend/src/constants/conditions.ts` |
| CHAR-016 | Create condition descriptions | Tooltip text for each condition | `frontend/src/constants/conditions.ts` |

---

### Phase 5: Economy & Progression

---

#### 5.1 XP & Leveling

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| ECON-001 | Create XP thresholds constant | D&D 5e level XP requirements | `frontend/src/constants/leveling.ts` |
| ECON-002 | Create `calculateLevel` utility | Derive level from total XP | `frontend/src/utils/leveling.ts` |
| ECON-003 | Create `XPDisplay` component | Show current XP and level progress | `frontend/src/components/economy/XPDisplay.tsx` |
| ECON-004 | Create `XPProgressBar` component | Visual XP to next level | `frontend/src/components/economy/XPProgressBar.tsx` |
| ECON-005 | Create `addXP` function | Add XP to character via PocketBase | `frontend/src/lib/characterApi.ts` |

---

#### 5.2 Gold Management

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| ECON-006 | Create `GoldDisplay` component | Show current gold amount | `frontend/src/components/economy/GoldDisplay.tsx` |
| ECON-007 | Create `GoldEditor` component | Add/remove gold (GM only) | `frontend/src/components/economy/GoldEditor.tsx` |
| ECON-008 | Create `updateGold` function | Update gold in PocketBase | `frontend/src/lib/characterApi.ts` |

---

#### 5.3 Magical Items Vault

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| ECON-009 | Create `items` PocketBase collection | Master item database schema | PocketBase Admin UI |
| ECON-010 | Create `player_items` PocketBase collection | Player inventory (UUID links) | PocketBase Admin UI |
| ECON-011 | Create `Item` TypeScript interface | Define item type | `frontend/src/types/items.ts` |
| ECON-012 | Create `usePlayerItems` hook | Fetch player's items | `frontend/src/hooks/usePlayerItems.ts` |
| ECON-013 | Create `ItemCard` component | Display single item | `frontend/src/components/inventory/ItemCard.tsx` |
| ECON-014 | Create `ItemList` component | List player's items | `frontend/src/components/inventory/ItemList.tsx` |
| ECON-015 | Create `ItemGrantModal` component | GM grants item to player | `frontend/src/components/inventory/ItemGrantModal.tsx` |
| ECON-016 | Create `grantItem` function | Add item to player inventory | `frontend/src/lib/inventoryApi.ts` |
| ECON-017 | Create `removeItem` function | Remove item from player | `frontend/src/lib/inventoryApi.ts` |

---

#### 5.4 Faction Renown

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| ECON-018 | Create `factions` PocketBase collection | List of world factions | PocketBase Admin UI |
| ECON-019 | Create `player_renown` PocketBase collection | Player standing per faction | PocketBase Admin UI |
| ECON-020 | Create `Faction` TypeScript interface | Define faction type | `frontend/src/types/factions.ts` |
| ECON-021 | Create `usePlayerRenown` hook | Fetch player's faction standings | `frontend/src/hooks/usePlayerRenown.ts` |
| ECON-022 | Create `RenownBadge` component | Single faction standing display | `frontend/src/components/factions/RenownBadge.tsx` |
| ECON-023 | Create `RenownList` component | All faction standings | `frontend/src/components/factions/RenownList.tsx` |
| ECON-024 | Create `updateRenown` function | Modify faction standing | `frontend/src/lib/factionApi.ts` |

---

### Phase 6: Global World State

---

#### 6.1 Multi-Layer Map System

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| WORLD-001 | Create `useWorldState` hook | Fetch/subscribe to world_state | `frontend/src/hooks/useWorldState.ts` |
| WORLD-002 | Create `getMapForLayer` function | Get map URL for specific z-index | `frontend/src/lib/worldApi.ts` |
| WORLD-003 | Update HexMapViewer for layer maps | Load different image per z-layer | `frontend/src/components/HexMapViewer.tsx` |
| WORLD-004 | Create map transition animation | Fade between layer changes | `frontend/src/components/HexMapViewer.tsx` |

---

#### 6.2 Dungeon Progress Tracking

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| WORLD-005 | Create `dungeon_progress` collection | Dungeon clearing status | PocketBase Admin UI |
| WORLD-006 | Create `DungeonProgress` interface | TypeScript type | `frontend/src/types/dungeons.ts` |
| WORLD-007 | Create `useDungeonProgress` hook | Fetch dungeon states | `frontend/src/hooks/useDungeonProgress.ts` |
| WORLD-008 | Create `DungeonStatusBadge` component | Show dungeon cleared % | `frontend/src/components/world/DungeonStatusBadge.tsx` |
| WORLD-009 | Create `DungeonList` component | List all dungeons with status | `frontend/src/components/world/DungeonList.tsx` |
| WORLD-010 | Create `updateDungeonProgress` function | GM updates dungeon state | `frontend/src/lib/dungeonApi.ts` |

---

#### 6.3 Dynamic Decals System

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| WORLD-011 | Create `useDecals` hook | Fetch/subscribe to decals | `frontend/src/hooks/useDecals.ts` |
| WORLD-012 | Create `filterDecalsByLayer` function | Get decals for current z | `frontend/src/lib/decalApi.ts` |
| WORLD-013 | Create `DecalRenderer` component | Render decals on map | `frontend/src/components/map/DecalRenderer.tsx` |
| WORLD-014 | Integrate DecalRenderer into HexMapViewer | Draw decals at hex positions | `frontend/src/components/HexMapViewer.tsx` |
| WORLD-015 | Create decal image preloader | Cache decal images | `frontend/src/utils/imageCache.ts` |
| WORLD-016 | Create `DecalEditor` component (GM) | Add/edit/remove decals | `frontend/src/components/gm/DecalEditor.tsx` |
| WORLD-017 | Create `createDecal` function | Add new decal | `frontend/src/lib/decalApi.ts` |
| WORLD-018 | Create `updateDecal` function | Update decal properties | `frontend/src/lib/decalApi.ts` |
| WORLD-019 | Create `deleteDecal` function | Remove decal | `frontend/src/lib/decalApi.ts` |

---

#### 6.4 Ecological Impact System

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| WORLD-020 | Create `monster_counts` collection | Monsters defeated per region | PocketBase Admin UI |
| WORLD-021 | Create `MonsterCount` interface | TypeScript type | `frontend/src/types/ecology.ts` |
| WORLD-022 | Create `useEcology` hook | Fetch regional monster counts | `frontend/src/hooks/useEcology.ts` |
| WORLD-023 | Create `EcologyDisplay` component | Show regional impact | `frontend/src/components/world/EcologyDisplay.tsx` |
| WORLD-024 | Create `updateMonsterCount` function | Increment/set count | `frontend/src/lib/ecologyApi.ts` |
| WORLD-025 | Define ecological threshold rules | When decals change based on counts | `frontend/src/constants/ecologyRules.ts` |

---

#### 6.5 NPC Directory

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| WORLD-026 | Create `npcs` PocketBase collection | NPC master list | PocketBase Admin UI |
| WORLD-027 | Create `discovered_npcs` collection | Player-discovered NPCs | PocketBase Admin UI |
| WORLD-028 | Create `NPC` TypeScript interface | Define NPC type | `frontend/src/types/npcs.ts` |
| WORLD-029 | Create `useDiscoveredNPCs` hook | Fetch player's known NPCs | `frontend/src/hooks/useDiscoveredNPCs.ts` |
| WORLD-030 | Create `NPCCard` component | Display NPC info | `frontend/src/components/npcs/NPCCard.tsx` |
| WORLD-031 | Create `NPCList` component | List discovered NPCs | `frontend/src/components/npcs/NPCList.tsx` |
| WORLD-032 | Create `NPCLocationBadge` component | Show NPC current location | `frontend/src/components/npcs/NPCLocationBadge.tsx` |
| WORLD-033 | Create `discoverNPC` function | Add NPC to player's known list | `frontend/src/lib/npcApi.ts` |
| WORLD-034 | Create `updateNPCLocation` function (GM) | Move NPC location | `frontend/src/lib/npcApi.ts` |
| WORLD-035 | Create `NPCEditor` component (GM) | Create/edit NPCs | `frontend/src/components/gm/NPCEditor.tsx` |

---

### Phase 7: Real-Time Updates

---

#### 7.1 PocketBase Subscriptions

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| RT-001 | Create `useRealtimeSubscription` hook | Generic PB subscription wrapper | `frontend/src/hooks/useRealtimeSubscription.ts` |
| RT-002 | Add HP change subscription | Listen for users_stats HP changes | `frontend/src/hooks/useCharacterStats.ts` |
| RT-003 | Add gold change subscription | Listen for gold updates | `frontend/src/hooks/useCharacterStats.ts` |
| RT-004 | Add fog_of_war subscription | Listen for new hex reveals | `frontend/src/hooks/useFogOfWar.ts` |
| RT-005 | Add decals subscription | Listen for decal changes | `frontend/src/hooks/useDecals.ts` |
| RT-006 | Add world_state subscription | Listen for world changes | `frontend/src/hooks/useWorldState.ts` |

---

#### 7.2 Optimistic Updates

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| RT-007 | Implement optimistic HP update | Instant UI update before server | `frontend/src/hooks/useCharacterStats.ts` |
| RT-008 | Implement optimistic fog reveal | Instant fog clear before server | `frontend/src/hooks/useFogOfWar.ts` |
| RT-009 | Add rollback on failure | Revert if server update fails | `frontend/src/hooks/useOptimisticUpdate.ts` |

---

### Phase 8: GM Tools

---

#### 8.1 GM Dashboard

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| GM-001 | Create `GMDashboard` page | Main GM control panel | `frontend/src/pages/GMDashboard.tsx` |
| GM-002 | Create `PlayerOverview` component | See all player stats | `frontend/src/components/gm/PlayerOverview.tsx` |
| GM-003 | Create `QuickHPEditor` component | Bulk HP adjustment | `frontend/src/components/gm/QuickHPEditor.tsx` |
| GM-004 | Create `QuickGoldEditor` component | Bulk gold distribution | `frontend/src/components/gm/QuickGoldEditor.tsx` |
| GM-005 | Create `QuickXPEditor` component | Bulk XP distribution | `frontend/src/components/gm/QuickXPEditor.tsx` |

---

#### 8.2 Map Management

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| GM-006 | Create `MapUploader` component | Upload new map images | `frontend/src/components/gm/MapUploader.tsx` |
| GM-007 | Create `MapConfigEditor` component | Set hex grid params | `frontend/src/components/gm/MapConfigEditor.tsx` |
| GM-008 | Create `LayerManager` component | Add/edit z-layers | `frontend/src/components/gm/LayerManager.tsx` |
| GM-009 | Create map image upload function | Upload to PocketBase files | `frontend/src/lib/mapApi.ts` |

---

#### 8.3 Hex Revelation Tools

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| GM-010 | Create `HexRevealTool` component | Click to reveal hexes | `frontend/src/components/gm/HexRevealTool.tsx` |
| GM-011 | Create `BulkRevealTool` component | Reveal hex range/radius | `frontend/src/components/gm/BulkRevealTool.tsx` |
| GM-012 | Create `revealHexesForPlayer` function | GM reveals for specific player | `frontend/src/lib/fogApi.ts` |
| GM-013 | Create `revealHexesForAll` function | GM reveals for all players | `frontend/src/lib/fogApi.ts` |

---

### Phase 9: Infrastructure & DevOps

---

#### 9.1 Cloudflare Tunnel Setup

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| INFRA-001 | Create Cloudflare Tunnel config file | `config.yml` for tunnel routing | `infrastructure/cloudflare/config.yml` |
| INFRA-002 | Create tunnel setup script | Script to configure tunnel | `infrastructure/scripts/setup-tunnel.sh` |
| INFRA-003 | Document tunnel setup process | Step-by-step instructions | `docs/cloudflare-tunnel.md` |

---

#### 9.2 Docker Configuration

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| INFRA-004 | Create PocketBase Dockerfile | Container for PocketBase | `infrastructure/docker/pocketbase/Dockerfile` |
| INFRA-005 | Create cloudflared Dockerfile | Container for tunnel daemon | `infrastructure/docker/cloudflared/Dockerfile` |
| INFRA-006 | Create docker-compose.yml | Orchestrate PB + tunnel | `docker-compose.yml` |
| INFRA-007 | Create .env.example | Document required env vars | `.env.example` |
| INFRA-008 | Create docker startup script | Helper to start services | `infrastructure/scripts/start.sh` |

---

#### 9.3 Syncthing Backup

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| INFRA-009 | Document Syncthing folder setup | How to sync PB data folder | `docs/syncthing-setup.md` |
| INFRA-010 | Create backup verification script | Check sync status | `infrastructure/scripts/verify-backup.sh` |

---

### Phase 10: Testing & Polish

---

#### 10.1 Unit Tests

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| TEST-001 | Setup Vitest for frontend | Configure test runner | `frontend/vitest.config.ts` |
| TEST-002 | Test hexGrid utility | Coordinate conversions | `frontend/src/utils/hexGrid.test.ts` |
| TEST-003 | Test leveling utility | XP calculations | `frontend/src/utils/leveling.test.ts` |
| TEST-004 | Test useServerStatus hook | Offline detection | `frontend/src/hooks/useServerStatus.test.ts` |

---

#### 10.2 Integration Tests

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| TEST-005 | Test PocketBase CRUD operations | Users_stats operations | `frontend/src/lib/characterApi.test.ts` |
| TEST-006 | Test fog of war reveal flow | Hex reveal end-to-end | `frontend/src/hooks/useFogOfWar.test.ts` |
| TEST-007 | Test real-time subscriptions | Subscription callbacks | `frontend/src/hooks/useRealtimeSubscription.test.ts` |

---

#### 10.3 UI Polish

| Task ID | Task | Description | Files Affected |
|---------|------|-------------|----------------|
| UI-001 | Add loading skeletons | Skeleton placeholders | Various components |
| UI-002 | Add error boundaries | Graceful error handling | `frontend/src/components/ErrorBoundary.tsx` |
| UI-003 | Add toast notifications | Success/error messages | `frontend/src/components/Toast.tsx` |
| UI-004 | Responsive mobile layout | Mobile-friendly UI | Various CSS |
| UI-005 | Add keyboard shortcuts | Accessibility | `frontend/src/hooks/useKeyboardShortcuts.ts` |

---

## Task Dependency Graph

```
Phase 1 (PocketBase Schema)
    ↓
Phase 2 (Auth & Server Status) ←→ Phase 3 (Fog of War)
    ↓                                    ↓
Phase 4 (Character Stats) ←→ Phase 5 (Economy)
    ↓                                    ↓
              Phase 6 (World State)
                      ↓
              Phase 7 (Real-Time)
                      ↓
              Phase 8 (GM Tools)
                      ↓
              Phase 9 (Infrastructure)
                      ↓
              Phase 10 (Testing)
```

---

## Quick Reference: Component Count by Phase

| Phase | Tasks | Components | Hooks | API Functions |
|-------|-------|------------|-------|---------------|
| 1. PocketBase Schema | 8 | 0 | 0 | 0 |
| 2. Auth & Server | 9 | 2 | 1 | 0 |
| 3. Fog of War | 13 | 1 | 2 | 0 |
| 4. Character Stats | 16 | 8 | 1 | 5 |
| 5. Economy | 24 | 8 | 3 | 6 |
| 6. World State | 35 | 11 | 5 | 9 |
| 7. Real-Time | 9 | 0 | 2 | 0 |
| 8. GM Tools | 13 | 10 | 0 | 3 |
| 9. Infrastructure | 10 | 0 | 0 | 0 |
| 10. Testing | 12 | 2 | 1 | 0 |
| **TOTAL** | **149** | **42** | **15** | **23** |

---

## Recommended Implementation Order

1. **Start with**: PB-001 through PB-008 (schema setup)
2. **Then**: TS-001 through TS-005 (TypeScript types)
3. **Then**: SRV-001 through SRV-005 (server status)
4. **Then**: FOW-001 through FOW-013 (fog of war)
5. **Then**: CHAR-001 through CHAR-016 (character system)
6. **Continue with remaining phases...**

---

## Notes

- Each task is designed to be completable in 15-30 minutes
- Tasks are ordered to minimize blocking dependencies
- GM-only features can be deprioritized for MVP
- Real-time features depend on base functionality being complete
