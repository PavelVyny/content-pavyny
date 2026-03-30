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
      if (value === "__unlink__" && linkedVideo) {
        await unlinkVideo(linkedVideo.id);
      } else {
        const videoId = Number(value);
        if (!isNaN(videoId)) {
          await linkVideo(scriptId, videoId);
        }
      }
    });
  }

  // Use a key that changes after unlink to force Select to reset
  const selectKey = linkedVideo ? `linked-${linkedVideo.id}` : "unlinked";

  return (
    <Select
      key={selectKey}
      defaultValue={linkedVideo ? String(linkedVideo.id) : undefined}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger size="sm" className="w-auto max-w-full cursor-pointer">
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="#a1a1aa">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <SelectValue placeholder="Link to video...">
            {linkedVideo ? cleanTitle(linkedVideo.title) : "Link to video..."}
          </SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent className="w-auto min-w-[350px]">
        {linkedVideo ? (
          <>
            <SelectItem value={String(linkedVideo.id)}>
              {cleanTitle(linkedVideo.title)}
            </SelectItem>
            <SelectSeparator />
            <SelectItem value="__unlink__">Unlink video</SelectItem>
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
