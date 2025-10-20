# App Directory - Next.js 15 App Router

**Technology**: Next.js 15 (App Router)
**Entry Point**: [app/layout.tsx](layout.tsx) (Root Layout), [app/page.tsx](page.tsx) (Home Page)
**Parent Context**: Extends [../CLAUDE.md](../CLAUDE.md)
**Related Documentation**: [AGENTS.md](AGENTS.md) for generic AI agent context

This directory contains Next.js App Router code: pages, layouts, API routes, and global styles.

---

## Development Commands

### From Root
```bash
bun run dev          # Start dev server with Turbopack (http://localhost:3000)
bun run build        # Production build + type check
bun run start        # Run production server (after build)
bunx tsc --noEmit    # Type check only
bun run lint         # ESLint
```

### Pre-PR Checklist
```bash
bunx tsc --noEmit && bun run lint && bun run build
```

### Manual Testing After Changes
1. Dev server renders: `bun run dev`
2. Open http://localhost:3000 and verify:
   - Page loads without console errors
   - Theme toggle works (light/dark mode)
   - File upload component renders
   - Responsive on mobile/tablet/desktop

---

## Architecture Overview

### Directory Structure
```
app/
├── layout.tsx              # Root layout (fonts, theme provider, global background)
├── page.tsx                # Home page (client component with upload + AI streaming)
├── globals.css             # Tailwind v4 + custom Ghibli animations
└── api/                    # API routes (see api/CLAUDE.md)
    └── generate/
        └── route.ts        # POST endpoint for AI timestamp generation
```

### File System Routing
- **Pages**: `app/page.tsx` → `/`
- **Layouts**: `app/layout.tsx` → Wraps all pages
- **API Routes**: `app/api/generate/route.ts` → `/api/generate`

