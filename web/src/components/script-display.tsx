"use client";

import type { Script, ScriptBeat } from "@/lib/types";

interface ScriptDisplayProps {
  script: Script & { beats: ScriptBeat[] };
  onRegenerate?: () => void;
}

export function ScriptDisplay({ script, onRegenerate }: ScriptDisplayProps) {
  // Placeholder — will be fully implemented in Task 2
  return (
    <div>
      <p>{script.title}</p>
      {onRegenerate && <button onClick={onRegenerate}>Re-generate</button>}
    </div>
  );
}
