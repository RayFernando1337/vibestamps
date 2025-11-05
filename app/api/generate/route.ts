import { MAX_FILE_SIZE } from "@/lib/constants";
import { generateApiRequestSchema } from "@/lib/schemas";
import { getDurationFromSrtContent } from "@/lib/srt-parser";
import { gateway } from "@ai-sdk/gateway";
import { streamText } from "ai";
import { NextResponse } from "next/server";

// Initialize the Vercel AI Gateway with Gemini 2.5 Pro
// When deployed on Vercel, authentication is automatic
// For local development, set AI_GATEWAY_API_KEY in your .env.local
const model = gateway("google/gemini-2.5-pro");

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

    // Get the duration in a human-readable format (e.g., "2 hours and 16 mins" or "45 mins")
    const duration = getDurationFromSrtContent(srtContent);

    // Create a system prompt that explains what we want from the model
    const systemPrompt = `
<file_contents>
\`\`\`srt
${srtContent}
\`\`\`
</file_contents>
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

- **The Hook:** Always create a \`00:00:00\` timestamp that uses the first few impactful words of the video.
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

- For each identified moment, note the \`HH:MM:SS\` where it begins.
- Write a concise, specific, and action-oriented description (3-6 words).
    - **Good:** "Explaining the new Cursor pricing tiers"
    - **Avoid:** "Talks about pricing"
    - **Good:** "Final walkthrough of Claude Code setup in Cursor"
    - **Avoid:** "Claude Code"
- Use parentheses to add clarifying context where needed (e.g., \`(the 'closed-loop' problem)\`).

### Step 4: Format and Review

1. Assemble the final list in chronological order.
2. Use the standard format:
    
    \`\`\`markdown
    🕒 Key moments:
    00:00:00 [Initial 3-5 word hook]
    HH:MM:SS [Specific, action-oriented description]
    HH:MM:SS [Specific, action-oriented description]
    ...
    \`\`\`
    
3. Read the entire list from top to bottom. Does it tell the story of the video? Is it easy to scan? Ensure the timestamps are accurate and the descriptions are valuable. Adjust wording for clarity and impact.

### Gold Standard Example

This is the target quality and format for the final output:

\`\`\`
🕒 Key moments:
00:00:00 Cursor to refund unexpected charges
00:02:11 Explaining the new Cursor pricing tiers
00:04:38 How to claim a refund for overages
00:08:20 Showcasing the "Ray Transcribes" app
00:10:43 Recommending Magic UI templates
00:14:40 How to integrate Claude Code into Cursor
00:18:30 Discovering the Magic UI Command Palette
00:24:25 Detailing advanced Claude Code workflow
00:32:40 Pro-tip for Stripe integration (the "closed-loop" problem)
00:35:20 Claude Code terminal navigation tips
00:39:35 The MLX transcriber repo hits 420 stars
00:44:40 Deep dive into the Claude Code workflow
00:52:56 Explaining the full development stack
00:59:08 Final recap of the Cursor pricing changes
1:08:08 Explaining YouTube memberships and Discord access
1:12:00 Ray's birthday "preach" on AI engineering
1:19:50 Using Claude Code to plan app launch
1:25:36 Deep dive on the "planning mode" workflow
1:32:21 Final walkthrough of Claude Code setup in Cursor
\`\`\`
</meta prompt 1>
<user_instructions>
Generate timestamps for this content using the Generate Timestamps v4 instructions. This content is ${duration} long, so provide an appropriate number of timestamps based on content density (aim for one key moment every 5-10 minutes as a guideline).
</user_instructions>
    `;

    // Use the AI Gateway model with Gemini 2.5 Pro
    const result = streamText({
      model: model,
      prompt: systemPrompt,
      maxOutputTokens: 65536,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
