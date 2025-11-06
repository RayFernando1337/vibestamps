/**
 * Timestamp normalization utilities
 * Handles conversion between MM:SS and HH:MM:SS formats based on video duration
 */

export interface KeyMoment {
  time: string;
  description: string;
}

export interface TimestampResponse {
  keyMoments: KeyMoment[];
}

/**
 * Normalize timestamp format based on video duration (YouTube standard)
 * For videos under 1 hour: MM:SS with leading zeros (00:00, 01:23, 15:30)
 * For videos over 1 hour: HH:MM:SS with leading zeros (00:00:00, 00:01:23, 02:23:02)
 */
export function normalizeTimestampFormat(timestamp: string, isLongContent: boolean): string {
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
export function normalizeTimestampResponse(
  response: TimestampResponse,
  isLongContent: boolean
): TimestampResponse {
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
