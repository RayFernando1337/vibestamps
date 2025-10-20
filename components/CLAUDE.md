# Components - React UI Components

**Technology**: React 19 + TypeScript
**Entry Point**: Feature components in this directory, UI primitives in [ui/](ui/)
**Parent Context**: Extends [../CLAUDE.md](../CLAUDE.md)
**Related Documentation**: [AGENTS.md](AGENTS.md) for generic context

This directory contains React components: feature components (SrtUploader, TimestampResults) and UI primitives from shadcn/ui (see [ui/CLAUDE.md](ui/CLAUDE.md)).

---

## Development Commands

### From Root
```bash
bun run dev          # Start dev server
bunx tsc --noEmit    # Type check
bun run lint         # Lint
```

### Add shadcn/ui Component
```bash
bunx --bun shadcn@latest add <component-name>
# Example: bunx --bun shadcn@latest add dialog
```

---

## Architecture Overview

### Directory Structure
```
components/
├── SrtUploader.tsx          # File upload with drag-drop, validation
├── TimestampResults.tsx     # Streaming results display
├── magicui/                 # Visual effects (Particles, SparklesText)
│   ├── particles.tsx
│   └── sparkles-text.tsx
└── ui/                      # shadcn/ui primitives (see ui/CLAUDE.md)
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── progress.tsx
    ├── tooltip.tsx
    ├── theme-toggle.tsx
    └── ghibli-background.tsx
```

### Component Types
- **Feature Components**: Business logic (SrtUploader, TimestampResults)
- **UI Primitives**: Reusable UI from shadcn/ui (Button, Card, Input, etc.)
- **Visual Effects**: Animations and decorative elements (Particles, Sparkles)

---

## Code Organization Patterns

### 1. Feature Component Structure - SrtUploader

**File**: [SrtUploader.tsx](SrtUploader.tsx)

#### Purpose
- Accept SRT file via drag-drop or file input
- Validate file name, size, and content with Zod
- Parse SRT content into entries
- Auto-trigger AI generation after successful upload

#### Key Patterns

##### Props Interface (TypeScript)
```typescript
// ✅ DO: Define clear props interface
interface SrtUploaderProps {
  onContentExtracted: (content: string, entries: SrtEntry[]) => void  // Callback with parsed data
  onProcessFile: () => void                                           // Trigger AI generation
  disabled: boolean                                                   // Loading state
  entriesCount: number                                                // Display parsed entry count
  hasContent: boolean                                                 // Control UI state
}

export function SrtUploader({
  onContentExtracted,
  onProcessFile,
  disabled,
  entriesCount,
  hasContent,
}: SrtUploaderProps) {
  // Component logic
}
```

