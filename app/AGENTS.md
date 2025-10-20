# app — AGENTS.md

## Package Identity
- Next.js App Router UI and server routes.
- Hosts main page (`page.tsx`), layout, global styles, and API route `api/generate/route.ts`.

## Setup & Run
- Dev: `bun run dev`
- Build: `bun run build`
- Start (prod): `bun run start`
- Lint: `bun run lint`
- Typecheck: `bunx tsc -p tsconfig.json --noEmit`

## Patterns & Conventions
- ✅ Route handlers in `app/api/**/route.ts` exporting HTTP methods.
  - Example: `app/api/generate/route.ts` exports `POST` and returns `result.toTextStreamResponse()`.
- ✅ Validate inputs with Zod before processing.
  - Example: `generateApiRequestSchema` in `app/api/generate/route.ts`.
- ✅ Enforce file/req limits using shared constants.
  - Example: `MAX_FILE_SIZE` in `app/api/generate/route.ts`.
- ✅ Client components must declare `"use client"` at top.
  - Example: `app/page.tsx`.
- ✅ Stream handling on client: use ReadableStream reader + TextDecoder.
  - Example: streaming code in `app/page.tsx`.
- ✅ Use absolute imports (`@/lib/...`, `@/components/...`).
  - Example: `app/page.tsx` imports from `@/lib/schemas`.
- ❌ Don’t call AI providers directly from UI.
  - Instead of importing `@ai-sdk/gateway` in `app/page.tsx`, call `/api/generate`.
- ❌ Don’t place server logic in client components.
  - Keep model calls and validation in `app/api/generate/route.ts`.

## Touch Points / Key Files
- Main UI: `app/page.tsx`
- API route: `app/api/generate/route.ts`
- Layout: `app/layout.tsx`
- Global styles: `app/globals.css`

## JIT Index Hints
- Route handlers: `rg -n "export async function (GET|POST)" app/api`
- Client components: `rg -n '^"use client"' app`
- Streaming usage: `rg -n "getReader\\(|TextDecoder\\(" app/page.tsx`
- Schemas referenced in app: `rg -n "srtContentSchema|srtEntriesSchema" app`

## Common Gotchas
- `AI_GATEWAY_API_KEY` is needed locally if using gateway; never expose keys client-side.
- Respect `MAX_FILE_SIZE` or the route returns 413.
- Client-only code must include `"use client"` (e.g., components that use hooks).

## Pre-PR Checks
- `bunx tsc -p tsconfig.json --noEmit && bun run lint && bun run build`
