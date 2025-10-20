# Vibestamps - AI-Powered Timestamp Generator

## Overview

**Type**: Next.js 15 Single Application
**Stack**: TypeScript + React 19 + Tailwind CSS v4 + Vercel AI SDK
**Package Manager**: Bun (exclusive)
**Deployment**: Vercel (vibestamps.com)
**LLM**: Google Gemini via @ai-sdk/gateway

Vibestamps transforms SRT subtitle files into meaningful timestamps using AI. This CLAUDE.md is the **root authoritative guide** for Claude Code development.

### Documentation System

This project uses a **hierarchical CLAUDE.md system** optimized for Claude Code:

```
📦 Vibestamps CLAUDE.md System (3,779 lines)
│
├── 📄 CLAUDE.md (Root) ← YOU ARE HERE (492 lines)
│   └── Purpose: Universal rules, quick navigation, security
│
├── 📁 app/
│   ├── 📄 CLAUDE.md (642 lines)
│   │   └── Purpose: Next.js App Router, server/client components
│   └── 📁 api/
│       └── 📄 CLAUDE.md (690 lines)
│           └── Purpose: API routes, AI streaming, Gemini integration
│
├── 📁 components/
│   ├── 📄 CLAUDE.md (696 lines)
│   │   └── Purpose: React patterns, hooks, state management
│   └── 📁 ui/
│       └── 📄 CLAUDE.md (589 lines)
│           └── Purpose: shadcn/ui, variants, dark mode
│
└── 📁 lib/
    └── 📄 CLAUDE.md (670 lines)
        └── Purpose: Zod schemas, SRT parsing, utilities
```

**Quick Links**:
- [app/CLAUDE.md](app/CLAUDE.md) - Next.js App Router patterns (642 lines)
- [app/api/CLAUDE.md](app/api/CLAUDE.md) - API routes & AI streaming (690 lines)
- [components/CLAUDE.md](components/CLAUDE.md) - React component patterns (696 lines)
- [components/ui/CLAUDE.md](components/ui/CLAUDE.md) - shadcn/ui system (589 lines)
- [lib/CLAUDE.md](lib/CLAUDE.md) - Utilities & validation (670 lines)

**Total Documentation**: **3,779 lines** across 6 CLAUDE.md files + 5 custom slash commands + hooks configuration

**Related Documentation**: Existing [AGENTS.md](AGENTS.md) files (4 files) provide additional context for generic AI agents. This creates a **parallel system** - CLAUDE.md for Claude Code, AGENTS.md for other tools.

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
├── CLAUDE.md               # THIS FILE - Universal rules & navigation
├── app/
│   ├── CLAUDE.md          # Next.js App Router patterns (370 lines)
│   ├── api/
│   │   ├── CLAUDE.md      # API routes & AI streaming (350 lines)
│   │   └── generate/route.ts
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main UI (client component)
│   └── globals.css         # Tailwind v4 + custom animations
├── components/
│   ├── CLAUDE.md          # React component patterns (380 lines)
│   ├── ui/
│   │   ├── CLAUDE.md      # shadcn/ui system (300 lines)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── SrtUploader.tsx     # File upload with validation
│   └── TimestampResults.tsx # Streaming results display
├── lib/
│   ├── CLAUDE.md          # Utilities & validation (390 lines)
│   ├── constants.ts        # MAX_FILE_SIZE = 430KB
│   ├── schemas.ts          # Zod validation schemas
│   ├── srt-parser.ts       # SRT parsing utilities
│   └── utils.ts            # cn() class merger
├── .claude/
│   ├── settings.json       # Hooks configuration
│   └── commands/           # Custom slash commands (/review, /fix-issue, etc.)
└── public/                 # Static assets
```

---

## CLAUDE.md Hierarchy (Read These for Context)

Claude Code reads CLAUDE.md files hierarchically - each subdirectory provides specialized context:

### 1. **Root** - [CLAUDE.md](CLAUDE.md) ← YOU ARE HERE
**Lines**: ~280 (concise)
**Purpose**: Universal rules, project overview, quick navigation
**When to read**: Always (starting point for all tasks)

### 2. **App Directory** - [app/CLAUDE.md](app/CLAUDE.md)
**Lines**: ~370 (comprehensive)
**Purpose**: Next.js 15 App Router, server vs client components, streaming patterns
**When to read**: Working on pages, layouts, or understanding Next.js patterns
**Key topics**:
- Server vs Client Components
- Streaming API responses
- Theme management
- Font loading

### 3. **API Routes** - [app/api/CLAUDE.md](app/api/CLAUDE.md)
**Lines**: ~350 (comprehensive)
**Purpose**: API route handlers, Vercel AI SDK, Gemini integration, validation
**When to read**: Creating/modifying API endpoints, AI model integration
**Key topics**:
- Zod validation in API routes
- Streaming with Vercel AI SDK
- Request/response patterns
- Error handling with proper status codes

### 4. **Components** - [components/CLAUDE.md](components/CLAUDE.md)
**Lines**: ~380 (comprehensive)
**Purpose**: React component patterns, hooks, event handlers, state management
**When to read**: Building or modifying React components
**Key topics**:
- Feature components (SrtUploader, TimestampResults)
- Props interfaces & TypeScript
- Event handler patterns
- Streaming content parsing

### 5. **UI Primitives** - [components/ui/CLAUDE.md](components/ui/CLAUDE.md)
**Lines**: ~300 (comprehensive)
**Purpose**: shadcn/ui component system, variants, customization, dark mode
**When to read**: Adding shadcn components, customizing UI primitives
**Key topics**:
- CVA variant system
- Adding new shadcn components
- Dark mode support
- Design tokens & CSS variables

### 6. **Utilities** - [lib/CLAUDE.md](lib/CLAUDE.md)
**Lines**: ~390 (comprehensive)
**Purpose**: Zod schemas, SRT parsing, constants, utility functions
**When to read**: Validation, parsing SRT files, using utilities
**Key topics**:
- All Zod schemas (5 schemas documented)
- SRT parsing functions
- Constants management
- cn() utility for class merging

---

## How to Navigate This System

### Quick Task-Based Navigation

| Task | Read These CLAUDE.md Files |
|------|---------------------------|
| **Add new page/route** | Root → [app/CLAUDE.md](app/CLAUDE.md) |
| **Create API endpoint** | Root → [app/CLAUDE.md](app/CLAUDE.md) → [app/api/CLAUDE.md](app/api/CLAUDE.md) |
| **Build React component** | Root → [components/CLAUDE.md](components/CLAUDE.md) |
| **Add shadcn component** | Root → [components/ui/CLAUDE.md](components/ui/CLAUDE.md) |
| **Add validation schema** | Root → [lib/CLAUDE.md](lib/CLAUDE.md) |
| **Parse SRT files** | Root → [lib/CLAUDE.md](lib/CLAUDE.md) |
| **Understand full stack** | Read all 6 CLAUDE.md files in order |

### Context Inheritance

When working in a subdirectory, Claude Code reads CLAUDE.md files from CWD up to root:

```
Example: Working in app/api/generate/
  ↓
