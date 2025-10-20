# components — AGENTS.md

## Package Identity
- Feature components and UI primitives (shadcn-style) used by the app.
- Subfolders:
  - `components/ui/*`: primitives (Button, Card, Input, Progress, Tooltip, ThemeToggle)
  - `components/magicui/*`: visual effects
  - Feature: `SrtUploader.tsx`, `TimestampResults.tsx`

## Setup & Run
- Reuse root commands (no separate build):  
  - Dev: `bun run dev` | Build: `bun run build` | Lint: `bun run lint` | Typecheck: `bunx tsc -p tsconfig.json --noEmit`

## Patterns & Conventions
- ✅ Functional components with typed props.
  - Example: `components/SrtUploader.tsx`, `components/TimestampResults.tsx`
- ✅ Use `cn` from `@/lib/utils` for class merging.
  - Example: `components/ui/button.tsx`, `components/ui/card.tsx`
- ✅ Prefer absolute imports (`@/lib/...`, `@/components/...`).
  - Example: `components/ui/tooltip.tsx`
- ✅ UI primitives live under `components/ui/*`.
  - Examples: `components/ui/button.tsx`, `components/ui/progress.tsx`, `components/ui/tooltip.tsx`
- ✅ Input validation close to boundaries (e.g., file validation in uploader).
  - Example: `components/SrtUploader.tsx` uses Zod and `MAX_FILE_SIZE`.
- ✅ Display streamed results incrementally and clearly.
  - Example: `components/TimestampResults.tsx` parses and highlights new lines.
- ❌ Don’t import server-only modules (e.g., `@ai-sdk/gateway`) in components.
  - Keep server logic in `app/api/**/route.ts`.
- ❌ Don’t use relative imports to shared libs (e.g., `../lib/utils`); use `@/lib/utils`.

## Touch Points / Key Files
- Upload flow: `components/SrtUploader.tsx`
- Streaming display: `components/TimestampResults.tsx`
- UI primitives: `components/ui/*.tsx`
- Visuals: `components/magicui/*`

## JIT Index Hints
- Find exported components: `rg -n "export (default )?function|export const .* = \(" components`
- UI primitives: `rg -n "" components/ui/*.tsx`
- Find uploader/stream results: `rg -n "SrtUploader|TimestampResults" components`

## Common Gotchas
- Theme toggle relies on `next-themes` and mount guard (`mounted`): see `components/ui/theme-toggle.tsx`.
- Tooltip/Progress are client components (`"use client"`). Ensure correct usage in server vs client contexts.

## Pre-PR Checks
- `bunx tsc -p tsconfig.json --noEmit && bun run lint && bun run build`
