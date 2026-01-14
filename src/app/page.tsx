"use client";

import { useEffect, useMemo, useState } from "react";
import { SiweMessage } from "siwe";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import styles from "./page.module.css";
import { CounterPanel } from "./components/CounterPanel";

export default function Home() {
  const { address, status } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  const [siweAddress, setSiweAddress] = useState<string | null>(null);
  const [siweError, setSiweError] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const formattedAddress =
    address && `${address.slice(0, 6)}…${address.slice(-4)}`;

  const isConnected = status === "connected";
  const statusMessage =
    status === "connecting" || status === "reconnecting"
      ? "Connecting..."
      : isConnected
        ? "Wallet connected"
        : "Not connected";

  const isSiweSignedIn = useMemo(
    () => !!siweAddress && siweAddress.toLowerCase() === address?.toLowerCase(),
    [address, siweAddress]
  );

  useEffect(() => {
    const getSession = async () => {
      setSessionLoading(true);
      try {
        const res = await fetch("/api/siwe/session");
        const data = await res.json();
        setSiweAddress(data.address);
      } catch (err) {
        console.error(err);
        setSiweAddress(null);
      } finally {
        setSessionLoading(false);
      }
    };

    getSession();
  }, []);

  const handleSiweSignIn = async () => {
    if (!address || !isConnected) {
      setSiweError("Connect your wallet before signing in.");
      return;
    }

    const domain =
      typeof window !== "undefined" ? window.location.host : "localhost";
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    setIsAuthorizing(true);
    setSiweError(null);

    try {
      const nonceRes = await fetch("/api/siwe/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const { nonce } = await nonceRes.json();

      const message = new SiweMessage({
        domain,
        address,
        statement: "Sign in with Ethereum to this app.",
        uri: origin,
        version: "1",
        chainId,
        nonce,
      });

      const preparedMessage = message.prepareMessage();
      const signature = await signMessageAsync({
        message: preparedMessage,
      });

      const verifyRes = await fetch("/api/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: preparedMessage,
          signature,
        }),
      });

      if (!verifyRes.ok) {
        const { error } = await verifyRes.json();
        throw new Error(error || "Failed to verify SIWE signature.");
      }

      setSiweAddress(address);
    } catch (err) {
      setSiweError(err instanceof Error ? err.message : "SIWE failed.");
      setSiweAddress(null);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleSiweSignOut = async () => {
    setSiweError(null);
    setIsAuthorizing(true);
    try {
      await fetch("/api/siwe/logout", { method: "POST" });
      setSiweAddress(null);
    } catch (err) {
      setSiweError(err instanceof Error ? err.message : "Failed to sign out.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.heading}>
          <p className={styles.tag}>web3</p>
          <h1>Connect your wallet</h1>
          <p className={styles.lead}>
            Click “Connect”, confirm the request in your extension, and a
            snippet of your address will show below.
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
              chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
              showBalance={true}
            />
          </div>

          <div className={styles.authBlock}>
            <div className={styles.authHeader}>
              <p className={styles.label}>SIWE</p>
              <p
                className={
                  isSiweSignedIn ? styles.connected : styles.disconnected
                }
              >
                {sessionLoading
                  ? "Loading session..."
                  : isSiweSignedIn
                    ? "Signed in"
                    : "Not signed in"}
              </p>
            </div>

            {isSiweSignedIn && siweAddress && (
              <p className={styles.sessionAddress}>
                Session for {siweAddress.slice(0, 6)}…
                {siweAddress.slice(-4)}
              </p>
            )}

            {siweError && <p className={styles.error}>{siweError}</p>}

            <button
              className={
                isSiweSignedIn ? styles.secondaryButton : styles.primaryButton
              }
              onClick={isSiweSignedIn ? handleSiweSignOut : handleSiweSignIn}
              disabled={
                !isConnected ||
                isAuthorizing ||
                isSigning ||
                sessionLoading
              }
            >
              {isAuthorizing || isSigning
                ? "Authorizing..."
                : isSiweSignedIn
                  ? "Sign out"
                  : "Sign-In with Ethereum"}
            </button>
          </div>

          {isSiweSignedIn && (
            <CounterPanel
              isConnected={isConnected}
              chainId={chainId}
            />
          )}

        </div>
      </main>
    </div>
  );
}
