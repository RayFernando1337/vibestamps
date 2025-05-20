import { MAX_FILE_SIZE } from "@/lib/constants";
import {
  generateApiRequestSchema,
  AIGeneratedTimestampsOutputSchema,
} from "@/lib/schemas";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamObject, wrapLanguageModel, type LanguageModelV1Middleware } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

// Initialize the Google Generative AI provider
const googleBase = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

// Create a fallback middleware
const fallbackMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    try {
      return await doGenerate();
    } catch (error) {
      console.warn("Primary model failed, falling back to gemini-2.5-pro-exp-03-25:", error);

      // Create the fallback model
      const fallbackModel = googleBase("gemini-2.5-pro-exp-03-25");

      // Call the fallback model with the same parameters
      return await fallbackModel.doGenerate(params);
    }
  },

  wrapStream: async ({ doStream, params }) => {
    try {
      return await doStream();
    } catch (error) {
      console.warn(
        "Primary model failed in streaming, falling back to gemini-2.5-pro-exp-03-25:",
        error
      );

      // Create the fallback model
      const fallbackModel = googleBase("gemini-2.5-pro-exp-03-25");

      // Call the fallback model with the same parameters
      return await fallbackModel.doStream(params);
    }
  },
};

// Create our primary model with fallback middleware
const primaryModel = googleBase("gemini-1.5-pro");
const modelWithFallback = wrapLanguageModel({
  model: primaryModel,
  middleware: fallbackMiddleware,
});

export async function POST(request: Request) {
  try {
    // Check request size before parsing
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Request too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB` },
        { status: 413 } // 413 Payload Too Large
      );
    }

    const body = await request.json();

    // Validate request body with Zod
    const validationResult = generateApiRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { srtContent, numTimestamps } = validationResult.data;

    // Extract the last timestamp from the SRT content using a more robust pattern
    // This looks for SRT timestamp patterns like "00:14:03,251 --> 00:14:03,751"
    const timestampRegex = /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g;
    let maxTimestamp = "00:00:00";
    let match;

    // Find all timestamp pairs and get the latest end time
    while ((match = timestampRegex.exec(srtContent)) !== null) {
      const endTime = match[2]; // Second capture group is the end time
      // Convert to seconds for comparison
      const endTimeParts = endTime.split(/[,:]/);
      const endTimeSeconds =
        parseInt(endTimeParts[0]) * 3600 +
        parseInt(endTimeParts[1]) * 60 +
        parseInt(endTimeParts[2]) +
        parseInt(endTimeParts[3]) / 1000;

      const maxTimeParts = maxTimestamp.split(/[,:]/);
      const maxTimeSeconds =
        parseInt(maxTimeParts[0]) * 3600 +
        parseInt(maxTimeParts[1]) * 60 +
        parseInt(maxTimeParts[2] || "0") +
        parseInt(maxTimeParts[3] || "0") / 1000;

      if (endTimeSeconds > maxTimeSeconds) {
        // Format nicely for display: HH:MM:SS
        const hours = endTimeParts[0];
        const minutes = endTimeParts[1];
        const seconds = endTimeParts[2];

        // Keep only hours if non-zero, otherwise just show MM:SS
        maxTimestamp = hours !== "00" ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
      }
    }

    // Create more explicit constraints about the video end time
    const videoEndTimeInfo =
      maxTimestamp !== "00:00:00"
        ? `The video's maximum duration is ${maxTimestamp}. ANY TIMESTAMP BEYOND ${maxTimestamp} IS INVALID AND MUST NOT BE INCLUDED IN YOUR RESPONSE. Only generate timestamps within the range of 00:00 to ${maxTimestamp}.`
        : "The video duration is unknown, but ensure all timestamps are chronologically ordered and make sense within a typical video context.";

    let currentOutputSchema = AIGeneratedTimestampsOutputSchema;
    let timestampCountInstruction =
      "Generate a list of 5-12 meaningful and concise timestamps that capture the key topics and demonstrations in the video.";

    if (numTimestamps && numTimestamps > 0) {
      currentOutputSchema = AIGeneratedTimestampsOutputSchema.refine(
        (data) => data.timestamps.length === numTimestamps,
        {
          message: `The AI must generate exactly ${numTimestamps} timestamp entries.`,
        }
      );
      timestampCountInstruction = `Generate exactly ${numTimestamps} meaningful and evenly spaced timestamp entries. This is a strict requirement.`;
    }

    const systemPrompt = `
      You are an expert AI assistant tasked with generating structured video timestamps from a transcript.
      Your output MUST be a valid JSON object that strictly adheres to the following Zod schema:

      \`\`\`json
      {
        "type": "object",
        "properties": {
          "timestamps": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "time": {
                  "type": "string",
                  "regex": "^(\\d{1,2}:\\d{2}(:\\d{2})?)$",
                  "description": "Timestamp in MM:SS or HH:MM:SS format. Must be within the video's duration."
                },
                "description": {
                  "type": "string",
                  "minLength": 3,
                  "maxLength": 150,
                  "description": "A concise, action-oriented summary of the content at this timestamp (3-150 characters)."
                }
              },
              "required": ["time", "description"]
            }
          }
        },
        "required": ["timestamps"]
      }
      \`\`\`

      Key Instructions:
      1.  **Video Duration Constraint**: ${videoEndTimeInfo} All 'time' entries must respect this.
      2.  **Timestamp Quantity**: ${timestampCountInstruction}
      3.  **Content Analysis**: Analyze the provided transcript to identify major themes, demonstrations, and significant topic shifts.
      4.  **Timestamp Accuracy**: Ensure timestamps are accurate (within a few seconds) to the content they describe.
      5.  **Description Quality**: Descriptions should be specific, action-oriented, and capture the essence of the segment using keywords from the transcript.
      6.  **Chronological Order**: All timestamp entries in the 'timestamps' array must be chronologically ordered.
      7.  **Focus on Key Moments**: Prioritize timestamps representing significant concepts or demonstrations, avoiding redundant or minor details.

      Analyze the following transcript and generate the JSON output as described.
    `;

    // Use the model with fallback middleware and stream structured objects
    const { partialObjectStream } = await streamObject({
      model: modelWithFallback,
      schema: currentOutputSchema,
      prompt: `${systemPrompt}\n\nHere is the transcript content from an SRT file:\n\n${srtContent}`,
      temperature: 0.1,
      // maxTokens: 1500, // maxTokens is often not used or needed for object streaming as the structure dictates completion
    });

    return new Response(partialObjectStream);
  } catch (error) {
    console.error("Error processing request:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
