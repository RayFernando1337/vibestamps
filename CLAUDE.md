# Vibestamps - AI-Powered Timestamp Generator

## Overview

**Type**: Next.js 15 Single Application
**Stack**: TypeScript + React 19 + Tailwind CSS v4 + Vercel AI SDK
**Package Manager**: Bun (exclusive)
**Deployment**: Vercel (vibestamps.com)
**LLM**: Google Gemini via @ai-sdk/gateway

Vibestamps transforms SRT subtitle files into meaningful timestamps using AI. This CLAUDE.md is the authoritative development guide for Claude Code. Subdirectories contain specialized CLAUDE.md files with detailed patterns.

**Related Documentation**: Existing [AGENTS.md](AGENTS.md) files provide additional context for generic AI agents.

---

## Universal Development Rules

### Code Quality (MUST)

- **MUST** use TypeScript in strict mode (no `any` without justification)
- **MUST** validate all user input with Zod schemas (client + server)
- **MUST** run pre-commit checks: `bunx tsc --noEmit && bun run lint && bun run build`
- **MUST NOT** commit secrets, API keys, or tokens to Git
- **MUST NOT** bypass TypeScript errors with `@ts-ignore` (fix the type)
- **MUST NOT** push directly to `main` branch (use PRs)

### Best Practices (SHOULD)

- **SHOULD** use absolute imports: `@/components`, `@/lib` (never relative for cross-directory)
- **SHOULD** keep functions under 50 lines (extract complex logic)
- **SHOULD** use functional React components with hooks (no class components)
- **SHOULD** stream AI responses using Vercel AI SDK's `streamText()`
- **SHOULD** co-locate tests with source files when testing is added

### Anti-Patterns (MUST NOT)

- **MUST NOT** use `@ai-sdk/gateway` or `@ai-sdk/google` in client components (server-only)
- **MUST NOT** hardcode colors/spacing (use Tailwind design tokens)
- **MUST NOT** edit `.env.local`, `bun.lock`, `.vercel/` without permission
- **MUST NOT** log sensitive data (API keys, user content, PII)

---

## Core Commands

### Development
```bash
bun run dev          # Start dev server with Turbopack
bun run build        # Production build + type check
bun run start        # Run production server
bun run lint         # ESLint all code
```

### Package Management
```bash
bun add <package>           # Add dependency
bun add -D <package>        # Add dev dependency
bun remove <package>        # Remove dependency
bunx --bun shadcn@latest add <component>  # Add shadcn/ui component
```

### Quality Gates (Run Before PR)
```bash
bunx tsc --noEmit && bun run lint && bun run build
```

### Common Git Workflows
```bash
# Feature branch workflow
git checkout -b feature/description
# ... make changes ...
git add .
git commit -m "feat: description"
git push -u origin feature/description

# Use gh CLI for PRs
gh pr create --title "Feature: description" --body "Summary of changes"
```

---

## Project Structure

```
timestamps-chill/
├── app/                    # Next.js App Router (see app/CLAUDE.md)
│   ├── api/generate/       # AI streaming endpoint (see app/api/CLAUDE.md)
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main UI (client component)
│   └── globals.css         # Tailwind v4 + custom animations
├── components/             # React components (see components/CLAUDE.md)
│   ├── ui/                 # shadcn/ui primitives (see components/ui/CLAUDE.md)
│   ├── SrtUploader.tsx     # File upload with validation
│   └── TimestampResults.tsx # Streaming results display
├── lib/                    # Utilities & schemas (see lib/CLAUDE.md)
│   ├── constants.ts        # MAX_FILE_SIZE = 430KB
│   ├── schemas.ts          # Zod validation schemas
│   ├── srt-parser.ts       # SRT parsing utilities
│   └── utils.ts            # cn() class merger
└── public/                 # Static assets
```

**Specialized Context**: When working in specific directories, refer to their CLAUDE.md for detailed patterns:
- Frontend/UI: [app/CLAUDE.md](app/CLAUDE.md), [components/CLAUDE.md](components/CLAUDE.md)
- API development: [app/api/CLAUDE.md](app/api/CLAUDE.md)
- Utilities: [lib/CLAUDE.md](lib/CLAUDE.md)
- UI components: [components/ui/CLAUDE.md](components/ui/CLAUDE.md)

---

## Quick Find Commands (JIT Index)

### Code Navigation
```bash
# Find component definitions
rg -n "^export (function|const) [A-Z]" components

# Find API routes
rg -n "export async function (GET|POST)" app/api

# Find Zod schemas
rg -n "(Schema|schema) = z\." lib

# Find client components
rg -n '^"use client"' app components

# Find all exports
rg -n "^export " app components lib
```

