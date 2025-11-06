/**
 * Prompt building utilities for AI timestamp generation
 * Handles dynamic prompt construction based on video metadata
 */

export interface PromptConfig {
  srtContent: string;
  durationInSeconds: number;
  durationFormatted: string;
  isLongContent: boolean;
  endTimestamp: string;
}

export class PromptBuilder {
  /**
   * Calculate end timestamp in appropriate format
   */
  private calculateEndTimestamp(durationInSeconds: number): string {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Generate format example based on video duration
   */
  private buildFormatExample(isLongContent: boolean): string {
    return isLongContent
      ? "01:08:08 (HH:MM:SS with leading zeros)"
      : "08:20 (MM:SS with leading zeros)";
  }

  /**
   * Generate gold standard example based on video duration
   */
  private buildGoldStandardExample(isLongContent: boolean): string {
    if (isLongContent) {
      return `{
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
}`;
    }

    return `{
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
  }

  /**
   * Build the complete system prompt for AI timestamp generation
   */
  public buildSystemPrompt(config: PromptConfig): string {
    const endTimestamp = this.calculateEndTimestamp(config.durationInSeconds);
    const formatExample = this.buildFormatExample(config.isLongContent);
    const goldStandardExample = this.buildGoldStandardExample(config.isLongContent);

    return `
<file_contents>
\`\`\`srt
${config.srtContent}
\`\`\`
</file_contents>
<video_metadata>
Video Duration: ${config.durationFormatted} (ends at timestamp ${endTimestamp})
Total Length: ${config.durationInSeconds} seconds
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
      config.isLongContent ? "00:00:00" : "00:00"
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
Generate timestamps for this content using the Generate Timestamps v4 instructions. This content is ${
      config.durationFormatted
    } long${
      config.isLongContent ? ", so I'm going to need you to give me more timestamps than normal" : ""
    }. Provide an appropriate number of timestamps based on content density (aim for one key moment every 5-10 minutes as a guideline).

CRITICAL REQUIREMENTS:
1. You MUST analyze the ENTIRE transcript from start (${
      config.isLongContent ? "00:00:00" : "00:00"
    }) to the END (${endTimestamp}).
2. The video is ${config.durationFormatted} long - your final timestamp should be close to ${endTimestamp}.
3. Do NOT stop early - generate timestamps that span the COMPLETE duration from beginning to ${endTimestamp}.
4. ALL timestamps must use the ${config.isLongContent ? "HH:MM:SS" : "MM:SS"} format with leading zeros.

TIMESTAMP FORMAT REQUIREMENT (CRITICAL - YouTube Standard):
- Video duration: ${config.durationFormatted} (${config.durationInSeconds} seconds)
- ${
      config.isLongContent
        ? "This video is OVER 1 HOUR long. You MUST use HH:MM:SS format with LEADING ZEROS for ALL timestamps (e.g., 00:00:00, 00:15:30, 01:08:08)."
        : "This video is UNDER 1 HOUR long. You MUST use MM:SS format with LEADING ZEROS for ALL timestamps (e.g., 00:00, 08:20, 15:30). DO NOT use HH:MM:SS format."
    }
- Format example: ${formatExample}
- ALWAYS include leading zeros (e.g., "08:20" NOT "8:20", "01:08:08" NOT "1:08:08")

IMPORTANT: Return ONLY a valid JSON object matching the structure shown in the Gold Standard Example Format above. Use the exact field names "keyMoments", "time", and "description". ${
      config.isLongContent
        ? "Use HH:MM:SS format with leading zeros for ALL timestamps."
        : "Use MM:SS format with leading zeros for ALL timestamps - DO NOT include hours."
    }

Expected JSON structure (timestamps should go all the way to ${endTimestamp}):
{
  "keyMoments": [
    {"time": "${config.isLongContent ? "00:00:00" : "00:00"}", "description": "Opening"},
    {"time": "${config.isLongContent ? "00:15:30" : "15:30"}", "description": "Key topic"},
    ...continue through to approximately ${endTimestamp}...
    {"time": "${endTimestamp}", "description": "Closing"}
  ]
}
</user_instructions>
    `;
  }
}
