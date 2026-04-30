import { type SVGProps } from "react";

/** EWM Altus chevron mark — a single upward peak. */
export function AltusMark({
  size = 32,
  background = true,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; background?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EWM Altus"
      {...props}
    >
      {background && (
        <rect width="64" height="64" rx="14" fill="url(#altusGrad)" />
      )}
      <defs>
        <linearGradient id="altusGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A5570" />
          <stop offset="100%" stopColor="#0E3D52" />
        </linearGradient>
      </defs>
      <path
        d="M32 16 L48 46 L42 46 L32 28 L22 46 L16 46 Z"
        fill="#5EB4CC"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full wordmark: chevron + "EWM Altus" text. For use in dark contexts. */
export function AltusWordmark({
  className = "",
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <AltusMark size={36} />
      <div className="flex flex-col leading-none">
        <span className="text-xl font-light tracking-wide">
          <span className="text-altus-cream">EWM </span>
          <span className="font-serif italic text-altus-accent">Altus</span>
        </span>
        {showTagline && (
          <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-altus-muted">
            Technology · Elevated
          </span>
        )}
      </div>
    </div>
  );
}
