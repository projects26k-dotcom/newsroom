import { NextRequest, NextResponse } from "next/server";
import { getThumbnailDetails } from "@/lib/thumb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const link = searchParams.get("link");

  if (!link) {
    return NextResponse.json({ image: null }, { status: 400 });
  }

  try {
    const details = await getThumbnailDetails(link);

    return NextResponse.json(
      {
        image: details.image,
        publisherUrl: details.publisherUrl,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return NextResponse.json({ image: null });
  }
}
