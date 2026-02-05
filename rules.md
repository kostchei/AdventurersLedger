# Agent Rules & Guidelines

## 1. Production Safety (CRITICAL)
- **Always Run Build Locally**: Before instructing the user to push to `main` or deploy, you MUST run `npm run build` locally in the `frontend` directory.
- **Verify Build Success**: If the build fails, fix the errors before proceeding. Do NOT assume it will work in CI/CD if it fails locally.
- **Check MIME Types**: If the user reports MIME type errors (`application/octet-stream`), it usually means the build failed and the server is serving raw source files.

## 2. Code Editing
- **Read First**: Always read the file content before editing to ensure precise targeting.
- **Target Precision**: Use unique context for search/replace.
- **Verify Imports**: When moving code between files, ensure all necessary imports are carried over.
- **State Cleanup**: When removing components, ensure all associated state variables and queries are also removed.

## 3. Database & Migrations (CRITICAL)
- **Check Migrations**: Before committing, ALWAYS check `pocketbase/pb_migrations` for auto-generated files (e.g., `_created_...`, `_deleted_...`).
- **No Junk Migrations**: If you ran `import_schema.js` or used the Admin UI to experiment, DELETE the clutter migrations. Only commit migrations you explicitly intended to create.
- **Sync via Schema**: For local development resets, update `pb_schema.json` to match your migrations, so `import_schema.js` doesn't delete your new fields.
