"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VideoFormat, Script, ScriptBeat } from "@/lib/types";
import { GenerateForm } from "@/components/generate-form";
import { ScriptDisplay } from "@/components/script-display";
import { deleteScript, regenerateScript } from "@/app/actions/generate";

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
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isRegenerating, startRegenerateTransition] = useTransition();

  // Show form if: user chose to, no script exists, or script is a failed placeholder
  const isFailed = latestScript?.title === "Generation failed";
  const displayScript =
    latestScript && !showForm && !isFailed ? latestScript : null;

  function handleScriptGenerated(scriptId: number) {
    setGeneratedScriptId(scriptId);
    setShowForm(false);
  }

  function handleRegenerate() {
    if (!displayScript) return;
    startRegenerateTransition(async () => {
      const result = await regenerateScript(
        displayScript.id,
        displayScript.format,
        displayScript.devContext ?? ""
      );
      if ("success" in result) {
        router.refresh();
      }
    });
  }

  function handleNewScript() {
    setShowForm(true);
    setGeneratedScriptId(null);
  }

  function handleDelete(scriptId: number) {
    startDeleteTransition(async () => {
      await deleteScript(scriptId);
      setShowForm(true);
      setGeneratedScriptId(null);
      router.refresh();
    });
  }

  if (showForm || !displayScript) {
    return (
      <GenerateForm
        formats={formats}
        onScriptGenerated={handleScriptGenerated}
        failedScript={isFailed ? latestScript : undefined}
        onDeleteFailed={isFailed && latestScript ? () => handleDelete(latestScript.id) : undefined}
        isDeleting={isDeleting}
      />
    );
  }

  return (
    <ScriptDisplay
      script={displayScript}
      onRegenerate={handleRegenerate}
      onNewScript={handleNewScript}
      onDelete={() => handleDelete(displayScript.id)}
    />
  );
}
