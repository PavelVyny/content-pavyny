"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VideoFormat, Script, ScriptBeat } from "@/lib/types";
import { GenerateForm } from "@/components/generate-form";
import { deleteScript } from "@/app/actions/generate";

interface GenerationPageProps {
  formats: VideoFormat[];
  latestScript: (Script & { beats: ScriptBeat[] }) | null;
}

export function GenerationPage({
  formats,
  latestScript,
}: GenerationPageProps) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  const isFailed = latestScript?.title === "Generation failed";

  function handleScriptGenerated(scriptId: number) {
    router.push(`/script/${scriptId}`);
  }

  function handleDelete(scriptId: number) {
    startDeleteTransition(async () => {
      await deleteScript(scriptId);
      router.refresh();
    });
  }

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
