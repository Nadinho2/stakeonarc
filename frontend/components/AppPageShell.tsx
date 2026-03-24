"use client";

type Props = {
  children: React.ReactNode;
};

/** Full-page gradient backdrop + base text color — wrap main app views */
export function AppPageShell({ children }: Props) {
  return (
    <div className="relative min-h-screen bg-[#0f0f1a] text-zinc-100 antialiased selection:bg-cyan-500/25 selection:text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_-15%,rgba(34,211,238,0.12),transparent_58%),radial-gradient(ellipse_95%_65%_at_100%_5%,rgba(168,85,247,0.11),transparent_52%),radial-gradient(ellipse_75%_55%_at_0%_95%,rgba(251,146,60,0.07),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_35%,rgba(0,0,0,0.5)_100%)]"
        aria-hidden
      />
      {children}
    </div>
  );
}
