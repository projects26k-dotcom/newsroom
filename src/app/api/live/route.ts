import { NextRequest, NextResponse } from "next/server";
import { CHANNELS, getChannelBySlug, resolveChannelId } from "@/lib/channels";
import { getLiveVideoId } from "@/lib/youtubeLive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("channel");

  if (!slug) {
    return NextResponse.json({ error: "Missing channel slug" }, { status: 400 });
  }

  const channel = getChannelBySlug(slug) || CHANNELS.find((c) => c.slug === slug.toLowerCase());
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  try {
    const resolvedId = await resolveChannelId(channel);
    const liveVideo = await getLiveVideoId({
      ...channel,
      resolvedId: resolvedId || channel.youtubeChannelId,
    });

    return NextResponse.json(
      {
        slug: channel.slug,
        name: channel.name,
        channelId: resolvedId || channel.youtubeChannelId,
        liveVideo,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        slug: channel.slug,
        name: channel.name,
        channelId: channel.youtubeChannelId,
        liveVideo: null,
        error: err.message || "Failed to resolve live video",
      },
      { status: 500 }
    );
  }
}
