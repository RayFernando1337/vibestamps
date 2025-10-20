# Vibestamps — AGENTS.md (Root)

## Project Snapshot
- Simple Next.js 15 (App Router) + TypeScript project using Bun.
- Styling: Tailwind CSS v4; UI: shadcn/ui; State/UI utils in components/.
- AI: Vercel AI SDK + @ai-sdk/gateway (Google Gemini 2.5 Pro).
- Sub-folders have their own AGENTS.md for “nearest-wins” guidance.

## Root Setup Commands
- Install: `bun install`
- Dev: `bun run dev` (http://localhost:3000)
- Build: `bun run build`
- Start (prod): `bun run start`
- Lint: `bun run lint`
- Typecheck: `bunx tsc -p tsconfig.json --noEmit`
- Tests: not configured (none present)

## Universal Conventions
- TypeScript: strict mode enabled; noEmit true.
- ESLint: Next core-web-vitals + TypeScript (see eslint.config.mjs).
- Imports: use absolute paths via `@/*` (see tsconfig paths).
- Commits: Conventional Commits style recommended (e.g., chore:, feat:, fix:).
- Branching/PR: feature branches from main; open PRs with passing build, lint, typecheck.

## Security & Secrets
- Never commit API keys or `.env*` files (see .gitignore).
- Local secrets in `.env.local` (e.g., `GOOGLE_API_KEY`, optionally `AI_GATEWAY_API_KEY` for local gateway use).
- Client-visible envs must be prefixed with `NEXT_PUBLIC_` if needed client-side.

## JIT Index (what to open, not what to paste)

### Directory Map
- App (UI + routes): `app/` → see [app/AGENTS.md](app/AGENTS.md)
- Components (UI + feature): `components/` → see [components/AGENTS.md](components/AGENTS.md)
- Shared libs (schemas, parsers): `lib/` → see [lib/AGENTS.md](lib/AGENTS.md)
- Public assets: `public/`

### Quick Find Commands
- Search functions: `rg -n "export (async )?function|export const" app components lib`
- Find client components: `rg -n '^"use client"' app components`
- API route handlers: `rg -n "export async function (GET|POST)" app/api`
- Zod schemas usage: `rg -n "srtContentSchema|generateApiRequestSchema|srtEntriesSchema" app lib`
- SRT utilities: `rg -n "parseSrtContent|extractTextFromSrt|MAX_FILE_SIZE" lib components app`

## Definition of Done
- Build, lint, and typecheck succeed:
  - `bunx tsc -p tsconfig.json --noEmit && bun run lint && bun run build`
- Dev server renders main page and SRT upload works end-to-end.
- No secrets or `.env` files committed; streaming API responds without errors.
