"use server";

import { revalidatePath } from "next/cache";
import {
  getAuthUrl,
  getQuickConnectionStatus,
  getFullConnectionStatus,
  getChannelInfo as fetchChannelInfo,
  loadTokens,
  deleteTokens,
  getOAuth2Client,
  resetOAuth2Client,
} from "@/lib/youtube-client";

export async function getAuthUrlAction(): Promise<string> {
  return getAuthUrl();
}

export async function disconnectYouTube(): Promise<{ success: boolean }> {
  const tokens = loadTokens();
  if (tokens?.access_token) {
    try {
      const client = getOAuth2Client();
      await client.revokeToken(tokens.access_token as string);
    } catch {
      // Token may already be revoked -- continue with local cleanup
    }
  }
  deleteTokens();
  resetOAuth2Client();
  revalidatePath("/", "layout");
  return { success: true };
}

export async function getConnectionStatus(): Promise<
  "disconnected" | "connected" | "expired"
> {
  return getFullConnectionStatus();
}

export async function getQuickStatus(): Promise<
  "disconnected" | "connected" | "expired"
> {
  return getQuickConnectionStatus();
}

export async function getChannelInfoAction() {
  return fetchChannelInfo();
}
