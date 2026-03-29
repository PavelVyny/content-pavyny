"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Status = "disconnected" | "connected" | "expired";

const statusLabels: Record<Status, string> = {
  disconnected: "YouTube: not connected",
  connected: "YouTube: connected",
  expired: "YouTube: token expired",
};

export function YouTubeStatusIcon({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    disconnected: "#a1a1aa",
    connected: "#FF0000",
    expired: "#FF0000",
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger render={<span className="relative flex items-center" />}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill={colors[status]}>
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            {status === "expired" && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
            )}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] px-2 py-1">
          {statusLabels[status]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
