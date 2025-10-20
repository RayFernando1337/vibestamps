Generate missing tests for: $ARGUMENTS

⚠️ **Note**: This project currently has no testing framework configured. This command is a template for when Vitest + React Testing Library are added.

---

## Prerequisites (Not Yet Installed)

Before running this command, the project needs:

```bash
# Install testing dependencies
bun add -D vitest @vitest/ui
bun add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
bun add -D happy-dom  # or jsdom

# For E2E tests
bun add -D @playwright/test
```

**Update `package.json`** with test scripts:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## Test Generation Strategy

### 1. Identify Test Targets

Determine what needs testing:
- **Utilities** (`lib/`): Pure functions, Zod schemas, SRT parsing
- **Components** (`components/`): UI behavior, user interactions
- **API Routes** (`app/api/`): Request/response handling, validation
- **E2E Flows**: Upload → Generate → Display

### 2. Locate Existing Code

```bash
# Find the code to test
rg -n "export (function|const) $ARGUMENTS" app components lib
```

### 3. Determine Test Type

| Target | Test Type | Location |
|--------|-----------|----------|
| `lib/` utilities | Unit test (Vitest) | Co-located: `lib/file.test.ts` |
| React components | Component test (RTL) | Co-located: `components/File.test.tsx` |
| API routes | Integration test | `tests/integration/api-generate.test.ts` |
| User flows | E2E test (Playwright) | `tests/e2e/upload-flow.spec.ts` |

---

## Unit Test Template (lib/ utilities)

Example: `lib/srt-parser.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { parseSrtContent, extractTextFromSrt } from './srt-parser'

describe('parseSrtContent', () => {
  it('should parse valid SRT content', () => {
    const srtContent = `1
00:00:01,000 --> 00:00:05,000
First subtitle

2
00:00:06,000 --> 00:00:10,000
Second subtitle`

    const result = parseSrtContent(srtContent)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 1,
      startTime: '00:00:01,000',
      endTime: '00:00:05,000',
      text: 'First subtitle'
    })
  })

  it('should handle empty content', () => {
    expect(parseSrtContent('')).toEqual([])
  })

  it('should throw error for invalid format', () => {
    expect(() => parseSrtContent('invalid')).toThrow()
  })
})
```

---

## Component Test Template (React components)

Example: `components/SrtUploader.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SrtUploader } from './SrtUploader'

describe('SrtUploader', () => {
  it('should render upload button', () => {
    render(<SrtUploader onUpload={vi.fn()} />)
    expect(screen.getByText(/upload/i)).toBeInTheDocument()
  })

  it('should handle file selection', async () => {
    const onUpload = vi.fn()
    render(<SrtUploader onUpload={onUpload} />)

    const file = new File(['1\n00:00:01,000 --> 00:00:05,000\nTest'], 'test.srt', {
      type: 'application/x-subrip'
    })

    const input = screen.getByLabelText(/upload/i) as HTMLInputElement
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test.srt'
      }))
    })
  })

  it('should reject files over size limit', async () => {
    render(<SrtUploader onUpload={vi.fn()} />)

    const largeContent = 'a'.repeat(450 * 1024) // > 430 KB
    const file = new File([largeContent], 'large.srt')

    const input = screen.getByLabelText(/upload/i) as HTMLInputElement
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument()
    })
  })
})
```

---

## API Route Test Template

Example: `tests/integration/api-generate.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/generate/route'

describe('/api/generate', () => {
  it('should return 400 for missing body', async () => {
    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should stream response for valid input', async () => {
    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        srtContent: '1\n00:00:01,000 --> 00:00:05,000\nTest subtitle'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
  })
})
```

---

## E2E Test Template (Playwright)

Example: `tests/e2e/upload-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('SRT Upload Flow', () => {
  test('should upload SRT and generate timestamps', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/sample.srt')

    // Wait for parsing
    await expect(page.getByText(/file uploaded/i)).toBeVisible()

    // Generate timestamps
    await page.getByRole('button', { name: /generate/i }).click()

    // Verify streaming starts
    await expect(page.getByText(/timestamp/i)).toBeVisible({ timeout: 10000 })

    // Verify results display
    const results = page.locator('[data-testid="timestamp-results"]')
    await expect(results).toContainText('00:')
  })

  test('should show error for oversized file', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Upload large file
    await page.locator('input[type="file"]').setInputFiles('tests/fixtures/large.srt')

    // Verify error message
    await expect(page.getByText(/file size exceeds/i)).toBeVisible()
  })
})
```

---

## Run Tests

Once testing framework is installed:

```bash
# Unit + Component tests
bun test                    # Run all tests
bun test $ARGUMENTS         # Run specific test file
bun test --watch            # Watch mode
bun test --coverage         # Coverage report

# E2E tests
bun test:e2e                # Run Playwright tests
```

---

## Coverage Goals

Aim for:
- **Utilities (`lib/`)**: 90%+ coverage
- **Components**: 80%+ coverage
- **API Routes**: 85%+ coverage
- **Critical paths**: 100% E2E coverage

---

## Update CLAUDE.md

After adding tests, document patterns in relevant CLAUDE.md:
```markdown
## Testing Patterns

### Unit Tests (lib/)
- Location: Co-located with source
- Example: See `lib/srt-parser.test.ts`

### Component Tests
- Location: Co-located with components
- Example: See `components/SrtUploader.test.tsx`
```

---

**When testing is set up, this command will generate comprehensive test coverage for $ARGUMENTS.**
