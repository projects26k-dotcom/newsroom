import { Metadata } from "next";
import { getResolvedChannels } from "@/lib/channels";
import { getLiveVideoId } from "@/lib/youtubeLive";
import { LiveClient } from "./LiveClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live News — Dispatch",
  description: "Watch live streaming news broadcasts from major national and international newsrooms.",
};

export default async function LivePage() {
  const channels = await getResolvedChannels();
  const initialChannel = channels[0];
  const initialLiveVideo = initialChannel ? await getLiveVideoId(initialChannel) : null;

  return (
    <div className="py-2 sm:py-6">
      <LiveClient
        channels={channels}
        initialSlug={initialChannel?.slug || ""}
        initialLiveVideo={initialLiveVideo}
      />
    </div>
  );
}
