import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { timestampResponseSchema } from "@/lib/schemas";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

interface TimestampResultsProps {
  isLoading: boolean;
  content: string;
}

type TimestampItem = z.infer<typeof timestampResponseSchema>["keyMoments"][number];

interface ParsedTimestamp extends TimestampItem {
  isNew?: boolean;
}

export function TimestampResults({ isLoading, content }: TimestampResultsProps) {
  const [progress, setProgress] = useState(0);
  const [parsedTimestamps, setParsedTimestamps] = useState<ParsedTimestamp[]>([]);
  const prevContentRef = useRef<string>("");

  // Update progress based on actual streaming content
  useEffect(() => {
    if (isLoading) {
      // Base progress on content length and number of timestamps
      if (content) {
        // Parse to see how many timestamps we have so far
        const currentCount = parsedTimestamps.length;

        if (currentCount > 0) {
          // Estimate progress based on timestamps received
          // Assume we want roughly 1 timestamp every 5-10 minutes
          // For a 90 min video, that's ~9-18 timestamps
          // Use a more conservative estimate to avoid hitting 100% too early
          const estimatedTotal = Math.max(10, currentCount * 1.5);
          const calculatedProgress = Math.min(90, (currentCount / estimatedTotal) * 100);
          setProgress(calculatedProgress);
        } else {
          // Show some progress even if we haven't parsed timestamps yet
          const contentProgress = Math.min(40, content.length / 100);
          setProgress(contentProgress);
        }
      } else {
        // Initial loading state
        setProgress(10);
      }
    } else if (content) {
      // Set progress to 100% when loading is complete
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [isLoading, content, parsedTimestamps.length]);

  // Parse structured JSON content from streamObject
  useEffect(() => {
    const parseStructuredContent = (text: string): TimestampItem[] => {
      if (!text) return [];

      try {
        // Try to parse as complete JSON first
        const parsed = JSON.parse(text);
        const validated = timestampResponseSchema.safeParse(parsed);

        if (validated.success) {
          return validated.data.keyMoments;
        }

        // If validation fails, return empty array (partial data)
        return [];
      } catch {
        // If JSON parsing fails, it's likely partial streaming data
        // Try to extract partial keyMoments array
        try {
          // Look for keyMoments array in the partial JSON
          const keyMomentsMatch = text.match(/"keyMoments"\s*:\s*\[([\s\S]*?)(?:\]|$)/);

          if (keyMomentsMatch) {
            // Try to parse partial array
            const partialArray = keyMomentsMatch[1];
            // Add closing bracket if missing
            const arrayText = partialArray.endsWith("]") ? partialArray : partialArray + "]";

            try {
              const items = JSON.parse(`[${arrayText}]`);
              // Validate each item
              return items.filter((item: unknown) => {
                const result = z
                  .object({
                    time: z.string(),
                    description: z.string(),
                  })
                  .safeParse(item);
                return result.success;
              });
            } catch {
              // If that fails, try to extract individual complete objects
              const objectMatches = partialArray.matchAll(
                /\{[^}]*"time"\s*:\s*"([^"]+)"[^}]*"description"\s*:\s*"([^"]+)"[^}]*\}/g
              );
              const extractedItems: TimestampItem[] = [];

              for (const match of objectMatches) {
                extractedItems.push({
                  time: match[1],
                  description: match[2],
                });
              }

              return extractedItems;
            }
          }
        } catch (parseError) {
          console.error("Error parsing partial JSON:", parseError);
        }

        return [];
      }
    };

    // If there's new content
    if (content !== prevContentRef.current) {
      const currentTimestamps = parseStructuredContent(content);
      const previousTimestamps = parseStructuredContent(prevContentRef.current);

      // Log parsing progress for debugging
      if (currentTimestamps.length !== previousTimestamps.length) {
        console.log(
          `📊 Parsed ${currentTimestamps.length} timestamps (was ${previousTimestamps.length})`
        );
        if (currentTimestamps.length > 0) {
          const lastTimestamp = currentTimestamps[currentTimestamps.length - 1];
          console.log(`⏱️  Latest timestamp: ${lastTimestamp.time} - ${lastTimestamp.description}`);
        }
      }

      // Find new timestamps that weren't in the previous content
      if (currentTimestamps.length > previousTimestamps.length) {
        const newTimestamps = currentTimestamps.map((timestamp, index) => {
          // Mark as new if it's a timestamp we haven't seen before
          const isNew = index >= previousTimestamps.length;
          return {
            ...timestamp,
            isNew: isNew,
          };
        });

        setParsedTimestamps(newTimestamps);

        // After a delay, remove the "new" flag to stop the animation
        if (newTimestamps.some((t) => t.isNew)) {
          const timer = setTimeout(() => {
            setParsedTimestamps((prev) =>
              prev.map((timestamp) => ({ ...timestamp, isNew: false }))
            );
          }, 1000);
          return () => clearTimeout(timer);
        }
      } else if (currentTimestamps.length > 0) {
        // Update with current timestamps even if count is the same (content might have changed)
        setParsedTimestamps(currentTimestamps);
      }

      prevContentRef.current = content;
    }
  }, [content]);

  // Function to copy all timestamps to clipboard
  const copyToClipboard = () => {
    const timestampsText = parsedTimestamps
      .map((item) => `${item.time} ${item.description}`)
      .join("\n");
    navigator.clipboard.writeText(timestampsText);
  };

  return (
    <Card className="w-full max-w-3xl backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl text-emerald-800 dark:text-emerald-300">
          Generated Timestamps
        </CardTitle>
        {content && !isLoading && (
          <Button onClick={copyToClipboard} variant="outline" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            Copy All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className={isLoading ? "space-y-4 p-6" : "hidden"}>
          <p className="text-sm text-sky-700/70 dark:text-sky-300/70 text-center">
            Analyzing your SRT file and generating timestamps...
          </p>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-center">
            <div className="animate-pulse text-sky-600/50 dark:text-sky-400/50 text-sm mt-2">
              This may take a moment depending on file size
            </div>
          </div>
        </div>

        {/* Now we show results even while loading if we have some content */}
        {parsedTimestamps.length > 0 ? (
          <div className="animate-in fade-in duration-500">
            <div className="mb-4 text-center">
              <p className="text-sky-700 dark:text-sky-300 text-lg font-medium">🕒 Key Moments</p>
            </div>

            <div className="space-y-2 mt-2">
              {parsedTimestamps.map((timestamp, index) => {
                return (
                  <div
                    key={`${timestamp.time}-${index}`}
                    className={`border-b border-slate-200/60 dark:border-slate-700/50 py-3 last:border-0 flex items-start justify-between group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 rounded-xl px-4 transition-colors ${
                      timestamp.isNew
                        ? "animate-in slide-in-from-right-5 fade-in duration-300 scale-in-100"
                        : ""
                    }`}
                    style={
                      timestamp.isNew
                        ? {
                            animationDelay: `${index * 100}ms`,
                            backgroundColor: timestamp.isNew
                              ? "rgba(16,185,129,0.07)"
                              : "transparent",
                            transition: "background-color 1s ease-out",
                          }
                        : undefined
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-baseline">
                        <span className="text-base font-medium text-emerald-600 dark:text-emerald-400 mr-3 whitespace-nowrap">
                          {timestamp.time}
                        </span>
                        <span className="text-base text-slate-700 dark:text-slate-200">
                          {timestamp.description}
                        </span>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full ml-2"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `${timestamp.time} ${timestamp.description}`
                              )
                            }
                          >
                            <span className="sr-only">Copy</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-emerald-600 dark:text-emerald-400"
                            >
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy timestamp</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          !isLoading &&
          !content && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-emerald-50/80 dark:bg-emerald-900/20 p-6 mb-6 border border-emerald-100/50 dark:border-emerald-800/40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-500 dark:text-emerald-400"
                >
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="m4.93 4.93 2.83 2.83" />
                  <path d="m16.24 16.24 2.83 2.83" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                  <path d="m4.93 19.07 2.83-2.83" />
                  <path d="m16.24 7.76 2.83-2.83" />
                </svg>
              </div>
              <p className="text-sky-700 dark:text-sky-300">
                Upload an SRT file to generate timestamps
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
