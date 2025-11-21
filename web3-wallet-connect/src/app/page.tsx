"use client";

import { useMemo, useState } from "react";
import { useConnect, useConnectors, useConnection, useDisconnect } from "wagmi";
import styles from "./page.module.css";

export default function Home() {
  const { address, status: accountStatus } = useConnection();
  const { connectAsync, error: connectError, isPending: isConnectPending } =
    useConnect();
  const { disconnectAsync, isPending: isDisconnectPending } = useDisconnect();
  const connectors = useConnectors();

  const [localError, setLocalError] = useState<string | null>(null);

  const connector = useMemo(() => {
    if (!connectors.length) return null;
    return (
      connectors.find((item) => item.id === "injected") ??
      connectors.find((item) => item.type === "injected") ??
      connectors[0]
    );
  }, [connectors]);

  const handleConnect = async () => {
    if (!connector) {
      setLocalError("Не найден ни один коннектор. Установите web3-кошелек.");
      return;
    }

    if (typeof connector.ready === "boolean" && !connector.ready) {
      setLocalError("Кошелек не доступен. Откройте расширение и попробуйте снова.");
      return;
    }

    setLocalError(null);

    try {
      await connectAsync({ connector });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Не удалось подключить кошелек."
      );
    }
  };

  const handleDisconnect = async () => {
    setLocalError(null);
    try {
      await disconnectAsync();
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Не удалось отключить кошелек."
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
          <h1>Подключите свой кошелек</h1>
          <p className={styles.lead}>
            Нажмите «Подключить», подтвердите действие в расширении, затем
            кусочек адреса появится ниже.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.status}>
            <p className={styles.label}>Статус</p>
            <p className={isConnected ? styles.connected : styles.disconnected}>
              {isConnected ? "Кошелек подключен" : "Не подключен"}
            </p>
          </div>

          {isConnected && formattedAddress && (
            <div className={styles.addressBlock}>
              <p className={styles.label}>Адрес</p>
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
                {isConnectPending ? "Подключаем..." : "Подключить кошелек"}
              </button>
            ) : (
              <button
                className={styles.secondaryButton}
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                {isDisconnectPending ? "Отключаем..." : "Отключить"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
