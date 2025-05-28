import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { srtFileSchema } from "@/lib/schemas";
import { extractTextFromSrt, getVideoMetadata, parseSrtContent, SrtEntry } from "@/lib/srt-parser";
import {
  analyzeVideoForProcessing,
  getAnalysisDescription,
  validateAnalysis,
} from "@/lib/video-analyzer";
import { useRef, useState } from "react";

interface SrtUploaderProps {
  onContentExtracted: (
    content: string,
    entries: SrtEntry[],
    analysisData: {
      optimalTimestampCount: number;
      durationMinutes: number;
      description: string;
    }
  ) => void;
  onProcessFile: () => void;
  disabled: boolean;
  entriesCount: number;
  hasContent: boolean;
  analysisData?: {
    optimalTimestampCount: number;
    durationMinutes: number;
    description: string;
  };
}

export function SrtUploader({
  onContentExtracted,
  onProcessFile,
  disabled,
  entriesCount,
  hasContent,
  analysisData,
}: SrtUploaderProps) {
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setError("");
    setIsAnalyzing(true);

    // Check file size before any other validation
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`);
      setIsAnalyzing(false);
      return;
    }

    try {
      // Validate file name with Zod
      const validationResult = srtFileSchema.safeParse({
        fileName: file.name,
        fileContent: "placeholder", // Will be replaced with actual content
      });

      if (!validationResult.success) {
        setError(validationResult.error.errors[0].message);
        setIsAnalyzing(false);
        return;
      }

      const content = await file.text();

      // Now validate actual content
      const contentValidation = srtFileSchema.safeParse({
        fileName: file.name,
        fileContent: content,
      });

      if (!contentValidation.success) {
        setError(contentValidation.error.errors[0].message);
        setIsAnalyzing(false);
        return;
      }

      const entries = parseSrtContent(content);

      if (entries.length === 0) {
        setError("Could not parse any valid entries from the SRT file");
        setIsAnalyzing(false);
        return;
      }

      // Perform intelligent video analysis
      const metadata = getVideoMetadata(entries);
      const analysis = analyzeVideoForProcessing(metadata);
      const analysisValidation = validateAnalysis(analysis, metadata);

      if (!analysisValidation.isValid) {
        setError(`Video analysis failed: ${analysisValidation.warnings.join(", ")}`);
        setIsAnalyzing(false);
        return;
      }

      // Show warnings if any (but don't fail)
      if (analysisValidation.warnings.length > 0) {
        console.warn("Video analysis warnings:", analysisValidation.warnings);
      }

      const description = getAnalysisDescription(analysis, metadata);
      const extractedText = extractTextFromSrt(entries);

      onContentExtracted(extractedText, entries, {
        optimalTimestampCount: analysis.optimalTimestampCount,
        durationMinutes: metadata.durationMinutes,
        description,
      });

      setIsAnalyzing(false);

      // Auto-process after a short delay to allow UI to update
      setTimeout(() => {
        if (!disabled) {
          onProcessFile();
        }
      }, 1000); // Slightly longer delay to show analysis
    } catch (err) {
      console.error("Error reading file:", err);
      setError("Failed to read the file. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card
      className={
        isDragging
          ? "w-full max-w-2xl p-4 transition-all duration-300 border-2 border-sky-400/80 dark:border-sky-500/70 bg-sky-50/80 dark:bg-sky-900/20 shadow-[0_8px_30px_rgba(14,165,233,0.2)]"
          : "w-full max-w-2xl p-4 transition-all duration-300 hover:border-sky-200/70 dark:hover:border-sky-700/60 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center gap-4 p-6">
        {!hasContent && !isAnalyzing && (
          <>
            <div className="text-center mb-2">
              <h2 className="text-base font-semibold mb-3 text-emerald-800 dark:text-emerald-300">
                Upload SRT File
              </h2>
              <p className="text-sky-700/70 dark:text-sky-300/70 text-xs">
                Drag & drop your .srt file here or click to browse
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                We&apos;ll automatically determine the optimal number of timestamps based on your
                video
              </p>
            </div>

            <Input
              ref={fileInputRef}
              type="file"
              accept=".srt"
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled}
            />

            <Button
              onClick={triggerFileInput}
              className="w-full max-w-xs"
              disabled={disabled}
              size="lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Select SRT File
            </Button>
          </>
        )}

        {fileName && (
          <div className="mt-2 text-xs flex items-center justify-center gap-2 bg-emerald-50/80 dark:bg-emerald-900/20 p-3 rounded-xl w-full backdrop-blur-sm border border-emerald-100 dark:border-emerald-800/50">
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
              className="text-emerald-500"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              Selected file:
            </span>
            <span className="text-slate-600 dark:text-slate-300">{fileName}</span>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300 w-full">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-sm font-medium">Analyzing video structure...</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Determining optimal timestamp count and processing strategy
            </p>
          </div>
        )}

        {hasContent && !disabled && analysisData && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300 w-full">
            <p className="text-xs text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-900/20 px-4 py-2 rounded-full border border-sky-100/70 dark:border-sky-800/50">
              <span className="font-semibold">{entriesCount}</span> entries found in the SRT file
            </p>

            {/* Intelligent Analysis Display */}
            <div className="flex flex-col items-center gap-3 w-full max-w-lg bg-gradient-to-br from-emerald-50/80 to-sky-50/80 dark:from-emerald-900/20 dark:to-sky-900/20 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
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
                >
                  <path d="M9 11H5a2 2 0 0 0-2 2v3c0 3.5 2 4 4 4h3" />
                  <path d="M15 13h4a2 2 0 0 1 2-2V8c0-3.5-2-4-4-4h-3" />
                  <path d="M9 7 8 3l4 6 4-6-1 4" />
                </svg>
                <span className="font-semibold text-sm">Intelligent Analysis Complete</span>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analysisData.optimalTimestampCount}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    optimal timestamps
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {analysisData.description}
                </p>
              </div>
            </div>

            <Button
              onClick={onProcessFile}
              className="w-full max-w-xs"
              disabled={disabled}
              size="lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              Generate Timestamps
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-2 text-xs flex items-start gap-2 bg-rose-50/70 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-200 dark:border-rose-800/60 w-full backdrop-blur-sm">
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
              className="text-rose-500 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-rose-600 dark:text-rose-300">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
