"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import styles from "../page.module.css";
import { counterAbi } from "@/generated/wagmi";
import { CounterValueEvent } from "./CounterValueEvent";
import { CounterValueRefetch } from "./CounterValueRefetch";
import { MulticallPanel } from "./MulticallPanel";
import { TipPanel } from "./TipPanel";
import { formatEther, formatUnits, parseUnits } from "viem";

type CounterPanelProps = {
  isConnected: boolean;
  chainId: number;
};

export function CounterPanel({
  isConnected,
  chainId,
}: CounterPanelProps) {
  const { address } = useAccount();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [customValue, setCustomValue] = useState("0");
  const [counterError, setCounterError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [batchPending, setBatchPending] = useState(false);
  const [tipInput, setTipInput] = useState("0");
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [baseFeePerGas, setBaseFeePerGas] = useState<bigint | null>(null);

  const counterAddress = process.env
    .NEXT_PUBLIC_COUNTER_ADDRESS as `0x${string}` | undefined;
  const counterChainId = Number(
    process.env.NEXT_PUBLIC_COUNTER_CHAIN_ID ?? 31337
  );
  const publicClient = usePublicClient({ chainId: counterChainId });
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
  }, [isTxSuccess]);

  useEffect(() => {
    if (!publicClient || !counterAddress || !address || !isCounterReady) {
      setEstimatedGas(null);
      setBaseFeePerGas(null);
      return;
    }

    let cancelled = false;

    const loadEstimates = async () => {
      try {
        const block = await publicClient.getBlock();
        if (!cancelled) {
          setBaseFeePerGas(block.baseFeePerGas ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setBaseFeePerGas(null);
        }
      }

      try {
        const gas = await publicClient.estimateContractGas({
          address: counterAddress,
          abi: counterAbi,
          functionName: "increment",
          account: address,
        });
        if (!cancelled) {
          setEstimatedGas(gas);
        }
      } catch (err) {
        if (!cancelled) {
          setEstimatedGas(null);
        }
      }
    };

    loadEstimates();

    return () => {
      cancelled = true;
    };
  }, [publicClient, counterAddress, address, isCounterReady]);

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
    submitCounterTx(() => {
      if (!isTipValid) {
        throw new Error("Fix the tip amount before sending.");
      }
      return writeContractAsync({
        address: counterAddress!,
        abi: counterAbi,
        functionName: "increment",
        ...gasTipOverrides,
      });
    });

  const handleDecrement = () =>
    submitCounterTx(() => {
      if (!isTipValid) {
        throw new Error("Fix the tip amount before sending.");
      }
      return writeContractAsync({
        address: counterAddress!,
        abi: counterAbi,
        functionName: "decrement",
        ...gasTipOverrides,
      });
    });

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
      if (!isTipValid) {
        throw new Error("Fix the tip amount before sending.");
      }

      return writeContractAsync({
        address: counterAddress!,
        abi: counterAbi,
        functionName: "setCount",
        args: [value],
        ...gasTipOverrides,
      });
    });

  const parseTip = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return { wei: 0n, error: null };
    }
    if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) {
      return { wei: null, error: "Enter up to 2 decimals in gwei." };
    }
    try {
      return {
        wei: parseUnits(trimmed, 9),
        error: null,
      };
    } catch (err) {
      return { wei: null, error: "Tip value is too large." };
    }
  };

  const { wei: tipWei, error: tipError } = useMemo(
    () => parseTip(tipInput),
    [tipInput]
  );
  const isTipValid = !tipError;
  const gasTipOverrides =
    tipWei && tipWei > 0n ? { maxPriorityFeePerGas: tipWei } : {};
  const estimatedFeeWei = useMemo(() => {
    if (!estimatedGas || baseFeePerGas === null) return null;
    return (baseFeePerGas + (tipWei ?? 0n)) * estimatedGas;
  }, [estimatedGas, baseFeePerGas, tipWei]);
  const formatEth = (value?: bigint | null) => {
    if (value === null || value === undefined) return "—";
    const eth = formatEther(value);
    const [whole, fraction] = eth.split(".");
    if (!fraction) return eth;
    return `${whole}.${fraction.slice(0, 6)}`;
  };
  const estimatedFeeEth = formatEth(estimatedFeeWei);
  const baseFeeGwei = useMemo(() => {
    if (baseFeePerGas === null || baseFeePerGas === undefined) return "—";
    const gwei = formatUnits(baseFeePerGas, 9);
    const [whole, fraction] = gwei.split(".");
    if (!fraction) return gwei;
    return `${whole}.${fraction.slice(0, 2)}`;
  }, [baseFeePerGas]);
  const estimatedGasText = estimatedGas ? estimatedGas.toString() : "—";

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
          <CounterValueRefetch
            address={resolvedCounterAddress}
            chainId={counterChainId}
            isReady={isCounterReady}
            countData={countData}
            isFetching={isCountFetching}
            onRefetch={refetchCount}
            disabled={!isCounterReady || counterBusy}
          />
          <CounterValueEvent
            address={resolvedCounterAddress}
            chainId={counterChainId}
            isReady={isCounterReady}
            countData={countData}
            disabled={!isCounterReady || counterBusy}
          />

          <div className={styles.counterControls}>
            <button
              className={styles.primaryButton}
              onClick={handleIncrement}
              disabled={!isCounterReady || counterBusy || !isTipValid}
            >
              +1
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleDecrement}
              disabled={!isCounterReady || counterBusy || !isTipValid}
            >
              -1
            </button>
          </div>

          <TipPanel
            value={tipInput}
            onChange={setTipInput}
            disabled={!isCounterReady || counterBusy}
            error={tipError}
            estimatedFeeEth={estimatedFeeEth}
            baseFeeGwei={baseFeeGwei}
            estimatedGas={estimatedGasText}
          />

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
              disabled={!isCounterReady || counterBusy || !isTipValid}
            >
              Set
            </button>
          </div>
          <MulticallPanel
            counterAddress={counterAddress!}
            counterChainId={counterChainId}
            isCounterReady={isCounterReady}
            isBusy={counterBusy}
            isTipValid={isTipValid}
            tipWei={tipWei ?? undefined}
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
