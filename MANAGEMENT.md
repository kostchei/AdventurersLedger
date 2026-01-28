# TaleKeeper Cloud Management Guide

This guide details how to deploy, manage, and maintain the TaleKeeper infrastructure on Google Cloud Platform (GCP) using the **Always Free** tier.

## Architecture (Zero Cost)

- **Frontend**: Azure Static Web Apps (or Cloudflare Pages) hosting the React/Vite app.
- **Backend Access**: Cloudflare Tunnel (`cloudflared`) pointing to `api.talekeeper.org`.
- **Backend Host**: GCP `e2-micro` VM (US regions, 30GB disk).
- **Database**: PocketBase (SQLite) running on the VM.
- **Backups**: Google Cloud Storage (Standard class, <5GB free).

## 1. Initial Setup

### Prerequisites
- GCP Project with Billing enabled.
- Cloudflare Account managed domain.
- Google Cloud CLI installed locally (`gcloud`).

### Provisioning the VM
We use a startup script to automate software installation (PocketBase, Cloudflared).

1.  Navigate to `infrastructure/`.
2.  Edit `setup-vm.sh` to set your Project ID and confirm Zone.
3.  Run:
    ```bash
    ./setup-vm.sh
    ```
4.  Follow the output instructions to:
    -   SSH into the VM.
    -   Authenticate Cloudflare Tunnel.
    -   Start the tunnel service.

## 2. Data Migration

If you have existing local data (`pb_data`, `pb_migrations`):

1.  Zip your local data or upload directory directly.
2.  Use `scp` to copy files to the VM:
    ```bash
    gcloud compute scp --recurse pb_data pb_migrations pocketbase@talekeeper-server:~/ --zone=us-central1-a
    ```
    *Note: You may need to copy to your user home first, then move.*

3.  Run the migration helper script on the VM:
    ```bash
    sudo ./migrate_data.sh
    ```
    *(Upload this script to the VM first)*

## 3. Backups

We recommend storing backups in a GCP Storage Bucket.

1.  **Create a Bucket**:
    ```bash
    gcloud storage buckets create gs://talekeeper-backups --location=US --class=STANDARD
    ```
    *Ensure you stay under 5GB total storage to remain free.*

2.  **Grant Permissions**:
    Ensure the VM's Service Account has `Storage Object Admin` role.

3.  **Run Backup**:
    ```bash
    sudo ./backup-to-gcs.sh talekeeper-backups
    ```

4.  **Automate (Cron)**:
    Add to `/etc/crontab` (running as root or user with gsutil access):
    ```
    0 3 * * 0 root /opt/pocketbase/backup-to-gcs.sh talekeeper-backups
    ```

## 4. Updates

To update PocketBase:

1.  SSH into VM.
2.  Stop service: `sudo systemctl stop pocketbase`.
3.  Download new binary to `/opt/pocketbase`.
4.  Start service: `sudo systemctl start pocketbase`.

## 5. Cost Control (Guardrails)

-   **VM**: Keep to 1 `e2-micro` instance.
-   **Disk**: Max 30GB Standard Persistent Disk.
-   **Network**: Cloudflare Tunnel avoids ingress/egress cost for public IP (mostly).
-   **Alerts**: Set up a GCP Budget Alert for $1.00 to be notified of any leakage.

## Troubleshooting

-   **Logs**: `journalctl -u pocketbase -f`
-   **Service Status**: `systemctl status pocketbase`
-   **Tunnel Status**: `systemctl status cloudflared`
