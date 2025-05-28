# Timestamp Count Selection & Validation Features

## Overview

This implementation adds user-selectable timestamp counts with Zod schema validation using the Vercel AI SDK's structured output features.

## Key Features

### 1. User-Selectable Timestamp Count

- **Range**: 3-25 timestamps
- **Default**: 8 timestamps (recommended)
- **UI**: Dropdown selector in the upload component
- **Options**: 3, 5, 8, 10, 12, 15, 20, 25 timestamps

### 2. Zod Schema Validation

- **Input validation**: Ensures timestamp count is within valid range (3-25)
- **Output validation**: Verifies generated timestamps match requested count (with 20% tolerance)
- **Structure validation**: Ensures proper timestamp format (HH:MM or HH:MM:SS) and description length

### 3. Even Distribution for Long Videos

- Automatically calculates video duration from SRT content
- For videos longer than 30 minutes, ensures timestamps are spread throughout
- Prevents clustering of timestamps at the beginning of long videos
- Uses intelligent distribution algorithm based on video length

### 4. Vercel AI SDK Integration

- Uses `streamObject` for structured output generation
- Real-time validation during generation
- Type-safe with TypeScript interfaces
- Graceful error handling and fallback

## Implementation Details

### Schema Definitions (`lib/schemas.ts`)

```typescript
// Individual timestamp schema
export const timestampSchema = z.object({
  time: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Invalid timestamp format"),
  description: z.string().min(1).max(100),
});

// Complete output validation
export const timestampsOutputSchema = z
  .object({
    timestamps: z.array(timestampSchema).min(1),
    requestedCount: z.number().int().min(3).max(25),
    actualCount: z.number().int().min(1),
    videoMaxTime: z.string().optional(),
  })
  .refine((data) => {
    // 20% tolerance for count matching
    const tolerance = Math.max(1, Math.floor(data.requestedCount * 0.2));
    const countDifference = Math.abs(data.actualCount - data.requestedCount);
    return countDifference <= tolerance;
  });

// API request schema with timestamp count
export const generateApiRequestSchema = z.object({
  srtContent: z.string().min(1).max(MAX_FILE_SIZE),
  timestampCount: z.number().int().min(3).max(25).default(8),
});
```

### API Route Updates (`app/api/generate/route.ts`)

```typescript
// Structured output generation
const { partialObjectStream } = streamObject({
  model: modelWithFallback,
  prompt: systemPrompt,
  schema: timestampsOutputSchema,
  temperature: 0.1,
});

// Stream transformation for UI compatibility
return new Response(
  new ReadableStream({
    async start(controller) {
      for await (const partialObject of partialObjectStream) {
        if (partialObject?.timestamps?.length > 0) {
          let formattedOutput = "🕒 Key moments:\n";
          partialObject.timestamps.forEach((timestamp) => {
            if (timestamp?.time && timestamp?.description) {
              formattedOutput += `${timestamp.time} ${timestamp.description}\n`;
            }
          });
          controller.enqueue(new TextEncoder().encode(formattedOutput));
        }
      }
    },
  })
);
```

### UI Components

#### Updated SrtUploader Component

- Added dropdown selector for timestamp count
- Updated interface to pass timestamp count to parent
- Dynamic button text showing selected count

#### Select Component (`components/ui/select.tsx`)

- Radix UI based dropdown component
- Fully accessible with keyboard navigation
- Consistent styling with existing design system

## Distribution Algorithm

The system uses a smart distribution algorithm for longer videos:

1. **Calculate video duration** from SRT timestamps
2. **Determine distribution strategy** based on video length
3. **Spread timestamps evenly** across the timeline
4. **Include key moments**: introduction, major topics, transitions, conclusion
5. **Ensure no clustering** at video start for long content

## Error Handling

- **Invalid timestamp counts**: Clear error messages for out-of-range values
- **Schema validation failures**: Detailed error reporting with field-specific messages
- **AI generation errors**: Graceful fallbacks with user-friendly error messages
- **Network issues**: Proper error states in the UI

## Benefits

1. **User Control**: Users can choose the granularity of timestamps
2. **Quality Assurance**: Zod validation ensures consistent output
3. **Performance**: Structured output is more efficient than text parsing
4. **Accessibility**: Clear UI feedback and error messages
5. **Flexibility**: Easy to extend with new timestamp counts or validation rules

## Usage Example

```typescript
// User selects 10 timestamps
const response = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    srtContent: "...",
    timestampCount: 10,
  }),
});

// Validated output with exactly 10 timestamps (±20% tolerance)
// Evenly distributed across video duration
// Formatted for immediate display in UI
```

This implementation provides a robust, user-friendly system for generating custom timestamp counts with built-in validation and intelligent distribution.
