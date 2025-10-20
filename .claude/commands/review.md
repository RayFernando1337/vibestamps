Perform a comprehensive code review of recent changes.

## Review Checklist

### 1. Code Conventions (from CLAUDE.md)
- ✅ TypeScript strict mode compliance (no `any` without justification)
- ✅ Absolute imports (`@/components`, `@/lib`) used correctly
- ✅ Functional components with hooks (no class components)
- ✅ Server-side imports (`@ai-sdk/*`) only in API routes, not client components
- ✅ `"use client"` directive present only when needed (hooks, state, events)

### 2. Zod Validation
- ✅ All user inputs validated with Zod schemas (client + server)
- ✅ Schemas defined in `lib/schemas.ts` or co-located
- ✅ `.safeParse()` used with proper error handling

### 3. Error Handling & Loading States
- ✅ Try-catch blocks for async operations
- ✅ Loading states shown during streaming/API calls
- ✅ Error messages user-friendly (no stack traces exposed)
- ✅ Streaming responses handle connection errors

### 4. Security
- ✅ No API keys or secrets in client code
- ✅ No sensitive data logged (API keys, PII, user content)
- ✅ Client env vars use `NEXT_PUBLIC_` prefix
- ✅ File size limits enforced (430 KB for SRT uploads)

### 5. Accessibility
- ✅ Semantic HTML elements used
- ✅ ARIA labels for interactive elements
- ✅ Keyboard navigation supported (Tab, Enter, Escape)
- ✅ Color contrast meets WCAG standards
- ✅ Focus states visible

### 6. Performance
- ✅ No unnecessary re-renders (proper memoization if needed)
- ✅ Dynamic imports for heavy components if applicable
- ✅ Streaming used for AI responses (no buffering entire response)
- ✅ Tailwind classes optimized (no redundant utilities)

### 7. Testing Coverage (when tests exist)
- ✅ Unit tests for new utilities in `lib/`
- ✅ Component tests for new UI components
- ✅ E2E tests updated if user flow changed

### 8. Documentation
- ✅ Complex logic has comments explaining "why", not "what"
- ✅ New patterns documented in relevant CLAUDE.md file
- ✅ README updated if user-facing features changed

## Output Format

Provide specific, actionable feedback with file/line references:
- **Good**: ✅ `components/SrtUploader.tsx:45` - Excellent Zod validation pattern
- **Issue**: ⚠️ `app/page.tsx:78` - Missing error boundary, add try-catch for API call
- **Critical**: 🚨 `components/Button.tsx:12` - Hardcoded color `bg-blue-500`, use design token

## Summary

- **Total Issues**: X
- **Critical**: X
- **Warnings**: X
- **Suggestions**: X
- **Overall Assessment**: Ready for merge / Needs fixes / Needs discussion
