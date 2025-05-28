/**
 * Utilities for parsing SRT files and extracting their content
 */

export interface SrtEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

export interface VideoMetadata {
  durationMinutes: number;
  durationSeconds: number;
  totalEntries: number;
  averageEntryDuration: number;
  estimatedWordsPerMinute: number;
  hasLongPauses: boolean;
  contentDensity: "low" | "medium" | "high";
  videoCategory: "short" | "medium" | "long" | "very_long";
}

export interface BreakPoint {
  entryIndex: number;
  timestamp: string;
  timestampSeconds: number;
  confidence: number;
  reason: "long_pause" | "topic_change" | "speaker_change" | "section_break";
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
 * Convert SRT timestamp format to seconds
 */
export function srtTimeToSeconds(timestamp: string): number {
  const parts = timestamp.split(/[,:]/);
  if (parts.length !== 4) return 0;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const milliseconds = parseInt(parts[3], 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Convert seconds to readable time format (HH:MM:SS or MM:SS)
 */
export function secondsToReadableTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Get video duration in minutes from SRT entries
 */
export function getVideoDuration(entries: SrtEntry[]): number {
  if (entries.length === 0) return 0;

  // Find the latest end time across all entries
  let maxEndTime = 0;

  for (const entry of entries) {
    const endTimeSeconds = srtTimeToSeconds(entry.endTime);
    if (endTimeSeconds > maxEndTime) {
      maxEndTime = endTimeSeconds;
    }
  }

  return Math.ceil(maxEndTime / 60); // Return duration in minutes, rounded up
}

/**
 * Get comprehensive video metadata from SRT entries
 */
export function getVideoMetadata(entries: SrtEntry[]): VideoMetadata {
  if (entries.length === 0) {
    return {
      durationMinutes: 0,
      durationSeconds: 0,
      totalEntries: 0,
      averageEntryDuration: 0,
      estimatedWordsPerMinute: 0,
      hasLongPauses: false,
      contentDensity: "low",
      videoCategory: "short",
    };
  }

  const durationSeconds = getVideoDuration(entries) * 60;
  const durationMinutes = Math.floor(durationSeconds / 60);

  // Calculate average entry duration
  let totalEntryDuration = 0;
  let longPauseCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const startSeconds = srtTimeToSeconds(entry.startTime);
    const endSeconds = srtTimeToSeconds(entry.endTime);
    const entryDuration = endSeconds - startSeconds;
    totalEntryDuration += entryDuration;

    // Check for long pauses between entries
    if (i < entries.length - 1) {
      const nextEntry = entries[i + 1];
      const nextStartSeconds = srtTimeToSeconds(nextEntry.startTime);
      const pause = nextStartSeconds - endSeconds;

      if (pause > 3) {
        // 3+ second pause is considered long
        longPauseCount++;
      }
    }
  }

  const averageEntryDuration = totalEntryDuration / entries.length;

  // Estimate words per minute
  const totalWords = entries.reduce((count, entry) => {
    return count + entry.text.split(/\s+/).length;
  }, 0);
  const estimatedWordsPerMinute =
    durationMinutes > 0 ? Math.round(totalWords / durationMinutes) : 0;

  // Determine content density
  let contentDensity: "low" | "medium" | "high" = "medium";
  if (estimatedWordsPerMinute < 120) contentDensity = "low";
  else if (estimatedWordsPerMinute > 180) contentDensity = "high";

  // Categorize video length
  let videoCategory: "short" | "medium" | "long" | "very_long" = "short";
  if (durationMinutes > 30) videoCategory = "medium";
  if (durationMinutes > 90) videoCategory = "long";
  if (durationMinutes > 180) videoCategory = "very_long";

  return {
    durationMinutes,
    durationSeconds: Math.floor(durationSeconds),
    totalEntries: entries.length,
    averageEntryDuration,
    estimatedWordsPerMinute,
    hasLongPauses: longPauseCount > entries.length * 0.1, // More than 10% of transitions have long pauses
    contentDensity,
    videoCategory,
  };
}

/**
 * Find natural break points in the video for chunking
 */
export function findNaturalBreakPoints(entries: SrtEntry[]): BreakPoint[] {
  if (entries.length < 2) return [];

  const breakPoints: BreakPoint[] = [];

  for (let i = 0; i < entries.length - 1; i++) {
    const currentEntry = entries[i];
    const nextEntry = entries[i + 1];

    const currentEndSeconds = srtTimeToSeconds(currentEntry.endTime);
    const nextStartSeconds = srtTimeToSeconds(nextEntry.startTime);
    const pause = nextStartSeconds - currentEndSeconds;

    let confidence = 0;
    let reason: BreakPoint["reason"] = "long_pause";

    // Long pause detection (3+ seconds)
    if (pause >= 3) {
      confidence += 0.4;
      reason = "long_pause";
    }

    // Topic change detection (basic heuristics)
    const currentText = currentEntry.text.toLowerCase();
    const nextText = nextEntry.text.toLowerCase();

    // Look for topic transition indicators
    const topicChangeIndicators = [
      "now",
      "next",
      "so",
      "okay",
      "alright",
      "moving on",
      "let's",
      "another",
      "different",
      "change",
      "switch",
      "turn to",
      "look at",
    ];

    if (
      topicChangeIndicators.some(
        (indicator) => nextText.startsWith(indicator) || nextText.includes(indicator)
      )
    ) {
      confidence += 0.3;
      reason = "topic_change";
    }

    // Section break detection (paragraph-like breaks)
    if (
      pause >= 1.5 &&
      (currentText.endsWith(".") || currentText.endsWith("?") || currentText.endsWith("!"))
    ) {
      confidence += 0.2;
      reason = "section_break";
    }

    // Only include break points with reasonable confidence
    if (confidence >= 0.3) {
      breakPoints.push({
        entryIndex: i + 1, // Next entry index
        timestamp: nextEntry.startTime,
        timestampSeconds: nextStartSeconds,
        confidence: Math.min(confidence, 1.0),
        reason,
      });
    }
  }

  // Sort by confidence (highest first)
  return breakPoints.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Validate video structure and check for common issues
 */
export function validateVideoStructure(entries: SrtEntry[]): boolean {
  if (entries.length === 0) return false;

  // Check for reasonable duration
  const duration = getVideoDuration(entries);
  if (duration < 1 || duration > 300) {
    // 1 minute to 5 hours seems reasonable
    return false;
  }

  // Check for sequential timestamps
  for (let i = 0; i < entries.length - 1; i++) {
    const currentEnd = srtTimeToSeconds(entries[i].endTime);
    const nextStart = srtTimeToSeconds(entries[i + 1].startTime);

    // Next entry should start at or after current entry ends
    if (nextStart < currentEnd - 1) {
      // Allow 1 second tolerance for overlaps
      return false;
    }
  }

  // Check for reasonable entry count relative to duration
  const entriesPerMinute = entries.length / duration;
  if (entriesPerMinute < 1 || entriesPerMinute > 30) {
    // Reasonable range
    return false;
  }

  // Check that most entries have text content
  const emptyEntries = entries.filter((entry) => entry.text.trim().length < 3).length;
  if (emptyEntries > entries.length * 0.2) {
    // More than 20% empty is suspicious
    return false;
  }

  return true;
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
