"use client";

import { useEffect, useRef } from "react";
import { useAccount, useSwitchChain } from "wagmi";

import { arcTestnet } from "@/lib/web3";

// VIBE: When a wallet connects on the wrong chain, prompt a switch once (user can reject)
export function useAutoArcSwitch() {
  const { chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isConnected) {
      attempted.current = false;
      return;
    }
    if (!chainId) return;

    if (chainId === arcTestnet.id) {
      attempted.current = false;
      return;
    }

    if (attempted.current || !switchChain) return;
    attempted.current = true;
    // VIBE: Wallet may prompt the user — if they reject, use the banner’s Switch button
    switchChain({ chainId: arcTestnet.id });
  }, [isConnected, chainId, switchChain]);
}
