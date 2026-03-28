"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingState() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
          </div>

          <div className="space-y-1.5">
            <p className="text-base font-medium text-foreground">
              Generating your script...
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Claude is reading your brand voice, selecting the format, writing
              beats, and scoring for anti-slop. This takes 30-60 seconds.
            </p>
          </div>

          <p className="text-xs text-muted-foreground tabular-nums">
            Elapsed: {elapsed}s
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