Read: app/api/CLAUDE.md (API patterns)
  ↓
Read: app/CLAUDE.md (Next.js patterns)
  ↓
Read: CLAUDE.md (Universal rules) ← ROOT
  ↓
Apply: All rules hierarchically
```

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

---

## Complete CLAUDE.md File Map

This project has **6 CLAUDE.md files** forming a hierarchical documentation system:

### Root Level
📄 [CLAUDE.md](CLAUDE.md) ← **YOU ARE HERE**
- **Size**: 492 lines (comprehensive quick reference)
- **Purpose**: Universal rules, quick navigation, project overview
- **Always read this first**

### App Directory
📄 [app/CLAUDE.md](app/CLAUDE.md)
- **Size**: 642 lines (comprehensive)
- **Purpose**: Next.js 15 patterns, routing, streaming
- **Covers**: Server/client components, layouts, pages, theme management

📄 [app/api/CLAUDE.md](app/api/CLAUDE.md)
- **Size**: 690 lines (comprehensive)
- **Purpose**: API routes, AI integration, validation
- **Covers**: Vercel AI SDK, Gemini streaming, request/response patterns

### Components Directory
📄 [components/CLAUDE.md](components/CLAUDE.md)
- **Size**: 696 lines (comprehensive)
- **Purpose**: React component architecture
- **Covers**: Feature components, hooks, state management, event handlers

📄 [components/ui/CLAUDE.md](components/ui/CLAUDE.md)
- **Size**: 589 lines (comprehensive)
- **Purpose**: shadcn/ui component system
- **Covers**: UI primitives, variants, dark mode, customization

### Lib Directory
📄 [lib/CLAUDE.md](lib/CLAUDE.md)
- **Size**: 670 lines (comprehensive)
- **Purpose**: Utilities, validation, parsing
- **Covers**: Zod schemas, SRT parsing, constants, utility functions

---

## Custom Slash Commands

Located in `.claude/commands/` directory:

1. `/review` - Comprehensive code review checklist
2. `/fix-issue <number>` - Analyze and fix GitHub issue
3. `/check-pr` - Pre-PR validation checklist
4. `/add-component <name>` - Add shadcn/ui component
5. `/add-test <name>` - Generate tests (template for future)

---

## Hooks Configuration

Located in `.claude/settings.json`:

- ✅ **PreToolUse**: Block dangerous commands (`rm -rf`, `git push --force`)
- ✅ **PreToolUse**: Protect sensitive files (`.env.local`, `bun.lock`)
- ✅ **PostToolUse**: Type check TypeScript files after edits
- ✅ **UserPromptSubmit**: Pre-PR reminder

---

## Documentation Statistics

| Metric | Count |
|--------|-------|
| **CLAUDE.md files** | 6 |
| **Total lines** | 3,779 |
| **Root CLAUDE.md** | 492 lines |
| **Largest file** | components/CLAUDE.md (696 lines) |
| **Custom commands** | 5 |
| **Hooks configured** | 4 |
| **AGENTS.md files** | 4 (parallel system) |

**System Health**: ✅ All documentation files properly linked and cross-referenced

**Coverage**: Every major directory has comprehensive CLAUDE.md documentation with real code examples
