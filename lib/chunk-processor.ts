/**
 * Video chunk processing utilities for intelligent segmentation
 * Supports natural break points and content-aware splitting
 */

import { BreakPoint, SrtEntry, srtTimeToSeconds } from "./srt-parser";
import { VideoAnalysis } from "./video-analyzer";

export interface SrtChunk {
  id: number;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  durationMinutes: number;
  entries: SrtEntry[];
  entryCount: number;
  wordCount: number;
  breakPointReason?: BreakPoint["reason"];
  confidence: number;
  isIntro: boolean;
  isOutro: boolean;
  hasNaturalBreak: boolean;
}

export interface ChunkMetadata {
  totalChunks: number;
  averageChunkDuration: number;
  naturalBreakCount: number;
  overlapDuration: number;
  qualityScore: number;
  processingHints: string[];
}

export interface ChunkingOptions {
  targetDurationMinutes: number;
  maxDurationMinutes: number;
  minDurationMinutes: number;
  overlapSeconds: number;
  respectNaturalBreaks: boolean;
  prioritizeIntroOutro: boolean;
}

/**
 * Default chunking options optimized for LM processing
 */
export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  targetDurationMinutes: 6,
  maxDurationMinutes: 8,
  minDurationMinutes: 4,
  overlapSeconds: 30,
  respectNaturalBreaks: true,
  prioritizeIntroOutro: true,
};

/**
 * Create time-based chunks with intelligent break point detection
 */
export function createTimeBasedChunks(
  entries: SrtEntry[],
  analysis: VideoAnalysis,
  options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS
): SrtChunk[] {
  if (entries.length === 0) return [];

  const chunks: SrtChunk[] = [];
  const targetDurationSeconds = options.targetDurationMinutes * 60;
  const maxDurationSeconds = options.maxDurationMinutes * 60;
  const minDurationSeconds = options.minDurationMinutes * 60;

  let currentChunkStart = 0;
  let chunkId = 1;

  while (currentChunkStart < entries.length) {
    const chunk = createSingleChunk(
      entries,
      currentChunkStart,
      targetDurationSeconds,
      maxDurationSeconds,
      minDurationSeconds,
      chunkId,
      options
    );

    chunks.push(chunk);

    // Move to next chunk start (with overlap handling)
    currentChunkStart = calculateNextChunkStart(chunk, entries, options);
    chunkId++;

    // Safety check to prevent infinite loops
    if (currentChunkStart <= chunk.entries[chunk.entries.length - 1].id) {
      currentChunkStart++;
    }
  }

  // Post-process chunks for quality and special sections
  return postProcessChunks(chunks, analysis);
}

/**
 * Create a single chunk starting from a specific entry
 */
function createSingleChunk(
  entries: SrtEntry[],
  startIndex: number,
  targetDuration: number,
  maxDuration: number,
  minDuration: number,
  chunkId: number,
  options: ChunkingOptions
): SrtChunk {
  const startEntry = entries[startIndex];
  const startSeconds = srtTimeToSeconds(startEntry.startTime);

  let endIndex = startIndex;
  let currentDuration = 0;
  let bestBreakPoint: number | null = null;
  let bestBreakReason: BreakPoint["reason"] | undefined;

  // Find the optimal end point for this chunk
  for (let i = startIndex; i < entries.length; i++) {
    const entry = entries[i];
    const entryEndSeconds = srtTimeToSeconds(entry.endTime);
    currentDuration = entryEndSeconds - startSeconds;

    // Check if we've reached target duration
    if (currentDuration >= targetDuration) {
      // Look for natural break points within acceptable range
      if (options.respectNaturalBreaks) {
        const breakPoint = findNearestBreakPoint(
          entries,
          i,
          startIndex,
          maxDuration - targetDuration
        );
        if (breakPoint) {
          endIndex = breakPoint.index;
          bestBreakReason = breakPoint.reason;
          break;
        }
      }

      // If no natural break found and we're within max duration, use current position
      if (currentDuration <= maxDuration) {
        endIndex = i;
        break;
      }

      // If we exceeded max duration, use previous entry
      endIndex = Math.max(startIndex, i - 1);
      break;
    }

    endIndex = i;
  }

  // Ensure minimum duration is met (if possible)
  if (currentDuration < minDuration && endIndex < entries.length - 1) {
    const remainingEntries = entries.length - startIndex;
    const minEndIndex = Math.min(
      entries.length - 1,
      startIndex + Math.floor(remainingEntries * (minDuration / targetDuration))
    );
    endIndex = Math.max(endIndex, minEndIndex);
  }

  // Create chunk entries
  const chunkEntries = entries.slice(startIndex, endIndex + 1);
  const endSeconds = srtTimeToSeconds(chunkEntries[chunkEntries.length - 1].endTime);
  const actualDuration = endSeconds - startSeconds;

  // Calculate chunk properties
  const wordCount = chunkEntries.reduce((count, entry) => {
    return count + entry.text.split(/\s+/).length;
  }, 0);

  const isIntro = chunkId === 1;
  const isOutro = endIndex >= entries.length - 1;
  const hasNaturalBreak = bestBreakReason !== undefined;

  // Calculate confidence score based on multiple factors
  const confidence = calculateChunkConfidence(
    actualDuration,
    targetDuration,
    hasNaturalBreak,
    wordCount,
    chunkEntries.length
  );

  return {
    id: chunkId,
    startTime: startEntry.startTime,
    endTime: chunkEntries[chunkEntries.length - 1].endTime,
    startSeconds,
    endSeconds,
    durationMinutes: Math.round((actualDuration / 60) * 10) / 10,
    entries: chunkEntries,
    entryCount: chunkEntries.length,
    wordCount,
    breakPointReason: bestBreakReason,
    confidence,
    isIntro,
    isOutro,
    hasNaturalBreak,
  };
}

