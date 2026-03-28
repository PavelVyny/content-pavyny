"use client";

import type { Script, ScriptBeat } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface ScriptDisplayProps {
  script: Script & { beats: ScriptBeat[] };
  onRegenerate?: () => void;
  onNewScript?: () => void;
  onDelete?: () => void;
}

function scoreColor(total: number): string {
  if (total >= 35) return "text-green-600";
  if (total >= 25) return "text-yellow-600";
  return "text-red-600";
}

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

export function ScriptDisplay({ script, onRegenerate, onNewScript, onDelete }: ScriptDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">
            {script.title}
          </h2>
          <Badge variant={statusColor(script.status)}>{script.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{script.format}</Badge>
          {script.durationEstimate && (
            <span className="text-sm text-muted-foreground">
              {script.durationEstimate}
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Title Options */}
      {script.titles && script.titles.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Title Options
          </h3>
          <ol className="space-y-1.5">
            {script.titles.map((title, i) => (
              <li
                key={i}
                className={`text-sm rounded-md px-3 py-1.5 ${
                  i === 0
                    ? "bg-primary/10 font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {i + 1}. {title}
              </li>
            ))}
          </ol>
        </section>
      )}

      <Separator />

      {/* Hook Variants */}
      {script.hooks && script.hooks.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Hook Variants
          </h3>
          <div className="space-y-3">
            {script.hooks.map((hook, i) => (
              <Card key={i} size="sm">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    Variant {hook.variant}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Visual
                      </p>
                      <p className="text-sm italic text-muted-foreground leading-relaxed">
                        {hook.visual}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Voiceover
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {hook.voiceover}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* Script Beats */}
      {script.beats && script.beats.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Script Beats
          </h3>
          <div className="space-y-3">
            {script.beats.map((beat) => (
              <Card key={beat.id} size="sm">
                <CardContent>
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className="shrink-0 mt-0.5 tabular-nums"
                    >
                      #{beat.order}
                    </Badge>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Visual
                        </p>
                        <p className="text-sm italic text-muted-foreground leading-relaxed">
                          {beat.visual}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Voiceover
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {beat.voiceover}
                        </p>
                      </div>
                    </div>
                    {beat.duration && (
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                        {beat.duration}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* Anti-Slop Score */}
      {script.antiSlopScore && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Anti-Slop Score
          </h3>
          <Card size="sm">
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-bold tabular-nums ${scoreColor(
                    script.antiSlopScore.total
                  )}`}
                >
                  {script.antiSlopScore.total}
                </span>
                <span className="text-sm text-muted-foreground">/50</span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center">
                {(
                  [
                    "directness",
                    "rhythm",
                    "trust",
                    "authenticity",
                    "density",
                  ] as const
                ).map((dim) => (
                  <div key={dim} className="space-y-0.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {dim}
                    </p>
                    <p className="text-sm font-medium tabular-nums">
                      {script.antiSlopScore![dim]}/10
                    </p>
                  </div>
                ))}
              </div>

              {script.antiSlopScore.notes && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {script.antiSlopScore.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

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
                <p className="text-sm text-foreground leading-relaxed">
                  {script.thumbnail}
                </p>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {onNewScript && (
            <Button variant="default" onClick={onNewScript}>
              New Script
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
        {onRegenerate && (
          <Button variant="outline" onClick={onRegenerate}>
            Re-generate
          </Button>
        )}
      </div>
    </div>
  );
}
