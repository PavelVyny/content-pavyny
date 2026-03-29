import { google } from "googleapis";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "data", ".youtube-tokens.json");

const SCOPES = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
];

// Types for stored token data
interface StoredTokens {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
  channel?: {
    title: string;
    thumbnailUrl: string;
    subscriberCount: number;
    videoCount: number;
  };
}

let oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

export function getOAuth2Client() {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    const tokens = loadTokens();
    if (tokens) {
      oauth2Client.setCredentials(tokens);
    }

    // CRITICAL: Merge new tokens with existing to preserve refresh_token
    // (Pitfall 2 from RESEARCH.md: on("tokens") only receives access_token on refresh)
    oauth2Client.on("tokens", (newTokens) => {
      const existing = loadTokens() || {};
      // Strip nulls from googleapis token response before merging
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(newTokens)) {
        if (v != null) clean[k] = v;
      }
      const merged = { ...existing, ...clean };
      saveTokens(merged as StoredTokens);
      // Also update in-memory client (Pitfall 3: singleton staleness)
      oauth2Client!.setCredentials(merged);
    });
  }
  return oauth2Client;
}

export function resetOAuth2Client() {
  oauth2Client = null;
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export function loadTokens(): StoredTokens | null {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    }
  } catch {
    // Corrupted file -- treat as disconnected
  }
  return null;
}

export function saveTokens(tokens: StoredTokens) {
  const dir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

export function deleteTokens() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
  } catch {
    // Already gone
  }
}

// Quick status check for header icon (no API call -- file check only)
export function getQuickConnectionStatus():
  | "disconnected"
  | "connected"
  | "expired" {
  const tokens = loadTokens();
  if (!tokens) return "disconnected";
  if (!tokens.refresh_token) return "expired";

  // Token expired but refresh token exists -- likely still valid
  // Actual refresh happens on next API call via googleapis auto-refresh
  return "connected";
}

// Full status check with API call (for settings page only)
export async function getFullConnectionStatus(): Promise<
  "disconnected" | "connected" | "expired"
> {
  const tokens = loadTokens();
  if (!tokens) return "disconnected";

  try {
    const client = getOAuth2Client();
    const youtube = google.youtube("v3");
    await youtube.channels.list({
      auth: client,
      part: ["snippet"],
      mine: true,
      maxResults: 1,
    });
    return "connected";
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    if (err.code === 401 || err.message?.includes("invalid_grant")) {
      return "expired";
    }
    // Network error -- assume connected since token file exists
    return "connected";
  }
}

// Fetch channel info after OAuth (stored in token file alongside tokens)
export async function getChannelInfo(): Promise<
  StoredTokens["channel"] | null
> {
  // First check cached channel info
  const tokens = loadTokens();
  if (tokens?.channel) return tokens.channel;

  // Fetch from API
  try {
    const client = getOAuth2Client();
    const youtube = google.youtube("v3");
    const response = await youtube.channels.list({
      auth: client,
      part: ["snippet", "statistics"],
      mine: true,
    });

    const ch = response.data.items?.[0];
    if (!ch) return null;

    const channel = {
      title: ch.snippet?.title ?? "",
      thumbnailUrl: ch.snippet?.thumbnails?.default?.url ?? "",
      subscriberCount: Number(ch.statistics?.subscriberCount ?? 0),
      videoCount: Number(ch.statistics?.videoCount ?? 0),
    };

    // Cache channel info in token file
    if (tokens) {
      saveTokens({ ...tokens, channel });
    }

    return channel;
  } catch {
    return null;
  }
}
