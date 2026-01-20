## **Product Requirements Document: Project Codex (Tale-Keeper)**

**Version:** 1.0

**Status:** Draft / Base Prompt

**Focus:** Persistent World State Manager for Hex-based Sandbox Campaigns

### ---

**1\. Executive Summary**

**Project Codex** is a lightweight, hybrid-cloud platform designed to manage a persistent, evolving "West Marches" style campaign. It bridges the gap between high-availability web access and private, self-hosted data ownership. The system provides unique "Fog of War" visibility for every player while maintaining a shared, evolving global world state across multiple dimensions (overworld and dungeons).

### ---

**2\. Architecture Goals**

* **Data Sovereignty:** Primary data (stats, coordinates, world state) is hosted locally via **PocketBase** on user-owned hardware (laptop/desktop).  
* **High Availability Entry Point:** An **Azure Static Web App** serves as the persistent frontend "pointer," ensuring players always have a stable URL to access, regardless of the host's current IP.  
* **Zero-Inference Personalization:** Strict data isolation where players only see the map data they have personally "unlocked" through exploration.  
* **No Hosted SaaS:** Avoidance of monthly subscription platforms (Firebase, Supabase Cloud) in favor of self-hosted logic and infrastructure-as-a-service.

### ---

**3\. User & Character Features (Per-Player Data)**

Each player has a unique record in the users collection. Data is isolated via backend API rules.

#### **3.1 Personal Fog of War (FoW)**

* **Mechanism:** A stored collection of 3D coordinates $(q, r, z)$ representing explored hexes.  
* **3D Layering:** Exploration is $z$-axis specific. Exploring a hex on the surface $(z=0)$ does not reveal the corresponding hex in a dungeon $(z=-1)$.  
* **Rendering:** The frontend "punches holes" in a global black overlay based on these triplets.

#### **3.2 Character Vitality & Statistics**

* **Core Attributes:** Tracking of Strength (STR), Dexterity (DEX), Constitution (CON), Intelligence (INT), Wisdom (WIS), and Charisma (CHA).  
* **Health Tracking:** Current HP and Max HP.  
* **Ongoing Conditions:** A list of active status effects (e.g., Poisoned, Restrained, Exhaustion).

#### **3.3 Economy & Progression**

* **Total XP:** Cumulative experience points for level tracking.  
* **Vault:** Tracking of Gold and a list of unique Magical Items (UUID-linked to a master item database).  
* **Faction Renown:** Numerical values representing standing with various world organizations.

### ---

**4\. Global World Features (Shared Data)**

Data accessible to all authorized players, representing the "state of the world."

#### **4.1 The Master Map**

* **Base Layer:** High-resolution PNG files mapped to a hex-grid coordinate system.  
* **Multi-Layer Support:** Support for overworld, sky-realms, and multi-floor dungeons via $z$-index.  
* **Dynamic Decals:** Image overlays for cities, ruins, or complex sites that appear or change based on world events (e.g., a "Village" icon changing to a "Ruins" icon).

#### **4.2 World Progress & Lore**

* **Dungeon States:** Boolean flags or completion percentages for "Dungeon Levels Cleared."  
* **Ecological Impact:** "Monsters Defeated" counter to track regional changes (e.g., clearing too many wolves might increase the deer population/decals).  
* **NPC Directory:** A list of "Discovered NPCs" including their current known location and status.

### ---

**5\. Technical Specifications**

#### **5.1 The Stack**

