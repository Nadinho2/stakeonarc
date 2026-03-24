"use client";

import { TrendingUp, Wallet, Gift } from "lucide-react";

import { cn } from "@/utils/cn";

type Stat = {
  label: string;
  value: string;
  sub?: string;
  icon: "wallet" | "gift" | "apy";
};

const icons = {
  wallet: Wallet,
  gift: Gift,
  apy: TrendingUp,
};

export function StatsCard({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {stats.map((s) => {
        const Icon = icons[s.icon];
        return (
          <div
            key={s.label}
            className={cn(
              "rounded-2xl border border-white/[0.06] bg-zinc-950/50 p-5 backdrop-blur-sm",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_40px_-12px_rgba(0,0,0,0.5)]",
            )}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              <Icon className="h-4 w-4 text-fuchsia-400/90" aria-hidden />
              {s.label}
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-white sm:mt-3 sm:text-2xl">
              {s.value}
            </p>
            {s.sub ? (
              <p className="mt-2 text-xs leading-snug text-zinc-600">{s.sub}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
