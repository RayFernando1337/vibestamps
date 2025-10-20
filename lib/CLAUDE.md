# Lib - Shared Utilities & Helpers

**Technology**: TypeScript + Zod
**Entry Point**: Individual utility files in this directory
**Parent Context**: Extends [../CLAUDE.md](../CLAUDE.md)
**Related Documentation**: [AGENTS.md](AGENTS.md) for generic context

This directory contains framework-agnostic utilities: Zod validation schemas, SRT parsing, constants, and helper functions.

---

## Development Commands

### Type Checking
```bash
bunx tsc --noEmit    # Type check all utilities
bun run lint         # Lint utilities
```

### Testing (Future)
```bash
# When testing is added
bun test lib/        # Test all utilities
```

---

## Architecture Overview

### Directory Structure
```
lib/
├── schemas.ts       # Zod validation schemas
├── srt-parser.ts    # SRT file parsing utilities
├── constants.ts     # Application-wide constants
└── utils.ts         # General utility functions (cn)
```

### Design Principles
- **Pure Functions**: No side effects, predictable outputs
- **Framework-Agnostic**: Can be used in client, server, or tests
- **Type-Safe**: Full TypeScript support
- **Validation First**: Zod schemas for all data

---

## File-by-File Breakdown

### 1. schemas.ts - Zod Validation Schemas

**File**: [schemas.ts](schemas.ts)

#### Purpose
Define Zod schemas for validating:
- SRT file uploads (name, size, content)
- SRT content and entries
- API request payloads

#### Available Schemas

##### 1.1. `srtEntrySchema` - Individual SRT Entry
```typescript
import { z } from "zod"

export const srtEntrySchema = z.object({
  id: z.number(),           // Entry ID (1, 2, 3, ...)
  startTime: z.string(),    // Start timestamp (HH:MM:SS,mmm)
  endTime: z.string(),      // End timestamp (HH:MM:SS,mmm)
  text: z.string(),         // Subtitle text
})

// Type inference
type SrtEntry = z.infer<typeof srtEntrySchema>
```

