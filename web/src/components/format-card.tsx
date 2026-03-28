"use client";

import type { VideoFormat } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FormatCardProps {
  format: VideoFormat;
  selected: boolean;
  onSelect: () => void;
}

export function FormatCard({ format, selected, onSelect }: FormatCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "cursor-pointer transition-all",
        selected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "hover:border-muted-foreground/30"
      )}
      onClick={onSelect}
    >
      <CardContent className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">
            {format.name}
          </span>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {format.beatCount} beats
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {format.description}
        </p>
      </CardContent>
    </Card>
  );
}
