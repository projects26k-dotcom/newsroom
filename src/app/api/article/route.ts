import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const { decodeArticleId } = await import("@/lib/encoder");
    const googleUrl = decodeArticleId(id);
    if (!googleUrl) {
      return NextResponse.json({ error: "Invalid article id" }, { status: 400 });
    }

    const { getArticleByUrl } = await import("@/lib/article");
    const article = await getArticleByUrl(googleUrl);
    return NextResponse.json(article, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to extract article" }, { status: 500 });
  }
}
