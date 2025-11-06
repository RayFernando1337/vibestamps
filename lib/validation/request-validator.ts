/**
 * Request validation utilities for API endpoints
 */

import { NextResponse } from "next/server";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { generateApiRequestSchema } from "@/lib/schemas";

export interface ValidatedRequest {
  srtContent: string;
}

/**
 * Validate incoming request for timestamp generation
 * Checks size, parses JSON, and validates schema
 */
export async function validateGenerateRequest(
  request: Request
): Promise<ValidatedRequest> {
  // Check request size before parsing
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
    throw new ValidationError(
      `Request too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`,
      413
    );
  }

  // Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON in request body", 400);
  }

  // Validate with Zod schema
  const validationResult = generateApiRequestSchema.safeParse(body);

  if (!validationResult.success) {
    throw new ValidationError(
      validationResult.error.issues[0].message,
      400
    );
  }

  return validationResult.data;
}

/**
 * Custom error class for validation errors with HTTP status codes
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ValidationError";
  }

  toResponse(): NextResponse {
    return NextResponse.json({ error: this.message }, { status: this.statusCode });
  }
}
