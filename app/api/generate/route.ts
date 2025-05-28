import { MAX_FILE_SIZE } from "@/lib/constants";
import { generateApiRequestSchema, timestampsOutputSchema } from "@/lib/schemas";
import { getVideoMetadata, parseSrtContent, secondsToReadableTime } from "@/lib/srt-parser";
import { analyzeVideoForProcessing } from "@/lib/video-analyzer";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamObject, wrapLanguageModel, type LanguageModelV1Middleware } from "ai";
import { NextResponse } from "next/server";

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

    const { srtContent, timestampCount } = validationResult.data;

    console.log(`🎯 API received request for ${timestampCount} timestamps`);

    // Parse SRT content using our intelligent system
    const srtEntries = parseSrtContent(srtContent);

    if (srtEntries.length === 0) {
      return NextResponse.json(
        { error: "Could not parse any valid entries from the SRT content" },
        { status: 400 }
      );
    }

    // Get comprehensive video metadata and analysis
    const metadata = getVideoMetadata(srtEntries);
    const analysis = analyzeVideoForProcessing(metadata);

    // Get readable duration format
    const maxTimestamp = secondsToReadableTime(metadata.durationSeconds);
    const totalVideoSeconds = metadata.durationSeconds;

    console.log(`🧠 Intelligent analysis complete:`);
    console.log(
      `   Video duration: ${metadata.durationMinutes} minutes (${metadata.durationSeconds} seconds)`
    );
    console.log(`   Video category: ${metadata.videoCategory}`);
    console.log(`   Content density: ${metadata.contentDensity}`);
    console.log(`   Processing strategy: ${analysis.processingStrategy}`);
    console.log(`   Recommended chunks: ${analysis.recommendedChunkCount}`);
    console.log(`   Quality expectation: ${analysis.qualityExpectation}`);

    // Calculate intelligent distribution for guidance (but LM will decide final positions)
    const calculateIntelligentDistribution = (totalSeconds: number, count: number): string[] => {
      if (count === 1) return ["00:00"];

      const suggestions = [];
      // Always start with 00:00
      suggestions.push("00:00");

      // For remaining timestamps, distribute evenly but intelligently
      for (let i = 1; i < count; i++) {
        const position = (totalSeconds / (count - 1)) * i;
        const readableTime = secondsToReadableTime(position);
        suggestions.push(readableTime);
      }

      return suggestions;
    };

    const suggestedTimestamps = calculateIntelligentDistribution(totalVideoSeconds, timestampCount);
    console.log(
      `🎯 Calculated distribution for ${timestampCount} timestamps across ${metadata.durationMinutes} minutes:`,
      suggestedTimestamps
    );

    // Create enhanced system prompt using proven strategies
    const systemPrompt = `
You are a video timestamp generator using proven content analysis strategies. Your task is to analyze a video transcript and create meaningful timestamps that help viewers navigate to key moments.

CRITICAL REQUIREMENT: Generate EXACTLY ${timestampCount} timestamps. No more, no less.

VIDEO ANALYSIS:
- Total duration: ${maxTimestamp} (${metadata.durationMinutes} minutes)
- Content density: ${metadata.contentDensity} (${metadata.estimatedWordsPerMinute} words/min)
- Video category: ${metadata.videoCategory}
- Processing strategy: ${analysis.processingStrategy}
- Required timestamps: ${timestampCount}

PROVEN CONTENT FOCUS AREAS:
Find ${timestampCount} KEY MOMENTS representing:
- Introduction/Overview: Video opening and context setting
- Functional Demonstrations: Code execution, feature demonstrations, practical examples
- Topic Shifts: Major transitions between concepts or sections
- Complex Concepts: Detailed explanations of technical or important concepts
- Example Builds: Practical coding examples and applications
- Conclusions: Summaries, final thoughts, and wrap-ups

INTELLIGENT DISTRIBUTION GUIDANCE:
Use these timeframes as GUIDANCE for finding meaningful content:

${suggestedTimestamps
  .map((ts, i) => {
    if (i === 0) return `- Around ${ts}: Find the introduction, overview, or opening key point`;
    if (i === timestampCount - 1)
      return `- Around ${ts}: Find the conclusion, summary, or final important point`;
    return `- Around ${ts}: Find significant content, major topic changes, or key demonstrations`;
  })
  .join("\n")}

DESCRIPTION REQUIREMENTS (PROVEN EFFECTIVE):
- EXACTLY 2-5 words per description
- Start with action verbs: "Demonstrating", "Explaining", "Building", "Introducing"
- Include key technical terms and concepts
- Focus on what viewers would want to jump to
- Prioritize content flow over exact precision (±5 seconds is fine)

CONTENT ANALYSIS INSTRUCTIONS:
- Use time ranges as GUIDANCE, not exact positions
- Within each timeframe, find the MOST IMPORTANT or INTERESTING moment
- Look for: topic introductions, key explanations, major transitions, examples, conclusions
- Adjust timestamps to match when something meaningful actually happens
- Choose timestamps that provide genuine navigation value

DISTRIBUTION REQUIREMENTS:
- MUST span the ENTIRE video duration from 00:00 to ${maxTimestamp}
- Do NOT cluster all timestamps at the beginning
- Ensure good coverage across the full timeline
- Each timestamp should be in a different section of the video
- Prioritize content quality over mathematical precision

COUNT VALIDATION:
- You must provide exactly ${timestampCount} timestamps in the array
- Set actualCount to ${timestampCount}
- All timestamps must be unique (no duplicates)
- Validate timestamps are within 00:00 to ${maxTimestamp}

Your job is to intelligently analyze the content and find the most meaningful moments that align with proven content navigation patterns, not just place timestamps at mathematical positions.
    `;

    console.log(`🎯 Using Zod schema validation for exactly ${timestampCount} timestamps`);

    // Use structured output with automatic Zod validation and retry
    const { partialObjectStream } = streamObject({
      model: modelWithFallback,
      prompt: `${systemPrompt}\n\nAnalyze this video transcript and generate exactly ${timestampCount} high-quality timestamps using proven content analysis strategies:\n\n${srtContent}`,
      schema: timestampsOutputSchema,
      temperature: 0.1,
      maxRetries: 5,
    });

    // Transform structured output to text stream for UI compatibility
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            let lastFormattedOutput = "";
            let finalObject = null;

            for await (const partialObject of partialObjectStream) {
              finalObject = partialObject; // Keep track of the latest object

              if (partialObject?.timestamps && partialObject.timestamps.length > 0) {
                // Format the timestamps in the expected UI format
                let formattedOutput = "🕒 Key moments:\n";
                partialObject.timestamps.forEach((timestamp) => {
                  if (timestamp?.time && timestamp?.description) {
                    formattedOutput += `${timestamp.time} ${timestamp.description}\n`;
                  }
                });

                // Only send if the output has changed to avoid duplicates
                if (formattedOutput !== lastFormattedOutput) {
                  controller.enqueue(new TextEncoder().encode(formattedOutput));
                  lastFormattedOutput = formattedOutput;
                }
              }
            }

            // Log validation results with enhanced information
            if (finalObject) {
              const actualCount = finalObject.timestamps?.length || 0;
              const requestedCount = finalObject.requestedCount || timestampCount;

              console.log(`✅ Intelligent timestamp generation completed:`);
              console.log(
                `   Video: ${metadata.durationMinutes} minutes, ${metadata.videoCategory} category`
              );
              console.log(
                `   Strategy: ${analysis.processingStrategy} with ${analysis.qualityExpectation} quality`
              );
              console.log(`   Requested: ${requestedCount} timestamps`);
              console.log(`   Generated: ${actualCount} timestamps`);
              console.log(`   Validation: ${actualCount === requestedCount ? "PASSED" : "FAILED"}`);

              if (actualCount !== requestedCount) {
                console.warn(
                  `⚠️  Count mismatch detected - Zod validation should have caught this`
                );
              }
            }

            controller.close();
          } catch (error) {
            console.error("Structured output error:", error);

            // Enhanced error handling with analysis context
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes("validation") || errorMessage.includes("schema")) {
              console.error("🚨 Zod validation failed after retries:", errorMessage);
              console.error(
                `Context: ${metadata.durationMinutes}min ${metadata.videoCategory} video, ${analysis.processingStrategy} strategy`
              );
              const errorOutput = `🕒 Validation Error:\nFailed to generate exactly ${timestampCount} timestamps for this ${metadata.durationMinutes}-minute video after multiple attempts. Please try again.`;
              controller.enqueue(new TextEncoder().encode(errorOutput));
            } else {
              const errorOutput =
                "🕒 Error generating timestamps:\nPlease try again with a different file.";
              controller.enqueue(new TextEncoder().encode(errorOutput));
            }

            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
