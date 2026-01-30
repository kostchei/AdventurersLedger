# PocketBase DB & Schema CD/CD Workflow

This document outlines the "GitOps" workflow for managing PocketBase schema changes and deploying them automatically.

## The Problem
Updates to PocketBase are painful because manual schema changes on the server are error-prone and tedious to merge.

## The Solution
We treat the database schema as code. 
1.  **Local Development**: You make changes in your local PocketBase Admin UI.
2.  **Auto-Migration**: PocketBase automatically generates migration files in `pocketbase/pb_migrations`.
3.  **Version Control**: You commit these files to Git.
4.  **Automatic Deployment**: A GitHub Action pushes these files to your server and restarts PocketBase, applying changes automatically.

## Prerequisites
-   **SSH Access**: You must have SSH access to your production server.
-   **Systemd**: PocketBase should be running as a systemd service (linux) or similar, so it can be restarted.
-   **GitHub Secrets**: You need to configure the following in your repo settings (Settings > Secrets and variables > Actions):
    -   `HOST`: `35.209.19.233` (Found in `secrets/infrastructure.json`)
    -   `USERNAME`: The SSH username (e.g., `github-action` - see below).
    -   `KEY`: Your private SSH key content (PEM format).

### GCP Specifics: Getting your SSH Key
Since we don't have a stored SSH key in `secrets/`, you should generate a dedicated one for GitHub Actions:
1.  **Generate a key pair locally**:
    ```bash
    ssh-keygen -t rsa -f ~/.ssh/gcp_github_action -C "github-action"
    ```
2.  **Add public key to GCP**:
    -   Copy the content of `gcp_github_action.pub`.
    -   Go to **Compute Engine > VM Instances > instance-20260126-151258**.
    -   Click **Edit**.
    -   Scroll down to **SSH Keys** -> **Add Item**.
    -   Paste the public key. The "Username" will separate automatically (e.g. `github-action`).
    -   Save.
3.  **Add private key to GitHub**:
    -   Copy the content of `gcp_github_action` (the private key).
    -   Add this as the `KEY` secret in GitHub.
    -   Use the username from step 2 (e.g. `github-action`) as the `USERNAME` secret.
    -   Use `35.209.19.233` as the `HOST` secret.

## The Workflow

### 1. Make Changes Locally
Run your local PocketBase:
```bash
./pocketbase serve
```
Go to `http://127.0.0.1:8090/_/` and make your changes (add collections, change fields, etc.).
PocketBase will Create new files in `pocketbase/pb_migrations`, e.g., `169..._created_posts.js`.

### 2. Commit Changes
```bash
git add pocketbase/pb_migrations
git commit -m "feat: add posts collection"
git push origin main
```

### 3. Automatic Deployment
The GitHub Action `.github/workflows/deploy-backend.yml` will trigger:
1.  Connects to your server via SSH.
2.  Pulls the latest code (including new migrations).
3.  Restarts the `pocketbase` service.

On restart, PocketBase automatically detects unapplied migrations in `pb_migrations` and applies them.

## 🛑 The "Don't Break Shit" Golden Rules

To prevent data loss (like the "Collection Wipe" incident), follow these strictly:

### 1. Review Migrations BEFORE Committing
Always check files in `pocketbase/pb_migrations/` before you `git add`. 
- **⚠️ ALERT**: If you see a file named `..._deleted_...js` and you didn't mean to delete data, **DELETE THAT FILE** and restore it from Git.
- PocketBase generates these whenever you change the schema. If you renamed a collection, it might "Delete" the old name and "Create" the new one—wiping data in the process!

### 2. Local is the Sandbox
Never make schema changes directly on the production Admin UI. Always do them locally, let the JS files generate, and push them.

### 3. Automated Backups
The GitHub Action is now configured to create a snapshot of your database (`data.db.bak`) every time it deploys. If something breaks, you can swap it back.

## Troubleshooting & Recovery

### "Migration mismatch"
If you and another dev both create migrations, they might conflict.
**Fix**: Rename the timestamp in the filename of your local migration to be recent, ensuring they run in order.

### "Validation Failure"
If deployment fails, check the service logs on the server:
```bash
journalctl -u pocketbase -f
```
