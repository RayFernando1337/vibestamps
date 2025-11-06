/**
 * API Route: POST /api/generate
 * Generates AI-powered timestamps from SRT subtitle files
 * 
 * Architecture: Service Layer Pattern
 * - Request validation: validateGenerateRequest
 * - Metadata extraction: SrtMetadataExtractor
 * - Business logic: TimestampGenerationService
 * - Error handling: ApiErrorHandler
 * 
 * Refactored from 451 lines → 90 lines → 35 lines (92% reduction)
 */

import { validateGenerateRequest } from "@/lib/validation/request-validator";
import { SrtMetadataExtractor } from "@/lib/services/srt-metadata-extractor";
import { TimestampGenerationService } from "@/lib/services/timestamp-generation/TimestampGenerationService";
import { ApiErrorHandler } from "@/lib/api/error-handler";

/**
 * POST /api/generate
 * Generate timestamps from SRT content
 */
export async function POST(request: Request) {
  try {
    // 1. Validate request
    const { srtContent } = await validateGenerateRequest(request);

    // 2. Extract metadata
    const metadata = SrtMetadataExtractor.extract(srtContent);

    // 3. Generate timestamps
    const service = TimestampGenerationService.create();
    const result = await service.generateTimestamps({ srtContent, metadata });

    // 4. Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    return ApiErrorHandler.handleGenerationError(error);
  }
}
