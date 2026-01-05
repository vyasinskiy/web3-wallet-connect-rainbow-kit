"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type HistoryItem = {
  id: number;
  message: string;
  signature: string;
  createdAt: string;
  nonceId: number | null;
};

type Props = {
  sessionAddress: string;
};

export default function ProtectedClient({ sessionAddress }: Props) {
  const [address, setAddress] = useState(sessionAddress);
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch("/api/signature/history");
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        setHistory(data.signatures ?? []);
      } catch (err) {
        setStatus({
          kind: "error",
          text: err instanceof Error ? err.message : "Failed to load history",
        });
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/signature/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      if (data.valid) {
        setStatus({
          kind: "success",
          text: "Signature is valid for this address.",
        });
      } else {
        setStatus({
          kind: "error",
          text: `Signature invalid. Recovered: ${data.recovered}`,
        });
      }
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Verification error",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToForm = (item: HistoryItem) => {
    setMessage(item.message);
    setSignature(item.signature);
    setStatus(null);
  };

  return (
    <div className={styles.card}>
      <div className={styles.heading}>
        <h1>Signature verification</h1>
        <p className={styles.muted}>
          Доступно только после SIWE. Проверяйте подписи и копируйте данные из истории.
        </p>
        <p className={styles.muted}>Сессия для адреса: {sessionAddress}</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <form onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="address">
              Address
            </label>
            <input
              id="address"
              className={styles.input}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
            />

            <label className={styles.label} htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              className={`${styles.input} ${styles.textarea}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message that was signed"
            />

            <label className={styles.label} htmlFor="signature">
              Signature
            </label>
            <textarea
              id="signature"
              className={`${styles.input} ${styles.textarea}`}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="0x..."
            />

            <div style={{ marginTop: "12px" }}>
              <button
                type="submit"
                className={`${styles.button} ${styles.primaryButton}`}
                disabled={loading}
              >
                {loading ? "Checking..." : "Verify signature"}
              </button>
            </div>
          </form>

          {status && (
            <p className={`${styles.status} ${styles[status.kind]}`}>{status.text}</p>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.historyHeader}>
            <h3 style={{ margin: 0 }}>История подписей</h3>
            <p className={styles.small}>
              {historyLoading ? "Загрузка..." : `${history.length} записей`}
            </p>
          </div>
          <div className={styles.history}>
            {history.length === 0 && !historyLoading && (
              <p className={styles.muted}>Пока нет сохранённых подписей.</p>
            )}
            {history.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <div className={styles.historyHeader}>
                  <p className={styles.small}>
                    {new Date(item.createdAt).toLocaleString()}
                    {item.nonceId ? ` · nonce ${item.nonceId}` : ""}
                  </p>
                  <button
                    className={`${styles.button} ${styles.primaryButton}`}
                    onClick={() => copyToForm(item)}
                    type="button"
                  >
                    Заполнить форму
                  </button>
                </div>
                <p className={styles.label}>Message</p>
                <p className={styles.code}>{item.message}</p>
                <p className={styles.label}>Signature</p>
                <p className={styles.code}>{item.signature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
