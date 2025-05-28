/**
 * Video analysis utilities for intelligent timestamp calculation
 * Based on proven strategies for optimal video navigation
 */

import { VideoMetadata } from "./srt-parser";

export interface VideoAnalysis {
  optimalTimestampCount: number;
  recommendedChunkCount: number;
  chunkDurationMinutes: number;
  processingStrategy: "simple" | "standard" | "complex" | "enterprise";
  estimatedProcessingTime: number;
  qualityExpectation: "basic" | "good" | "excellent" | "premium";
}

export interface ContentDensityAnalysis {
  wordsPerMinute: number;
  pauseFrequency: number;
  topicChangeFrequency: number;
  complexityScore: number;
  recommendedApproach: "focused" | "balanced" | "comprehensive";
}

/**
 * Calculate optimal number of timestamps based on video duration
 * Uses proven 5-12 range for maximum effectiveness
 */
export function calculateOptimalTimestamps(durationMinutes: number): number {
  if (durationMinutes <= 30) return 5; // Short videos: concise navigation
  if (durationMinutes <= 60) return 7; // Medium videos: balanced coverage
  if (durationMinutes <= 90) return 9; // Long videos: comprehensive navigation
  if (durationMinutes <= 120) return 10; // Very long videos: detailed coverage
  return Math.min(12, Math.floor(durationMinutes / 12)); // Max 12, or 1 per 12 minutes
}

/**
 * Categorize video length for processing strategy
 */
export function categorizeVideoLength(durationMinutes: number): VideoMetadata["videoCategory"] {
  if (durationMinutes <= 30) return "short";
  if (durationMinutes <= 90) return "medium";
  if (durationMinutes <= 180) return "long";
  return "very_long";
}

/**
 * Calculate recommended chunk count for parallel processing
 */
export function calculateChunkCount(durationMinutes: number): number {
  // Target 5-7 minute chunks for optimal LM performance
  const targetChunkDuration = 6; // minutes
  const idealChunkCount = Math.ceil(durationMinutes / targetChunkDuration);

  // Ensure reasonable bounds
  const minChunks = 2;
  const maxChunks = 20; // Practical limit for processing

  return Math.max(minChunks, Math.min(maxChunks, idealChunkCount));
}

/**
 * Analyze content density to determine processing approach
 */
export function analyzeContentDensity(metadata: VideoMetadata): ContentDensityAnalysis {
  const { estimatedWordsPerMinute, hasLongPauses, contentDensity } = metadata;

  // Calculate pause frequency (rough estimate)
  const pauseFrequency = hasLongPauses ? 0.8 : 0.3;

  // Estimate topic change frequency based on content density
  let topicChangeFrequency = 0.5; // Default: moderate changes
  if (contentDensity === "high") topicChangeFrequency = 0.7;
  if (contentDensity === "low") topicChangeFrequency = 0.3;

  // Calculate complexity score (0-1)
  const complexityScore = Math.min(
    1,
    (estimatedWordsPerMinute / 200) * 0.4 + pauseFrequency * 0.3 + topicChangeFrequency * 0.3
  );

  // Determine recommended approach
  let recommendedApproach: ContentDensityAnalysis["recommendedApproach"] = "balanced";
  if (complexityScore < 0.4) recommendedApproach = "focused";
  if (complexityScore > 0.7) recommendedApproach = "comprehensive";

  return {
    wordsPerMinute: estimatedWordsPerMinute,
    pauseFrequency,
    topicChangeFrequency,
    complexityScore,
    recommendedApproach,
  };
}

/**
 * Determine processing strategy based on video characteristics
 */
export function determineProcessingStrategy(
  metadata: VideoMetadata,
  contentAnalysis: ContentDensityAnalysis
): VideoAnalysis["processingStrategy"] {
  const { durationMinutes, videoCategory } = metadata;
  const { complexityScore } = contentAnalysis;

  // Simple strategy for short, straightforward videos
  if (videoCategory === "short" && complexityScore < 0.4) {
    return "simple";
  }

  // Complex strategy for long, dense videos
  if (videoCategory === "very_long" || complexityScore > 0.8) {
    return "complex";
  }

  // Enterprise strategy for extremely long videos
  if (durationMinutes > 240) {
    // 4+ hours
    return "enterprise";
  }

  // Standard strategy for most videos
  return "standard";
}

