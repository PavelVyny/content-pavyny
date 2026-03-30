"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  getAuthUrlAction,
  disconnectYouTube,
  getConnectionStatus,
  getChannelInfoAction,
} from "@/app/actions/youtube";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type Status = "disconnected" | "connected" | "expired";
interface ChannelInfo {
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
}

export function YouTubeConnectCard() {
  const [status, setStatus] = useState<Status>("disconnected");
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await getConnectionStatus();
        setStatus(s);
        if (s === "connected") {
          const info = await getChannelInfoAction();
          setChannel(info ?? null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleConnect() {
    const url = await getAuthUrlAction();
    window.location.href = url;
  }

  async function handleDisconnect() {
    await disconnectYouTube();
    setStatus("disconnected");
    setChannel(null);
    toast.success("YouTube disconnected");
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "disconnected") {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Connect your YouTube channel to sync video metrics automatically.
          </p>
          <Button
            onClick={handleConnect}
            className="bg-[#FF0000] hover:bg-[#cc0000] text-white"
          >
            Connect YouTube
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "expired") {
    return (
      <Card className="border-amber-300">
        <CardContent className="py-8 flex flex-col items-center gap-4">
          <p className="text-sm text-amber-600">
            YouTube connection expired. Please reconnect.
          </p>
          <Button
            onClick={handleConnect}
            className="bg-[#FF0000] hover:bg-[#cc0000] text-white"
          >
            Reconnect YouTube
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Connected state with channel card (per D-03)
  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-center gap-4">
          {channel?.thumbnailUrl && (
            <ImageWithFallback
              src={channel.thumbnailUrl}
              alt={channel.title}
              className="w-12 h-12 rounded-full"
              fallbackIcon="avatar"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-900 truncate">
              {channel?.title ?? "Connected"}
            </p>
            <div className="flex gap-3 text-sm text-muted-foreground mt-1">
              <span>
                {channel?.subscriberCount?.toLocaleString() ?? "\u2014"}{" "}
                subscribers
              </span>
              <span>
                {channel?.videoCount?.toLocaleString() ?? "\u2014"} videos
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="text-red-600 hover:text-red-700 hover:border-red-300"
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
