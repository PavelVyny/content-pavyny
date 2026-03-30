"use client";

import { useTransition } from "react";
import type { AntiSlopScore } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { rescoreScript } from "@/app/actions/editor";
import { toast } from "sonner";

function scoreColor(total: number): string {
  if (total >= 35) return "text-green-600";
  if (total >= 25) return "text-yellow-600";
  return "text-red-600";
}

interface ScorePanelProps {
  score: AntiSlopScore | null;
  isStale: boolean;
  scriptId: number;
  onRescored?: (newScore: AntiSlopScore) => void;
}

export function ScorePanel({ score, isStale, scriptId, onRescored }: ScorePanelProps) {
  const [isRescoring, startTransition] = useTransition();

  function handleRescore() {
    startTransition(async () => {
      const result = await rescoreScript(scriptId);
      if (result.success && result.score) {
        onRescored?.(result.score);
      } else {
        toast.error("Rescore failed: " + (result.error || "Unknown error"));
      }
    });
  }

  if (!score) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Anti-Slop Score
      </h3>
      <Card size="sm">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-bold tabular-nums ${scoreColor(score.total)}`}
              >
                {score.total}
              </span>
              <span className="text-sm text-muted-foreground">/50</span>
            </div>
            {isStale && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                stale
              </Badge>
            )}
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRescore}
                disabled={isRescoring}
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-1.5", isRescoring && "animate-spin")}
                />
                {isRescoring ? "Rescoring..." : "Rescore"}
              </Button>
            </div>
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
                  {score[dim]}/10
                </p>
              </div>
            ))}
          </div>

          {score.notes && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {score.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
