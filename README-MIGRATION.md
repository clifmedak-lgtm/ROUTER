# Router — extracted source snapshot

This folder is a reconstruction of the code snippets shared in chat. It does not modify the user's original repository.

## Contents
- `design.md` and the source paths under `packages/web/`: extracted from `Texte collé(1).txt` (43 sections).
- `package.json` and `.env.example`: reconstructed from the separately pasted contents in chat.
- `_source-alternates/`: reserved for materially different duplicate snippets; currently empty because all 14 snippets in `Texte collé(5).txt` match the primary dump after whitespace normalization.
- `EXTRACTION_REPORT.json`: file-by-file comparison of the 14 overlapping snippets (13 TSX files plus `format.ts`).

## Agreed target decisions
- New app: Next.js App Router + TypeScript.
- Package manager: npm; do not carry over Bun commands.
- Do not use Drizzle ORM.
- Database: Neon PostgreSQL. A replacement database layer must be selected after inspecting schema/auth requirements.
- Adapt existing Hono/oRPC API logic to Next.js Route Handlers where appropriate. Preserve business rules and features, not the old framework structure.
- Email: Brevo.
- Payments: replace NotchPay with CamerPay only after verifying official integration documentation.
- Remove Runable-specific auth/runtime integrations as part of a deliberate auth migration.
- Keep Cloudinary if still needed for driver photos/documents.

## Important caveats
- This is a code-snippet reconstruction, not a complete Git clone. The shared source dump does not show every possible config, asset, lockfile, migration, or generated file.
- The package manifest supplied in chat lists desktop/mobile workspaces, but their source files were not included in the two source dumps reviewed here.
- No production secrets should be placed in source control or in `NEXT_PUBLIC_*` variables.
- Do not deploy the extracted source as-is: it still contains the old stack and needs migration and security fixes.
