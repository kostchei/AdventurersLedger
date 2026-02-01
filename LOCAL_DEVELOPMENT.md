# Local Development Guide

This guide explains how to set up and run the full Adventurer's Ledger stack (Frontend + Backend) locally on Windows.

## Prerequisites

1.  **Node.js**: Installed (v18+ recommended).
2.  **Powershell**: For running commands.

## Backend (PocketBase) Setup

We use a local instance of PocketBase for testing database changes and migrations before deploying to production.

### 1. Installation

If `pocketbase.exe` is not already in your `pocketbase/` directory:

1.  Download the latest Windows (amd64) release from [PocketBase Releases](https://github.com/pocketbase/pocketbase/releases/latest).
2.  Extract the zip file contents (specifically `pocketbase.exe`) into `d:\Code\AdventurersLedger\pocketbase\`.

### 2. Running the Server

Open a terminal in `d:\Code\AdventurersLedger\pocketbase` and run:

```powershell
# Run on port 8091 to avoid conflicts with other services
.\pocketbase.exe serve --http=127.0.0.1:8091
```

Access the Admin UI at: `http://127.0.0.1:8091/_/`

### 3. Migrations

Migrations are JavaScript files in `pocketbase/pb_migrations`. They run automatically when you start `serve`.

-   **Files**: Located in `pocketbase/pb_migrations/`.
-   **Applying**: Just restart the server.
-   **Resetting**: To start fresh, stop the server and delete the `pb_data` directory.
    ```powershell
    Remove-Item -Recurse -Force pb_data
    ```

## Frontend Setup

### 1. Configuration

The frontend needs to know where the backend is. Create or update `.env.local` in `frontend/`:

```env
VITE_PB_URL=http://127.0.0.1:8091
```

### 2. Running

Open a terminal in `d:\Code\AdventurersLedger\frontend` and run:

```powershell
npm run dev
```

The app will be available at `http://localhost:5173`.

## Verification Workflow

1.  **Start Backend**: Run `./pocketbase.exe serve --http=127.0.0.1:8091`.
    -   Watch for migration logs in the console.
2.  **Start Frontend**: Run `npm run dev`.
3.  **Test**: Open the app, log in (create a user if needed via "Sign Up" or Admin UI), and test features like Character Creation.

## Common Issues

-   **Migration Errors**: If a migration fails, the server logs will show the error. Check the file syntax.
-   **502 Bad Gateway (Production)**: Usually caused by a migration crashing the server startup. We now wrap migrations in `try-catch` blocks to prevent this.
-   **400 Errors**: Check the network tab in browser DevTools. The response JSON usually contains validation details.
