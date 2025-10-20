# API Routes - Next.js 15 Server-Side Endpoints

**Technology**: Next.js 15 API Routes + Vercel AI SDK v5
**Entry Point**: [generate/route.ts](generate/route.ts)
**Parent Context**: Extends [../../CLAUDE.md](../../CLAUDE.md) and [../CLAUDE.md](../CLAUDE.md)
**Related Documentation**: [AGENTS.md](../AGENTS.md) for generic context

This directory contains server-side API routes that handle backend logic, external API calls, and AI model integration.

---

## Development Commands

### Testing API Routes Locally
```bash
# Start dev server
bun run dev

# Test POST endpoint
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"srtContent": "1\n00:00:01,000 --> 00:00:05,000\nTest subtitle"}'

# Or use HTTPie
http POST localhost:3000/api/generate srtContent="..."

# Or use Postman/Insomnia
```

### Pre-PR Checklist
```bash
bunx tsc --noEmit    # Type check
bun run lint         # Lint
bun run build        # Build verification
```

---

## Architecture Overview

### Directory Structure
```
app/api/
└── generate/
    └── route.ts     # POST /api/generate - AI timestamp generation
```

### API Route Pattern
- **File**: `route.ts` exports HTTP method functions (GET, POST, PUT, DELETE, PATCH)
- **URL**: `/api/generate` → `app/api/generate/route.ts`
- **Server-Only**: All code runs on server (Node.js runtime)
- **Environment Variables**: Access to `process.env.*` without `NEXT_PUBLIC_` prefix

---

## Code Organization Patterns

### 1. API Route Handler Structure

**File**: [generate/route.ts](generate/route.ts)

#### Purpose
- Accept SRT content from client
- Validate with Zod schemas
- Extract video duration from timestamps
- Generate AI-powered timestamps using Google Gemini
- Stream response back to client

#### Complete Pattern
```typescript
// ✅ DO: Import server-only packages (no "use client" needed)
import { streamText } from "ai"                         // Vercel AI SDK
import { gateway } from "@ai-sdk/gateway"               // AI Gateway
import { NextResponse } from "next/server"              // Next.js response helper
import { generateApiRequestSchema } from "@/lib/schemas" // Zod validation
import { MAX_FILE_SIZE } from "@/lib/constants"

// Initialize AI model outside handler (singleton)
const model = gateway("google/gemini-2.5-pro")

// Export async function with HTTP method name
export async function POST(request: Request) {
  try {
    // 1. Validate request size
    // 2. Parse and validate request body
    // 3. Process data
    // 4. Call AI model
    // 5. Return streaming response
  } catch (error) {
    // 6. Handle errors
  }
}
```

