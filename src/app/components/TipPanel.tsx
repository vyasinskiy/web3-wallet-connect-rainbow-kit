"use client";

import styles from "../page.module.css";

type TipPanelProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error: string | null;
  estimatedFeeEth: string;
  baseFeeGwei: string;
  estimatedGas: string;
};

export function TipPanel({
  value,
  onChange,
  disabled,
  error,
  estimatedFeeEth,
  baseFeeGwei,
  estimatedGas,
}: TipPanelProps) {
  return (
    <div className={styles.tipBlock}>
      <div className={styles.tipHeader}>
        <p className={styles.label}>Priority fee tip</p>
        <p className={styles.counterMeta}>Gwei</p>
      </div>
      <div className={styles.tipRow}>
        <input
          className={styles.tipSlider}
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
        <p className={styles.tipValue}>{value} gwei</p>
      </div>
      <p className={styles.tipCost}>Est. fee {estimatedFeeEth} ETH</p>
      <p className={styles.tipMeta}>
        Min gas price {baseFeeGwei} gwei · Gas limit {estimatedGas}
      </p>
      <p className={styles.tipHint}>Adds a tip to speed inclusion</p>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
