import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";

interface TimestampResultsProps {
  isLoading: boolean;
  content: string;
}

export function TimestampResults({ isLoading, content }: TimestampResultsProps) {
  const [progress, setProgress] = useState(0);
  const [parsedSections, setParsedSections] = useState<{ timestamp: string; isNew?: boolean }[]>(
    []
  );
  const prevContentRef = useRef<string>("");

  // Simulate progress when loading
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          // Keep progress between 0-95% while loading
          // We'll set it to 100% when loading is complete
          const newValue = prev + Math.random() * 15;
          return Math.min(newValue, 95);
        });
      }, 200);

      return () => {
        clearInterval(interval);
      };
    } else if (content) {
      // Set progress to 100% when we have content and loading is complete
      setProgress(100);
    }
  }, [isLoading, content]);

  // Parse timestamp content and handle streaming updates
  useEffect(() => {
    const parseLines = (text: string) => {
      if (!text) return [];

      // Split by lines and filter empty lines
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      // Find header line with "Key Moments" (if exists)
      const contentStartIndex = lines.findIndex(
        (line) => line === "🕒 Key Moments:" || line === "🕒 Key moments:"
      );

      // Get only content after the header, or use all lines if header not found
      const contentLines = contentStartIndex >= 0 ? lines.slice(contentStartIndex + 1) : lines;

      // Match lines with timestamp format MM:SS or HH:MM:SS followed by description
      // Now handles both "00:00 Description" and "00:00:00 Description" formats
      return contentLines
        .filter((line) => {
          // Match either MM:SS or HH:MM:SS format at the start of the line
          return /^(\d{1,2}:\d{2}(:\d{2})?\s+)/.test(line);
        })
        .map((line) => ({ timestamp: line }));
    };

    // If there's new content
    if (content !== prevContentRef.current) {
      const currentLines = parseLines(content);
      const previousLines = parseLines(prevContentRef.current);

      // Find new lines that weren't in the previous content
      if (currentLines.length > previousLines.length) {
        const newSections = currentLines.map((line, index) => {
          // Mark as new if it's a line we haven't seen before
          const isNew = index >= previousLines.length;
          return {
            ...line,
            isNew: isNew,
          };
        });

        setParsedSections(newSections);

        // After a delay, remove the "new" flag to stop the animation
        if (newSections.some((s) => s.isNew)) {
          const timer = setTimeout(() => {
            setParsedSections((prev) => prev.map((section) => ({ ...section, isNew: false })));
          }, 1000);
          return () => clearTimeout(timer);
        }
      }

      prevContentRef.current = content;
    }
  }, [content]);

  // Function to copy all timestamps to clipboard
  const copyToClipboard = () => {
    const timestampsText = parsedSections.map((section) => section.timestamp).join("\n");
    navigator.clipboard.writeText(timestampsText);
  };

  return (
    <Card className="w-full max-w-3xl backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base text-emerald-800 dark:text-emerald-300">
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
          <p className="text-xs text-sky-700/70 dark:text-sky-300/70 text-center">
            Analyzing your SRT file and generating timestamps...
          </p>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-center">
            <div className="animate-pulse text-sky-600/50 dark:text-sky-400/50 text-xs mt-2">
              This may take a moment depending on file size
            </div>
          </div>
        </div>

        {/* Now we show results even while loading if we have some content */}
        {parsedSections.length > 0 ? (
          <div className="animate-in fade-in duration-500">
            {content.includes("🕒 Key Moments:") || content.includes("🕒 Key moments:") ? (
              <div className="mb-4 text-center">
                <p className="text-sky-700 dark:text-sky-300 text-sm font-semibold">
                  🕒 Key Moments
                </p>
              </div>
            ) : null}

            <div className="space-y-2 mt-2">
              {parsedSections.map((section, index) => {
                // Extract time part and description part from the timestamp
                // Handles both "00:00 Description" and "00:00:00 Description" formats
                const [timePart, ...descriptionParts] = section.timestamp.split(/\s+/);
                const description = descriptionParts.join(" ");

                return (
                  <div
                    key={index}
                    className={`border-b border-slate-200/60 dark:border-slate-700/50 py-3 last:border-0 flex items-start justify-between group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 rounded-xl px-4 transition-colors ${
                      section.isNew
                        ? "animate-in slide-in-from-right-5 fade-in duration-300 scale-in-100"
                        : ""
                    }`}
                    style={
                      section.isNew
                        ? {
                            animationDelay: `${index * 100}ms`,
                            backgroundColor: section.isNew
                              ? "rgba(16,185,129,0.07)"
                              : "transparent",
                            transition: "background-color 1s ease-out",
                          }
                        : undefined
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-baseline">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mr-3 whitespace-nowrap">
                          {timePart}
                        </span>
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          {description}
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
                            onClick={() => navigator.clipboard.writeText(section.timestamp)}
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
