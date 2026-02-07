/// <reference path="../pb_data/types.d.ts" />

/**
 * Collection Hook for users (auth collection)
 * Goals:
 * - Allow new users to sign up via Google OAuth (global_role is required by schema).
 * - Ensure self-serve signups are always `USER` (cannot self-escalate to GM/ADMIN).
 * - Prevent users from changing their own `global_role` via update requests.
 */

const normalizeRole = (role) => {
  const r = typeof role === "string" ? role.toUpperCase() : "";
  return r === "GM" || r === "ADMIN" || r === "USER" ? r : "";
};

const getAuthRecord = (e) => {
  try {
    return e && e.httpContext ? e.httpContext.get("authRecord") : null;
  } catch {
    return null;
  }
};

const canManageRoles = (authRecord) => {
  const role = normalizeRole(authRecord?.get?.("global_role"));
  return role === "ADMIN";
};

onRecordAuthWithOAuth2Request(
  (e) => {
    // PocketBase expects createData to be mutable. Still, be defensive to avoid
    // breaking the OAuth flow if the runtime changes its shape.
    if (!e.createData || typeof e.createData !== "object") {
      e.createData = {};
    }

    // For newly created OAuth users, ensure required `global_role` is present and safe.
    if (e.isNewRecord) {
      const incoming = normalizeRole(e.createData?.global_role);
      e.createData.global_role = incoming || "USER";
      if (e.createData.global_role !== "USER") {
        // Do not allow role escalation on self-serve OAuth signup.
        e.createData.global_role = "USER";
      }
    } else {
      // Existing users: never allow oauth flow to change their role via createData merge.
      if (e.createData && "global_role" in e.createData) {
        delete e.createData.global_role;
      }
    }

    return e.next();
  },
  "users"
);

onRecordCreateRequest(
  (e) => {
    // Defensive: if a user record is created through any request path, force safe role.
    const authRecord = getAuthRecord(e);
    const incoming = normalizeRole(e.record?.get?.("global_role"));
    if (!canManageRoles(authRecord)) {
      e.record.set("global_role", "USER");
    } else if (!incoming) {
      e.record.set("global_role", "USER");
    }

    return e.next();
  },
  "users"
);

onRecordUpdateRequest(
  (e) => {
    // Prevent users from updating their own role (or anyone's) via API.
    const authRecord = getAuthRecord(e);
    if (canManageRoles(authRecord)) {
      return e.next();
    }

    try {
      if (!e.record || !e.record.id) return e.next();

      const existing = $app.findRecordById("users", e.record.id);
      const existingRole = normalizeRole(existing?.get?.("global_role")) || "USER";
      const newRole = normalizeRole(e.record.get("global_role"));

      if (newRole && newRole !== existingRole) {
        e.record.set("global_role", existingRole);
      }
    } catch {
      // If we can't load the existing record, fail safe: force USER.
      if (e.record) e.record.set("global_role", "USER");
    }

    return e.next();
  },
  "users"
);
