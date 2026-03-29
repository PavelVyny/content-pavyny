"use client";

interface TopVideo {
  title: string;
  thumbnailUrl: string | null;
  views: number;
  badge: string;
  badgeValue: string;
}

const badgeColors: Record<string, string> = {
  "Most Viewed": "bg-blue-100 text-blue-700",
  "Most Subscribers": "bg-green-100 text-green-700",
  "Best Retention": "bg-purple-100 text-purple-700",
};

export function TopPerformersGrid({ videos }: { videos: TopVideo[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {videos.map((v) => (
        <div
          key={v.title}
          className="border rounded-lg overflow-hidden"
        >
          {v.thumbnailUrl && (
            <img
              src={v.thumbnailUrl}
              alt=""
              className="w-full h-28 object-cover"
            />
          )}
          <div className="p-3 space-y-2">
            <p className="text-sm font-medium truncate">{v.title}</p>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeColors[v.badge] ?? "bg-gray-100 text-gray-700"}`}>
                {v.badge}
              </span>
              <span className="text-xs text-muted-foreground">{v.badgeValue}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
