import { generateNonce } from "siwe";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { siweCookies } from "@/lib/siweSession";

export async function GET() {
  const nonce = generateNonce();

  const cookieStore = await cookies();

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.nonce.create({
    data: {
      value: nonce,
      expiresAt,
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
