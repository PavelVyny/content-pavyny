"use client";

import { useState } from "react";
import type { VideoFormat, Script, ScriptBeat } from "@/lib/types";
import { GenerateForm } from "@/components/generate-form";
import { ScriptDisplay } from "@/components/script-display";

interface GenerationPageProps {
  formats: VideoFormat[];
  latestScript: (Script & { beats: ScriptBeat[] }) | null;
}

export function GenerationPage({
  formats,
  latestScript,
}: GenerationPageProps) {
  const [showForm, setShowForm] = useState(!latestScript);
  const [generatedScriptId, setGeneratedScriptId] = useState<number | null>(
    null
  );

  // After generation, the server component re-renders with the new script
  // via router.refresh() in GenerateForm. The latestScript prop updates.
  const displayScript =
    latestScript && !showForm ? latestScript : null;

  function handleScriptGenerated(scriptId: number) {
    setGeneratedScriptId(scriptId);
    setShowForm(false);
  }

  function handleRegenerate() {
    setShowForm(true);
  }

  if (showForm || !displayScript) {
    return (
      <GenerateForm
        formats={formats}
        onScriptGenerated={handleScriptGenerated}
      />
    );
  }

  return (
    <ScriptDisplay script={displayScript} onRegenerate={handleRegenerate} />
  );
}