/**
 * Find the nearest natural break point within acceptable range
 */
function findNearestBreakPoint(
  entries: SrtEntry[],
  currentIndex: number,
  startIndex: number,
  searchRange: number
): { index: number; reason: BreakPoint["reason"] } | null {
  const searchStart = Math.max(startIndex, currentIndex - Math.floor(searchRange / 2));
  const searchEnd = Math.min(entries.length - 1, currentIndex + Math.floor(searchRange / 2));

  let bestBreakPoint: { index: number; reason: BreakPoint["reason"]; score: number } | null = null;

  for (let i = searchStart; i <= searchEnd; i++) {
    if (i >= entries.length - 1) break;

    const currentEntry = entries[i];
    const nextEntry = entries[i + 1];

    const currentEndSeconds = srtTimeToSeconds(currentEntry.endTime);
    const nextStartSeconds = srtTimeToSeconds(nextEntry.startTime);
    const pause = nextStartSeconds - currentEndSeconds;

    let score = 0;
    let reason: BreakPoint["reason"] = "long_pause";

    // Score based on pause length
    if (pause >= 3) {
      score += 0.6;
      reason = "long_pause";
    } else if (pause >= 1.5) {
      score += 0.3;
      reason = "section_break";
    }

    // Score based on text content
    const currentText = currentEntry.text.toLowerCase();
    const nextText = nextEntry.text.toLowerCase();

    // Look for topic transition indicators
    const topicChangeIndicators = [
      "now",
      "next",
      "so",
      "okay",
      "alright",
      "moving on",
      "let's",
      "another",
      "different",
      "change",
      "switch",
      "turn to",
      "look at",
      "speaking of",
    ];

    if (topicChangeIndicators.some((indicator) => nextText.includes(indicator))) {
      score += 0.4;
      reason = "topic_change";
    }

    // Score based on sentence endings
    if (currentText.match(/[.!?]$/)) {
      score += 0.2;
    }

    // Prefer break points closer to target
    const distanceFromTarget = Math.abs(i - currentIndex);
    const distancePenalty = (distanceFromTarget / searchRange) * 0.2;
    score -= distancePenalty;

    if (score > 0.4 && (!bestBreakPoint || score > bestBreakPoint.score)) {
      bestBreakPoint = { index: i, reason, score };
    }
  }

  return bestBreakPoint ? { index: bestBreakPoint.index, reason: bestBreakPoint.reason } : null;
}

/**
 * Calculate the next chunk start index with overlap handling
 */
function calculateNextChunkStart(
  currentChunk: SrtChunk,
  allEntries: SrtEntry[],
  options: ChunkingOptions
): number {
  const lastEntryIndex = currentChunk.entries[currentChunk.entries.length - 1].id - 1;

  if (options.overlapSeconds === 0) {
    return lastEntryIndex + 1;
  }

  // Find entry that starts approximately overlapSeconds before the end
  const overlapStartTime = currentChunk.endSeconds - options.overlapSeconds;

  for (let i = lastEntryIndex; i >= 0; i--) {
    const entryStartSeconds = srtTimeToSeconds(allEntries[i].startTime);
    if (entryStartSeconds <= overlapStartTime) {
      return Math.max(0, i);
    }
  }

  return Math.max(0, lastEntryIndex);
}

/**
 * Calculate confidence score for chunk quality
 */
