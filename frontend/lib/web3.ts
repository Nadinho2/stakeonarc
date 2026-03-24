"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { defineChain } from "viem";

// VIBE: RPC comes from .env — same URL wagmi uses for all JSON-RPC calls
const ARC_RPC_URL =
  process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network";

const ARC_EXPLORER =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";

// VIBE: Arc Testnet — chain metadata (native gas token is USDC on Arc)
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: ARC_EXPLORER,
    },
  },
  testnet: true,
});

// VIBE: RainbowKit + wagmi — explicit http() transport for predictable RPC routing
export const wagmiConfig = getDefaultConfig({
  appName: "Vibe Staking on Arc",
  projectId:
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "demo-project-id",
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(ARC_RPC_URL),
  },
  ssr: true,
});
