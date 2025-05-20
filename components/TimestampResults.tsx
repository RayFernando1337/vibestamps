import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type AITimestampEntrySchema as AITimestampEntry } from "@/lib/schemas"; // Import the type
import { useEffect, useState } from "react";

interface TimestampResultsProps {
  isLoading: boolean;
  timestamps: AITimestampEntry[]; // Updated prop type
}

export function TimestampResults({ isLoading, timestamps }: TimestampResultsProps) {
  const [progress, setProgress] = useState(0);

  // Simulate progress when loading
  useEffect(() => {
    if (isLoading) {
      setProgress(0); // Reset progress when loading starts
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newValue = prev + Math.random() * 15;
          return Math.min(newValue, 95); // Keep progress capped at 95% during loading
        });
      }, 200);
      return () => clearInterval(interval);
    } else if (timestamps && timestamps.length > 0) {
      setProgress(100); // Set to 100% when content is loaded
    } else {
      setProgress(0); // Reset if no content and not loading
    }
  }, [isLoading, timestamps]);

  // Function to copy all timestamps to clipboard
  const copyToClipboard = () => {
    const timestampsText = timestamps
      .map((entry) => `${entry.time} ${entry.description}`)
      .join("\n");
    navigator.clipboard.writeText(timestampsText);
  };

  return (
    <Card className="w-full max-w-3xl backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl text-emerald-800 dark:text-emerald-300">
          Generated Timestamps
        </CardTitle>
        {timestamps && timestamps.length > 0 && !isLoading && (
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
        {isLoading && (!timestamps || timestamps.length === 0) && (
          <div className="space-y-4 p-6">
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
        )}

        {timestamps && timestamps.length > 0 ? (
          <div className="animate-in fade-in duration-500">
            <div className="space-y-2 mt-2">
              {timestamps.map((entry, index) => (
                <div
                  key={index}
                  className="border-b border-slate-200/60 dark:border-slate-700/50 py-3 last:border-0 flex items-start justify-between group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 rounded-xl px-4 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-baseline">
                      <span className="text-base font-medium text-emerald-600 dark:text-emerald-400 mr-3 whitespace-nowrap">
                        {entry.time}
                      </span>
                      <span className="text-base text-slate-700 dark:text-slate-200">
                        {entry.description}
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
                            navigator.clipboard.writeText(`${entry.time} ${entry.description}`)
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
              ))}
            </div>
          </div>
        ) : (
          !isLoading && (
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
