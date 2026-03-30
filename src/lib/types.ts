export interface HookVariant {
  variant: string; // "A", "B", "C"
  visual: string;
  voiceover: string;
}

export interface ScriptBeat {
  id: number;
  scriptId: number;
  order: number;
  visual: string;
  voiceover: string;
  duration: string | null;
}

export interface AntiSlopScore {
  directness: number;
  rhythm: number;
  trust: number;
  authenticity: number;
  density: number;
  total: number;
  notes: string;
}

export interface Script {
  id: number;
  title: string;
  format: string;
  status: "generating" | "draft" | "ready" | "done";
  hooks: HookVariant[] | null;
  selectedHook: string | null;
  titles: string[] | null;
  thumbnail: string | null;
  durationEstimate: string | null;
  antiSlopScore: AntiSlopScore | null;
  devContext: string | null;
  createdAt: Date;
  updatedAt: Date;
  beats?: ScriptBeat[];
}

export interface VideoFormat {
  name: string;
  slug: string;
  description: string;
  beatCount: number;
}

export interface VideoMetricsData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
  averageViewPercentage: number;
  averageViewDuration: number;
  engagedViews: number;
  retentionCurve: number[] | null;
  lastSyncedAt: Date;
}

export interface VideoData {
  id: number;
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  scriptId: number | null;
}

export interface ScriptWithVideo extends Script {
  video: VideoData | null;
  metrics: VideoMetricsData | null;
}
