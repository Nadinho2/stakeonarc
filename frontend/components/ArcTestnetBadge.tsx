"use client";

import { BadgeCheck } from "lucide-react";

import { cn } from "@/utils/cn";

type Props = {
  visible: boolean;
  className?: string;
};

// VIBE: Shown when the wallet is on Arc Testnet — builds trust for testers
export function ArcTestnetBadge({ visible, className }: Props) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-200 shadow-[0_0_20px_rgba(0,255,255,0.2)]",
        className,
      )}
    >
      <BadgeCheck className="h-4 w-4 text-cyan-300" aria-hidden />
      Deployed on Arc Testnet
    </div>
  );
}
