import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// VIBE: Merge Tailwind classes without conflicts (shadcn-style helper)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