**Reference**: [SrtUploader.tsx:9-23](SrtUploader.tsx#L9-L23)

##### Local State Management
```typescript
// ✅ DO: Use useState for component-specific state
import { useState, useRef } from "react"

const [fileName, setFileName] = useState<string>("")    // Current file name
const [error, setError] = useState<string>("")          // Error message
const [isDragging, setIsDragging] = useState(false)     // Drag-drop state
const fileInputRef = useRef<HTMLInputElement>(null)     // File input reference
```

**Reference**: [SrtUploader.tsx:24-27](SrtUploader.tsx#L24-L27)

##### File Processing with Validation
```typescript
// ✅ DO: Multi-layer validation (size → name → content → parsing)
const processFile = async (file: File) => {
  setFileName(file.name)
  setError("")

  // 1. Check file size FIRST (before reading)
  if (file.size > MAX_FILE_SIZE) {
    setError(`File is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`)
    return
  }

  try {
    // 2. Validate file name with Zod
    const validationResult = srtFileSchema.safeParse({
      fileName: file.name,
      fileContent: "placeholder"
    })

    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message)
      return
    }

    // 3. Read file content
    const content = await file.text()

    // 4. Validate actual content
    const contentValidation = srtFileSchema.safeParse({
      fileName: file.name,
      fileContent: content
    })

    if (!contentValidation.success) {
      setError(contentValidation.error.issues[0].message)
      return
    }

    // 5. Parse SRT entries
    const entries = parseSrtContent(content)

    if (entries.length === 0) {
      setError("Could not parse any valid entries from the SRT file")
      return
    }

    // 6. Extract text and callback to parent
    const extractedText = extractTextFromSrt(entries)
    onContentExtracted(extractedText, entries)

    // 7. Auto-trigger processing after UI update
    setTimeout(() => {
      if (!disabled) {
        onProcessFile()
      }
    }, 500)

  } catch (err) {
    console.error("Error reading file:", err)
    setError("Failed to read the file. Please try again.")
  }
}
```

**Reference**: [SrtUploader.tsx:34-89](SrtUploader.tsx#L34-L89)

##### Drag-and-Drop Handlers
```typescript
// ✅ DO: Handle drag events for better UX
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault()                // Required to allow drop
  setIsDragging(true)
}

const handleDragLeave = () => {
  setIsDragging(false)
}

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragging(false)

  const file = e.dataTransfer.files?.[0]
  if (file) processFile(file)
}

// Use in JSX
<Card
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
```

**Reference**: [SrtUploader.tsx:91-106](SrtUploader.tsx#L91-L106)

##### Conditional Rendering
```typescript
// ✅ DO: Show different UI based on state
{!hasContent && (
  // Show upload button
  <Button onClick={triggerFileInput}>Select SRT File</Button>
)}

{hasContent && !disabled && (
  // Show "Generate Timestamps" button
  <Button onClick={onProcessFile}>Generate Timestamps</Button>
)}

{error && (
  // Show error message
  <div className="bg-rose-50 dark:bg-rose-900/20">{error}</div>
)}
```

**Reference**: [SrtUploader.tsx:124-247](SrtUploader.tsx#L124-L247)

---

### 2. Feature Component Structure - TimestampResults

**File**: [TimestampResults.tsx](TimestampResults.tsx)

#### Purpose
- Display AI-generated timestamps with streaming support
- Show loading progress during generation
- Parse streaming content line-by-line with animation
- Provide copy-to-clipboard functionality

#### Key Patterns

##### Props Interface
```typescript
// ✅ DO: Simple props for controlled component
interface TimestampResultsProps {
  isLoading: boolean    // Show loading state
  content: string       // Streaming content (updated incrementally)
}

export function TimestampResults({ isLoading, content }: TimestampResultsProps) {
  // Component logic
}
```

**Reference**: [TimestampResults.tsx:7-12](TimestampResults.tsx#L7-L12)

##### Progress Simulation
```typescript
// ✅ DO: Simulate progress while loading (smooth UX)
const [progress, setProgress] = useState(0)

useEffect(() => {
  if (isLoading) {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Keep progress between 0-95% while loading
        const newValue = prev + Math.random() * 15
        return Math.min(newValue, 95)
      })
    }, 200)

    return () => clearInterval(interval)  // ✅ Cleanup on unmount
  } else if (content) {
    // Set to 100% when complete
    setProgress(100)
  }
}, [isLoading, content])
```

**Reference**: [TimestampResults.tsx:19-38](TimestampResults.tsx#L19-L38)

##### Streaming Content Parsing
```typescript
// ✅ DO: Parse streaming content incrementally
const [parsedSections, setParsedSections] = useState<{ timestamp: string; isNew?: boolean }[]>([])
const prevContentRef = useRef<string>("")  // Track previous content

useEffect(() => {
  const parseLines = (text: string) => {
    if (!text) return []

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    // Find header line
    const contentStartIndex = lines.findIndex(
      (line) => line === "🕒 Key Moments:" || line === "🕒 Key moments:"
    )

    const contentLines = contentStartIndex >= 0
      ? lines.slice(contentStartIndex + 1)
      : lines

    // Match timestamp format: MM:SS or HH:MM:SS followed by description
    return contentLines
      .filter((line) => /^(\d{1,2}:\d{2}(:\d{2})?\s+)/.test(line))
      .map((line) => ({ timestamp: line }))
  }

  // If new content arrived
  if (content !== prevContentRef.current) {
    const currentLines = parseLines(content)
    const previousLines = parseLines(prevContentRef.current)

    // Mark new lines for animation
    if (currentLines.length > previousLines.length) {
      const newSections = currentLines.map((line, index) => ({
        ...line,
        isNew: index >= previousLines.length  // Mark newly added lines
      }))

      setParsedSections(newSections)

      // Remove "new" flag after animation
      if (newSections.some((s) => s.isNew)) {
        const timer = setTimeout(() => {
          setParsedSections((prev) =>
            prev.map((section) => ({ ...section, isNew: false }))
          )
        }, 1000)
        return () => clearTimeout(timer)
      }
    }

    prevContentRef.current = content
  }
}, [content])
```

**Reference**: [TimestampResults.tsx:40-98](TimestampResults.tsx#L40-L98)

##### Copy to Clipboard
```typescript
// ✅ DO: Use navigator.clipboard API
const copyToClipboard = () => {
  const timestampsText = parsedSections
    .map((section) => section.timestamp)
    .join("\n")

  navigator.clipboard.writeText(timestampsText)
}

// Use in JSX
<Button onClick={copyToClipboard}>Copy All</Button>
```

**Reference**: [TimestampResults.tsx:100-104](TimestampResults.tsx#L100-L104)

##### Animated List Rendering
```typescript
// ✅ DO: Animate new items as they stream in
{parsedSections.map((section, index) => {
  const [timePart, ...descriptionParts] = section.timestamp.split(/\s+/)
  const description = descriptionParts.join(" ")

  return (
    <div
      key={index}
      className={`py-3 ${
        section.isNew
          ? "animate-in slide-in-from-right-5 fade-in duration-300"
          : ""
      }`}
      style={
        section.isNew
          ? {
              animationDelay: `${index * 100}ms`,  // Stagger animation
              backgroundColor: "rgba(16,185,129,0.07)",
              transition: "background-color 1s ease-out"
            }
          : undefined
      }
    >
      <span className="text-emerald-600">{timePart}</span>
      <span className="text-slate-700">{description}</span>
    </div>
  )
})}
```

**Reference**: [TimestampResults.tsx:156-226](TimestampResults.tsx#L156-L226)

---

## Component Composition Patterns

### 1. Using shadcn/ui Primitives
```typescript
// ✅ DO: Import and compose shadcn components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

// Use in component
<Card>
  <CardHeader>
    <Button variant="outline">Click Me</Button>
  </CardHeader>
  <CardContent>
    <Input type="text" />
  </CardContent>
</Card>
```

### 2. Event Handlers
```typescript
// ✅ DO: Type event handlers properly
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (file) processFile(file)
}

const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault()
  // Handle click
}

const handleDrop = (event: React.DragEvent) => {
  event.preventDefault()
  // Handle drop
}
```

### 3. Refs for DOM Access
```typescript
// ✅ DO: Use useRef for DOM element access
import { useRef } from "react"

const fileInputRef = useRef<HTMLInputElement>(null)

const triggerFileInput = () => {
  fileInputRef.current?.click()  // ✅ Programmatic click
}

// In JSX
<Input ref={fileInputRef} type="file" className="hidden" />
```

---

## Styling Patterns

### 1. Conditional Classes (Tailwind)
```typescript
// ✅ DO: Use template literals for dynamic classes
<Card
  className={
    isDragging
      ? "border-2 border-sky-400 bg-sky-50"
      : "border border-gray-200 hover:border-sky-200"
  }
>
```

### 2. Responsive Classes
```typescript
// ✅ DO: Use Tailwind responsive breakpoints
<div className="w-full max-w-2xl p-4 md:p-6 lg:p-8">
  <h2 className="text-xl md:text-2xl lg:text-3xl">Title</h2>
</div>
```

### 3. Dark Mode Support
```typescript
// ✅ DO: Use dark: prefix for dark mode styles
<div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
  <p className="text-sky-700 dark:text-sky-300">Description</p>
</div>
```

### 4. Animations (Tailwind + Custom)
```typescript
// ✅ DO: Use built-in Tailwind animations
<div className="animate-pulse">Loading...</div>
<div className="animate-in fade-in duration-300">Fade in</div>
<div className="animate-in slide-in-from-right-5">Slide in</div>

// ✅ DO: Use custom animations from globals.css
<div className="animate-float">Floating element</div>
<div className="animate-cloud1">Moving cloud</div>
```

---

## Common Gotchas

### 1. Client Components
❌ **DON'T**: Forget `"use client"` directive
```typescript
// ❌ WRONG: No directive but using hooks
import { useState } from "react"

export function MyComponent() {
  const [state, setState] = useState("")  // Error!
  return <div>{state}</div>
}
```

✅ **DO**: Add directive at top
```typescript
// ✅ CORRECT
"use client"

import { useState } from "react"

export function MyComponent() {
  const [state, setState] = useState("")
  return <div>{state}</div>
}
```

### 2. Props Destructuring
❌ **DON'T**: Use props without destructuring (verbose)
```typescript
export function MyComponent(props: MyProps) {
  return <div>{props.title} {props.description}</div>
}
```

✅ **DO**: Destructure props in function signature
```typescript
export function MyComponent({ title, description }: MyProps) {
  return <div>{title} {description}</div>
}
```

### 3. Event Handler Types
❌ **DON'T**: Use generic Event type
```typescript
const handleClick = (e: Event) => { /* ... */ }  // ❌ Wrong type
```

✅ **DO**: Use React-specific event types
```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { /* ... */ }
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ }
const handleDrop = (e: React.DragEvent) => { /* ... */ }
```

### 4. useEffect Cleanup
❌ **DON'T**: Forget to cleanup intervals/timeouts
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setProgress((prev) => prev + 10)
  }, 1000)
  // ❌ Missing cleanup - memory leak!
}, [])
```

✅ **DO**: Return cleanup function
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setProgress((prev) => prev + 10)
  }, 1000)

  return () => clearInterval(interval)  // ✅ Cleanup
}, [])
```

### 5. Async Event Handlers
❌ **DON'T**: Make event handler async without handling errors
```typescript
const handleClick = async (e: React.MouseEvent) => {
  await fetch("/api/data")  // ❌ Unhandled promise rejection
}
```

✅ **DO**: Wrap in try-catch
```typescript
const handleClick = async (e: React.MouseEvent) => {
  try {
    await fetch("/api/data")
  } catch (error) {
    console.error("Error:", error)
    setError("Failed to fetch data")
  }
}
```

---

## Testing Guidelines

### Current Status
⚠️ **No testing framework configured** - Manual testing only.

### Manual Testing Checklist

#### SrtUploader
- [ ] Click "Select SRT File" → file picker opens
- [ ] Drag-drop SRT file → file processed
- [ ] Upload oversized file → error message shown
- [ ] Upload non-SRT file → error message shown
- [ ] Valid file upload → "Generate Timestamps" button appears
- [ ] Click "Generate" → triggers processing

#### TimestampResults
- [ ] Loading state → progress bar animates
- [ ] Streaming content → timestamps appear line-by-line
- [ ] Completed state → "Copy All" button visible
- [ ] Click "Copy All" → content copied to clipboard
- [ ] Hover timestamp → copy button appears

### Future Testing (Component Tests)
```typescript
// tests/components/SrtUploader.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { SrtUploader } from "@/components/SrtUploader"

describe("SrtUploader", () => {
  it("should render upload button", () => {
    render(<SrtUploader {...mockProps} />)
    expect(screen.getByText(/select srt file/i)).toBeInTheDocument()
  })

  it("should show error for oversized file", async () => {
    const { getByLabelText } = render(<SrtUploader {...mockProps} />)
    const file = new File(["a".repeat(500 * 1024)], "large.srt")
    const input = getByLabelText(/upload/i)

    await fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText(/file is too large/i)).toBeInTheDocument()
  })
})
```

---

## Quick Search Commands (JIT Index)

### Find Components
```bash
# Find all component exports
rg -n "^export (function|const) [A-Z]" components

# Find client components
rg -n '^"use client"' components

# Find props interfaces
rg -n "^interface.*Props" components
```

### Find Hooks Usage
```bash
# useState hooks
rg -n "useState" components

# useEffect hooks
rg -n "useEffect" components

# useRef hooks
rg -n "useRef" components
```

### Find Event Handlers
```bash
# Click handlers
rg -n "onClick=" components

# Change handlers
rg -n "onChange=" components

# Drag-drop handlers
rg -n "(onDragOver|onDrop)" components
```

---

## Related Documentation

- **shadcn/ui Components**: See [ui/CLAUDE.md](ui/CLAUDE.md)
- **App Router Integration**: See [../app/CLAUDE.md](../app/CLAUDE.md)
- **Utilities**: See [../lib/CLAUDE.md](../lib/CLAUDE.md) for schemas, parsing
- **Root Context**: See [../CLAUDE.md](../CLAUDE.md)

---

## Quick Reference

- **Feature Components**: [SrtUploader.tsx](SrtUploader.tsx), [TimestampResults.tsx](TimestampResults.tsx)
- **UI Primitives**: [ui/](ui/) directory (shadcn/ui)
- **Visual Effects**: [magicui/](magicui/) directory
- **Component Docs**: https://ui.shadcn.com/docs/components/