* **Backend:** [PocketBase](https://pocketbase.io/) (Self-hosted on local hardware).  
* **Frontend:** [Azure Static Web Apps](https://azure.microsoft.com/en-us/products/app-service/static) (React, Vue, or Vanilla JS).  
* **Connectivity:** Cloudflare Tunnel to expose the local PocketBase API to the Azure Frontend.  
* **Data Sync:** Syncthing (for database parity between the Desktop and Laptop hosts).

#### **5.2 Database Schema (Conceptual)**

| Collection | Fields | Access Policy |
| :---- | :---- | :---- |
| **users\_stats** | user\_id, hp, max\_hp, stats\_json, gold, xp | Owner Only |
| **fog\_of\_war** | user\_id, q, r, z, timestamp | Owner Only |
| **world\_state** | layer\_id, z\_index, map\_url, cleared\_dungeons\_list | Authenticated Users (Read) |
| **decals** | site\_name, q, r, z, image\_url, is\_visible | Authenticated Users (Read) |

### ---

**6\. User Experience (UX) Flow**

1. **Authentication:** Player visits the Azure URL and logs in via Google/Discord (handled by PocketBase OAuth).  
2. **Handshake:** The Azure app pings the local Home Server. If the server is offline, the app displays a "Campaign Resting (Server Offline)" message.  
3. **Map Load:** Upon successful connection, the app fetches the Global Map for the current $z$-layer.  
4. **Fog Masking:** The app fetches the player's unique fog\_of\_war coordinates and clears the overlay.  
5. **Live Updates:** As the GM updates HP or Gold in the PocketBase Admin UI, the player's view reflects changes in real-time.

### ---

**7\. Future Expansion (Out of Scope for MVP)**

* **Combat Tracker:** Initiative integration with character HP.  
* **Interactive Notes:** Players leaving "map markers" for others to find.  
* **Automatic Fireball:** A tool to calculate hex-radius impact for 3rd-level spells $(8d6$ fire, 20ft radius).

### ---

**Next Step for Coding**

Would you like me to generate the **docker-compose.yml** and **Cloudflare Tunnel configuration** to get the PocketBase/Home Server environment running, or should we start with the **HTML5 Canvas logic** for the 3D Hex/Fog of War rendering?

Here is a **clean, PRD-ready summary** of the PocketBase integration for *Project Codex (Tale-Keeper)* — concise, architecture-focused, and suitable to paste directly into your document.

---

# **PocketBase Integration Summary (for PRD)**

## **Overview**

PocketBase serves as the **primary local backend** for Codex, running on GM-controlled hardware to ensure **data sovereignty**, **offline-first capability**, and **full ownership** of world-state data. It manages user accounts, per-player fog of war, character stats, global map data, and real-time updates.

---

## **1\. Hosting Model**

PocketBase is **self-hosted** on a GM machine (desktop, laptop, or home server).  
It is exposed publicly **only through a secure Cloudflare Tunnel**, allowing the Azure frontend to access the API without opening ports or exposing the home network.

### **Key Benefits**

* No SaaS dependency  
* Full data ownership  
* Local latency and instant admin updates  
* Public access with zero inbound firewall rules

---

## **2\. Networking Architecture**

### **Public API Endpoint**

https://api.talekeeper.org

### **Mechanism**

A Cloudflare Tunnel daemon (`cloudflared`) runs alongside PocketBase and creates an encrypted outbound connection to Cloudflare. DNS routes:

api.talekeeper.org → \<Tunnel UUID\>.cfargotunnel.com → localhost:8090

This provides:

* Stable, SSL-secured public API URL  
* No dynamic IP issues  
* No port forwarding  
* Works seamlessly with browsers and Azure Static Web Apps

---

## **3\. Authentication Flow**

PocketBase handles all player and GM authentication, including Google/Discord OAuth.

Flow:

1. Player opens `app.talekeeper.org` (Azure frontend)  
2. Frontend initializes PocketBase client pointing at `api.talekeeper.org`  
3. Player logs in via OAuth  
4. PocketBase issues a JWT and retrieves the user's linked player record  
5. API security rules ensure strict **per-user isolation**

---

## **4\. Database Collections (Core Data Model)**

### **Users**

* Auth identities (OAuth)  
* Links to character data

### **users\_stats**

* `hp`, `max_hp`  
* `stats_json` (STR/DEX/etc.)  
* `xp`, `gold`  
* `conditions[]`

Access: **Owner Only**

---

### **fog\_of\_war**

Stores which hexes a player has explored:

* `user_id`  
* `q`, `r`, `z` (3D hex coordinates)  
* `timestamp`

Access: **Owner Only**

---

### **world\_state**

Shared map/world progress:

* `layer_id`  
* `z_index`  
* `map_url`  
* `cleared_dungeons_list[]`

Access: **Authenticated Read**

---

### **decals**

Dynamic world overlays (cities, ruins, faction banners):

* `site_name`  
* `q`, `r`, `z`  
* `image_url`  
* `is_visible`

Access: **Authenticated Read**

---

## **5\. Real-Time Updates**

PocketBase’s built-in real-time subscriptions (WebSockets) allow:

* HP changes to appear instantly on player screens  
* Fog of war updates immediately after player exploration  
* GM updates to world\_state reflected without refresh

This makes the platform feel like a live, synced virtual tabletop without running a hosted VTT.

---

## **6\. Deployment & DevOps Notes**

* PocketBase runs as a local service or Docker container  
* Cloudflare Tunnel runs as a companion service  
* DNS configured via Cloudflare for `api.talekeeper.org`  
* Azure Static Web App connects directly to the public API endpoint  
* Optional: Syncthing keeps a mirrored PocketBase instance on GM laptop for mobile play

---

## **7\. Security Considerations**

* API is never publicly exposed on home network; Cloudflare proxies all requests  
* OAuth redirect URLs locked to `app.talekeeper.org`  
* PocketBase rules enforce:  
  * per-user isolation  
  * shared read-only global world-state  
* No GM/DM data spills into player collections

---

## **8\. Summary**

PocketBase provides a **lightweight, real-time, self-hosted backend** that fits the Codex design philosophy:

* **Local-first, GM-owned data**  
* **High-availability public entry point via Cloudflare Tunnel**  
* **Strong per-user isolation for fog of war**  
* **Shared world state for persistent campaign management**  
* **Zero SaaS lock-in**  
* **Fast, simple to maintain**

It enables the hybrid “local backend \+ global frontend” model at the heart of the Tale-Keeper system.

