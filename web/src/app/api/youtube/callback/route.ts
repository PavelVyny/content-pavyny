import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getOAuth2Client,
  saveTokens,
  getChannelInfo,
} from "@/lib/youtube-client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/settings?error=" + (error || "no_code"), request.url)
    );
  }

  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);
    saveTokens(tokens as Record<string, unknown>);
    client.setCredentials(tokens);

    // Immediately fetch and cache channel info
    // (Pitfall 6: OAuth only gives tokens, not channel data)
    await getChannelInfo();
    revalidatePath("/", "layout");

    return NextResponse.redirect(
      new URL("/settings?connected=true", request.url)
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/settings?error=token_exchange", request.url)
    );
  }
}
