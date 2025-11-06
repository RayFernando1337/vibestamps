/**
 * Gemini AI client wrapper for timestamp generation
 */

import { gateway } from "@ai-sdk/gateway";
import { NoObjectGeneratedError, streamObject } from "ai";
import { timestampResponseSchema } from "@/lib/schemas";
import { normalizeTimestampResponse, TimestampResponse } from "@/lib/timestamp-utils/normalizer";

export interface AIConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  model: "google/gemini-2.5-pro",
  temperature: 1,
  maxOutputTokens: 65536,
  topP: 0.95,
};

export interface StreamCallbacks {
  onError?: (error: Error) => void;
  onFinish?: (object: TimestampResponse | null, error: Error | null) => void;
  onRepair?: (text: string, error: Error) => Promise<string>;
}

export class GeminiClient {
  private model: ReturnType<typeof gateway>;
  private config: AIConfig;

  constructor(config: AIConfig = DEFAULT_AI_CONFIG) {
    this.config = config;
    this.model = gateway(config.model);
  }

  /**
   * Stream AI-generated timestamps with validation and normalization
   */
  async streamObject(
    prompt: string,
    isLongContent: boolean,
    callbacks?: StreamCallbacks
  ) {
    const result = streamObject({
      model: this.model,
      schema: timestampResponseSchema,
      prompt: prompt,
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxOutputTokens,
      topP: this.config.topP,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: -1,
            includeThoughts: false,
          },
        },
      },
      // Handle streaming errors
      onError({ error }) {
        console.error("Stream error:", error);
        callbacks?.onError?.(error as Error);
      },
      // Validate and normalize final object
      onFinish({ object, error }) {
        if (error) {
          console.error("Validation error:", error);
          callbacks?.onFinish?.(null, error as Error);
        } else if (object) {
          // Normalize timestamp format based on video duration
          const normalizedObject = normalizeTimestampResponse(object, isLongContent);

          // Update the object with normalized timestamps
          object.keyMoments = normalizedObject.keyMoments;

          const timestampCount = object.keyMoments?.length || 0;
          console.log(`✅ Successfully generated ${timestampCount} timestamps`);

          // Log the time range covered
          if (object.keyMoments && object.keyMoments.length > 0) {
            const firstTime = object.keyMoments[0].time;
            const lastTime = object.keyMoments[object.keyMoments.length - 1].time;
            console.log(`⏱️  Time range: ${firstTime} to ${lastTime}`);
          }

          callbacks?.onFinish?.(object, null);
        }
      },
      // Attempt to repair malformed JSON
      experimental_repairText: async ({ text, error }) => {
        console.log("Attempting to repair malformed JSON:", error.message);

        if (callbacks?.onRepair) {
          return callbacks.onRepair(text, error as Error);
        }

        // Default repair logic
        let repaired = text.trim();

        // Add missing closing braces if needed
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
          repaired += "}".repeat(openBraces - closeBraces);
        }

        // Add missing closing brackets if needed
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/\]/g) || []).length;
        if (openBrackets > closeBrackets) {
          repaired += "]".repeat(openBrackets - closeBrackets);
        }

        console.log("Repaired JSON:", repaired);
        return repaired;
      },
    });

    return result;
  }

  /**
   * Check if an error is a NoObjectGeneratedError
   */
  static isNoObjectError(error: unknown): error is NoObjectGeneratedError {
    return NoObjectGeneratedError.isInstance(error);
  }
}
