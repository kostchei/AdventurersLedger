/// <reference path="../pb_data/types.d.ts" />

/**
 * campaign_memberships hook (PocketBase v0.26.x)
 *
 * Some clients omit `is_primary_dm` when creating a membership. The collection
 * field is required, so set a safe default to avoid "cannot be blank".
 */
onRecordCreateRequest(
  (e) => {
    try {
      const v = e.record?.get?.("is_primary_dm");
      if (v === null || v === undefined || v === "") {
        e.record.set("is_primary_dm", false);
      }
    } catch {
      // If anything unexpected happens, fail safe and set a default.
      if (e.record) e.record.set("is_primary_dm", false);
    }

    return e.next();
  },
  "campaign_memberships"
);

