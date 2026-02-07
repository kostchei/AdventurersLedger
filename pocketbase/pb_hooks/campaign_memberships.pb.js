/// <reference path="../pb_data/types.d.ts" />

/**
 * campaign_memberships hook (PocketBase v0.26.x)
 *
 * Some clients omit `is_primary_dm` when creating a membership. The collection
 * field is required, so set a safe default to avoid "cannot be blank".
 */
onRecordCreateRequest(
  (e) => {
    // Run without relying on tags filtering (PocketBase v0.26.x tag matching can
    // be surprising depending on route/collection id). Filter manually.
    if (e.collection?.name !== "campaign_memberships") {
      return e.next();
    }

    try {
      const v = e.record?.get?.("is_primary_dm");

      // Normalize common cases where boolean may come as string.
      if (v === "true") {
        e.record.set("is_primary_dm", true);
      } else if (v === "false") {
        e.record.set("is_primary_dm", false);
      } else if (v === null || v === undefined || v === "") {
        e.record.set("is_primary_dm", false);
      }
    } catch {
      // If anything unexpected happens, fail safe and set a default.
      if (e.record) e.record.set("is_primary_dm", false);
    }

    return e.next();
  }
);
