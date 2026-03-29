import {
  getChannelStats,
  getGrowthTimeline,
  getTopPerformers,
} from "@/app/actions/metrics";
import { GrowthChart } from "@/components/growth-chart";
import { TopPerformersGrid } from "@/components/top-performers";

export default async function AnalyticsPage() {
  const [stats, timeline, topPerformers] = await Promise.all([
    getChannelStats(),
    getGrowthTimeline(),
    getTopPerformers(),
  ]);

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-3 gap-4">
        <HeroStat value={formatBig(stats.totalViews)} label="Total Views" />
        <HeroStat value={String(stats.subscriberCount)} label="Subscribers" />
        <HeroStat value={String(stats.videoCount)} label="Videos" />
      </div>

      {/* Growth Timeline */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">
          Growth Timeline
        </h2>
        <GrowthChart data={timeline} />
      </section>

      {/* Best Performers */}
      {topPerformers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">
            Best Performers
          </h2>
          <TopPerformersGrid videos={topPerformers} />
        </section>
      )}
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center py-6 rounded-lg border">
      <p className="text-3xl font-bold text-zinc-900">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function formatBig(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
