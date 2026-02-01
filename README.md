# Adventurer's Ledger Codex

A D&D 5e campaign management and hex exploration application with unique per-player session-based fog of war.

## 📚 Documentation

-   **[Developer Guide](./DEVELOPER_GUIDE.md)**: Setup, contributing workflows, migration rules, and roadmap.
-   **[Architecture & Deployment](./ARCHITECTURE_AND_DEPLOYMENT.md)**: Infrastructure topology, CI/CD pipelines, and operational management.
-   **[Changelog](./CHANGELOG.md)**: Version history and release notes.

## ✨ Features

-   **Session-Based Fog of War**: Each player sees only hexes from sessions they attended.
-   **D&D 5e Character Management**: Full character sheet with attributes, piety, factions, and conditions.
-   **Real-time Updates**: Socket.io integration for instant map and stat synchronization.
-   **Persistent World**: Changes to the world (dungeons cleared, NPCs met) are tracked globally.

## 🛠️ Tech Stack

-   **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
-   **Backend**: Node.js/Express (Legacy), PocketBase (Primary Data Store)
-   **Infrastructure**: Azure Static Web Apps (Frontend), GCP VM (Backend)

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/kostchei/AdventurersLedger_Codex.git

# Start PocketBase (Backend)
cd pocketbase
./pocketbase serve --http=0.0.0.0:8090

# Start Frontend
cd ../frontend
npm install
npm run dev
```

See [Developer Guide](./DEVELOPER_GUIDE.md) for detailed setup instructions.

## License

MIT