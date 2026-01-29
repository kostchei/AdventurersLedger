# Deployment Status

**Last Updated:** 2026-01-26

## Current State

### ✅ Backend (GCP + Cloudflare)
| Component | Status | Details |
|-----------|--------|---------|
| GCP VM | ✅ Running | `instance-20260126-151258` in `us-central1-c` |
| PocketBase | ✅ Running | v0.26.6, systemd service active |
| Cloudflare Tunnel | ✅ Active | ID: `bb6b0852-f844-496b-9647-736cb93ee7b3` |
| API URL | ✅ Live | https://api.talekeeper.org |
| Admin Panel | ✅ Accessible | https://api.talekeeper.org/_/ |
| Database | ⚠️ Empty | Schema not imported, no user data |

### ✅ Frontend (Azure)
| Component | Status | Details |
|-----------|--------|---------|
| Azure Static Web App | ✅ Active | Live via Cloudflare |
| GitHub Actions | ✅ Configured | Deployment pipeline active |
| Domain | ✅ DNS Ready | `talekeeper.org` CNAME exists |

### ⏳ Data Migration
| Task | Status |
|------|--------|
| Import `pb_schema.json` | ⏳ Pending |
| Create test users | ⏳ Pending |
| Seed initial data | ⏳ Pending |

---

## Next Steps

1. **Import Schema**: Go to PocketBase Admin → Settings → Import Collections → Upload `pocketbase/pb_schema.json`
2. **Deploy Frontend**: Create Azure Static Web App and configure GitHub secrets
3. **Configure Environment**: Set `VITE_PB_URL=https://api.talekeeper.org` in frontend build
4. **Test End-to-End**: Verify login, data sync, and real-time features

---

## Infrastructure Details

See `secrets/infrastructure.json` for:
- GCP Project ID and VM details
- Cloudflare Tunnel ID
- Connection URLs

---

## SSH Access

```bash
# Browser SSH (Recommended)
# Go to: https://console.cloud.google.com/compute/instances
# Click "SSH" button next to the VM

# CLI (requires PuTTY on Windows)
gcloud compute ssh ashley_stevens_hoare@instance-20260126-151258 --zone=us-central1-c --project=doc-to-json-tarot
```

## Service Management

```bash
# PocketBase
sudo systemctl status pocketbase
sudo systemctl restart pocketbase

# Cloudflare Tunnel
sudo systemctl status cloudflared
sudo systemctl restart cloudflared
```
