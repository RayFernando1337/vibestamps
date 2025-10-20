# lib — AGENTS.md

## Package Identity
- Shared utilities: constants, Zod schemas, SRT parsing helpers, and CSS utils (cn).

## Setup & Run
- Reuse root commands:
  - Typecheck: `bunx tsc -p tsconfig.json --noEmit`
  - Lint/Build via root scripts

## Patterns & Conventions
- ✅ Keep utilities pure and framework-agnostic.
  - Example: `lib/srt-parser.ts` (no side effects)
- ✅ Centralize limits and shared values in constants.
  - Example: `lib/constants.ts` with `MAX_FILE_SIZE`
- ✅ Validate at the edges with Zod schemas.
  - Example: `lib/schemas.ts` (srtEntrySchema, srtContentSchema, srtEntriesSchema, generateApiRequestSchema)
- ✅ Prefer reusable parsing helpers and structured types.
  - Example: `parseSrtContent`, `extractTextFromSrt` in `lib/srt-parser.ts`
- ✅ Merge classes via `cn` to keep Tailwind manageable.
  - Example: `lib/utils.ts`
- ❌ Don’t redefine constants in components; import from `lib/constants.ts`.
- ❌ Don’t bypass validation in routes/UI; use `lib/schemas.ts`.

## Touch Points / Key Files
- Limits: `lib/constants.ts`
- Schemas: `lib/schemas.ts`
- SRT utilities: `lib/srt-parser.ts`
- CSS utilities: `lib/utils.ts`

## JIT Index Hints
- Find schemas: `rg -n "export const .*Schema" lib/schemas.ts`
- SRT helpers: `rg -n "parseSrtContent|extractTextFromSrt|formatTimestamp" lib/srt-parser.ts`
- Constants usage: `rg -n "MAX_FILE_SIZE" app lib components`

## Common Gotchas
- `MAX_FILE_SIZE` is in bytes; compare to file sizes and string lengths appropriately.
- SRT timestamps pattern must match `HH:MM:SS,mmm` for parsing; keep regex in sync with route/client logic.

## Pre-PR Checks
- `bunx tsc -p tsconfig.json --noEmit && bun run lint && bun run build`
