/**
 * Main service for timestamp generation
 * Orchestrates prompt building, AI invocation, and result normalization
 */

import { GeminiClient, DEFAULT_AI_CONFIG } from "@/lib/ai/gemini-client";
import { PromptBuilder } from "@/lib/timestamp-utils/prompt-builder";
import { withExponentialRetry, DEFAULT_RETRY_CONFIG } from "@/lib/ai/retry-handler";
import type { TimestampGenerationRequest } from "./types";

export class TimestampGenerationService {
  private aiClient: GeminiClient;
  private promptBuilder: PromptBuilder;

  constructor(aiClient?: GeminiClient, promptBuilder?: PromptBuilder) {
    this.aiClient = aiClient || new GeminiClient(DEFAULT_AI_CONFIG);
    this.promptBuilder = promptBuilder || new PromptBuilder();
  }

  /**
   * Factory method to create service with default configuration
   */
  static create(): TimestampGenerationService {
    return new TimestampGenerationService();
  }

  /**
   * Generate timestamps from SRT content with retry logic
   */
  async generateTimestamps(request: TimestampGenerationRequest) {
    const { srtContent, metadata } = request;

    // Use retry wrapper for resilience
    return withExponentialRetry(
      async () => {
        // 1. Build the prompt
        const systemPrompt = this.promptBuilder.buildSystemPrompt({
          srtContent,
          durationInSeconds: metadata.durationInSeconds,
          durationFormatted: metadata.durationFormatted,
          isLongContent: metadata.isLongContent,
          endTimestamp: "", // Will be calculated by PromptBuilder
        });

        // 2. Stream AI response with validation
        const result = await this.aiClient.streamObject(
          systemPrompt,
          metadata.isLongContent,
          {
            onFinish: (object, error) => {
              if (error) {
                console.error("Generation finished with error:", error);
                return;
              }

              if (object && object.keyMoments && object.keyMoments.length > 0) {
                // Check if last timestamp is significantly before video end
                const lastTime = object.keyMoments[object.keyMoments.length - 1].time;
                const lastTimeParts = lastTime.split(":").map(Number);
                const lastTimeSeconds =
                  lastTimeParts.length === 3
                    ? lastTimeParts[0] * 3600 + lastTimeParts[1] * 60 + lastTimeParts[2]
                    : lastTimeParts[0] * 60 + lastTimeParts[1];

                const timeDifference = metadata.durationInSeconds - lastTimeSeconds;

                if (timeDifference > 300) {
                  // More than 5 minutes short
                  console.warn(
                    `⚠️  WARNING: Last timestamp (${lastTime}) is ${Math.floor(
                      timeDifference / 60
                    )} minutes before video end`
                  );
                }
              }
            },
          }
        );

        return result;
      },
      {
        ...DEFAULT_RETRY_CONFIG,
        onRetry: (attempt, error) => {
          console.error(`Attempt ${attempt} failed:`, error);
          
          // Log additional details for NoObjectGeneratedError
          if (GeminiClient.isNoObjectError(error)) {
            console.error("NoObjectGeneratedError details:", {
              cause: error.cause,
              text: error.text?.substring(0, 200),
              usage: error.usage,
            });
          }
        },
      }
    );
  }
}
