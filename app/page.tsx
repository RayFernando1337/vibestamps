"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { SrtUploader } from "@/components/SrtUploader";
import { TimestampResults } from "@/components/TimestampResults";
import { SrtEntry } from "@/lib/srt-parser";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [srtContent, setSrtContent] = useState<string>("");
  const [srtEntries, setSrtEntries] = useState<SrtEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Handle extracted SRT content
  const handleContentExtracted = (content: string, entries: SrtEntry[]) => {
    setSrtContent(content);
    setSrtEntries(entries);
    setGeneratedContent(""); // Reset previous results
    setError("");
  };

  // Process the SRT content with AI
  const processWithAI = async () => {
    if (!srtContent) return;

    setIsProcessing(true);
    setError("");
    setGeneratedContent("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ srtContent }),
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <header className="flex flex-col items-center mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h1 className={`text-3xl font-bold ${inter.className}`}>SRT Timestamp Generator</h1>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl">
            Upload a SubRip Text (.srt) file to generate meaningful timestamps and summaries using
            AI.
          </p>
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center gap-6 md:gap-8 w-full">
          {/* Step 1: File Upload (only show when not processing and no results) */}
          {!isProcessing && !generatedContent && (
            <>
              <SrtUploader onContentExtracted={handleContentExtracted} disabled={isProcessing} />
              
              {/* Process Button (only show when file is uploaded) */}
              {srtContent && (
                <div className="flex flex-col items-center gap-2 animate-in fade-in duration-300">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {srtEntries.length} entries found in the SRT file
                  </p>
                  <Button
                    onClick={processWithAI}
                    className="w-full max-w-xs"
                    disabled={isProcessing}
                    size="lg"
                  >
                    Generate Timestamps
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Error Display (show at any step if there's an error) */}
          {error && (
            <div className="w-full max-w-2xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 animate-in fade-in duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div className="text-red-600 dark:text-red-400 text-sm">
                <p className="font-medium">Error</p>
                <p>{error}</p>
                {/* Add a retry button when there's an error */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={() => setError("")}
                >
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
                  className="mt-6"
                >
                  Process Another File
                </Button>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Built with Next.js, Tailwind CSS, and Google Gemini</p>
          <p className="mt-1"> {new Date().getFullYear()} SRT Timestamp Generator</p>
        </footer>
      </div>
    </div>
  );
}
