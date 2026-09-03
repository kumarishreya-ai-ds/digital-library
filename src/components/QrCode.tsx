import { useEffect, useState } from "react";

export function QrCode({
  value,
  size = 200,
  alt,
}: {
  value: string;
  size?: number;
  alt: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setFailed(false);
    import("qrcode")
      .then((mod) =>
        mod.default.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: "M" }),
      )
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <p className="text-sm text-destructive">QR कोड नहीं बन सका। कृपया पेज रिफ्रेश करें।</p>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse rounded border border-border bg-muted"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className="rounded border border-border bg-card p-2"
    />
  );
}
