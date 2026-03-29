"use client";

import { useTransition } from "react";
import type { VideoData } from "@/lib/types";
import { linkVideo, unlinkVideo } from "@/app/actions/metrics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VideoLinkSelectorProps {
  scriptId: number;
  linkedVideo: VideoData | null;
  unlinkedVideos: VideoData[];
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function cleanTitle(title: string): string {
  return title.replace(/\s*[|].*$/, "").replace(/\s*#\w+/g, "").trim();
}

export function VideoLinkSelector({
  scriptId,
  linkedVideo,
  unlinkedVideos,
}: VideoLinkSelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    if (!value) return;

    startTransition(async () => {
      if (value === "unlink" && linkedVideo) {
        await unlinkVideo(linkedVideo.id);
      } else {
        const videoId = Number(value);
        if (!isNaN(videoId)) {
          await linkVideo(scriptId, videoId);
        }
      }
    });
  }

  const currentValue = linkedVideo ? String(linkedVideo.id) : "";

  return (
    <Select
      value={currentValue}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger size="sm" className="w-auto max-w-full cursor-pointer">
        <SelectValue placeholder="Link to video..." />
      </SelectTrigger>
      <SelectContent className="w-auto min-w-[350px]">
        {linkedVideo ? (
          <>
            <SelectItem value={String(linkedVideo.id)}>
              {cleanTitle(linkedVideo.title)}
            </SelectItem>
            <SelectSeparator />
            <SelectItem value="unlink">Unlink video</SelectItem>
          </>
        ) : (
          <>
            {unlinkedVideos.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                <span className="flex items-center justify-between gap-4 w-full">
                  <span className="truncate">{cleanTitle(v.title)}</span>
                  <span className="shrink-0 text-muted-foreground">{formatDate(v.publishedAt)}</span>
                </span>
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
