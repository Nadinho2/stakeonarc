import { cn } from "@/utils/cn";

/** Shared input styling for forms across the app */
export function vibeInput(className?: string) {
  return cn(
    "w-full rounded-xl border border-zinc-700/90 bg-zinc-950/80 px-4 py-3 text-[15px] text-zinc-100 tabular-nums",
    "placeholder:text-zinc-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] outline-none transition",
    "focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20",
    "disabled:cursor-not-allowed disabled:opacity-45",
    className,
  );
}

/** Admin mint form — purple focus ring */
export function vibeInputAdmin(className?: string) {
  return cn(
    vibeInput(),
    "focus:border-purple-500/50 focus:ring-purple-500/20",
    className,
  );
}
