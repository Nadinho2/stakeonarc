"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

type Variant = "cyan" | "purple" | "orange";

const variantClass: Record<Variant, string> = {
  cyan:
    "border-cyan-400/50 bg-cyan-500/10 text-cyan-100 shadow-[0_0_24px_rgba(0,255,255,0.25)] hover:bg-cyan-500/20",
  purple:
    "border-purple-400/50 bg-purple-500/10 text-purple-100 shadow-[0_0_24px_rgba(168,85,247,0.25)] hover:bg-purple-500/20",
  orange:
    "border-orange-400/50 bg-orange-500/10 text-orange-100 shadow-[0_0_24px_rgba(251,146,60,0.25)] hover:bg-orange-500/20",
};

type Props = {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
};

export function TransactionButton({
  children,
  onClick,
  disabled,
  loading,
  variant = "cyan",
  className,
  type = "button",
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        variantClass[variant],
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
