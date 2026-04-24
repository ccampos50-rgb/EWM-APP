"use client";

import { useEffect } from "react";

type ScanCode = {
  id: string;
  code: string;
  entity_kind: string;
  entity_ref: string;
};

export function PrintableQRSheet({
  siteName,
  siteAddress,
  siteQRCode,
  entityKind,
  scanCodes,
}: {
  siteName: string;
  siteAddress: string;
  siteQRCode: string;
  entityKind: string;
  scanCodes: ScanCode[];
}) {
  useEffect(() => {
    // Wire up the "Print" button in the header
    const trigger = document.querySelector<HTMLButtonElement>("[data-print-trigger]");
    if (!trigger) return;
    const handler = () => window.print();
    trigger.addEventListener("click", handler);
    return () => trigger.removeEventListener("click", handler);
  }, []);

  return (
    <div>
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-semibold text-slate-900">Printable QR codes</h1>
        <p className="mt-1 text-sm text-slate-500">
          {siteName} · {scanCodes.length} {entityKind} code{scanCodes.length === 1 ? "" : "s"}.
          Print and post at each location. Workers scan with the mobile app to start/complete tasks.
        </p>
      </div>

      {/* Site QR header card (always first) */}
      <div className="mb-6 break-inside-avoid rounded-lg border-2 border-slate-900 bg-white p-8 text-center print:border-black">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Site QR — post at entrance</div>
        <div className="mt-2 text-lg font-bold text-slate-900">{siteName}</div>
        {siteAddress && <div className="text-xs text-slate-500">{siteAddress}</div>}
        <div className="mt-4 flex justify-center">
          <QRBlock value={siteQRCode} size={220} />
        </div>
        <div className="mt-3 font-mono text-xs text-slate-600">{siteQRCode}</div>
      </div>

      {scanCodes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center print:hidden">
          <p className="text-sm text-slate-500">
            No {entityKind} codes registered at this site yet. Add them via Super Admin tools or by
            inserting into <code>scan_codes</code> directly.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 print:gap-3 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3">
          {scanCodes.map((sc) => (
            <div
              key={sc.id}
              className="break-inside-avoid rounded-lg border border-slate-300 bg-white p-5 text-center print:border-black"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {entityKind}
              </div>
              <div className="text-2xl font-bold text-slate-900">{sc.entity_ref}</div>
              <div className="mt-3 flex justify-center">
                <QRBlock value={sc.code} size={140} />
              </div>
              <div className="mt-2 font-mono text-[10px] text-slate-500">{sc.code}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Tiny QR generator using a public API. Zero-dependency approach suited for
 * a pilot. Swap to a local library (e.g. qrcode) if offline printing is needed.
 */
function QRBlock({ value, size }: { value: string; size: number }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(value)}`;
  return (
    <img
      src={url}
      alt={`QR: ${value}`}
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}
