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
  status: "generating" | "draft" | "ready" | "recorded";
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
