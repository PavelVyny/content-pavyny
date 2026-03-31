import {
  getChannelStats,
  getGrowthTimeline,
  getTopPerformers,
} from "@/app/actions/metrics";
import { AnalyticsPage } from "@/components/analytics-page";

export default async function AnalyticsRoute() {
  const [stats, timeline, topPerformers] = await Promise.all([
    getChannelStats(),
    getGrowthTimeline(),
    getTopPerformers(),
  ]);

  return (
    <AnalyticsPage
      stats={stats}
      timeline={timeline}
      topPerformers={topPerformers}
    />
  );
}
