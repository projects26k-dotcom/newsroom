"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

interface FaviconProps {
  domain?: string;
  className?: string;
  size?: number;
}

export function Favicon({
  domain,
  className = "w-3.5 h-3.5",
  size = 14,
}: FaviconProps) {
  const [hasError, setHasError] = useState(false);

  if (!domain || hasError) {
    return <Globe className={`${className} text-stone-400 shrink-0`} />;
  }

  const clean = domain.replace(/^www\./i, "").toLowerCase();
  const url = `https://www.google.com/s2/favicons?domain=${clean}&sz=64`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className={`${className} rounded-xs shrink-0 object-contain`}
      onError={() => setHasError(true)}
    />
  );
}
