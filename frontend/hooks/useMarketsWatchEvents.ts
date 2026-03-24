"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useWatchContractEvent } from "wagmi";

import {
  VIBE_PREDICTION_MARKET_ADDRESS,
  vibePredictionMarketAbi,
} from "@/lib/contracts";

/** Invalidate prediction-market reads when the contract emits. */
export function useMarketsWatchEvents(enabled: boolean) {
  const queryClient = useQueryClient();

  const bump = () => {
    void queryClient.invalidateQueries();
  };

  useWatchContractEvent({
    address: VIBE_PREDICTION_MARKET_ADDRESS,
    abi: vibePredictionMarketAbi,
    eventName: "MarketCreated",
    enabled,
    onLogs: bump,
  });

  useWatchContractEvent({
    address: VIBE_PREDICTION_MARKET_ADDRESS,
    abi: vibePredictionMarketAbi,
    eventName: "BetPlaced",
    enabled,
    onLogs: bump,
  });

  useWatchContractEvent({
    address: VIBE_PREDICTION_MARKET_ADDRESS,
    abi: vibePredictionMarketAbi,
    eventName: "MarketResolved",
    enabled,
    onLogs: bump,
  });

  useWatchContractEvent({
    address: VIBE_PREDICTION_MARKET_ADDRESS,
    abi: vibePredictionMarketAbi,
    eventName: "WinningsClaimed",
    enabled,
    onLogs: bump,
  });
}
