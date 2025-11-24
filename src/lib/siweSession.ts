import crypto from "crypto";

const SESSION_COOKIE = "siwe_session";
const NONCE_COOKIE = "siwe_nonce";

const defaultMaxAgeSeconds = 60 * 60 * 24 * 7; // 7 days

const secret = process.env.SIWE_SECRET || "dev-siwe-secret";

type SessionPayload = {
  address: string;
  exp: number;
};

export const siweCookies = {
  session: SESSION_COOKIE,
  nonce: NONCE_COOKIE,
};

const base64UrlEncode = (input: string) =>
  Buffer.from(input).toString("base64url");

const base64UrlDecode = (input: string) =>
  Buffer.from(input, "base64url").toString("utf8");

export function createSessionToken(
  address: string,
  maxAgeSeconds: number = defaultMaxAgeSeconds
) {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload: SessionPayload = { address, exp };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadEncoded)
    .digest("base64url");

  return `${payloadEncoded}.${signature}`;
}

export function parseSessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadEncoded)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadEncoded));
  } catch {
    return null;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export function sessionCookieOptions(maxAgeSeconds: number = defaultMaxAgeSeconds) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
