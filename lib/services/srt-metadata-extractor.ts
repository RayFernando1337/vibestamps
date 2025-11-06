/**
 * Extracts and validates metadata from SRT subtitle files
 * Handles duration detection with fallback logging for edge cases
 */

import { getDurationInSeconds, formatDuration } from "@/lib/srt-parser";
import type { SrtMetadata } from "./timestamp-generation/types";

export class SrtMetadataExtractor {
  /**
   * Extract video metadata from SRT content
   * Includes duration detection with fallback logging for zero duration cases
   */
  static extract(srtContent: string): SrtMetadata {
    const durationInSeconds = getDurationInSeconds(srtContent);
    const durationFormatted = formatDuration(durationInSeconds);
    const isLongContent = durationInSeconds >= 3600; // > 1 hour

    // Log metadata for debugging
    this.logMetadata(durationInSeconds, durationFormatted, isLongContent);

    // Handle zero duration edge case
    if (durationInSeconds === 0) {
      this.handleZeroDuration(srtContent);
    }

    return {
      durationInSeconds,
      durationFormatted,
      isLongContent,
    };
  }

  /**
   * Log extracted metadata for debugging purposes
   */
  private static logMetadata(
    durationInSeconds: number,
    durationFormatted: string,
    isLongContent: boolean
  ): void {
    console.log(`📹 Video duration detected: ${durationInSeconds} seconds (${durationFormatted})`);
    console.log(`⏱️  Content type: ${isLongContent ? "Long (>1hr)" : "Short (<1hr)"}`);
  }

  /**
   * Handle zero duration edge case with fallback timestamp extraction
   */
  private static handleZeroDuration(srtContent: string): void {
    console.warn("⚠️  WARNING: Duration detection returned 0! Attempting manual extraction...");

    // Try to find the last timestamp in the SRT content
    const lines = srtContent.split("\n");
    const lastTimestampLine = lines.reverse().find((line) => /\d{2}:\d{2}:\d{2}/.test(line));

    if (lastTimestampLine) {
      console.log(`🔍 Last timestamp line found: ${lastTimestampLine}`);
    }
  }
}