/**
 * Estimate processing time based on video characteristics
 */
export function estimateProcessingTime(
  metadata: VideoMetadata,
  chunkCount: number,
  strategy: VideoAnalysis["processingStrategy"]
): number {
  // Base time per chunk (seconds)
  let baseTimePerChunk = 5;

  switch (strategy) {
    case "simple":
      baseTimePerChunk = 3;
      break;
    case "standard":
      baseTimePerChunk = 5;
      break;
    case "complex":
      baseTimePerChunk = 8;
      break;
    case "enterprise":
      baseTimePerChunk = 12;
      break;
  }

  // Additional overhead for coordination and selection
  const coordinationOverhead = 10; // seconds
  const selectionTime = Math.max(5, chunkCount * 0.5); // seconds

  return Math.ceil(chunkCount * baseTimePerChunk + coordinationOverhead + selectionTime);
}

/**
 * Determine quality expectation based on processing approach
 */
export function determineQualityExpectation(
  strategy: VideoAnalysis["processingStrategy"],
  optimalTimestampCount: number
): VideoAnalysis["qualityExpectation"] {
  if (strategy === "simple" && optimalTimestampCount <= 5) return "basic";
  if (strategy === "enterprise" || optimalTimestampCount >= 10) return "premium";
  if (strategy === "complex") return "excellent";
  return "good";
}

/**
 * Perform comprehensive video analysis for intelligent processing
 */
export function analyzeVideoForProcessing(metadata: VideoMetadata): VideoAnalysis {
  const optimalTimestampCount = calculateOptimalTimestamps(metadata.durationMinutes);
  const recommendedChunkCount = calculateChunkCount(metadata.durationMinutes);
  const chunkDurationMinutes = Math.ceil(metadata.durationMinutes / recommendedChunkCount);

  const contentAnalysis = analyzeContentDensity(metadata);
  const processingStrategy = determineProcessingStrategy(metadata, contentAnalysis);
  const estimatedProcessingTime = estimateProcessingTime(
    metadata,
    recommendedChunkCount,
    processingStrategy
  );
  const qualityExpectation = determineQualityExpectation(processingStrategy, optimalTimestampCount);

  return {
    optimalTimestampCount,
    recommendedChunkCount,
    chunkDurationMinutes,
    processingStrategy,
    estimatedProcessingTime,
    qualityExpectation,
  };
}

/**
 * Get user-friendly description of the video analysis
 */
export function getAnalysisDescription(analysis: VideoAnalysis, metadata: VideoMetadata): string {
  const {
    optimalTimestampCount,
    recommendedChunkCount,
    estimatedProcessingTime,
    qualityExpectation,
  } = analysis;
  const { durationMinutes, videoCategory } = metadata;

  const durationText =
    durationMinutes < 60
      ? `${durationMinutes}-minute`
      : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

  const qualityText = {
    basic: "good quality",
    good: "high quality",
    excellent: "excellent quality",
    premium: "premium quality",
  }[qualityExpectation];

  return `Will generate ${optimalTimestampCount} ${qualityText} timestamps for this ${durationText} ${videoCategory} video. Processing will take approximately ${estimatedProcessingTime} seconds using ${recommendedChunkCount} focused segments.`;
}

/**
 * Validate analysis results and provide warnings if needed
 */
export function validateAnalysis(
  analysis: VideoAnalysis,
  metadata: VideoMetadata
): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check for extremely long videos
  if (metadata.durationMinutes > 300) {
    // 5+ hours
    warnings.push("Very long video detected. Processing may take significant time.");
    recommendations.push("Consider breaking into smaller segments if possible.");
  }

  // Check for very dense content
  if (metadata.estimatedWordsPerMinute > 200) {
    warnings.push("High content density detected. Timestamps may be less precise.");
    recommendations.push("Review generated timestamps for accuracy.");
  }

  // Check for sparse content
  if (metadata.estimatedWordsPerMinute < 80) {
    warnings.push("Low content density detected. Some timestamps may be less meaningful.");
  }

  // Check processing time estimate
  if (analysis.estimatedProcessingTime > 120) {
    // 2+ minutes
    warnings.push("Long processing time expected due to video complexity.");
  }

  const isValid = warnings.length === 0 || !warnings.some((w) => w.includes("Very long video"));

  return { isValid, warnings, recommendations };
}
