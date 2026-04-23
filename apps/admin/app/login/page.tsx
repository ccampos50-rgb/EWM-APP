import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight text-[#1E3A8A]">EWM</div>
          <p className="mt-1 text-sm text-slate-500">People. Performance. Elevated.</p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
