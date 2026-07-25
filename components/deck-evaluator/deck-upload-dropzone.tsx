"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function DeckUploadDropzone({ onSubmit }: { onSubmit: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (candidate: File | undefined) => {
    if (!candidate) return;
    const isPdf =
      candidate.type === "application/pdf" || candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files are supported. Export your deck as a PDF and try again.");
      setFile(null);
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setError(`File is too large (${formatBytes(candidate.size)}). Maximum size is 20 MB.`);
      setFile(null);
      return;
    }
    setError(null);
    setFile(candidate);
  };

  const handleSubmit = () => {
    if (!file) {
      setError("Pitch deck required");
      return;
    }
    onSubmit(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          validateAndSet(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-16 text-center transition-colors",
          dragActive ? "border-accent bg-accent/5" : "border-border",
        )}
      >
        {file ? (
          <>
            <FileText className="h-10 w-10 text-primary" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X className="h-4 w-4" /> Remove
            </Button>
          </>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop your pitch deck here</p>
              <p className="text-sm text-muted-foreground">PDF only, up to 20 MB and 20 slides</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Button className="w-full" size="lg" onClick={handleSubmit}>
        Evaluate Pitch Deck
      </Button>
    </div>
  );
}
