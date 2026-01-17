"use client";

import { useEffect, useState } from "react";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import styles from "../page.module.css";
import { counterAbi } from "@/generated/wagmi";
import { MulticallPanel } from "./MulticallPanel";

type CounterPanelProps = {
  isConnected: boolean;
  chainId: number;
};

export function CounterPanel({
  isConnected,
  chainId,
}: CounterPanelProps) {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [customValue, setCustomValue] = useState("0");
  const [counterError, setCounterError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [batchPending, setBatchPending] = useState(false);

  const counterAddress = process.env
    .NEXT_PUBLIC_COUNTER_ADDRESS as `0x${string}` | undefined;
  const counterChainId = Number(
    process.env.NEXT_PUBLIC_COUNTER_CHAIN_ID ?? 31337
  );
  const resolvedCounterAddress =
    counterAddress ?? "0x0000000000000000000000000000000000000000";

  const isCounterChain = chainId === counterChainId;
  const isCounterReady =
    isConnected && !!counterAddress && isCounterChain;

  const {
    data: countData,
    refetch: refetchCount,
    isFetching: isCountFetching,
  } = useReadContract({
    address: resolvedCounterAddress,
    abi: counterAbi,
    functionName: "count",
    chainId: counterChainId,
    query: {
      enabled: isCounterReady,
    },
  });

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash ?? undefined,
      query: { enabled: !!txHash },
    });

  useEffect(() => {
    if (!isTxSuccess) return;
    setTxHash(null);
    refetchCount();
  }, [isTxSuccess, refetchCount]);

  const submitCounterTx = async (action: () => Promise<`0x${string}`>) => {
    setCounterError(null);
    try {
      const hash = await action();
      setTxHash(hash);
    } catch (err) {
      setCounterError(
        err instanceof Error ? err.message : "Counter transaction failed."
      );
    }
  };

  const handleIncrement = () =>
    submitCounterTx(() =>
      writeContractAsync({
        address: counterAddress!,
        abi: counterAbi,
        functionName: "increment",
      })
    );

  const handleDecrement = () =>
    submitCounterTx(() =>
      writeContractAsync({
        address: counterAddress!,
        abi: counterAbi,
        functionName: "decrement",
      })
    );

  const handleSetCount = () =>
    submitCounterTx(async () => {
      let value: bigint;
      try {
        value = BigInt(customValue);
      } catch (err) {
        throw new Error("Enter a valid integer.");
      }
      if (value < 0n) {
        throw new Error("Enter a non-negative value.");
      }

      return writeContractAsync({
        address: counterAddress!,
        abi: counterAbi,
        functionName: "setCount",
        args: [value],
      });
    });

  const countValue =
    typeof countData === "bigint" ? countData.toString() : "0";
  const counterBusy = isWritePending || isTxLoading || batchPending;

  return (
    <div className={styles.counterBlock}>
      <div className={styles.counterHeader}>
        <p className={styles.label}>Counter</p>
        <p className={styles.counterMeta}>
          {counterAddress
            ? isCounterChain
              ? `Chain ${counterChainId}`
              : `Switch to chain ${counterChainId}`
            : "Set NEXT_PUBLIC_COUNTER_ADDRESS"}
        </p>
      </div>

      {counterAddress ? (
        <>
          <div className={styles.counterValueRow}>
            <p className={styles.counterValue}>
              {isCountFetching ? "Loading..." : countValue}
            </p>
            <button
              className={styles.secondaryButton}
              onClick={() => refetchCount()}
              disabled={!isCounterReady || counterBusy}
            >
              Refresh
            </button>
          </div>

          <div className={styles.counterControls}>
            <button
              className={styles.primaryButton}
              onClick={handleIncrement}
              disabled={!isCounterReady || counterBusy}
            >
              +1
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleDecrement}
              disabled={!isCounterReady || counterBusy}
            >
              -1
            </button>
          </div>

          <div className={styles.counterSetRow}>
            <input
              className={styles.counterInput}
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Custom value"
              disabled={!isCounterReady || counterBusy}
            />
            <button
              className={styles.primaryButton}
              onClick={handleSetCount}
              disabled={!isCounterReady || counterBusy}
            >
              Set
            </button>
          </div>
          <MulticallPanel
            counterAddress={counterAddress!}
            counterChainId={counterChainId}
            isCounterReady={isCounterReady}
            isBusy={counterBusy}
            onPendingChange={setBatchPending}
            onRefetch={refetchCount}
          />
        </>
      ) : (
        <p className={styles.disconnected}>
          Deploy the contract and set the address in
          NEXT_PUBLIC_COUNTER_ADDRESS.
        </p>
      )}

      {counterBusy && (
        <p className={styles.label}>Submitting transaction...</p>
      )}
      {counterError && <p className={styles.error}>{counterError}</p>}
    </div>
  );
}
