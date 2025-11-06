/**
 * API Route: POST /api/generate
 * Generates AI-powered timestamps from SRT subtitle files
 * 
 * Architecture: Service Layer Pattern
 * - Request validation handled by ValidationError middleware
 * - Business logic delegated to TimestampGenerationService
 * - AI integration abstracted through GeminiClient
 * - Prompt generation handled by PromptBuilder
 * 
 * Refactored from 451 lines to ~90 lines (80% reduction)
 */

import { NextResponse } from "next/server";
import { formatDuration, getDurationInSeconds } from "@/lib/srt-parser";
import { TimestampGenerationService } from "@/lib/services/timestamp-generation/TimestampGenerationService";
import { ValidationError, validateGenerateRequest } from "@/lib/validation/request-validator";
import { GeminiClient } from "@/lib/ai/gemini-client";

/**
 * POST /api/generate
 * Generate timestamps from SRT content
 */
export async function POST(request: Request) {
  try {
    // 1. Validate request (size, JSON format, schema)
    const { srtContent } = await validateGenerateRequest(request);

    // 2. Extract video metadata from SRT content
    const durationInSeconds = getDurationInSeconds(srtContent);
    const durationFormatted = formatDuration(durationInSeconds);
    const isLongContent = durationInSeconds >= 3600; // > 1 hour

    console.log(`📹 Video duration detected: ${durationInSeconds} seconds (${durationFormatted})`);
    console.log(`⏱️  Content type: ${isLongContent ? "Long (>1hr)" : "Short (<1hr)"}`);

    // Fallback: if duration detection fails, log warning
    if (durationInSeconds === 0) {
      console.warn("⚠️  WARNING: Duration detection returned 0! Attempting manual extraction...");
      // Try to find the last timestamp in the SRT content
      const lines = srtContent.split("\n");
      const lastTimestampLine = lines.reverse().find((line) => /\d{2}:\d{2}:\d{2}/.test(line));
      if (lastTimestampLine) {
        console.log(`🔍 Last timestamp line found: ${lastTimestampLine}`);
      }
    }

    // 3. Generate timestamps using service layer
    const service = TimestampGenerationService.create();
    const result = await service.generateTimestamps({
      srtContent,
      metadata: {
        durationInSeconds,
        durationFormatted,
        isLongContent,
      },
    });

    // 4. Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error processing request:", error);

    // Handle validation errors with proper status codes
    if (error instanceof ValidationError) {
      return error.toResponse();
    }

    // Handle AI-specific errors
    if (GeminiClient.isNoObjectError(error)) {
      return NextResponse.json(
        {
          error: "Failed to generate valid timestamps. The AI response could not be parsed.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
