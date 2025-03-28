import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextResponse } from "next/server";

// Initialize the Google Generative AI provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { srtContent } = await request.json();

    if (!srtContent || typeof srtContent !== "string") {
      return NextResponse.json({ error: "Invalid SRT content provided" }, { status: 400 });
    }

    // Create a system prompt that explains what we want from the model
    const systemPrompt = `
      You are a tool that analyzes video/audio transcripts from SRT files.
      Your task is to identify key moments and create meaningful timestamps or chapter markers.
      For each important moment or topic change, provide:
      
      1. A timestamp (in format HH:MM:SS)
      2. A concise title/description (5-7 words)
      
      Format your response exactly like this:
      
      00:00:00 - Introduction to the Video
      00:01:15 - First Important Topic
      00:03:42 - Next Key Point Discussed
      
      IMPORTANT: The first timestamp MUST start with 00:00:00 as this is required for YouTube chapters to work properly.
      
      Identify 5-10 meaningful timestamps throughout the content.
      Focus on topic changes, key arguments, or significant moments.
      Do not add any markdown formatting, headings, or additional text - just the timestamps in the format shown above.
    `;

    // Use streamText function from the AI SDK with Google Gemini model
    const { textStream } = streamText({
      model: google("gemini-1.5-pro"),
      prompt: `${systemPrompt}\n\nHere is the transcript content from an SRT file. Please analyze it and generate meaningful timestamps with summaries:\n\n${srtContent}`,
      temperature: 0.7,
      maxTokens: 1500,
    });

    // Return a proper streaming response
    return new Response(textStream);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
