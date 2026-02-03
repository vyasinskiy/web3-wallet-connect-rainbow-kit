"use client";

import { useEffect, useState } from "react";
import { useWatchCounterCountUpdatedEvent } from "@/generated/wagmi";
import styles from "../page.module.css";

type CounterValueEventProps = {
  address: `0x${string}`;
  chainId: number;
  isReady: boolean;
  countData: bigint | undefined;
  disabled: boolean;
};

export function CounterValueEvent({
  address,
  chainId,
  isReady,
  countData,
  disabled,
}: CounterValueEventProps) {
  const [eventCount, setEventCount] = useState<bigint | null>(null);

  useEffect(() => {
    if (typeof countData === "bigint") {
      setEventCount(countData);
    }
  }, [countData]);

  useWatchCounterCountUpdatedEvent({
    address,
    chainId,
    enabled: isReady,
    onLogs: (logs) => {
      debugger;
      const lastLog = logs[logs.length - 1];
      const nextValue =
        lastLog?.args && "newCount" in lastLog.args
          ? lastLog.args.newCount
          : null;
      if (typeof nextValue === "bigint") {
        setEventCount(nextValue);
      }
    },
  });

  const countValue = eventCount ? eventCount.toString() : "0";

  return (
    <div className={styles.counterValueRow}>
      <p className={styles.counterValue}>
        {disabled ? "Loading..." : countValue}
      </p>
      <button className={styles.secondaryButton} disabled>
        Live (onLogs)
      </button>
    </div>
  );
}
