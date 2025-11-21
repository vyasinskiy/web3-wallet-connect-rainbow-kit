"use client";

import { useState } from "react";
import { useConnect, useConnection, useDisconnect } from "wagmi";
import styles from "./page.module.css";

export default function Home() {
  const { address, status: accountStatus, connector } = useConnection();
  const {
    connectAsync,
    error: connectError,
    isPending: isConnectPending,
  } = useConnect();
  const { disconnectAsync, isPending: isDisconnectPending } = useDisconnect();

  const [localError, setLocalError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!connector) {
      setLocalError("No connector found. Please install a web3 wallet.");
      return;
    }

    if (typeof connector.ready === "boolean" && !connector.ready) {
      setLocalError("Wallet is not available. Open the extension and retry.");
      return;
    }

    setLocalError(null);

    try {
      // async usage is important to be handled in catch
      await connectAsync({ connector });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to connect wallet.");
    }
  };

  const handleDisconnect = async () => {
    setLocalError(null);
    try {
      // async usage is important to be handled in catch
      await disconnectAsync();
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to disconnect wallet."
      );
    }
  };

  const formattedAddress =
    address && `${address.slice(0, 6)}…${address.slice(-4)}`;

  const isConnected = accountStatus === "connected";
  const isLoading = isConnectPending || isDisconnectPending;
  const errorMessage = localError ?? connectError?.message ?? null;

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
              {isConnected ? "Wallet connected" : "Not connected"}
            </p>
          </div>

          {isConnected && formattedAddress && (
            <div className={styles.addressBlock}>
              <p className={styles.label}>Address</p>
              <p className={styles.address}>{formattedAddress}</p>
            </div>
          )}

          {errorMessage && <p className={styles.error}>{errorMessage}</p>}

          <div className={styles.actions}>
            {!isConnected ? (
              <button
                className={styles.primaryButton}
                onClick={handleConnect}
                disabled={isLoading}
              >
                {isConnectPending ? "Connecting..." : "Connect wallet"}
              </button>
            ) : (
              <button
                className={styles.secondaryButton}
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                {isDisconnectPending ? "Disconnecting..." : "Disconnect"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
