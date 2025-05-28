import { z } from "zod";
import { MAX_FILE_SIZE } from "./constants";

// SRT Entry schema for validating individual entries
export const srtEntrySchema = z.object({
  id: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  text: z.string(),
});

// SRT Content schema for validating the entire SRT content
export const srtContentSchema = z.object({
  srtContent: z
    .string()
    .min(1, "SRT content is required")
    .max(MAX_FILE_SIZE, `SRT content is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`),
});

// SRT File schema for validating file uploads
export const srtFileSchema = z.object({
  fileName: z.string().endsWith(".srt", "File must be an .srt file"),
  fileContent: z
    .string()
    .min(1, "File content is required")
    .max(MAX_FILE_SIZE, `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`),
});

// Schema for individual timestamp
export const timestampSchema = z.object({
  time: z
    .string()
    .regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Invalid timestamp format (HH:MM or HH:MM:SS)"),
  description: z.string().min(1, "Description is required").max(100, "Description too long"),
});

// Schema for timestamp output validation
export const timestampsOutputSchema = z
  .object({
    timestamps: z.array(timestampSchema).min(1, "At least one timestamp is required"),
    requestedCount: z.number().int().min(3).max(25),
    actualCount: z.number().int().min(1),
    videoMaxTime: z.string().optional(),
  })
  .refine(
    (data) => {
      // First validate that actualCount matches the actual array length
      const arrayLength = data.timestamps.length;
      if (data.actualCount !== arrayLength) {
        console.error(
          `❌ actualCount (${data.actualCount}) doesn't match array length (${arrayLength})`
        );
        return false;
      }
      return true;
    },
    {
      message: "actualCount must match the actual number of timestamps in the array",
      path: ["actualCount"],
    }
  )
  .refine(
    (data) => {
      // Check for duplicate timestamps
      const times = data.timestamps.map((t) => t.time);
      const uniqueTimes = new Set(times);
      if (times.length !== uniqueTimes.size) {
        const duplicates = times.filter((time, index) => times.indexOf(time) !== index);
        console.error(`❌ Duplicate timestamps found: ${duplicates.join(", ")}`);
        return false;
      }
      return true;
    },
    {
      message: "All timestamps must be unique - no duplicates allowed",
      path: ["timestamps"],
    }
  )
  .refine(
    (data) => {
      // Then validate that we have exactly the requested count (no tolerance for now)
      const arrayLength = data.timestamps.length;
      if (arrayLength !== data.requestedCount) {
        console.error(
          `❌ Generated ${arrayLength} timestamps but requested ${data.requestedCount}`
        );
        return false;
      }
      return true;
    },
    {
      message: "Must generate exactly the requested number of timestamps",
      path: ["timestamps"],
    }
  )
  .refine(
    (data) => {
      // Validate timestamp distribution for longer videos
      if (data.timestamps.length >= 3) {
        const times = data.timestamps
          .map((t) => {
            const parts = t.time.split(":").map((p) => parseInt(p));
            if (parts.length === 2) return parts[0] * 60 + parts[1]; // MM:SS to seconds
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
            return 0;
          })
          .sort((a, b) => a - b);

        // Check if all timestamps are clustered in the first 20% of the video
        const maxTime = Math.max(...times);
        const firstTwentyPercent = maxTime * 0.2;
        const clusteredCount = times.filter((t) => t <= firstTwentyPercent).length;

        if (clusteredCount >= data.timestamps.length - 1) {
          console.error(
            `❌ Poor distribution: ${clusteredCount}/${data.timestamps.length} timestamps are clustered in first 20% of video`
          );
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Timestamps must be distributed across the entire video, not clustered at the beginning",
      path: ["timestamps"],
    }
  );

// API Request schema for validating the generate endpoint with timestamp count
export const generateApiRequestSchema = z.object({
  srtContent: z
    .string()
    .min(1, "SRT content is required")
    .max(MAX_FILE_SIZE, `SRT content is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`),
  timestampCount: z
    .number()
    .int()
    .min(3, "Minimum 3 timestamps required")
    .max(25, "Maximum 25 timestamps allowed")
    .default(8),
});

// SRT Entries array schema
export const srtEntriesSchema = z.array(srtEntrySchema);

// ========== NEW SCHEMAS FOR CHUNKED PROCESSING ==========

// Video metadata schema for comprehensive video analysis
export const videoMetadataSchema = z.object({
  durationMinutes: z.number().min(1).max(600), // 1 minute to 10 hours max
  durationSeconds: z.number().min(60).max(36000), // 1 minute to 10 hours max
  totalEntries: z.number().min(1),
  averageEntryDuration: z.number().min(0),
  estimatedWordsPerMinute: z.number().min(0).max(500),
  hasLongPauses: z.boolean(),
  contentDensity: z.enum(["low", "medium", "high"]),
  videoCategory: z.enum(["short", "medium", "long", "very_long"]),
});

// Content category schema for proven content analysis
export const contentCategorySchema = z.enum([
  "introduction_overview",
  "functional_demonstration",
  "topic_shift",
  "complex_concept",
  "example_build",
  "conclusion",
  "transition",
  "general_content",
]);

// Break point schema for natural segmentation
export const breakPointSchema = z.object({
  entryIndex: z.number().min(0),
  timestamp: z.string(),
  timestampSeconds: z.number().min(0),
  confidence: z.number().min(0).max(1),
  reason: z.enum(["long_pause", "topic_change", "speaker_change", "section_break"]),
});

// Video analysis schema for intelligent processing
export const videoAnalysisSchema = z.object({
  optimalTimestampCount: z.number().int().min(3).max(25),
  recommendedChunkCount: z.number().int().min(1).max(30),
  chunkDurationMinutes: z.number().min(1).max(15),
  processingStrategy: z.enum(["simple", "standard", "complex", "enterprise"]),
  estimatedProcessingTime: z.number().min(1).max(3600), // 1 second to 1 hour
  qualityExpectation: z.enum(["basic", "good", "excellent", "premium"]),
});

// SRT chunk schema for individual video segments
export const srtChunkSchema = z.object({
  id: z.number().int().min(1),
  startTime: z.string(),
  endTime: z.string(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
  durationMinutes: z.number().min(0.1).max(20),
  entries: z.array(srtEntrySchema).min(1),
  entryCount: z.number().int().min(1),
  wordCount: z.number().int().min(1),
  breakPointReason: z
    .enum(["long_pause", "topic_change", "speaker_change", "section_break"])
    .optional(),
  confidence: z.number().min(0).max(1),
  isIntro: z.boolean(),
  isOutro: z.boolean(),
  hasNaturalBreak: z.boolean(),
});

// Chunk metadata schema for processing information
export const chunkMetadataSchema = z.object({
  totalChunks: z.number().int().min(0),
  averageChunkDuration: z.number().min(0),
  naturalBreakCount: z.number().int().min(0),
  overlapDuration: z.number().min(0),
  qualityScore: z.number().int().min(0).max(100),
  processingHints: z.array(z.string()),
});

// Moment candidate schema for chunk analysis results
export const momentCandidateSchema = z.object({
  timestamp: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Invalid timestamp format"),
  description: z.string().min(1).max(50), // 2-5 words as per proven strategy
  category: contentCategorySchema,
  confidence: z.number().min(0).max(1),
  contextualKeywords: z.array(z.string()).max(5),
  chunkId: z.number().int().min(1),
  importance: z.number().min(0).max(1),
});

// Chunk analysis request schema for LM processing
export const chunkAnalysisRequestSchema = z.object({
  chunkId: z.number().int().min(1),
  chunkContent: z.string().min(1),
  chunkDuration: z.number().min(0.1),
  targetMoments: z.number().int().min(1).max(5), // 2-3 moments per chunk typically
  contentHints: z.array(z.string()).optional(),
  processingStrategy: z.enum(["simple", "standard", "complex", "enterprise"]),
});

// Chunk analysis response schema for LM output validation
export const chunkAnalysisResponseSchema = z.object({
  chunkId: z.number().int().min(1),
  candidates: z.array(momentCandidateSchema).min(1).max(5),
  processingTime: z.number().min(0).optional(),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

// Selection algorithm input schema
export const selectionAlgorithmInputSchema = z.object({
  allCandidates: z.array(momentCandidateSchema).min(1),
  targetCount: z.number().int().min(3).max(25),
  videoMetadata: videoMetadataSchema,
  analysis: videoAnalysisSchema,
  selectionCriteria: z
    .object({
      diversityWeight: z.number().min(0).max(1).default(0.3),
      confidenceWeight: z.number().min(0).max(1).default(0.4),
      distributionWeight: z.number().min(0).max(1).default(0.2),
      importanceWeight: z.number().min(0).max(1).default(0.1),
    })
    .optional(),
});

// Final timestamp selection schema
export const finalTimestampSelectionSchema = z.object({
  selectedTimestamps: z.array(timestampSchema),
  rejectedCandidates: z.array(momentCandidateSchema),
  selectionReasoning: z.array(z.string()),
  qualityMetrics: z.object({
    distributionScore: z.number().min(0).max(1),
    diversityScore: z.number().min(0).max(1),
    confidenceScore: z.number().min(0).max(1),
    overallScore: z.number().min(0).max(1),
  }),
  processingInfo: z.object({
    totalCandidates: z.number().int().min(1),
    chunksProcessed: z.number().int().min(1),
    processingTimeSeconds: z.number().min(0),
    strategyUsed: z.enum(["simple", "standard", "complex", "enterprise"]),
  }),
});

// Enhanced API request schema for chunked processing
export const chunkedProcessingRequestSchema = z.object({
  srtContent: z
    .string()
    .min(1, "SRT content is required")
    .max(MAX_FILE_SIZE, `SRT content is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`),
  processingMode: z.enum(["intelligent", "chunked", "legacy"]).default("intelligent"),
  customOptions: z
    .object({
      targetTimestamps: z.number().int().min(3).max(25).optional(),
      chunkingStrategy: z.enum(["time_based", "content_aware", "hybrid"]).default("hybrid"),
      qualityPreference: z.enum(["speed", "balanced", "quality"]).default("balanced"),
    })
    .optional(),
});

// Progress tracking schema for UI updates
export const processingProgressSchema = z.object({
  stage: z.enum([
    "analyzing_video",
    "creating_chunks",
    "processing_chunks",
    "selecting_timestamps",
    "finalizing_results",
  ]),
  currentStep: z.string(),
  progress: z.number().min(0).max(100),
  chunksProcessed: z.number().int().min(0),
  totalChunks: z.number().int().min(0),
  candidatesFound: z.number().int().min(0),
  estimatedTimeRemaining: z.number().min(0),
  message: z.string(),
});

// Error reporting schema for chunk processing
export const chunkProcessingErrorSchema = z.object({
  errorType: z.enum(["validation", "processing", "timeout", "quota", "network"]),
  chunkId: z.number().int().min(1).optional(),
  message: z.string(),
  retryable: z.boolean(),
  context: z.record(z.any()).optional(),
  timestamp: z.string(),
});
