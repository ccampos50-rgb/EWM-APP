import { LoginForm } from "./login-form";
import { AltusMark } from "@/components/altus-mark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="altus-gradient flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <AltusMark size={64} />
          <div className="mt-4 altus-wordmark text-3xl text-altus-cream">
            EWM <span className="altus-em">Altus</span>
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.3em] text-altus-muted">
            Technology · Elevated
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
          <LoginForm next={next ?? "/"} />
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            href="https://elevated-workforce.com"
            target="_blank"
            rel="noopener"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-altus-cream/90 backdrop-blur transition hover:border-altus-accent hover:bg-white/10 hover:text-altus-accent-bright"
          >
            EWM &#8599;
          </a>
          <div className="text-[10px] uppercase tracking-[0.25em] text-altus-muted">
            ewm-altus.com
          </div>
        </div>
      </div>
    </div>
  );
}
