"use client";

import { useState, useTransition } from "react";
import type { Script, ScriptBeat, AntiSlopScore } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EditableField } from "@/components/editable-field";
import { HookSection } from "@/components/hook-section";
import { ScorePanel } from "@/components/score-panel";
import { updateBeat, regenerateBeat, selectTitle } from "@/app/actions/editor";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function statusColor(
  status: string
): "default" | "secondary" | "outline" {
  switch (status) {
    case "ready":
      return "default";
    case "recorded":
      return "secondary";
    default:
      return "outline";
  }
}

interface ScriptEditorProps {
  script: Script & { beats: ScriptBeat[] };
}

export function ScriptEditor({ script }: ScriptEditorProps) {
  const [localBeats, setLocalBeats] = useState<ScriptBeat[]>(script.beats);
  const [isScoreStale, setIsScoreStale] = useState(false);
  const [localScore, setLocalScore] = useState<AntiSlopScore | null>(
    script.antiSlopScore ?? null
  );
  const [regeneratingBeatId, setRegeneratingBeatId] = useState<number | null>(null);
  const [currentTitle, setCurrentTitle] = useState(script.title);
  const [, startTransition] = useTransition();

  function handleBeatSave(
    beatId: number,
    field: "visual" | "voiceover",
    value: string
  ) {
    // Update local state immediately
    setLocalBeats((prev) =>
      prev.map((b) => (b.id === beatId ? { ...b, [field]: value } : b))
    );
    setIsScoreStale(true);
    startTransition(() => {
      updateBeat(beatId, field, value);
    });
  }

  async function handleRegenerateBeat(beatId: number) {
    setRegeneratingBeatId(beatId);
    try {
      const result = await regenerateBeat(beatId, script.id);
      if (result.success && result.visual && result.voiceover) {
        setLocalBeats((prev) =>
          prev.map((b) =>
            b.id === beatId
              ? { ...b, visual: result.visual!, voiceover: result.voiceover! }
              : b
          )
        );
        setIsScoreStale(true);
      } else {
        toast.error("Regeneration failed: " + (result.error || "Unknown error"));
      }
    } catch {
      toast.error("Regeneration failed unexpectedly");
    }
    setRegeneratingBeatId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <EditableField
            value={currentTitle}
            onSave={(val) => {
              setCurrentTitle(val);
              startTransition(() => {
                selectTitle(script.id, val);
              });
            }}
            className="text-2xl font-semibold text-foreground"
          />
          <Badge variant={statusColor(script.status)}>{script.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{script.format}</Badge>
          {script.durationEstimate && (
            <span className="text-muted-foreground">
              {script.durationEstimate}
            </span>
          )}
        </div>
      </div>

      {/* Title Options */}
      {script.titles && script.titles.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Title Options
            </h3>
            <div className="flex flex-wrap gap-2">
              {script.titles.map((title, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCurrentTitle(title);
                    startTransition(() => {
                      selectTitle(script.id, title);
                    });
                  }}
                  className={`text-sm rounded-md px-3 py-1.5 border cursor-pointer transition-colors ${
                    title === currentTitle
                      ? "bg-primary/10 border-primary/30 font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-zinc-100 hover:border-zinc-200"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <Separator />

      {/* Column headers — one row for both hooks and beats */}
      <div className="grid grid-cols-2 gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Visual
        </p>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Voiceover
        </p>
      </div>

      {/* Hook Variants — above beats per D-06 */}
      {script.hooks && script.hooks.length > 0 && (
        <HookSection
          hooks={script.hooks}
          selectedHook={script.selectedHook}
          scriptId={script.id}
          onTextEdited={() => setIsScoreStale(true)}
        />
      )}

      <Separator />

      {/* Script Beats */}
      {localBeats.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Script Beats
          </h3>
          <div className="space-y-3">
            {localBeats.map((beat) => (
              <div key={beat.id} className="group relative flex items-start gap-2">
                <Card size="sm" className="flex-1">
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <EditableField
                        value={beat.visual}
                        onSave={(val) =>
                          handleBeatSave(beat.id, "visual", val)
                        }
                        className="text-base italic text-muted-foreground leading-relaxed"
                      />
                      <EditableField
                        value={beat.voiceover}
                        onSave={(val) =>
                          handleBeatSave(beat.id, "voiceover", val)
                        }
                        className="text-base text-foreground leading-relaxed"
                      />
                    </div>
                  </CardContent>
                </Card>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "shrink-0 mt-3 h-7 w-7 cursor-pointer transition-opacity",
                    regeneratingBeatId === beat.id
                      ? "opacity-100"
                      : regeneratingBeatId !== null
                        ? "opacity-0 pointer-events-none"
                        : "opacity-0 group-hover:opacity-100"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleRegenerateBeat(beat.id)}
                  disabled={regeneratingBeatId !== null && regeneratingBeatId !== beat.id}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      regeneratingBeatId === beat.id && "animate-spin"
                    )}
                  />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* Anti-Slop Score */}
      <ScorePanel
        score={localScore}
        isStale={isScoreStale}
        scriptId={script.id}
        onRescored={(newScore) => {
          setLocalScore(newScore);
          setIsScoreStale(false);
        }}
      />

      {/* Thumbnail Concept */}
      {script.thumbnail && (
        <>
          <Separator />
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Thumbnail Concept
            </h3>
            <Card size="sm">
              <CardContent>
                <p className="text-base text-foreground leading-relaxed">
                  {script.thumbnail}
                </p>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
