"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import styles from "./page.module.css";

export default function Home() {
  const { address, status } = useAccount();
  const formattedAddress =
    address && `${address.slice(0, 6)}…${address.slice(-4)}`;

  const isConnected = status === "connected";
  const statusMessage =
    status === "connecting" || status === "reconnecting"
      ? "Connecting..."
      : isConnected
        ? "Wallet connected"
        : "Not connected";

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.heading}>
          <p className={styles.tag}>web3</p>
          <h1>Connect your wallet</h1>
          <p className={styles.lead}>
            Click “Connect”, confirm the request in your extension, and a snippet
            of your address will show below.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.status}>
            <p className={styles.label}>Status</p>
            <p className={isConnected ? styles.connected : styles.disconnected}>
              {statusMessage}
            </p>
          </div>

          {isConnected && formattedAddress && (
            <div className={styles.addressBlock}>
              <p className={styles.label}>Address</p>
              <p className={styles.address}>{formattedAddress}</p>
            </div>
          )}

          <div className={styles.actions}>
            <ConnectButton
              accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