### Server vs Client Components
- **Server Components** (default): No `"use client"` directive
  - Example: [layout.tsx:29-44](layout.tsx#L29-L44)
  - Can use async/await at top level
  - Cannot use hooks, event handlers, or browser APIs

- **Client Components**: Must declare `"use client"` at top of file
  - Example: [page.tsx:1](page.tsx#L1)
  - Can use React hooks (useState, useEffect, etc.)
  - Can handle user interactions (onClick, onChange, etc.)

---

## Code Organization Patterns

### 1. Root Layout Pattern

**File**: [layout.tsx](layout.tsx)

#### Purpose
- Defines HTML structure (`<html>`, `<body>`)
- Loads Google Fonts (Geist, Geist Mono, Doto)
- Wraps children with `ThemeProvider` for dark/light mode
- Adds global background (`GhibliBackground`)

#### Key Patterns
```tsx
// ✅ DO: Server component (no "use client")
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>  {/* suppressHydrationWarning for theme */}
      <body className={`${font.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GhibliBackground />  {/* Global animated background */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

#### Font Loading
```tsx
// ✅ DO: Load fonts in layout, expose as CSS variables
import { Geist, Geist_Mono, Doto } from "next/font/google"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

// Use in className
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
```

#### Metadata
```tsx
// ✅ DO: Export metadata object for SEO
export const metadata: Metadata = {
  title: "Vibestamps | Timestamp Generator for YouTube",
  description: "Upload a .srt file to generate meaningful timestamps",
}
```

**Reference**: See [layout.tsx:1-44](layout.tsx#L1-L44) for complete example

---

### 2. Client Component with State Management

**File**: [page.tsx](page.tsx)

#### Purpose
- Handle SRT file upload and parsing
- Manage UI state (loading, errors, results)
- Stream AI-generated timestamps from API

#### Key Patterns

##### State Management
```tsx
"use client"  // ✅ MUST: Declare at top when using hooks

import { useState } from "react"

export default function Home() {
  const [srtContent, setSrtContent] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>("")

  // ... rest of component
}
```

##### Zod Validation (Client-Side)
```tsx
// ✅ DO: Validate all user input with Zod before processing
import { srtContentSchema, srtEntriesSchema } from "@/lib/schemas"

const handleContentExtracted = (content: string, entries: SrtEntry[]) => {
  try {
    // Validate content
    const contentValidation = srtContentSchema.safeParse({ srtContent: content })
    if (!contentValidation.success) {
      setError(contentValidation.error.issues[0].message)
      return
    }

    // Validate entries
    const entriesValidation = srtEntriesSchema.safeParse(entries)
    if (!entriesValidation.success) {
      setError("Invalid SRT entries format")
      return
    }

    // Proceed with validated data
    setSrtContent(content)
    setSrtEntries(entries)
  } catch (err) {
    setError("Failed to validate SRT data")
  }
}
```

**Reference**: [page.tsx:24-49](page.tsx#L24-L49)

##### Streaming API Calls
```tsx
// ✅ DO: Use ReadableStream for AI streaming responses
const processWithAI = async () => {
  setIsProcessing(true)
  setError("")

  try {
    // Validate before sending to API
    const contentValidation = srtContentSchema.safeParse({ srtContent })
    if (!contentValidation.success) {
      throw new Error(contentValidation.error.issues[0].message)
    }

    // POST to API route
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ srtContent }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to generate timestamps")
    }

    // ✅ DO: Stream response with ReadableStream reader
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let result = ""

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        result += chunk
        setGeneratedContent(result)  // Update UI incrementally
      }
    }
  } catch (err) {
    console.error("Error generating timestamps:", err)
    setError(err instanceof Error ? err.message : "Failed to process file")
  } finally {
    setIsProcessing(false)
  }
}
```

**Reference**: [page.tsx:52-99](page.tsx#L52-L99)

##### Error Handling
```tsx
// ✅ DO: Show user-friendly error messages
{error && (
  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
    <p className="text-red-600 dark:text-red-400">{error}</p>
    <Button onClick={() => setError("")}>Dismiss</Button>
  </div>
)}
```

**Reference**: [page.tsx:216-243](page.tsx#L216-L243)

##### Conditional Rendering
```tsx
// ✅ DO: Show different UI states based on loading/data
{!isProcessing && !generatedContent && (
  <SrtUploader onContentExtracted={handleContentExtracted} />
)}

{(isProcessing || generatedContent) && (
  <TimestampResults isLoading={isProcessing} content={generatedContent} />
)}
```

**Reference**: [page.tsx:205-265](page.tsx#L205-L265)

---

### 3. Tailwind CSS v4 + Custom Animations

**File**: [globals.css](globals.css)

#### Purpose
- Import Tailwind CSS v4 (PostCSS plugin)
- Define CSS custom properties (design tokens)
- Create Ghibli-themed animations

#### Key Patterns

##### Tailwind Import
```css
/* ✅ DO: Import Tailwind at top */
@import "tailwindcss";
@import "tw-animate-css";  /* Additional animation utilities */
```

##### Dark Mode Variant
```css
/* ✅ DO: Define dark mode custom variant */
@custom-variant dark (&:is(.dark *));
```

##### Design Tokens (OKLch Color Space)
```css
/* ✅ DO: Use OKLch for modern color space with better perceptual uniformity */
:root {
  --background: oklch(1 0 0);            /* Pure white */
  --foreground: oklch(0.145 0 0);        /* Near black */
  --primary: oklch(0.205 0 0);           /* Dark gray */
  --destructive: oklch(0.577 0.245 27.325);  /* Red with chroma */
  /* ... more tokens */
}

.dark {
  --background: oklch(0.145 0 0);        /* Near black */
  --foreground: oklch(0.985 0 0);        /* Near white */
  /* ... inverted colors for dark mode */
}
```

**Reference**: [globals.css:46-113](globals.css#L46-L113)

##### Custom Animations (Ghibli Theme)
```css
/* ✅ DO: Define keyframes for custom animations */
@keyframes cloudMove {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100vw); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* ✅ DO: Create utility classes for animations */
.animate-cloud1 {
  animation: cloudMove 120s linear infinite;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
```

**Reference**: [globals.css:124-170](globals.css#L124-L170)

##### Usage in Components
```tsx
// ✅ DO: Use custom animation classes
<div className="animate-cloud1 opacity-60">
  {/* Cloud element */}
</div>

<div className="animate-float">
  {/* Floating element */}
</div>
```

---

## Key Files & Touch Points

### Core Files (Understand These First)

| File | Purpose | Key Exports/Patterns |
|------|---------|---------------------|
| [layout.tsx](layout.tsx) | Root layout, fonts, theme | `RootLayout`, `metadata`, font loading |
| [page.tsx](page.tsx) | Home page UI, state management | `Home`, streaming pattern, Zod validation |
| [globals.css](globals.css) | Global styles, design tokens | CSS variables, animations |

### Theme Management
- **Provider**: [layout.tsx:37](layout.tsx#L37) - `ThemeProvider` from `next-themes`
- **Toggle**: `components/ui/theme-toggle.tsx` - Theme switcher button
- **CSS Variables**: [globals.css:46-113](globals.css#L46-L113) - Light/dark tokens

### Font Management
- **Fonts Used**: Geist (sans), Geist Mono (monospace), Doto (display/headings)
- **Loading**: [layout.tsx:7-21](layout.tsx#L7-L21)
- **Usage**: Applied via CSS variables (`--font-geist-sans`, etc.)
- **Display Font**: [page.tsx:14](page.tsx#L14) - Doto used for "Vibestamps" heading

### State Management Pattern
- **Local State**: `useState` for component-specific state
- **No Global State**: Currently no Redux/Zustand (not needed for simple app)
- **Future**: Consider Zustand if state shared across multiple pages

---

## Quick Search Commands (JIT Index)

### Find Components
```bash
# Client components (use hooks/events)
rg -n '^"use client"' app

# Server components (no "use client" directive)
rg -n "^export default function" app --glob "!*page.tsx"

# Find pages
find app -name "page.tsx"
```

### Find API Routes
```bash
# Find route handlers
rg -n "export async function (GET|POST|PUT|DELETE)" app/api

# Find all API routes
find app/api -name "route.ts"
```

### Find Styles
```bash
# Find Tailwind usage
rg -n "className=" app | head -20

# Find custom animations
rg -n "animate-(cloud|float|ghibli)" app

# Find theme variables
rg -n "(--background|--foreground|--primary)" app/globals.css
```

### Find State Management
```bash
# useState hooks
rg -n "useState" app

# useEffect hooks
rg -n "useEffect" app

# Event handlers
rg -n "(onClick|onChange|onSubmit)" app
```

---

## Common Gotchas

### 1. Server vs Client Components
❌ **DON'T**: Use hooks in server components
```tsx
// ❌ WRONG: No "use client" but using useState
export default function Page() {
  const [state, setState] = useState("")  // Error!
  return <div>{state}</div>
}
```

✅ **DO**: Add `"use client"` directive
```tsx
// ✅ CORRECT
"use client"

export default function Page() {
  const [state, setState] = useState("")
  return <div>{state}</div>
}
```

### 2. Importing Server-Only Packages in Client Components
❌ **DON'T**: Import `@ai-sdk/*` in client components
```tsx
// ❌ WRONG: In page.tsx (client component)
"use client"
import { streamText } from "ai"  // Server-only package!
```

✅ **DO**: Keep server logic in API routes
```tsx
// ✅ CORRECT: In app/api/generate/route.ts
import { streamText } from "ai"  // Server component
export async function POST(request: Request) { /* ... */ }
```

### 3. Environment Variables
❌ **DON'T**: Use server-only env vars in client
```tsx
// ❌ WRONG: In page.tsx (client component)
const apiKey = process.env.GOOGLE_API_KEY  // undefined!
```

✅ **DO**: Access env vars only in server components/API routes
```tsx
// ✅ CORRECT: In app/api/generate/route.ts
const apiKey = process.env.GOOGLE_API_KEY  // Available
```

Client-side env vars **MUST** use `NEXT_PUBLIC_` prefix:
```tsx
// ✅ CORRECT: In page.tsx (if needed)
const publicVar = process.env.NEXT_PUBLIC_API_URL
```

### 4. Hydration Errors with Theme
Always add `suppressHydrationWarning` to `<html>` when using `next-themes`:
```tsx
// ✅ DO: Prevent hydration mismatch
<html lang="en" suppressHydrationWarning>
```

**Reference**: [layout.tsx:35](layout.tsx#L35)

### 5. Streaming Response Handling
❌ **DON'T**: Use `.json()` on streaming responses
```tsx
const response = await fetch("/api/generate")
const data = await response.json()  // ❌ Breaks streaming!
```

✅ **DO**: Use ReadableStream reader
```tsx
const response = await fetch("/api/generate")
const reader = response.body?.getReader()
// ... read chunks
```

**Reference**: [page.tsx:80-92](page.tsx#L80-L92)

### 6. Hardcoded Colors
❌ **DON'T**: Use hardcoded Tailwind colors
```tsx
<div className="bg-red-500 text-white">Error</div>
```

✅ **DO**: Use design tokens
```tsx
<div className="bg-destructive text-destructive-foreground">Error</div>
```

Or use CSS variables for custom needs:
```tsx
<div className="bg-[var(--background)] text-[var(--foreground)]">Content</div>
```

### 7. Absolute Imports
❌ **DON'T**: Use relative imports for cross-directory
```tsx
import { Button } from "../../components/ui/button"  // ❌ Hard to maintain
```

✅ **DO**: Use absolute imports with `@/` alias
```tsx
import { Button } from "@/components/ui/button"  // ✅ Clear and maintainable
```

---

## Testing Guidelines

### Current Status
⚠️ **No testing framework configured** - Manual testing only.

### Manual Testing Checklist (Run After Changes)

#### 1. Dev Server
```bash
bun run dev
# Open http://localhost:3000
# Verify: No console errors, page renders correctly
```

#### 2. Theme Toggle
- Click theme toggle button (bottom right)
- Verify: Dark mode ↔ Light mode transition smooth
- Check: All colors update correctly

#### 3. Responsive Design
- Test on: Desktop (1920x1080), Tablet (768px), Mobile (375px)
- Verify: Layout adapts, no horizontal scroll

#### 4. File Upload Flow
- Upload valid SRT file (< 430 KB)
- Verify: File parses, entry count shows
- Upload invalid file / oversized file
- Verify: Error message displays

#### 5. AI Generation
- Click "Generate Timestamps"
- Verify: Streaming starts immediately
- Check: Content appears line-by-line
- Verify: "Process Another File" button appears when done

### Future Testing (When Framework Added)
- **Component Tests**: Test `Home` component with mocked API
- **E2E Tests**: Full upload → generate flow with Playwright
- **Visual Regression**: Chromatic for theme variants

---

## Pre-PR Validation

### Automated Checks
```bash
bunx tsc --noEmit && bun run lint && bun run build
```

### Manual Verification
- [ ] Dev server runs without errors
- [ ] Theme toggle works (light/dark)
- [ ] File upload + validation works
- [ ] AI streaming displays correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors or warnings
- [ ] All new `"use client"` directives justified
- [ ] No server-only imports in client components

### Code Quality
- [ ] Absolute imports used (`@/`)
- [ ] Zod validation on all user inputs
- [ ] Error states handled gracefully
- [ ] Loading states shown during async operations
- [ ] No hardcoded colors (use design tokens)

---

## Next.js 15 Specific Features

### Turbopack (Dev Mode)
- Enabled by default: `bun run dev` uses Turbopack
- **Faster**: Hot reload significantly faster than Webpack
- **No Config**: Works out of the box

### Async Request APIs (New in 15)
```tsx
// ✅ NEW: Params are now async
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params  // Must await params
  return <div>ID: {id}</div>
}
```

### React 19 Support
- Using React 19 (see `package.json`)
- New hooks available: `useOptimistic`, `useFormStatus`, `use`
- Enhanced Server Actions support

---

## Related Documentation

- **API Routes**: See [api/CLAUDE.md](api/CLAUDE.md) for streaming, Gemini integration
- **Components**: See [../components/CLAUDE.md](../components/CLAUDE.md) for UI patterns
- **Utilities**: See [../lib/CLAUDE.md](../lib/CLAUDE.md) for Zod schemas, SRT parsing
- **Root Context**: See [../CLAUDE.md](../CLAUDE.md) for universal rules

---

## Quick Reference

- **Main Page**: [page.tsx](page.tsx) - Home UI, state management, streaming
- **Root Layout**: [layout.tsx](layout.tsx) - Fonts, theme, global wrappers
- **Global Styles**: [globals.css](globals.css) - Design tokens, animations
- **API Endpoint**: [api/generate/route.ts](api/generate/route.ts) - AI streaming (see api/CLAUDE.md)

**Next.js 15 Docs**: https://nextjs.org/docs
