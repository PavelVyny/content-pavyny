"use client";

import { useState, useTransition } from "react";
import type { Script, ScriptBeat, AntiSlopScore } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EditableField } from "@/components/editable-field";
import { HookSection } from "@/components/hook-section";
import { ScorePanel } from "@/components/score-panel";
import { updateBeat, regenerateBeat, selectTitle, reorderBeats } from "@/app/actions/editor";
import { RefreshCw, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function statusColor(
  status: string
): "default" | "secondary" | "outline" {
  switch (status) {
    case "ready":
      return "default";
    case "done":
      return "secondary";
    default:
      return "outline";
  }
}

interface ScriptEditorProps {
  script: Script & { beats: ScriptBeat[] };
  videoLinkSlot?: React.ReactNode;
  deleteSlot?: React.ReactNode;
}

export function ScriptEditor({ script, videoLinkSlot, deleteSlot }: ScriptEditorProps) {
  const [localBeats, setLocalBeats] = useState<ScriptBeat[]>(script.beats);
  const [isScoreStale, setIsScoreStale] = useState(false);
  const [localScore, setLocalScore] = useState<AntiSlopScore | null>(
    script.antiSlopScore ?? null
  );
  const [regeneratingBeatId, setRegeneratingBeatId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(script.title);
  const [localTitles, setLocalTitles] = useState<string[]>(script.titles ?? []);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number>(
    script.titles?.indexOf(script.title) ?? 0
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx !== null && idx !== dragIdx) {
      setDragOverIdx(idx);
    }
  }

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const reordered = [...localBeats];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setLocalBeats(reordered);
    setDragIdx(null);
    setDragOverIdx(null);
    startTransition(() => {
      reorderBeats(reordered.map((b) => b.id));
    });
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

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
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <EditableField
              value={currentTitle}
              onSave={(val) => {
                setCurrentTitle(val);
                setLocalTitles((prev) =>
                  prev.map((t, i) => (i === selectedTitleIndex ? val : t))
                );
                startTransition(() => {
                  selectTitle(script.id, val);
                });
              }}
              onEditingChange={setEditingTitle}
              className="text-2xl font-semibold text-foreground"
            />
            {!editingTitle ? (
              <Badge key="status" variant={statusColor(script.status)} className="shrink-0">{script.status}</Badge>
            ) : null}
          </div>
          {deleteSlot}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{script.format}</Badge>
          {script.durationEstimate && (
            <span className="text-muted-foreground">
              {script.durationEstimate}
            </span>
          )}
          {videoLinkSlot && <div className="ml-auto">{videoLinkSlot}</div>}
        </div>
      </div>

      {/* Title Options */}
      {localTitles.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Title Options
            </h3>
            <div className="flex flex-wrap gap-2">
              {localTitles.map((title, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCurrentTitle(title);
                    setSelectedTitleIndex(i);
                    startTransition(() => {
                      selectTitle(script.id, title);
                    });
                  }}
                  className={`text-sm rounded-md px-3 py-1.5 border cursor-pointer transition-colors ${
                    i === selectedTitleIndex
                      ? "bg-primary/10 border-primary/30 font-medium text-foreground"
                      : "border-transparent bg-zinc-100 text-muted-foreground hover:text-foreground"
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
            {localBeats.map((beat, idx) => (
              <div
                key={beat.id}
                className={`group relative transition-opacity ${dragIdx === idx ? "opacity-40" : ""} ${dragOverIdx === idx ? "ring-2 ring-primary/30 rounded-lg" : ""}`}
                draggable={dragIdx !== null}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
              >
                <Card size="sm">
                  <CardContent>
                    <div className="flex gap-2">
                      <div
                        className="flex items-center shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(idx);
                        }}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 flex-1">
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
                    </div>
                  </CardContent>
                </Card>
                {regeneratingBeatId === beat.id ? (
                  <span className="absolute -right-9 top-3 h-7 w-7 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  </span>
                ) : regeneratingBeatId === null ? (
                  <button
                    type="button"
                    className="absolute -right-9 top-3 h-7 w-7 flex items-center justify-center rounded-md cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleRegenerateBeat(beat.id)}
                  >
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </button>
                ) : null}
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
