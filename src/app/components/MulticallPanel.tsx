"use client";

import { useState } from "react";
import { encodeFunctionData } from "viem";
import { usePublicClient, useWriteContract } from "wagmi";
import styles from "../page.module.css";
import { counterAbi } from "@/generated/wagmi";

type MulticallPanelProps = {
  counterAddress: `0x${string}`;
  counterChainId: number;
  isCounterReady: boolean;
  isBusy: boolean;
  isTipValid: boolean;
  tipWei?: bigint;
  onPendingChange: (pending: boolean) => void;
  onRefetch: () => void;
};

export function MulticallPanel({
  counterAddress,
  counterChainId,
  isCounterReady,
  isBusy,
  isTipValid,
  tipWei,
  onPendingChange,
  onRefetch,
}: MulticallPanelProps) {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: counterChainId });

  const [batchMode, setBatchMode] = useState<"separate" | "multicall">(
    "separate"
  );
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchPending, setBatchPending] = useState(false);
  const [separateGasUsed, setSeparateGasUsed] = useState<
    [bigint, bigint] | null
  >(null);
  const [multicallGasUsed, setMulticallGasUsed] = useState<bigint | null>(null);

  const setPendingState = (pending: boolean) => {
    setBatchPending(pending);
    onPendingChange(pending);
  };

  const handleBatchIncrement = async () => {
    if (!publicClient) {
      setBatchError("Public client is unavailable for this chain.");
      return;
    }

    if (!isTipValid) {
      setBatchError("Fix the tip amount before sending.");
      return;
    }

    const gasTip =
      tipWei && tipWei > 0n ? { maxPriorityFeePerGas: tipWei } : {};

    setBatchError(null);
    setPendingState(true);
    try {
      if (batchMode === "separate") {
        setSeparateGasUsed(null);
        const firstHash = await writeContractAsync({
          address: counterAddress,
          abi: counterAbi,
          functionName: "increment",
          ...gasTip,
        });
        const firstReceipt = await publicClient.waitForTransactionReceipt({
          hash: firstHash,
        });

        const secondHash = await writeContractAsync({
          address: counterAddress,
          abi: counterAbi,
          functionName: "increment",
          ...gasTip,
        });
        const secondReceipt = await publicClient.waitForTransactionReceipt({
          hash: secondHash,
        });

        setSeparateGasUsed([firstReceipt.gasUsed, secondReceipt.gasUsed]);
      } else {
        const data = [
          encodeFunctionData({
            abi: counterAbi,
            functionName: "increment",
          }),
          encodeFunctionData({
            abi: counterAbi,
            functionName: "increment",
          }),
        ];
        setMulticallGasUsed(null);
        const hash = await writeContractAsync({
          address: counterAddress,
          abi: counterAbi,
          functionName: "multicall",
          args: [data],
          ...gasTip,
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setMulticallGasUsed(receipt.gasUsed);
      }
      onRefetch();
    } catch (err) {
      setBatchError(
        err instanceof Error ? err.message : "Batch transaction failed."
      );
    } finally {
      setPendingState(false);
    }
  };

  const formatGas = (value?: bigint | null) =>
    typeof value === "bigint" ? value.toString() : "—";
  const separateGasTotal =
    separateGasUsed &&
    (separateGasUsed[0] + separateGasUsed[1]).toString();

  return (
    <div className={styles.batchBlock}>
      <div className={styles.batchHeader}>
        <p className={styles.label}>Multicall demo</p>
        <p className={styles.counterMeta}>Increment twice (+2)</p>
      </div>
      <div className={styles.batchOptions}>
        <label className={styles.batchOption}>
          <input
            type="radio"
            name="batchMode"
            value="separate"
            checked={batchMode === "separate"}
            onChange={() => setBatchMode("separate")}
            disabled={!isCounterReady || isBusy}
          />
          Two transactions
        </label>
        <label className={styles.batchOption}>
          <input
            type="radio"
            name="batchMode"
            value="multicall"
            checked={batchMode === "multicall"}
            onChange={() => setBatchMode("multicall")}
            disabled={!isCounterReady || isBusy}
          />
          Single multicall
        </label>
      </div>
      <button
        className={styles.primaryButton}
        onClick={handleBatchIncrement}
        disabled={!isCounterReady || isBusy || batchPending || !isTipValid}
      >
        {batchMode === "separate" ? "Send 2 transactions" : "Send multicall"}
      </button>

      {separateGasUsed && (
        <div className={styles.gasBlock}>
          <p className={styles.label}>Gas used (separate)</p>
          <p className={styles.gasValue}>
            Tx1 {formatGas(separateGasUsed[0])} · Tx2{" "}
            {formatGas(separateGasUsed[1])} · Total {separateGasTotal}
          </p>
        </div>
      )}

      {multicallGasUsed && (
        <div className={styles.gasBlock}>
          <p className={styles.label}>Gas used (multicall)</p>
          <p className={styles.gasValue}>{formatGas(multicallGasUsed)}</p>
        </div>
      )}

      {batchError && <p className={styles.error}>{batchError}</p>}
    </div>
  );
}
