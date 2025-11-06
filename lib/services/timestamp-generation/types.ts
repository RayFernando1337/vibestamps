/**
 * Type definitions for timestamp generation service
 */

export interface SrtMetadata {
  durationInSeconds: number;
  durationFormatted: string;
  isLongContent: boolean; // > 1 hour
  entriesCount?: number;
}

export interface TimestampGenerationRequest {
  srtContent: string;
  metadata: SrtMetadata;
}

export interface GenerationResult {
  keyMoments: Array<{
    time: string;
    description: string;
  }>;
  metadata: {
    totalMoments: number;
    timeRange: {
      first: string;
      last: string;
    };
    warningFlags?: string[];
  };
}
