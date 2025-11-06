import { MAX_FILE_SIZE } from "@/lib/constants";
import { generateApiRequestSchema, timestampResponseSchema } from "@/lib/schemas";
import { formatDuration, getDurationInSeconds } from "@/lib/srt-parser";
import { gateway } from "@ai-sdk/gateway";
import { NoObjectGeneratedError, streamObject } from "ai";
import { NextResponse } from "next/server";

// Initialize the Vercel AI Gateway with Gemini 2.5 Pro
// When deployed on Vercel, authentication is automatic
// For local development, set AI_GATEWAY_API_KEY in your .env.local
const model = gateway("google/gemini-2.5-pro");

/**
 * Normalize timestamp format based on video duration (YouTube standard)
 * For videos under 1 hour: MM:SS with leading zeros (00:00, 01:23, 15:30)
 * For videos over 1 hour: HH:MM:SS with leading zeros (00:00:00, 00:01:23, 02:23:02)
 */
function normalizeTimestampFormat(timestamp: string, isLongContent: boolean): string {
  // Parse the timestamp
  const parts = timestamp.split(":");

  if (parts.length === 3) {
    // HH:MM:SS format
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);

    if (!isLongContent && hours === 0) {
      // Video is under 1 hour and timestamp has hours - convert to MM:SS
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    // For long content, ensure proper HH:MM:SS format with leading zeros
    if (isLongContent) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  } else if (parts.length === 2) {
    // MM:SS format
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (isLongContent) {
      // Video is over 1 hour but timestamp is in MM:SS - convert to HH:MM:SS
      return `00:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    // For short content, ensure MM:SS format with leading zeros
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return timestamp;
}

/**
 * Normalize all timestamps in the response based on video duration
 */
function normalizeTimestampResponse(
  response: { keyMoments: Array<{ time: string; description: string }> },
  isLongContent: boolean
): { keyMoments: Array<{ time: string; description: string }> } {
  const normalized = {
    ...response,
    keyMoments: response.keyMoments.map((moment) => ({
      ...moment,
      time: normalizeTimestampFormat(moment.time, isLongContent),
    })),
  };

  // Log normalization for debugging
  const changedCount = response.keyMoments.filter(
    (moment, index) => moment.time !== normalized.keyMoments[index].time
  ).length;

  if (changedCount > 0) {
    console.log(`📝 Normalized ${changedCount} timestamps for format consistency`);
    console.log(`   Format: ${isLongContent ? "HH:MM:SS (video >1hr)" : "MM:SS (video <1hr)"}`);
  }

  return normalized;
}

// Retry wrapper with exponential backoff
async function generateTimestampsWithRetry(
  srtContent: string,
  durationInSeconds: number,
  durationFormatted: string,
  isLongContent: boolean,
  maxRetries = 3
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} of ${maxRetries} to generate timestamps`);

      // Calculate the end timestamp in HH:MM:SS format for the prompt
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      const endTimestamp =
        hours > 0
          ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
          : `${minutes}:${seconds.toString().padStart(2, "0")}`;

      // Determine format example based on video duration
      const formatExample = isLongContent
        ? "01:08:08 (HH:MM:SS with leading zeros)"
        : "08:20 (MM:SS with leading zeros)";

      // Generate appropriate example timestamps based on video duration
      const goldStandardExample = isLongContent
        ? `{
  "keyMoments": [
    {"time": "00:00:00", "description": "Cursor to refund unexpected charges"},
    {"time": "00:02:11", "description": "Explaining the new Cursor pricing tiers"},
    {"time": "00:04:38", "description": "How to claim a refund for overages"},
    {"time": "00:08:20", "description": "Showcasing the Ray Transcribes app"},
    {"time": "00:10:43", "description": "Recommending Magic UI templates"},
    {"time": "00:14:40", "description": "How to integrate Claude Code into Cursor"},
    {"time": "00:18:30", "description": "Discovering the Magic UI Command Palette"},
    {"time": "00:24:25", "description": "Detailing advanced Claude Code workflow"},
    {"time": "00:32:40", "description": "Pro-tip for Stripe integration (closed-loop problem)"},
    {"time": "00:35:20", "description": "Claude Code terminal navigation tips"},
    {"time": "00:39:35", "description": "The MLX transcriber repo hits 420 stars"},
    {"time": "00:44:40", "description": "Deep dive into the Claude Code workflow"},
    {"time": "00:52:56", "description": "Explaining the full development stack"},
    {"time": "00:59:08", "description": "Final recap of the Cursor pricing changes"},
    {"time": "01:08:08", "description": "Explaining YouTube memberships and Discord access"},
    {"time": "01:12:00", "description": "Ray's birthday preach on AI engineering"},
    {"time": "01:19:50", "description": "Using Claude Code to plan app launch"},
    {"time": "01:25:36", "description": "Deep dive on the planning mode workflow"},
    {"time": "01:32:21", "description": "Final walkthrough of Claude Code setup in Cursor"}
  ]
}`
        : `{
  "keyMoments": [
    {"time": "00:00", "description": "Introduction to the topic"},
    {"time": "02:15", "description": "Explaining key concepts"},
    {"time": "05:30", "description": "Live demonstration begins"},
    {"time": "08:45", "description": "Common pitfalls to avoid"},
    {"time": "12:20", "description": "Pro-tip for implementation"},
    {"time": "15:40", "description": "Q&A and community feedback"},
    {"time": "18:30", "description": "Advanced techniques walkthrough"},
    {"time": "22:15", "description": "Real-world example"},
    {"time": "25:50", "description": "Troubleshooting common issues"},
    {"time": "28:30", "description": "Final thoughts and recap"}
  ]
}`;

      const systemPrompt = `
<file_contents>
\`\`\`srt
${srtContent}
\`\`\`
</file_contents>
<video_metadata>
Video Duration: ${durationFormatted} (ends at timestamp ${endTimestamp})
Total Length: ${durationInSeconds} seconds
</video_metadata>
<meta prompt 1 = "Generate Timestamps v4">
# Timestamp Generation Guidelines v4.0

These instructions are designed to generate a comprehensive, yet scannable, set of timestamps from a video transcript, especially for longer formats like livestreams. The goal is to capture not just major topics, but also specific demonstrations, key insights, and memorable moments that provide maximum value to the viewer.

### Core Principles

1. **Content-Density Over Fixed Numbers:** The number of timestamps should reflect the density of the content, not a fixed count. As a general guideline, aim for **one key moment every 5-10 minutes**, but be flexible. A dense 10-minute segment might need two timestamps, while a 15-minute casual chat might only need one.
2. **Capture Value, Not Just Topics:** The best timestamps point to specific, valuable information. A viewer should be able to look at the list and immediately find a pro-tip, a deep-dive, or a specific answer.
3. **Be Specific and Action-Oriented:** Descriptions should be concise (3-6 words) and clearly state what is happening. Use action verbs to convey activity and learning.

### Step-by-Step Process

### Step 1: Initial Analysis

- Determine the total video duration from the final timestamp in the transcript.
- Quickly read through the transcript to get a high-level sense of the main themes and the overall flow of the session.

### Step 2: Identify Key Moments

Scan the transcript for the following types of content. This goes beyond simple topic changes and is the key to creating a rich, useful list.

- **The Hook:** Always create a \`${
        isLongContent ? "00:00:00" : "00:00"
      }\` timestamp that uses the first few impactful words of the video.
- **Major Topic Shifts:** The most obvious markers, such as moving from a news update (Cursor pricing) to a personal project demo (Ray Transcribes).
- **Specific Feature Demonstrations:** Pinpoint the exact moment a feature is shown and explained.
    - *Example:* "How to integrate Claude Code into Cursor"
- **"Pro-Tip" or "Nugget" Segments:** Isolate moments where a specific, non-obvious piece of advice is given that could save a viewer time or trouble.
    - *Example:* "Pro-tip for Stripe integration (the 'closed-loop' problem)"
- **Workflow Deep Dives:** Capture segments dedicated to explaining *how* the host accomplishes a complex task from start to finish.
    - *Example:* "Detailing his advanced Claude Code workflow"
- **Live Discoveries or "Aha!" Moments:** If the host discovers a new feature or has a moment of realization live on stream, capture it. It adds personality and is often highly engaging.
    - *Example:* "Discovering the Magic UI Command Palette"
- **Community & Meta Moments:** Acknowledge significant interactions with the community or milestones reached during the stream.
    - *Example:* "The MLX transcriber repo hits 420 stars"
- **Philosophical or "Soapbox" Segments:** If the host takes a moment to share their broader thoughts on a topic, it's a distinct content block worth timestamping.
    - *Example:* "His birthday 'preach' on AI engineering"

### Step 3: Draft Timestamps and Descriptions

- For each identified moment, note the timestamp where it begins.
- Write a concise, specific, and action-oriented description (3-6 words).
    - **Good:** "Explaining the new Cursor pricing tiers"
    - **Avoid:** "Talks about pricing"
    - **Good:** "Final walkthrough of Claude Code setup in Cursor"
    - **Avoid:** "Claude Code"
- Use parentheses to add clarifying context where needed (e.g., \`(the 'closed-loop' problem)\`).

### Step 4: Format and Review

1. Assemble the final list in chronological order.
2. Generate a structured JSON object with \`keyMoments\` array containing objects with \`time\` and \`description\` fields.
3. Read the entire list from top to bottom. Does it tell the story of the video? Is it easy to scan? Ensure the timestamps are accurate and the descriptions are valuable. Adjust wording for clarity and impact.

### Gold Standard Example Format

The output should be a JSON object with this structure:
${goldStandardExample}
</meta prompt 1>
<user_instructions>
Generate timestamps for this content using the Generate Timestamps v4 instructions. This content is ${durationFormatted} long${
        isLongContent ? ", so I'm going to need you to give me more timestamps than normal" : ""
      }. Provide an appropriate number of timestamps based on content density (aim for one key moment every 5-10 minutes as a guideline).

CRITICAL REQUIREMENTS:
1. You MUST analyze the ENTIRE transcript from start (${
        isLongContent ? "00:00:00" : "00:00"
      }) to the END (${endTimestamp}).
2. The video is ${durationFormatted} long - your final timestamp should be close to ${endTimestamp}.
3. Do NOT stop early - generate timestamps that span the COMPLETE duration from beginning to ${endTimestamp}.
4. ALL timestamps must use the ${isLongContent ? "HH:MM:SS" : "MM:SS"} format with leading zeros.

TIMESTAMP FORMAT REQUIREMENT (CRITICAL - YouTube Standard):
- Video duration: ${durationFormatted} (${durationInSeconds} seconds)
- ${
        isLongContent
          ? "This video is OVER 1 HOUR long. You MUST use HH:MM:SS format with LEADING ZEROS for ALL timestamps (e.g., 00:00:00, 00:15:30, 01:08:08)."
          : "This video is UNDER 1 HOUR long. You MUST use MM:SS format with LEADING ZEROS for ALL timestamps (e.g., 00:00, 08:20, 15:30). DO NOT use HH:MM:SS format."
      }
- Format example: ${formatExample}
- ALWAYS include leading zeros (e.g., "08:20" NOT "8:20", "01:08:08" NOT "1:08:08")

IMPORTANT: Return ONLY a valid JSON object matching the structure shown in the Gold Standard Example Format above. Use the exact field names "keyMoments", "time", and "description". ${
        isLongContent
          ? "Use HH:MM:SS format with leading zeros for ALL timestamps."
          : "Use MM:SS format with leading zeros for ALL timestamps - DO NOT include hours."
      }

Expected JSON structure (timestamps should go all the way to ${endTimestamp}):
{
  "keyMoments": [
    {"time": "${isLongContent ? "00:00:00" : "00:00"}", "description": "Opening"},
    {"time": "${isLongContent ? "00:15:30" : "15:30"}", "description": "Key topic"},
    ...continue through to approximately ${endTimestamp}...
    {"time": "${endTimestamp}", "description": "Closing"}
  ]
}
</user_instructions>
    `;

      const result = streamObject({
        model: model,
        schema: timestampResponseSchema,
        prompt: systemPrompt,
        temperature: 1,
        maxOutputTokens: 65536,
        topP: 0.95,
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
          console.error(`Stream error on attempt ${attempt + 1}:`, error);
        },
        // Validate final object and normalize timestamps
        onFinish({ object, error }) {
          if (error) {
            console.error(`Validation error on attempt ${attempt + 1}:`, error);
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
              console.log(
                `⏱️  Time range: ${firstTime} to ${lastTime} (requested: ${endTimestamp} / ${durationFormatted})`
              );

              // Parse last timestamp to seconds for comparison
              const lastTimeParts = lastTime.split(":").map(Number);
              const lastTimeSeconds =
                lastTimeParts.length === 3
                  ? lastTimeParts[0] * 3600 + lastTimeParts[1] * 60 + lastTimeParts[2]
                  : lastTimeParts[0] * 60 + lastTimeParts[1];

              const timeDifference = durationInSeconds - lastTimeSeconds;

              if (timeDifference > 300) {
                // More than 5 minutes short
                console.warn(
                  `⚠️  WARNING: Last timestamp (${lastTime}) is ${Math.floor(
                    timeDifference / 60
                  )} minutes before video end (${endTimestamp})`
                );
              }
            }
          }
        },
        // Attempt to repair malformed JSON
        experimental_repairText: async ({ text, error }) => {
          console.log("Attempting to repair malformed JSON:", error.message);
          // Try to fix common JSON issues
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
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      // Handle specific error types
      if (NoObjectGeneratedError.isInstance(error)) {
        console.error("NoObjectGeneratedError details:", {
          cause: error.cause,
          text: error.text?.substring(0, 200), // Log first 200 chars
          usage: error.usage,
        });
      }

      // Don't retry on the last attempt
      if (attempt < maxRetries - 1) {
        const delayMs = 1000 * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
        console.log(`Waiting ${delayMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  throw lastError || new Error("Failed to generate timestamps after all retries");
}

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
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { srtContent } = validationResult.data;

    // Get the duration in seconds for logic checks
    const durationInSeconds = getDurationInSeconds(srtContent);
    console.log(`📹 Video duration detected: ${durationInSeconds} seconds`);

    // Format for display in the prompt
    const durationFormatted = formatDuration(durationInSeconds);
    console.log(`⏱️  Formatted duration: ${durationFormatted}`);

    // Check if content is over an hour (3600 seconds) to request more timestamps
    const isLongContent = durationInSeconds >= 3600;

    // Fallback: if duration detection fails, extract from last SRT entry manually
    if (durationInSeconds === 0) {
      console.warn("⚠️  WARNING: Duration detection returned 0! Attempting manual extraction...");
      // Try to find the last timestamp in the SRT content
      const lines = srtContent.split("\n");
      const lastTimestampLine = lines.reverse().find((line) => /\d{2}:\d{2}:\d{2}/.test(line));
      if (lastTimestampLine) {
        console.log(`🔍 Last timestamp line found: ${lastTimestampLine}`);
      }
    }

    // Generate timestamps with retry logic
    const result = await generateTimestampsWithRetry(
      srtContent,
      durationInSeconds,
      durationFormatted,
      isLongContent,
      3 // max retries
    );

    // Return the structured stream response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error processing request:", error);

    // Provide more specific error messages
    if (NoObjectGeneratedError.isInstance(error)) {
      return NextResponse.json(
        {
          error: "Failed to generate valid timestamps. The AI response could not be parsed.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
