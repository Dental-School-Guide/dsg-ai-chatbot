"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EssayUploadProps {
  onEssaySubmit: (essayText: string) => void;
  isLoading?: boolean;
}

export function EssayUpload({ onEssaySubmit, isLoading }: EssayUploadProps) {
  const [essayText, setEssayText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Dynamically import PDF.js only on client-side to avoid SSR issues
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker path for pdfjs - use unpkg CDN which works better with Next.js
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      toast.error("PDF extraction failed", {
        description: "Please try pasting your text directly instead",
      });
      return "";
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (!file) return;

    // Check file type
    if (file.type === "application/pdf") {
      setUploadedFileName(file.name);
      setIsExtracting(true);
      toast.info("Extracting text from PDF...", {
        description: "This may take a moment",
      });
      
      const text = await extractTextFromPDF(file);
      setIsExtracting(false);
      
      if (text) {
        setEssayText(text);
        toast.success("PDF uploaded", {
          description: `Extracted ${text.split(/\s+/).length} words`,
        });
      }
    } else if (file.type === "text/plain") {
      setUploadedFileName(file.name);
      const text = await file.text();
      setEssayText(text);
      toast.success("File uploaded", {
        description: "Text loaded successfully",
      });
    } else {
      toast.error("Invalid file type", {
        description: "Please upload a PDF or TXT file",
      });
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      setUploadedFileName(file.name);
      setIsExtracting(true);
      toast.info("Extracting text from PDF...", {
        description: "This may take a moment",
      });
      
      const text = await extractTextFromPDF(file);
      setIsExtracting(false);
      
      if (text) {
        setEssayText(text);
        toast.success("PDF uploaded", {
          description: `Extracted ${text.split(/\s+/).length} words`,
        });
      }
    } else if (file.type === "text/plain") {
      setUploadedFileName(file.name);
      const text = await file.text();
      setEssayText(text);
      toast.success("File uploaded");
    } else {
      toast.error("Invalid file type", {
        description: "Please upload a PDF or TXT file",
      });
    }
  };

  const handleSubmit = () => {
    if (!essayText.trim()) {
      toast.error("No essay text", {
        description: "Please paste or upload your essay first",
      });
      return;
    }

    const wordCount = essayText.trim().split(/\s+/).length;
    if (wordCount < 100) {
      toast.warning("Essay seems short", {
        description: `Your essay is only ${wordCount} words. Most personal statements are 500-1000 words.`,
      });
    }

    onEssaySubmit(essayText);
  };

  const handleClear = () => {
    setEssayText("");
    setUploadedFileName(null);
    toast.info("Cleared", {
      description: "Essay text cleared",
    });
  };

  const wordCount = essayText.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="w-full space-y-3">
      {/* Combined Upload/Paste Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-200",
          isDragging
            ? "border-[--brand] bg-[--brand]/5"
            : "border-white/20 bg-[--panel-2]/50"
        )}
      >
        {/* Compact Header with Upload Button */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-[--brand]" />
            <span className="text-sm font-medium text-[--text]">Upload or paste your essay</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-[--text-dim]">{wordCount} words</span>
            
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileInput}
              className="hidden"
              id="essay-file-input"
              disabled={isLoading}
            />
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById('essay-file-input')?.click()}
              disabled={isLoading || isExtracting}
              className="h-7 gap-1.5 text-xs"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  Choose File
                </>
              )}
            </Button>
          </div>
        </div>

        {/* File Name Display */}
        {uploadedFileName && (
          <div className="flex items-center justify-between border-b border-white/10 bg-[--panel-3]/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-[--brand]" />
              <span className="text-xs text-[--text]">{uploadedFileName}</span>
            </div>
            <button
              onClick={handleClear}
              className="text-[--text-dim] hover:text-[--text]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Text Input Area */}
        <Textarea
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          placeholder={isExtracting ? "Extracting text from PDF..." : "Paste your dental school personal statement here... (Drag & drop PDF/TXT files also supported)"}
          className="min-h-[250px] resize-none border-0 bg-transparent p-4 text-sm text-[--text] placeholder:text-[--text-dim] focus-visible:ring-0"
          disabled={isLoading || isExtracting}
        />

        {/* Action Bar */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5">
          <p className="text-xs text-[--text-dim]">
            💡 Most competitive essays are 500-1000 words
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!essayText || isLoading}
              className="h-7 text-xs text-[--text-dim] hover:text-[--text]"
            >
              Clear
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!essayText.trim() || isLoading}
              size="sm"
              className="h-7 gap-1.5 bg-gradient-to-r from-[--brand] to-[--brand]/80 text-xs hover:brightness-110"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  Get Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
