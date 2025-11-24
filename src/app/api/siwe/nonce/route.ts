import { generateNonce } from "siwe";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { siweCookies } from "@/lib/siweSession";

type NonceRequest = {
  address?: string;
};

export async function POST(req: Request) {
  const { address }: NonceRequest = await req.json();

  if (!address) {
    return Response.json({ error: "Address is required." }, { status: 400 });
  }

  const normalizedAddress = address.toLowerCase();
  const nonce = generateNonce();

  const cookieStore = await cookies();

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const wallet = await prisma.wallet.upsert({
    where: { address: normalizedAddress },
    update: {},
    create: {
      address: normalizedAddress,
      user: {
        create: {},
      },
    },
  });

  await prisma.nonce.create({
    data: {
      value: nonce,
      expiresAt,
      walletId: wallet.id,
    },
  });

  cookieStore.set(siweCookies.nonce, nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return Response.json({ nonce });
}
