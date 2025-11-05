/**
 * Utilities for parsing SRT files and extracting their content
 */

export interface SrtEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Parse SRT file content into structured entries
 */
export function parseSrtContent(content: string): SrtEntry[] {
  // Split the content by double newline (entry separator)
  const blocks = content.trim().split(/\r?\n\r?\n/);
  const entries: SrtEntry[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);

    // Need at least 3 lines for a valid SRT entry (id, timestamp, and text)
    if (lines.length < 3) continue;

    // First line is the entry id
    const id = parseInt(lines[0].trim(), 10);
    if (isNaN(id)) continue;

    // Second line contains the timestamps
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) continue;

    const [, startTime, endTime] = timeMatch;

    // Remaining lines are the text content
    const text = lines.slice(2).join(" ").trim();

    entries.push({
      id,
      startTime,
      endTime,
      text,
    });
  }

  return entries;
}

/**
 * Extract plain text from SRT entries for AI processing
 */
export function extractTextFromSrt(entries: SrtEntry[]): string {
  return entries.map((entry) => entry.text).join(" ");
}

/**
 * Format time from SRT format (00:00:00,000) to more readable format (00:00:00)
 */
export function formatTimestamp(timestamp: string): string {
  return timestamp.replace(",", ".");
}

/**
 * Get full transcript with timestamps
 */
export function getTimestampedTranscript(entries: SrtEntry[]): string {
  return entries
    .map(
      (entry) =>
        `[${formatTimestamp(entry.startTime)} - ${formatTimestamp(entry.endTime)}] ${entry.text}`
    )
    .join("\n");
}

/**
 * Convert SRT timestamp (HH:MM:SS,mmm) to total seconds
 */
function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(/[,:]/);
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const milliseconds = parseInt(parts[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Get the duration of the video from SRT content in seconds
 * Returns the maximum end time found in the SRT timestamps
 */
export function getDurationInSeconds(srtContent: string): number {
  // Extract all timestamps using the same pattern as the API route
  const timestampRegex = /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g;
  let maxSeconds = 0;
  let match;

  // Find the latest end time
  while ((match = timestampRegex.exec(srtContent)) !== null) {
    const endTime = match[2]; // Second capture group is the end time
    const endTimeSeconds = timestampToSeconds(endTime);

    if (endTimeSeconds > maxSeconds) {
      maxSeconds = endTimeSeconds;
    }
  }

  return maxSeconds;
}

/**
 * Format duration in seconds to human-readable format
 * Returns format like "2 hours and 16 mins" or "45 mins" if under an hour
 */
export function formatDuration(durationInSeconds: number): string {
  const totalMinutes = Math.floor(durationInSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} ${hours === 1 ? "hour" : "hours"} and ${minutes} ${
        minutes === 1 ? "min" : "mins"
      }`;
    } else {
      return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }
  } else {
    return `${minutes} ${minutes === 1 ? "min" : "mins"}`;
  }
}

/**
 * Get the duration of the video from SRT content in a human-readable format
 * Returns format like "2 hours and 16 mins" or "45 mins" if under an hour
 * @deprecated Use getDurationInSeconds and formatDuration separately for better control
 */
export function getDurationFromSrtContent(srtContent: string): string {
  return formatDuration(getDurationInSeconds(srtContent));
}
