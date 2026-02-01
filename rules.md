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
