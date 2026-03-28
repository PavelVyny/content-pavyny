"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VideoFormat } from "@/lib/types";
import { generateNewScript } from "@/app/actions/generate";
import { FormatCard } from "@/components/format-card";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface GenerateFormProps {
  formats: VideoFormat[];
  onScriptGenerated: (scriptId: number) => void;
}

export function GenerateForm({
  formats,
  onScriptGenerated,
}: GenerateFormProps) {
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFormat) return;

    setIsGenerating(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("format", selectedFormat);

    try {
      const result = await generateNewScript(formData);

      if ("error" in result) {
        setError(result.error);
        toast.error(result.error);
      } else {
        onScriptGenerated(result.scriptId);
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }

  if (isGenerating) {
    return <LoadingState />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Choose a Format
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {formats.map((format) => (
            <FormatCard
              key={format.slug}
              format={format}
              selected={selectedFormat === format.slug}
              onSelect={() => setSelectedFormat(format.slug)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="devContext"
          className="text-sm font-medium text-foreground"
        >
          Dev Progress
        </label>
        <Textarea
          id="devContext"
          name="devContext"
          placeholder="What did you work on? Be specific: bugs fixed, features added, numbers, tools used..."
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!selectedFormat}
        >
          Generate Script
        </Button>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </div>
    </form>
  );
}