**Reference**: [schemas.ts:5-10](schemas.ts#L5-L10)

##### 1.2. `srtContentSchema` - SRT Content Validation
```typescript
export const srtContentSchema = z.object({
  srtContent: z
    .string()
    .min(1, "SRT content is required")
    .max(MAX_FILE_SIZE, `SRT content is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`)
})
```

**Use Case**: Validate SRT content before sending to API

**Reference**: [schemas.ts:13-18](schemas.ts#L13-L18)

##### 1.3. `srtFileSchema` - File Upload Validation
```typescript
export const srtFileSchema = z.object({
  fileName: z.string().endsWith(".srt", "File must be an .srt file"),
  fileContent: z
    .string()
    .min(1, "File content is required")
    .max(MAX_FILE_SIZE, `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`)
})
```

**Use Case**: Validate file uploads client-side

**Reference**: [schemas.ts:21-27](schemas.ts#L21-L27)

##### 1.4. `generateApiRequestSchema` - API Request Validation
```typescript
export const generateApiRequestSchema = z.object({
  srtContent: z
    .string()
    .min(1, "SRT content is required")
    .max(MAX_FILE_SIZE, `SRT content is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`)
})
```

**Use Case**: Validate request body in `/api/generate` route

**Reference**: [schemas.ts:30-35](schemas.ts#L30-L35)

##### 1.5. `srtEntriesSchema` - Array of SRT Entries
```typescript
export const srtEntriesSchema = z.array(srtEntrySchema)

// Type inference
type SrtEntries = z.infer<typeof srtEntriesSchema>  // SrtEntry[]
```

**Use Case**: Validate parsed SRT entries

**Reference**: [schemas.ts:38](schemas.ts#L38)

#### Usage Patterns

##### Safe Validation (Preferred)
```typescript
import { srtContentSchema } from "@/lib/schemas"

// ✅ DO: Use .safeParse() for validation without throwing
const result = srtContentSchema.safeParse({ srtContent: "..." })

if (result.success) {
  const validData = result.data  // Type-safe!
  console.log(validData.srtContent)
} else {
  const errorMessage = result.error.issues[0].message
  console.error(errorMessage)
}
```

##### Throwing Validation (Use with Caution)
```typescript
// ⚠️ CAUTION: .parse() throws ZodError if validation fails
try {
  const validData = srtContentSchema.parse({ srtContent: "..." })
  // Proceed with validData
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(error.issues[0].message)
  }
}
```

##### Type Inference
```typescript
// ✅ DO: Infer types from schemas
import { z } from "zod"
import { srtEntrySchema } from "@/lib/schemas"

type SrtEntry = z.infer<typeof srtEntrySchema>
// Equivalent to:
// type SrtEntry = {
//   id: number
//   startTime: string
//   endTime: string
//   text: string
// }
```

---

### 2. srt-parser.ts - SRT File Parsing

**File**: [srt-parser.ts](srt-parser.ts)

#### Purpose
Parse SRT subtitle files into structured data and extract text for AI processing.

#### Available Functions

##### 2.1. `parseSrtContent` - Parse SRT into Entries
```typescript
export interface SrtEntry {
  id: number
  startTime: string  // Format: "HH:MM:SS,mmm"
  endTime: string    // Format: "HH:MM:SS,mmm"
  text: string
}

export function parseSrtContent(content: string): SrtEntry[]
```

**Algorithm**:
1. Split content by double newline (`\n\n`) into blocks
2. For each block:
   - Line 1: Entry ID (integer)
   - Line 2: Timestamps (regex: `HH:MM:SS,mmm --> HH:MM:SS,mmm`)
   - Lines 3+: Subtitle text
3. Return array of `SrtEntry` objects

**Example**:
```typescript
const srtContent = `1
00:00:01,000 --> 00:00:05,000
First subtitle

2
00:00:06,000 --> 00:00:10,000
Second subtitle`

const entries = parseSrtContent(srtContent)
// [
//   { id: 1, startTime: "00:00:01,000", endTime: "00:00:05,000", text: "First subtitle" },
//   { id: 2, startTime: "00:00:06,000", endTime: "00:00:10,000", text: "Second subtitle" }
// ]
```

**Reference**: [srt-parser.ts:15-48](srt-parser.ts#L15-L48)

##### 2.2. `extractTextFromSrt` - Extract Plain Text
```typescript
export function extractTextFromSrt(entries: SrtEntry[]): string
```

**Purpose**: Extract all subtitle text (without timestamps) for AI processing

**Example**:
```typescript
const entries = parseSrtContent(srtContent)
const text = extractTextFromSrt(entries)
// "First subtitle Second subtitle"
```

**Reference**: [srt-parser.ts:53-55](srt-parser.ts#L53-L55)

##### 2.3. `formatTimestamp` - Format Timestamp
```typescript
export function formatTimestamp(timestamp: string): string
```

**Purpose**: Convert SRT timestamp format to more readable format

**Example**:
```typescript
formatTimestamp("00:01:30,250")
// "00:01:30.250"  (comma replaced with period)
```

**Reference**: [srt-parser.ts:60-62](srt-parser.ts#L60-L62)

##### 2.4. `getTimestampedTranscript` - Full Transcript with Timestamps
```typescript
export function getTimestampedTranscript(entries: SrtEntry[]): string
```

**Purpose**: Generate full transcript with formatted timestamps

**Example**:
```typescript
const transcript = getTimestampedTranscript(entries)
// "[00:00:01.000 - 00:00:05.000] First subtitle
// [00:00:06.000 - 00:00:10.000] Second subtitle"
```

**Reference**: [srt-parser.ts:67-71](srt-parser.ts#L67-L71)

#### Error Handling

```typescript
// ✅ DO: Handle invalid SRT content gracefully
const entries = parseSrtContent(content)

if (entries.length === 0) {
  console.error("No valid SRT entries found")
  // Handle error
}
```

**Note**: `parseSrtContent` does NOT throw errors - it returns empty array for invalid content.

---

### 3. constants.ts - Application Constants

**File**: [constants.ts](constants.ts)

#### Purpose
Centralize application-wide constants (no magic numbers in code).

#### Available Constants

##### 3.1. `MAX_FILE_SIZE` - File Size Limit
```typescript
export const MAX_FILE_SIZE = 420 * 1024  // 420 KB in bytes
```

**Used In**:
- Client-side validation (SrtUploader)
- Server-side validation (/api/generate)
- Zod schemas (srtContentSchema, srtFileSchema)

**Rationale**: Gemini API token limits + processing performance

**Reference**: [constants.ts:6](constants.ts#L6)

#### Usage Pattern
```typescript
import { MAX_FILE_SIZE } from "@/lib/constants"

// ✅ DO: Use constant instead of hardcoding
if (file.size > MAX_FILE_SIZE) {
  setError(`File is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`)
}

// ❌ DON'T: Hardcode values
if (file.size > 430080) {  // Magic number - what does this mean?
  setError("File is too large")
}
```

---

### 4. utils.ts - General Utilities

**File**: [utils.ts](utils.ts)

#### Purpose
General-purpose utility functions.

#### Available Functions

##### 4.1. `cn` - Class Name Merger
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Purpose**: Merge Tailwind classes while resolving conflicts

**How It Works**:
1. `clsx`: Conditional class names
2. `twMerge`: Resolve Tailwind class conflicts (last wins)

**Example**:
```typescript
import { cn } from "@/lib/utils"

// Conditional classes
cn("base-class", isActive && "active-class", isDisabled && "disabled-class")

// Conflict resolution
cn("px-4 py-2", "px-8")  // → "px-8 py-2" (px-8 wins)

// With undefined/null (ignored)
cn("base", undefined, null, "extra")  // → "base extra"

// Complex example
<Button
  className={cn(
    "rounded-lg",
    variant === "primary" && "bg-blue-500",
    variant === "secondary" && "bg-gray-500",
    isLoading && "opacity-50 cursor-not-allowed",
    className  // User-provided classes (last, so they win)
  )}
/>
```

**Reference**: [utils.ts:1-6](utils.ts#L1-L6)

**Why Use `cn()` Instead of Plain String Concatenation?**
- **Conflict Resolution**: `px-4 px-8` → `px-8` (not both)
- **Conditional Logic**: `clsx` handles boolean conditions elegantly
- **Type Safety**: TypeScript support via `ClassValue` type

---

## Best Practices

### 1. Validation Strategy

#### Multi-Layer Validation
```typescript
// ✅ DO: Validate at multiple layers

// Layer 1: Client-side (immediate feedback)
const result = srtFileSchema.safeParse({ fileName, fileContent })
if (!result.success) {
  setError(result.error.issues[0].message)
  return
}

// Layer 2: Server-side (security)
const apiResult = generateApiRequestSchema.safeParse(body)
if (!apiResult.success) {
  return NextResponse.json({ error: apiResult.error.issues[0].message }, { status: 400 })
}
```

#### Error Messages
```typescript
// ✅ DO: User-friendly error messages in schemas
z.string().min(1, "SRT content is required")  // Clear message
z.string().endsWith(".srt", "File must be an .srt file")  // Specific

// ❌ DON'T: Generic or missing messages
z.string().min(1)  // Generic "String must contain at least 1 character(s)"
```

---

### 2. Parsing Strategy

#### Robust Parsing
```typescript
// ✅ DO: Handle various SRT formats
const blocks = content.trim().split(/\r?\n\r?\n/)  // Handle \r\n or \n

// ✅ DO: Skip invalid entries (don't throw)
if (lines.length < 3) continue
if (isNaN(id)) continue
if (!timeMatch) continue

// ✅ DO: Validate after parsing
const entries = parseSrtContent(content)
if (entries.length === 0) {
  // Handle empty result
}
```

---

### 3. Constants Management

#### Centralization
```typescript
// ✅ DO: Define in constants.ts
export const MAX_FILE_SIZE = 420 * 1024
export const MAX_OUTPUT_TOKENS = 30000
export const API_TIMEOUT = 60000

// ❌ DON'T: Scatter across files
// In component: const MAX_SIZE = 430080
// In API route: const MAX_SIZE = 420 * 1024
// In schema: .max(430080)
```

---

## Common Gotchas

### 1. Zod Validation

❌ **DON'T**: Use `.parse()` in user-facing code
```typescript
const data = schema.parse(input)  // ❌ Throws error, crashes app
```

✅ **DO**: Use `.safeParse()` and handle errors
```typescript
const result = schema.safeParse(input)
if (!result.success) {
  setError(result.error.issues[0].message)
  return
}
const data = result.data
```

### 2. SRT Parsing

❌ **DON'T**: Assume all SRT files are well-formed
```typescript
const entries = parseSrtContent(content)
processEntries(entries[0])  // ❌ entries might be empty!
```

✅ **DO**: Check result before using
```typescript
const entries = parseSrtContent(content)
if (entries.length === 0) {
  setError("No valid entries found")
  return
}
processEntries(entries)
```

### 3. Constants

❌ **DON'T**: Hardcode magic numbers
```typescript
if (file.size > 430080) { /* ... */ }  // ❌ What is 430080?
```

✅ **DO**: Use named constants
```typescript
import { MAX_FILE_SIZE } from "@/lib/constants"
if (file.size > MAX_FILE_SIZE) { /* ... */ }  // ✅ Clear intent
```

### 4. Class Name Merging

❌ **DON'T**: Concatenate classes directly
```typescript
className={"base " + (isActive ? "active" : "")}  // ❌ No conflict resolution
```

✅ **DO**: Use `cn()` utility
```typescript
className={cn("base", isActive && "active")}  // ✅ Handles conflicts
```

---

## Testing Guidelines

### Current Status
⚠️ **No testing framework configured** - Manual testing only.

### Future Testing (Unit Tests)

#### schemas.ts Tests
```typescript
import { describe, it, expect } from "vitest"
import { srtContentSchema, srtFileSchema } from "@/lib/schemas"
import { MAX_FILE_SIZE } from "@/lib/constants"

describe("srtContentSchema", () => {
  it("should accept valid SRT content", () => {
    const result = srtContentSchema.safeParse({
      srtContent: "1\n00:00:01,000 --> 00:00:05,000\nTest"
    })
    expect(result.success).toBe(true)
  })

  it("should reject empty content", () => {
    const result = srtContentSchema.safeParse({ srtContent: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain("required")
  })

  it("should reject oversized content", () => {
    const largeContent = "a".repeat(MAX_FILE_SIZE + 1)
    const result = srtContentSchema.safeParse({ srtContent: largeContent })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain("too large")
  })
})
```

#### srt-parser.ts Tests
```typescript
import { parseSrtContent, extractTextFromSrt } from "@/lib/srt-parser"

describe("parseSrtContent", () => {
  it("should parse valid SRT content", () => {
    const srt = "1\n00:00:01,000 --> 00:00:05,000\nFirst\n\n2\n00:00:06,000 --> 00:00:10,000\nSecond"
    const entries = parseSrtContent(srt)

    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({
      id: 1,
      startTime: "00:00:01,000",
      endTime: "00:00:05,000",
      text: "First"
    })
  })

  it("should handle empty content", () => {
    const entries = parseSrtContent("")
    expect(entries).toEqual([])
  })

  it("should skip invalid entries", () => {
    const srt = "invalid\n00:00:01\ntext"  // Missing --> in timestamp
    const entries = parseSrtContent(srt)
    expect(entries).toEqual([])
  })
})

describe("extractTextFromSrt", () => {
  it("should extract text from entries", () => {
    const entries = [
      { id: 1, startTime: "00:00:01,000", endTime: "00:00:05,000", text: "First" },
      { id: 2, startTime: "00:00:06,000", endTime: "00:00:10,000", text: "Second" }
    ]
    const text = extractTextFromSrt(entries)
    expect(text).toBe("First Second")
  })
})
```

---

## Quick Search Commands (JIT Index)

### Find Schema Definitions
```bash
# All Zod schemas
rg -n "export const.*Schema = z\." lib

# Schema usage (safeParse)
rg -n "\.safeParse\(" app components lib

# Type inference
rg -n "z\.infer" app components lib
```

### Find SRT Parsing
```bash
# Parse function usage
rg -n "parseSrtContent|extractTextFromSrt" app components

# SRT entry interface
rg -n "interface SrtEntry" lib

# Timestamp regex
rg -n "\\d{2}:\\d{2}:\\d{2}" lib
```

### Find Constants Usage
```bash
# MAX_FILE_SIZE usage
rg -n "MAX_FILE_SIZE" app components lib

# All constant imports
rg -n "from ['\"]@/lib/constants['\"]" app components
```

### Find Utility Usage
```bash
# cn() function usage
rg -n "cn\(" app components

# Class merging
rg -n "twMerge|clsx" lib
```

---

## Related Documentation

- **Zod**: https://zod.dev/
- **clsx**: https://github.com/lukeed/clsx
- **tailwind-merge**: https://github.com/dcastil/tailwind-merge
- **Components**: See [../components/CLAUDE.md](../components/CLAUDE.md)
- **API Routes**: See [../app/api/CLAUDE.md](../app/api/CLAUDE.md)

---

## Quick Reference

- **Schemas**: [schemas.ts](schemas.ts) - Zod validation schemas
- **SRT Parsing**: [srt-parser.ts](srt-parser.ts) - SRT utilities
- **Constants**: [constants.ts](constants.ts) - Application constants
- **Utilities**: [utils.ts](utils.ts) - General helpers
- **Max File Size**: 420 KB (430,080 bytes)
