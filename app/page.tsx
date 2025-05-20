"use client";

import { Particles } from "@/components/magicui/particles";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { SrtUploader } from "@/components/SrtUploader";
import { TimestampResults } from "@/components/TimestampResults";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { srtContentSchema, srtEntriesSchema } from "@/lib/schemas";
import { SrtEntry } from "@/lib/srt-parser";
import { DEFAULT_TIMESTAMP_COUNT } from "@/lib/constants";
import { Doto } from "next/font/google";
import { useState } from "react";

const doto = Doto({ weight: "900", subsets: ["latin"] });

export default function Home() {
  const [srtContent, setSrtContent] = useState<string>("");
  const [srtEntries, setSrtEntries] = useState<SrtEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [granularity, setGranularity] = useState<"fewer" | "default" | "more">(
    "default"
  );
  const [timestampCount, setTimestampCount] = useState<number>(DEFAULT_TIMESTAMP_COUNT);

  // Handle extracted SRT content
  const handleContentExtracted = (content: string, entries: SrtEntry[]) => {
    // Validate content and entries with Zod
    try {
      // Validate SRT content
      const contentValidation = srtContentSchema.safeParse({ srtContent: content });
      if (!contentValidation.success) {
        setError(contentValidation.error.errors[0].message);
        return;
      }

      // Validate SRT entries
      const entriesValidation = srtEntriesSchema.safeParse(entries);
      if (!entriesValidation.success) {
        setError("Invalid SRT entries format");
        return;
      }

      setSrtContent(content);
      setSrtEntries(entries);
      setGeneratedContent(""); // Reset previous results
      setError("");
    } catch (err) {
      console.error("Validation error:", err);
      setError("Failed to validate SRT data");
    }
  };

  // Process the SRT content with AI
  const processWithAI = async () => {
    if (!srtContent) return;

    setIsProcessing(true);
    setError("");
    setGeneratedContent("");

    try {
      // Validate SRT content before sending to API
      const contentValidation = srtContentSchema.safeParse({ srtContent });
      if (!contentValidation.success) {
        throw new Error(contentValidation.error.errors[0].message);
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ srtContent, granularity, timestampCount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate timestamps");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          setGeneratedContent(result);
        }
      }
    } catch (err) {
      console.error("Error generating timestamps:", err);
      setError(err instanceof Error ? err.message : "Failed to process your file");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-4 md:py-8 flex flex-col relative overflow-hidden">
      {/* Ghibli theme - transparent background to allow the GhibliBackground to show through */}

      {/* Just a few subtle stars for Ghibli theme in dark mode */}
      <div className="hidden dark:block absolute inset-0 z-1 pointer-events-none opacity-40">
        <Particles
          className="absolute inset-0"
          quantity={25}
          staticity={30}
          color="#ffffff"
          ease={100}
          size={0.2}
          vy={0.02}
          vx={0.02}
          refresh={true}
        />
      </div>

      {/* Light mode - Just a few subtle bird-like particles */}
      <div className="dark:hidden absolute inset-0 z-1 pointer-events-none opacity-20">
        <Particles
          className="absolute inset-0"
          quantity={15}
          staticity={15}
          color="#5d4037"
          ease={80}
          size={0.15}
          vy={0.3}
          vx={0.3}
          refresh={true}
        />
      </div>
      <div className="container max-w-5xl mx-auto px-4 flex flex-col flex-grow relative z-20">
        {/* Header */}
        <header className="flex flex-col items-center mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`text-5xl md:text-7xl text-center font-bold ${doto.className}`}>
              Vibestamps
            </div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl px-16 md:px-0">
            Upload a .srt file to generate meaningful timestamps for YouTube videos.
          </p>
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl px-16 md:px-0 flex items-center justify-center gap-2 py-2">
            Ray Fernando
            <a
              href="https://rfer.me/xprofilevshedr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-500 transition-colors"
              aria-label="Twitter/X Profile"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
              </svg>
            </a>
            <a
              href="https://rfer.me/RayYouTube-rvs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-red-500 transition-colors"
              aria-label="YouTube Channel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408z" />
              </svg>
            </a>
            <a
              href="https://rfer.me/rayvibestamps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-1"
              aria-label="GitHub Repository"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span className="text-xs">Star</span>
            </a>
          </p>
        </header>

        {/* Main Content - added justify-center to center content vertically */}
        <main className="flex flex-col items-center justify-center gap-6 md:gap-8 w-full flex-grow my-auto">
          {/* Step 1: File Upload (only show when not processing and no results) */}
          {!isProcessing && !generatedContent && (
            <SrtUploader
              onContentExtracted={handleContentExtracted}
              onProcessFile={processWithAI}
              disabled={isProcessing}
              entriesCount={srtEntries.length}
              hasContent={!!srtContent}
              granularity={granularity}
              onGranularityChange={setGranularity}
              timestampCount={timestampCount}
              onTimestampCountChange={setTimestampCount}
            />
          )}

          {/* Error Display (show at any step if there's an error) */}
          {error && (
            <div className="w-full max-w-2xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 animate-in fade-in duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="text-red-600 dark:text-red-400 text-sm">
                <p className="font-medium">Error</p>
                <p>{error}</p>
                {/* Add a retry button when there's an error */}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setError("")}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 & 3: Processing or Results */}
          {(isProcessing || generatedContent) && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
              <TimestampResults isLoading={isProcessing} content={generatedContent} />

              {/* Only show reset button when results are generated and not loading */}
              {generatedContent && !isProcessing && (
                <Button
                  onClick={() => {
                    setSrtContent("");
                    setSrtEntries([]);
                    setGeneratedContent("");
                  }}
                  variant="outline"
                  className="mt-6 mb-8 md:mb-12"
                >
                  Process Another File
                </Button>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-8 text-gray-500 dark:text-gray-400 text-sm flex flex-col">
          <div className="flex items-center justify-between w-full">
            {/* Gemini attribution */}
            <div className="opacity-70 hover:opacity-100 transition-opacity">
              <SparklesText text="Google Gemini" className="text-base" sparklesCount={5} />
            </div>
            {/* Theme Toggle Button */}
            <div className="absolute bottom-0 right-4 md:bottom-8 md:right-4">
              <ThemeToggle />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