### Dependency Analysis
```bash
# Check why package is installed
bun pm ls <package-name>

# Find import usage
rg -n "from ['\"].*<package-name>" app components lib
```

---

## Security & Secrets

### Secrets Management
- **NEVER** commit tokens, API keys, or credentials
- Use `.env.local` for local secrets (already in .gitignore)
- Environment variables for CI/CD: Set in Vercel dashboard
- Client-side env vars MUST use `NEXT_PUBLIC_` prefix

### Current Secrets
- `GOOGLE_API_KEY` - Google Gemini API key (server-side only)
- `VERCEL_OIDC_TOKEN` - Vercel CLI auth (auto-generated)

### Safe Operations
- **Always confirm before**: `git push --force`, `bun remove`, `rm -rf`
- Review bash commands that modify multiple files
- Check diffs before committing: `git diff --staged`

---

## Git Workflow

### Branch Strategy
- Branch from `main`: `git checkout -b feature/description`
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- PRs require: passing type check, lint, build
- Squash commits on merge
- Delete branches after merge

### Commit Message Template
```
<type>: <subject>

<optional body>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `style`

---

## Testing Strategy

### Current Status
⚠️ **No testing framework configured** - This is a known gap.

### Manual Testing Checklist (Current Practice)
1. Dev server renders: `bun run dev` → Open http://localhost:3000
2. Upload SRT file → Verify parsing works
3. Click "Generate Timestamps" → Verify AI streaming works
4. Toggle dark/light theme → Verify styles correct
5. Test on mobile/tablet/desktop (responsive)

### Future Testing Plan
- **Unit tests**: Vitest for `lib/` utilities (SRT parsing, schemas)
- **Component tests**: React Testing Library for UI components
- **E2E tests**: Playwright for upload → generate flow
- **API tests**: Test `/api/generate` route

---

## Available Tools

### Claude Code Has Access To
✅ **Read**: All source files, configs, docs
✅ **Write**: Code files (`.ts`, `.tsx`), documentation
✅ **Bash**: `bun`, `git`, `gh`, `rg`, `find`, type checking

### MCP Servers Configured
- **Exa AI**: Web search and code context retrieval
- **Ref MCP**: Latest documentation references

### Requires Permission
⚠️ Edit: `.env.local`, `next.config.ts`, `package.json`, `bun.lock`
⚠️ Commands: `git push --force`, `bun remove`, destructive operations
⚠️ Deployment: Manual Vercel deployments, production env vars

### Blocked Operations
❌ Committing secrets to Git
❌ Disabling security features
❌ `rm -rf` without explicit confirmation
❌ Bypassing Git hooks (`--no-verify`)

---

## File Size Constraints

- **Max SRT Upload**: 430 KB (enforced in `lib/constants.ts`)
- **Validation**: Client-side (SrtUploader) + Server-side (/api/generate)
- **Reason**: Gemini API token limits + processing performance

---

## Custom Slash Commands

Claude Code-specific workflows (see `.claude/commands/`):

- `/review` - Comprehensive code review (conventions, security, accessibility)
- `/fix-issue` - Analyze and fix GitHub issue → PR workflow
- `/check-pr` - Pre-PR validation checklist
- `/add-component` - Add shadcn/ui component with documentation
- `/add-test` - Generate missing tests (when testing framework added)

---

## Pre-PR Checklist

Run this command:
```bash
bunx tsc --noEmit && bun run lint && bun run build
```

All checks must pass + manual testing complete before creating PR.

---

## Common Gotchas

1. **Environment Variables**: Client-side vars need `NEXT_PUBLIC_` prefix
2. **Absolute Imports**: Use `@/` for imports from root (configured in `tsconfig.json`)
3. **Server Components**: Default in Next.js 15 - add `"use client"` only when needed
4. **AI SDK Imports**: `@ai-sdk/*` packages are server-side only (API routes)
5. **Streaming**: Always handle loading states and errors in streaming UI
6. **File Uploads**: Check file size before parsing (430 KB max)

---

## Learn More

- Next.js 15: https://nextjs.org/docs
- Vercel AI SDK v5: https://sdk.vercel.ai/docs
- shadcn/ui: https://ui.shadcn.com/
- Tailwind CSS v4: https://tailwindcss.com/docs
- Zod: https://zod.dev/

For detailed patterns, see subdirectory CLAUDE.md files linked above.
