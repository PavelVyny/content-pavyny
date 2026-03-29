"use client";

import { useTransition } from "react";
import type { VideoData } from "@/lib/types";
import { linkVideo, unlinkVideo } from "@/app/actions/metrics";

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

export function VideoLinkSelector({
  scriptId,
  linkedVideo,
  unlinkedVideos,
}: VideoLinkSelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
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

  return (
    <select
      value={linkedVideo ? String(linkedVideo.id) : ""}
      onChange={handleChange}
      disabled={isPending}
      className="text-sm rounded border px-2 py-1 bg-background text-foreground disabled:opacity-50"
    >
      {linkedVideo ? (
        <>
          <option value={String(linkedVideo.id)}>
            {linkedVideo.title}
          </option>
          <option value="unlink">Unlink video</option>
        </>
      ) : (
        <>
          <option value="">Link to video...</option>
          {unlinkedVideos.map((v) => (
            <option key={v.id} value={String(v.id)}>
              {v.title} — {formatDate(v.publishedAt)}
            </option>
          ))}
        </>
      )}
    </select>
  );
}
