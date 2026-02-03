"use client";

import { useWatchCounterCountUpdatedEvent } from "@/generated/wagmi";
import styles from "../page.module.css";

type CounterValueRefetchProps = {
  address: `0x${string}`;
  chainId: number;
  isReady: boolean;
  countData: bigint | undefined;
  isFetching: boolean;
  onRefetch: () => void;
  disabled: boolean;
};

export function CounterValueRefetch({
  address,
  chainId,
  isReady,
  countData,
  isFetching,
  onRefetch,
  disabled,
}: CounterValueRefetchProps) {
  useWatchCounterCountUpdatedEvent({
    address,
    chainId,
    enabled: isReady,
    onLogs: () => {
      onRefetch();
    },
  });

  const countValue =
    typeof countData === "bigint" ? countData.toString() : "0";

  return (
    <div className={styles.counterValueRow}>
      <p className={styles.counterValue}>
        {isFetching ? "Loading..." : countValue}
      </p>
      <button
        className={styles.secondaryButton}
        onClick={onRefetch}
        disabled={disabled}
      >
        Refresh (refetch)
      </button>
    </div>
  );
}
