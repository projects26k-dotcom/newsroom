/**
 * URL-safe base64 encoding and decoding for Google News article IDs
 */
export function encodeArticleId(url: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(url, "utf-8").toString("base64url");
  }
  return btoa(encodeURIComponent(url))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeArticleId(id: string): string {
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(id, "base64url").toString("utf-8");
    }
    const b64 = id.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(atob(b64));
  } catch {
    return "";
  }
}
