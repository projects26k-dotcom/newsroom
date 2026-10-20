import { Metadata } from "next";
import { getResolvedChannels } from "@/lib/channels";
import { LiveClient } from "./LiveClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Live News — Dispatch",
  description: "Watch live streaming news broadcasts from major national and international newsrooms.",
};

export default async function LivePage() {
  const channels = await getResolvedChannels();

  return (
    <div className="py-2 sm:py-6">
      <LiveClient channels={channels} />
    </div>
  );
}
