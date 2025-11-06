/**
 * Centralized API error handling for consistent error responses
 * Provides type-safe error handling with appropriate HTTP status codes
 */

import { NextResponse } from "next/server";
import { ValidationError } from "@/lib/validation/request-validator";
import { GeminiClient } from "@/lib/ai/gemini-client";

export class ApiErrorHandler {
  /**
   * Handle errors from timestamp generation API
   * Returns appropriate NextResponse based on error type with correct status codes
   */
  static handleGenerationError(error: unknown): NextResponse {
    console.error("Error processing request:", error);

    // Validation errors (400 Bad Request)
    if (error instanceof ValidationError) {
      return error.toResponse();
    }

    // AI-specific errors (500 Internal Server Error)
    if (GeminiClient.isNoObjectError(error)) {
      return this.createJsonResponse(
        {
          error: "Failed to generate valid timestamps. The AI response could not be parsed.",
          details: error.message,
        },
        500
      );
    }

    // Generic errors (500 Internal Server Error)
    return this.createJsonResponse(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }

  /**
   * Helper to create consistent JSON error responses
   */
  private static createJsonResponse(body: Record<string, unknown>, status: number): NextResponse {
    return NextResponse.json(body, { status });
  }
}
