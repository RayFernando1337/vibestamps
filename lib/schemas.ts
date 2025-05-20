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
    .max(
      MAX_FILE_SIZE,
      `SRT content is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`
    ),
  granularity: z.enum(["fewer", "default", "more"]).optional(),
});

// SRT Entries array schema
export const srtEntriesSchema = z.array(srtEntrySchema);