**Reference**: [generate/route.ts:1-194](generate/route.ts#L1-L194)

---

### 2. Request Size Validation

#### Pattern: Check Content-Length Header Before Parsing
```typescript
// ✅ DO: Check size BEFORE parsing body (prevents memory overflow)
const contentLength = request.headers.get("content-length")

if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: `Request too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB` },
    { status: 413 }  // 413 Payload Too Large
  )
}
```

**Why**: Parsing a huge request body can crash the server. Check header first.

**Reference**: [generate/route.ts:14-21](generate/route.ts#L14-L21)

---

### 3. Request Body Validation with Zod

#### Pattern: Use `.safeParse()` for Safe Validation
```typescript
// ✅ DO: Parse request body
const body = await request.json()

// ✅ DO: Validate with Zod schema
const validationResult = generateApiRequestSchema.safeParse(body)

if (!validationResult.success) {
  return NextResponse.json(
    { error: validationResult.error.issues[0].message },
    { status: 400 }  // 400 Bad Request
  )
}

// ✅ DO: Extract validated data
const { srtContent } = validationResult.data  // Type-safe!
```

**Why**:
- `.safeParse()` never throws (returns `{ success: boolean, data/error }`)
- Provides user-friendly error messages
- Type-safe data extraction

**Reference**: [generate/route.ts:23-35](generate/route.ts#L23-L35)

---

### 4. SRT Content Processing

#### Pattern: Extract Video Duration with Regex
```typescript
// ✅ DO: Extract last timestamp from SRT content
const timestampRegex = /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g
let maxTimestamp = "00:00:00"
let match

// Find all timestamp pairs and get the latest end time
while ((match = timestampRegex.exec(srtContent)) !== null) {
  const endTime = match[2]  // Second capture group = end time

  // Convert to seconds for comparison
  const endTimeParts = endTime.split(/[,:]/)
  const endTimeSeconds =
    parseInt(endTimeParts[0]) * 3600 +  // Hours
    parseInt(endTimeParts[1]) * 60 +    // Minutes
    parseInt(endTimeParts[2]) +         // Seconds
    parseInt(endTimeParts[3]) / 1000    // Milliseconds

  // Update max if larger
  if (endTimeSeconds > maxTimeSeconds) {
    const hours = endTimeParts[0]
    const minutes = endTimeParts[1]
    const seconds = endTimeParts[2]

    // Format: "HH:MM:SS" or "MM:SS" (drop hours if 00)
    maxTimestamp = hours !== "00"
      ? `${hours}:${minutes}:${seconds}`
      : `${minutes}:${seconds}`
  }
}
```

**Why**:
- Determines video length from subtitle file
- Ensures AI doesn't generate timestamps beyond video duration
- Handles various SRT timestamp formats

**Reference**: [generate/route.ts:37-70](generate/route.ts#L37-L70)

---

### 5. AI Model Integration - Vercel AI SDK

#### Pattern: Initialize Model Once (Singleton)
```typescript
// ✅ DO: Initialize model outside handler (runs once)
import { gateway } from "@ai-sdk/gateway"

const model = gateway("google/gemini-2.5-pro")

export async function POST(request: Request) {
  // Use `model` here - already initialized
}
```

**Why**:
- Avoid re-initializing model on every request
- Better performance
- Singleton pattern

**Reference**: [generate/route.ts:7-10](generate/route.ts#L7-L10)

#### AI Gateway Configuration
- **Local Development**: Set `AI_GATEWAY_API_KEY` in `.env.local`
- **Vercel Deployment**: Authentication automatic via Vercel infrastructure
- **Model**: Google Gemini 2.5 Pro (via gateway)

---

### 6. System Prompt Engineering

#### Pattern: Structured Prompt with Constraints
```typescript
// ✅ DO: Create detailed system prompt with constraints
const videoEndTimeInfo =
  maxTimestamp !== "00:00:00"
    ? `The video's maximum duration is ${maxTimestamp}. ANY TIMESTAMP BEYOND ${maxTimestamp} IS INVALID.`
    : ""

const systemPrompt = `
<file_contents>
\`\`\`srt
${srtContent}
\`\`\`
</file_contents>

<meta prompt 1 = "Generate Timestamps v4">
# Timestamp Generation Guidelines v4.0

**IMPORTANT VIDEO LENGTH CONSTRAINT: ${videoEndTimeInfo}**

[Detailed instructions for timestamp generation...]

### Core Principles
1. **Content-Density Over Fixed Numbers:** Aim for one key moment every 5-10 minutes
2. **Capture Value, Not Just Topics:** Point to specific, valuable information
3. **Be Specific and Action-Oriented:** Use 3-6 word descriptions with action verbs

[...more guidelines...]

</meta prompt 1>

<user_instructions>
Generate timestamps for this ${maxTimestamp} long video using the guidelines above.
</user_instructions>
`
```

**Key Components**:
1. **File Contents**: Provide SRT data in code block
2. **Meta Prompt**: Detailed generation guidelines (v4.0)
3. **Constraints**: Video duration limits (prevent hallucinated timestamps)
4. **User Instructions**: Clear task description

**Reference**: [generate/route.ts:72-179](generate/route.ts#L72-L179)

---

### 7. Streaming AI Responses

#### Pattern: Use `streamText()` → `toTextStreamResponse()`
```typescript
// ✅ DO: Stream AI response
import { streamText } from "ai"

const result = streamText({
  model: model,                    // Gemini 2.5 Pro via gateway
  prompt: systemPrompt,            // Full system prompt
  maxOutputTokens: 30000,          // Max response length
})

// ✅ DO: Convert to HTTP streaming response
return result.toTextStreamResponse()
```

**Why**:
- User sees results immediately (no waiting for full generation)
- Better UX for long responses
- Lower perceived latency

**Response Type**: `ReadableStream` (client uses `.getReader()`)

**Reference**: [generate/route.ts:181-188](generate/route.ts#L181-L188)

---

### 8. Error Handling

#### Pattern: Try-Catch with Appropriate HTTP Status Codes
```typescript
export async function POST(request: Request) {
  try {
    // ... validation and processing ...

    // Validation errors: 400 Bad Request
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    // Size errors: 413 Payload Too Large
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Request too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB` },
        { status: 413 }
      )
    }

    // ... success path ...

  } catch (error) {
    // Server errors: 500 Internal Server Error
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
```

**HTTP Status Codes**:
- `200` - Success (streaming response)
- `400` - Bad Request (validation errors)
- `413` - Payload Too Large (file size limit)
- `500` - Internal Server Error (unexpected errors)

**Reference**: [generate/route.ts:12-193](generate/route.ts#L12-L193)

---

## Key Files & Touch Points

### Core API Route
| File | Purpose | Key Exports |
|------|---------|-------------|
| [generate/route.ts](generate/route.ts) | AI timestamp generation endpoint | `POST` function |

### Dependencies
- **Vercel AI SDK**: `ai` package → `streamText()` for streaming
- **AI Gateway**: `@ai-sdk/gateway` → Model router for Gemini
- **Zod Schemas**: `@/lib/schemas` → `generateApiRequestSchema`
- **Constants**: `@/lib/constants` → `MAX_FILE_SIZE`

### Environment Variables
```bash
# .env.local
GOOGLE_API_KEY=your_api_key_here           # Google Gemini API key (required)
AI_GATEWAY_API_KEY=your_gateway_key        # Optional for local testing
```

---

## Quick Search Commands (JIT Index)

### Find API Routes
```bash
# Find all route handlers
rg -n "export async function (GET|POST|PUT|DELETE)" app/api

# Find all API routes
find app/api -name "route.ts"

# Find model usage
rg -n "(streamText|generateText|streamObject)" app/api
```

### Find Validation
```bash
# Find Zod schema usage
rg -n "\.safeParse\(" app/api

# Find error responses
rg -n "NextResponse\.json.*error" app/api

# Find status codes
rg -n "status: \d+" app/api
```

### Find AI Model Integration
```bash
# Find gateway usage
rg -n "gateway\(" app/api

# Find streaming
rg -n "streamText|toTextStreamResponse" app/api

# Find prompts
rg -n "systemPrompt|prompt:" app/api
```

---

## Common Gotchas

### 1. Server-Only Imports
✅ **DO**: Import AI SDK packages only in API routes
```typescript
// ✅ CORRECT: In app/api/generate/route.ts
import { streamText } from "ai"
import { gateway } from "@ai-sdk/gateway"
```

❌ **DON'T**: Import in client components
```typescript
// ❌ WRONG: In app/page.tsx (client component)
"use client"
import { streamText } from "ai"  // Error! Server-only package
```

### 2. Environment Variables
✅ **DO**: Access without `NEXT_PUBLIC_` prefix in API routes
```typescript
// ✅ CORRECT: In API routes
const apiKey = process.env.GOOGLE_API_KEY  // Available
```

❌ **DON'T**: Use in client components
```typescript
// ❌ WRONG: In client component
const apiKey = process.env.GOOGLE_API_KEY  // undefined!
```

### 3. Request Body Parsing
✅ **DO**: Parse JSON body first
```typescript
const body = await request.json()
const { srtContent } = body  // Access properties after parsing
```

❌ **DON'T**: Access properties before parsing
```typescript
const srtContent = request.body.srtContent  // ❌ Error! Body not parsed yet
```

### 4. Zod Validation
✅ **DO**: Use `.safeParse()` and handle errors
```typescript
const result = schema.safeParse(data)
if (!result.success) {
  return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
}
const validData = result.data  // Type-safe
```

❌ **DON'T**: Use `.parse()` (throws errors)
```typescript
const validData = schema.parse(data)  // ❌ Throws, crashes handler
```

### 5. Streaming Response
✅ **DO**: Return streaming response directly
```typescript
const result = streamText({ model, prompt })
return result.toTextStreamResponse()  // ✅ Correct
```

❌ **DON'T**: Try to await or manipulate stream
```typescript
const result = await streamText({ model, prompt })  // ❌ Wrong
return result.json()  // ❌ Not a method
```

### 6. Error Logging
✅ **DO**: Log errors on server (never expose stack traces to client)
```typescript
catch (error) {
  console.error("Error processing request:", error)  // ✅ Server logs
  return NextResponse.json(
    { error: "Failed to process request" },  // ✅ Generic message to client
    { status: 500 }
  )
}
```

❌ **DON'T**: Send full error to client
```typescript
catch (error) {
  return NextResponse.json(
    { error: error.message, stack: error.stack },  // ❌ Security risk!
    { status: 500 }
  )
}
```

---

## Testing Guidelines

### Current Status
⚠️ **No testing framework configured** - Manual testing only.

### Manual Testing Checklist

#### 1. Valid Request
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "srtContent": "1\n00:00:01,000 --> 00:00:05,000\nTest subtitle\n\n2\n00:00:06,000 --> 00:00:10,000\nSecond subtitle"
  }'

# Expected: Streaming response with timestamps
```

#### 2. Invalid Request (Missing Field)
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request with error message
```

#### 3. Oversized Request
```bash
# Create large file (> 430 KB)
python3 -c "print('1\n00:00:01,000 --> 00:00:05,000\n' + 'a' * 500000)" > large.srt

curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d @large.srt

# Expected: 413 Payload Too Large
```

#### 4. Invalid API Key
```bash
# Remove GOOGLE_API_KEY from .env.local
bun run dev

# Make request
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"srtContent": "..."}'

# Expected: 500 Internal Server Error (API key missing)
```

### Future Testing (When Framework Added)
```typescript
// tests/integration/api-generate.test.ts
import { POST } from "@/app/api/generate/route"

describe("POST /api/generate", () => {
  it("should return 400 for missing srtContent", async () => {
    const request = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      body: JSON.stringify({})
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("should stream response for valid input", async () => {
    const request = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      body: JSON.stringify({
        srtContent: "1\n00:00:01,000 --> 00:00:05,000\nTest"
      })
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/plain")
  })
})
```

---

## Vercel AI SDK Best Practices

### Model Selection
```typescript
// ✅ DO: Use gateway for model flexibility
import { gateway } from "@ai-sdk/gateway"
const model = gateway("google/gemini-2.5-pro")

// Alternative: Direct provider
import { google } from "@ai-sdk/google"
const model = google("gemini-2.5-pro")
```

### Streaming vs Non-Streaming
```typescript
// ✅ Streaming (better UX for long responses)
const result = streamText({ model, prompt })
return result.toTextStreamResponse()

// Alternative: Non-streaming (simpler, but blocks)
const { text } = await generateText({ model, prompt })
return NextResponse.json({ text })
```

### Token Limits
```typescript
// ✅ DO: Set appropriate max tokens
const result = streamText({
  model: model,
  prompt: systemPrompt,
  maxOutputTokens: 30000,  // Adjust based on expected response length
})
```

### Prompt Engineering
```typescript
// ✅ DO: Use structured prompts with clear sections
const prompt = `
<file_contents>
${data}
</file_contents>

<instructions>
Generate timestamps following these rules:
1. Rule 1
2. Rule 2
</instructions>

<examples>
Example 1: ...
Example 2: ...
</examples>

<user_request>
${userRequest}
</user_request>
`
```

---

## Pre-PR Validation

### Automated Checks
```bash
bunx tsc --noEmit    # Type check
bun run lint         # Lint
bun run build        # Build verification
```

### Manual Testing
- [ ] Valid request returns streaming response
- [ ] Invalid request returns 400 with error message
- [ ] Oversized request returns 413
- [ ] Missing env var fails gracefully (500)
- [ ] Response streams correctly (check in browser)
- [ ] Error messages are user-friendly (no stack traces)

### Code Quality
- [ ] Zod validation on all inputs
- [ ] Appropriate HTTP status codes
- [ ] Error logging on server (not exposed to client)
- [ ] Environment variables accessed correctly
- [ ] Model initialized as singleton
- [ ] Streaming response returned without await

---

## Related Documentation

- **Vercel AI SDK v5**: https://sdk.vercel.ai/docs
- **Google Gemini API**: https://ai.google.dev/docs
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Zod Schemas**: See [../../lib/CLAUDE.md](../../lib/CLAUDE.md)
- **Client-Side Usage**: See [../CLAUDE.md](../CLAUDE.md) for streaming consumption

---

## Quick Reference

- **Main API Route**: [generate/route.ts](generate/route.ts) - POST endpoint for AI generation
- **Request Validation**: Uses `generateApiRequestSchema` from `@/lib/schemas`
- **Response Format**: Streaming text (`text/plain; charset=utf-8`)
- **Model**: Google Gemini 2.5 Pro via Vercel AI Gateway
- **Max Tokens**: 30,000 output tokens
- **File Size Limit**: 430 KB (defined in `@/lib/constants`)
