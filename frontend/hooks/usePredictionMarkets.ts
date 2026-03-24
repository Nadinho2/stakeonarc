"use client";

import { useMemo } from "react";
import { useAccount, useBlock, useReadContract, useReadContracts } from "wagmi";

import {
  VIBE_PREDICTION_MARKET_ADDRESS,
  isMarketsConfigured,
  vibePredictionMarketAbi,
} from "@/lib/contracts";
import { arcTestnet } from "@/lib/web3";

/** VIBE: Market row from `getMarket`. */
export type MarketStruct = {
  question: string;
  endTime: bigint;
  resolved: boolean;
  winningIsYes: boolean;
  totalYes: bigint;
  totalNo: bigint;
};

/** VIBE: Market + user position for UI. */
export type MarketWithPosition = {
  id: bigint;
  market: MarketStruct;
  userYes: bigint;
  userNo: bigint;
  claimed: boolean;
};

/** VIBE: Latest block timestamp (falls back to local clock). */
export function useChainNow() {
  const { data: block } = useBlock({
    chainId: arcTestnet.id,
    watch: true,
  });
  return block?.timestamp ?? BigInt(Math.floor(Date.now() / 1000));
}

/** VIBE: Prediction market contract owner (for Create Market). */
export function usePredictionMarketOwner() {
  return useReadContract({
    address: VIBE_PREDICTION_MARKET_ADDRESS,
    abi: vibePredictionMarketAbi,
    functionName: "owner",
    query: {
      enabled: isMarketsConfigured(),
    },
  });
}

/** VIBE: Load all markets, user stakes, and claim flags. */
export function usePredictionMarkets() {
  const { address } = useAccount();
  const now = useChainNow();

  const {
    data: marketCount,
    isPending: countPending,
    refetch: refetchCount,
  } = useReadContract({
    address: VIBE_PREDICTION_MARKET_ADDRESS,
    abi: vibePredictionMarketAbi,
    functionName: "marketCount",
    query: {
      enabled: isMarketsConfigured(),
      refetchInterval: 12_000,
    },
  });

  const n = marketCount !== undefined ? Number(marketCount) : 0;

  const marketContracts = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        address: VIBE_PREDICTION_MARKET_ADDRESS,
        abi: vibePredictionMarketAbi,
        functionName: "getMarket" as const,
        args: [BigInt(i)] as const,
      })),
    [n],
  );

  const {
    data: marketResults,
    isPending: marketsPending,
    refetch: refetchMarkets,
  } = useReadContracts({
    contracts: marketContracts,
    query: {
      enabled: isMarketsConfigured() && n > 0,
    },
  });

  const betContracts = useMemo(
    () =>
      address && n > 0
        ? Array.from({ length: n }, (_, i) => ({
            address: VIBE_PREDICTION_MARKET_ADDRESS,
            abi: vibePredictionMarketAbi,
            functionName: "getUserBet" as const,
            args: [BigInt(i), address] as const,
          }))
        : [],
    [n, address],
  );

  const claimedContracts = useMemo(
    () =>
      address && n > 0
        ? Array.from({ length: n }, (_, i) => ({
            address: VIBE_PREDICTION_MARKET_ADDRESS,
            abi: vibePredictionMarketAbi,
            functionName: "claimed" as const,
            args: [BigInt(i), address] as const,
          }))
        : [],
    [n, address],
  );

  const { data: betResults, refetch: refetchBets } = useReadContracts({
    contracts: betContracts,
    query: {
      enabled: !!address && isMarketsConfigured() && n > 0,
    },
  });

  const { data: claimedResults, refetch: refetchClaimed } = useReadContracts({
    contracts: claimedContracts,
    query: {
      enabled: !!address && isMarketsConfigured() && n > 0,
    },
  });

  const rows: MarketWithPosition[] = useMemo(() => {
    if (!marketResults || n === 0) return [];
    const out: MarketWithPosition[] = [];
    for (let i = 0; i < n; i++) {
      const mr = marketResults[i];
      if (!mr || mr.status !== "success" || mr.result == null) continue;
      const market = mr.result as MarketStruct;
      const betR = betResults?.[i];
      const clR = claimedResults?.[i];
      let userYes = 0n;
      let userNo = 0n;
      if (betR?.status === "success" && Array.isArray(betR.result)) {
        userYes = betR.result[0] as bigint;
        userNo = betR.result[1] as bigint;
      }
      let claimed = false;
      if (clR?.status === "success" && typeof clR.result === "boolean") {
        claimed = clR.result;
      }
      out.push({
        id: BigInt(i),
        market,
        userYes,
        userNo,
        claimed,
      });
    }
    return out.sort((a, b) => {
      const ra = statusRank(a.market, now);
      const rb = statusRank(b.market, now);
      if (ra !== rb) return ra - rb;
      return Number(b.id - a.id);
    });
  }, [marketResults, betResults, claimedResults, n, now]);

  const refetchAll = async () => {
    await refetchCount();
    await refetchMarkets();
    await refetchBets();
    await refetchClaimed();
  };

  return {
    marketCount,
    rows,
    now,
    isLoading: countPending || (n > 0 && marketsPending),
    refetchAll,
  };
}

/** VIBE: Sort: open → closed (awaiting resolution) → resolved. */
function statusRank(m: MarketStruct, now: bigint): number {
  if (m.resolved) return 2;
  if (now >= m.endTime) return 1;
  return 0;
}
