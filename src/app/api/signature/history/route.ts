import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { parseSessionToken, siweCookies } from "@/lib/siweSession";

export async function GET() {
  const cookieStore = await cookies();
  const session = parseSessionToken(cookieStore.get(siweCookies.session)?.value);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signatures = await prisma.signature.findMany({
    where: { wallet: { address: session.address.toLowerCase() } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      signature: true,
      createdAt: true,
      nonceId: true,
    },
  });

  return Response.json({ signatures });
}
