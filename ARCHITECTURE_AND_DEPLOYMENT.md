# Architecture & Deployment Guide

This document is the single source of truth for the TaleKeeper infrastructure, deployment pipelines, and operational procedures.

## 1. Architecture Overview

**Topology:**
```
┌─────────────────────────┐
│  Azure Static Web App   │ ← Frontend (talekeeper.org)
│    (React/Vite Build)   │
└────────────┬────────────┘
             │ HTTPS
             ↓
┌─────────────────────────┐
│  Cloudflare Tunnel      │ ← api.talekeeper.org
│   (Running on VM)       │
└────────────┬────────────┘
             │ Encrypted Tunnel
             ↓
┌─────────────────────────┐
│  PocketBase (GCP VM)    │ ← localhost:8090
│  e2-micro Always Free   │
└─────────────────────────┘
```
**Key Components:**
-   **Frontend**: Hosted on Azure Static Web Apps (Free Tier).
-   **Backend**: Google Cloud Platform `e2-micro` VM (US Central).
-   **Database**: PocketBase (SQLite mode) running as a systemd service.
-   **Networking**: Cloudflare Tunnel exposes the local port `8090` securely to `api.talekeeper.org`.
-   **Storage**: VM Persistent Disk + Google Cloud Storage for backups.

---

## 2. Infrastructure Setup

### GCP VM (Backend)
-   **Provisioning**: Use `infrastructure/setup-vm.sh` to provision the VM.
-   **Service**: PocketBase runs via `systemd` (`sudo systemctl status pocketbase`).
-   **Access**:
    ```bash
    gcloud compute ssh ashley_stevens_hoare@instance-20260126-151258 --zone=us-central1-c --project=doc-to-json-tarot
    ```

### Azure Static Web App (Frontend)
-   **Configuration**: `staticwebapp.config.json` handles routing and CSP.
-   **Domain**: `talekeeper.org` (CNAME record).

### Cloudflare Tunnel
-   **ConfigFile**: `pocketbase/cloudflared/config.yml`.
-   **Service**: `sudo systemctl status cloudflared`.

---

## 3. DevOps & CI/CD Pipelines

We use "GitOps" for both frontend and backend updates.

### Frontend Pipeline (Azure)
-   **Workflow**: `.github/workflows/azure-static-web-apps.yml`
-   **Trigger**: Push to `main`.
-   **Output**: Builds React app to `dist/` and deploys to Azure.

### Backend Pipeline (GCP)
-   **Workflow**: `.github/workflows/deploy-backend.yml`
-   **Trigger**: Push to `main` (changes in `pocketbase/**`).
-   **Strategy**: "Copy & Restart" (Not Docker).
    1.  **BackupDB**: Script creates `data.db.bak` snapshot.
    2.  **Sync**: Copies local `pb_migrations/` to server `pb_migrations/`.
    3.  **Wipe & Replace**: **CRITICAL** - The server's migration folder is WIPED and replaced with git content.
    4.  **Restart**: `pocketbase` service restarts to apply schema changes.

> [!WARNING]
> **Golden Rule**: NEVER manually edit schemas on the production server. Changes will be wiped on next deploy. Always use the migration flow (Local Edits -> Git Commit -> Push).

---

## 4. Operational Management

### Database Backups
-   **Automated**: GitHub Action backs up `data.db` on every deploy.
-   **Daily**: Cron job runs `backup-to-gcs.sh` to upload snapshot to Google Cloud Storage bucket `gs://talekeeper-backups`.

### Updating PocketBase Binary
1.  Stop service: `sudo systemctl stop pocketbase`
2.  Download new binary to `/opt/pocketbase/pocketbase`
3.  Start service: `sudo systemctl start pocketbase`

### Troubleshooting
-   **Backend Logs**: `journalctl -u pocketbase -f`
-   **Tunnel Status**: `systemctl status cloudflared`
-   **Frontend Build**: Check GitHub Actions logs.

---

## 5. Deployment Status (Access Details)

| Component | Status | Details |
|-----------|--------|---------|
| **API** | https://api.talekeeper.org | Public Backend Access |
| **Frontend** | https://talekeeper.org | Public App Access |
| **Admin** | https://api.talekeeper.org/_/ | PocketBase Dashboard |
| **GCP VM** | `instance-20260126-151258` | `us-central1-c` |
| **Tunnel** | ID: `bb6b...736cb93ee7b3` | `cloudflared` |

*Last Updated Consolidation: 2026-02-01*
