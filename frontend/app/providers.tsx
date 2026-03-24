"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { ThemeProvider } from "next-themes";
import { WagmiProvider } from "wagmi";

import { arcTestnet, wagmiConfig } from "@/lib/web3";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {/* VIBE: neon wallet modal to match the staking dashboard */}
          <RainbowKitProvider
            initialChain={arcTestnet}
            theme={darkTheme({
              accentColor: "#00ffff",
              accentColorForeground: "#0f0f1a",
              borderRadius: "large",
            })}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