function calculateChunkConfidence(
  actualDuration: number,
  targetDuration: number,
  hasNaturalBreak: boolean,
  wordCount: number,
  entryCount: number
): number {
  let confidence = 0.5; // Base confidence

  // Duration score (how close to target)
  const durationRatio =
    Math.min(actualDuration, targetDuration) / Math.max(actualDuration, targetDuration);
  confidence += durationRatio * 0.3;

  // Natural break bonus
  if (hasNaturalBreak) {
    confidence += 0.2;
  }

  // Content density score
  const wordsPerSecond = wordCount / actualDuration;
  if (wordsPerSecond >= 2 && wordsPerSecond <= 4) {
    // Good density range
    confidence += 0.1;
  }

  // Entry count score (not too sparse, not too dense)
  const entriesPerMinute = (entryCount / actualDuration) * 60;
  if (entriesPerMinute >= 10 && entriesPerMinute <= 30) {
    confidence += 0.1;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Post-process chunks for quality improvements and special handling
 */
function postProcessChunks(chunks: SrtChunk[], analysis: VideoAnalysis): SrtChunk[] {
  if (chunks.length === 0) return chunks;

  // Identify and enhance intro/outro chunks
  if (analysis.processingStrategy === "complex" || analysis.processingStrategy === "enterprise") {
    chunks[0].isIntro = true;
    chunks[chunks.length - 1].isOutro = true;
  }

  // Adjust chunk confidence based on overall strategy
  const strategyMultiplier = {
    simple: 0.9,
    standard: 1.0,
    complex: 1.1,
    enterprise: 1.2,
  }[analysis.processingStrategy];

  chunks.forEach((chunk) => {
    chunk.confidence = Math.min(1, chunk.confidence * strategyMultiplier);
  });

  return chunks;
}

/**
 * Generate metadata about the chunking process
 */
export function generateChunkMetadata(chunks: SrtChunk[]): ChunkMetadata {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      averageChunkDuration: 0,
      naturalBreakCount: 0,
      overlapDuration: 0,
      qualityScore: 0,
      processingHints: ["No chunks generated"],
    };
  }

  const totalDuration = chunks.reduce((sum, chunk) => sum + chunk.durationMinutes, 0);
  const averageChunkDuration = totalDuration / chunks.length;
  const naturalBreakCount = chunks.filter((chunk) => chunk.hasNaturalBreak).length;
  const averageConfidence =
    chunks.reduce((sum, chunk) => sum + chunk.confidence, 0) / chunks.length;

  // Calculate estimated overlap
  const estimatedOverlap = chunks.length > 1 ? (chunks.length - 1) * 0.5 : 0; // 30 seconds default

  // Generate processing hints
  const processingHints: string[] = [];

  if (averageConfidence > 0.8) {
    processingHints.push("High quality chunking - excellent natural breaks");
  } else if (averageConfidence > 0.6) {
    processingHints.push("Good quality chunking - adequate break points");
  } else {
    processingHints.push("Fair quality chunking - consider manual review");
  }

  if (naturalBreakCount / chunks.length > 0.7) {
    processingHints.push("Excellent natural break point detection");
  }

  if (averageChunkDuration < 4) {
    processingHints.push("Short chunks may need consolidation");
  } else if (averageChunkDuration > 8) {
    processingHints.push("Long chunks may need subdivision");
  }

  return {
    totalChunks: chunks.length,
    averageChunkDuration: Math.round(averageChunkDuration * 10) / 10,
    naturalBreakCount,
    overlapDuration: estimatedOverlap,
    qualityScore: Math.round(averageConfidence * 100),
    processingHints,
  };
}

/**
 * Validate chunk quality and structure
 */
export function validateChunks(chunks: SrtChunk[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (chunks.length === 0) {
    errors.push("No chunks generated");
    return { isValid: false, errors, warnings };
  }

  // Check for reasonable chunk count
  if (chunks.length > 30) {
    warnings.push(`High chunk count (${chunks.length}) may affect processing efficiency`);
  }

  // Validate each chunk
  chunks.forEach((chunk, index) => {
    if (chunk.entries.length === 0) {
      errors.push(`Chunk ${index + 1} has no entries`);
    }

    if (chunk.durationMinutes < 1) {
      warnings.push(`Chunk ${index + 1} is very short (${chunk.durationMinutes} minutes)`);
    }

    if (chunk.durationMinutes > 10) {
      warnings.push(`Chunk ${index + 1} is very long (${chunk.durationMinutes} minutes)`);
    }

    if (chunk.confidence < 0.3) {
      warnings.push(
        `Chunk ${index + 1} has low confidence (${Math.round(chunk.confidence * 100)}%)`
      );
    }

    if (chunk.wordCount < 50) {
      warnings.push(`Chunk ${index + 1} has very low word count (${chunk.wordCount} words)`);
    }
  });

  // Check for chronological order
  for (let i = 1; i < chunks.length; i++) {
    if (chunks[i].startSeconds <= chunks[i - 1].startSeconds) {
      errors.push(`Chunk ${i + 1} starts before or at the same time as chunk ${i}`);
    }
  }

  const isValid = errors.length === 0;
  return { isValid, errors, warnings };
}
