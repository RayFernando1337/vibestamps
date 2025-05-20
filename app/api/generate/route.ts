import { MAX_FILE_SIZE } from "@/lib/constants";
import { generateApiRequestSchema } from "@/lib/schemas";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, wrapLanguageModel, type LanguageModelV1Middleware } from "ai";
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

    let timestampInstruction =
      "Aim for a range of 5-12 timestamps for the entire video.";
    if (typeof timestampCount === "number") {
      timestampInstruction = `Aim for roughly ${timestampCount} timestamps for the entire video.`;
    }

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
        : "";

    // Create a system prompt that explains what we want from the model
    const systemPrompt = `
      # Instructions for Generating Concise Video Timestamps from a Transcript

These instructions aim to generate precise, high-level timestamps for a video, focusing on key topics and demonstrations rather than every single sentence.

**IMPORTANT VIDEO LENGTH CONSTRAINT: ${videoEndTimeInfo}**

**Input:** A video transcript in SRT or VTT format.

**Output:** A list of timestamps and descriptions, formatted as follows:

🕒 Key moments:
00:00 [Exact 2-5 word hook]
MM:SS [Specific, action-oriented description]
...
MM:SS [Specific final topic]

**Process:**

1. **Video Length:** The video length is ${maxTimestamp}. Do not generate any timestamps beyond ${maxTimestamp} under any circumstances.

2. **Target Timestamp Quantity:** (Crucial Adjustment) ${timestampInstruction} This is crucial for conciseness and to prevent an overly long list. Don't be afraid to be more selective.

3. **Content Analysis:** Analyze the transcript to identify major themes, demonstrations, and transitions. Focus on:

   - **Introduction/Overview:** The start of the video, setting the stage.
   - **Key Functional Demonstrations:** Precise moments where specific functions (generate text, generate object, etc.) are demonstrated with code.
   - **Topic Shifts:** Significant transitions in the discussion (e.g., moving from theoretical discussion to practical coding examples).
   - **Complex Concepts Explained:** Instances where complex concepts (like Zod schemas, tools, or generative UI) are introduced or clarified.
   - **Example Builds/Demonstrations:** When code examples are presented and executed, highlighting the use of various functions.
   - **Chatbot Interaction:** Any segment where the chatbot is discussed, or its construction and interaction are demonstrated.

4. **Timestamp Selection:** Choose timestamps that align with the key moments identified. Aim for accuracy within ±5 seconds, prioritizing the overall flow and message rather than microscopic precision.

5. **Description Generation:** Create concise descriptions (ideally 2-5 words) highlighting the core topic, for example:

   - **Action-oriented verbs:** Start with verbs to emphasize the actions (e.g., "Demonstrating," "Explaining," "Introducing").
   - **Key Words:** Capture the essence of the segment using keywords directly related to the content (e.g., "AI SDK," "Generative UI," "Zod schemas").
   - **Concise phrasing:** Avoid lengthy descriptions; focus on conveying the main idea (e.g., "Chatbot development," "Building AI application").

6. **Formatting and Structure:** Ensure timestamps are ordered chronologically.

7. **Review and Refinement:** Thoroughly review to ensure:

   - **Accuracy:** Ensure the descriptions accurately reflect the content at the given timestamp.
   - **Conciseness:** Maintain the 2-5 word guideline for descriptions.
   - **Consistency:** Maintain a consistent style and level of detail across all descriptions.
   - **Relevance:** Prioritize timestamps representing significant concepts or demonstrations, avoiding redundant or minor details.

**Example (improved formatting and descriptions):**

\`\`\`
🕒 Key Moments:
00:00 Introduction and overview of AI SDK
07:59 Explaining AI SDK capabilities
16:16 Demonstrating generate text function
29:59 Introducing Zod schemas for data extraction
52:20 Building chatbot with AI SDK
1:04:22 Demonstrating generative UI
1:29:42 Best practices and tips for using SDK
1:49:55 AI chatbot template showcase
2:09:55 Final thoughts and next steps
\`\`\`

**Important Considerations for Long Videos:**

* **Segmentation:** Divide the video into logical sections if the video is very long. This allows you to target specific sections.
* **Contextual Keywords:** Incorporate keywords that reflect the context of the overall presentation.

By following these guidelines, you can create a list of timestamps that effectively and concisely reflect the video's key moments and allow viewers to quickly navigate to the relevant parts.

Now analyze the following transcript and generate timestamps following this format:

🕒 Key moments:
00:00 [2-5 word hook]
MM:SS [Action-oriented description]
...
    `;

    // Use the model with fallback middleware
    const { textStream } = streamText({
      model: modelWithFallback,
      prompt: `${systemPrompt}\n\nHere is the transcript content from an SRT file. Please analyze it and generate meaningful timestamps with summaries:\n\n${srtContent}`,
      temperature: 0.1,
      maxTokens: 1500,
    });

    return new Response(textStream);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
