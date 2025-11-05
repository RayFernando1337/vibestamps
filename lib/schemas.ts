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

// API Request schema for validating the generate endpoint
export const generateApiRequestSchema = z.object({
  srtContent: z
    .string()
    .min(1, "SRT content is required")
    .max(MAX_FILE_SIZE, `SRT content is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`),
});

// SRT Entries array schema
export const srtEntriesSchema = z.array(srtEntrySchema);

// Timestamp output schema for AI-generated timestamps
export const timestampItemSchema = z.object({
  time: z
    .string()
    .regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Invalid timestamp format (expected MM:SS or HH:MM:SS)")
    .describe("Timestamp in MM:SS or HH:MM:SS format"),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(150, "Description must be at most 150 characters")
    .describe("Brief description of what happens at this timestamp"),
});

// Schema for the complete AI-generated timestamp response
export const timestampResponseSchema = z.object({
  keyMoments: z
    .array(timestampItemSchema)
    .min(1, "At least one timestamp must be generated")
    .describe("Array of key moments with timestamps and descriptions"),
});
