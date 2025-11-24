import { SiweMessage } from "siwe";
import { cookies, headers as NextHeaders } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  clearCookieOptions,
  createSessionToken,
  sessionCookieOptions,
  siweCookies,
} from "@/lib/siweSession";

type VerifyBody = {
  message?: string;
  signature?: string;
};

export async function POST(req: Request) {
  const { message, signature }: VerifyBody = await req.json();

  if (!message || !signature) {
    return Response.json({ error: "Missing SIWE payload." }, { status: 400 });
  }

  const cookieStore = await cookies();

  const nonce = cookieStore.get(siweCookies.nonce)?.value;
  if (!nonce) {
    return Response.json({ error: "Nonce not found or expired." }, { status: 400 });
  }

  const nonceRecord = await prisma.nonce.findUnique({
    where: { value: nonce },
  });

  if (
    !nonceRecord ||
    nonceRecord.used ||
    nonceRecord.expiresAt.getTime() < Date.now()
  ) {
    cookieStore.set(siweCookies.nonce, "", clearCookieOptions());
    return Response.json({ error: "Nonce not found or expired." }, { status: 400 });
  }

  const siweMessage = new SiweMessage(message);
  const headers = await NextHeaders();
  const domain = headers.get("x-forwarded-host") || headers.get("host") || "";
  const originProtocol = (headers.get("x-forwarded-proto") || "http").includes(
    "https"
  )
    ? "https"
    : "http";

  const verification = await siweMessage.verify({
    signature,
    nonce,
    domain,
    time: new Date().toISOString(),
  });

  if (!verification.success) {
    cookieStore.set(siweCookies.nonce, "", clearCookieOptions());
    return Response.json({ error: "Invalid SIWE signature." }, { status: 422 });
  }

  const address = siweMessage.address.toLowerCase();

  await prisma.nonce.update({
    where: { value: nonce },
    data: { used: true },
  });

  await prisma.user.upsert({
    where: { address },
    create: { address },
    update: {},
  });

  cookieStore.set(
    siweCookies.session,
    createSessionToken(address),
    sessionCookieOptions()
  );

  cookieStore.set(siweCookies.nonce, "", clearCookieOptions());

  return Response.json({
    address,
    chainId: siweMessage.chainId,
    issuedAt: siweMessage.issuedAt,
    uri: siweMessage.uri || `${originProtocol}://${domain}`,
  });
}
