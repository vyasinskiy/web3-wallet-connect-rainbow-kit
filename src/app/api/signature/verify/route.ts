import { isAddress, recoverMessageAddress } from "viem";
import { cookies } from "next/headers";
import { parseSessionToken, siweCookies } from "@/lib/siweSession";

type VerifyRequest = {
  address?: string;
  message?: string;
  signature?: string;
};

export async function POST(req: Request) {
  const body: VerifyRequest = await req.json();
  const { address, message, signature } = body;

  const cookieStore = await cookies();
  const session = parseSessionToken(cookieStore.get(siweCookies.session)?.value);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!address || !message || !signature) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  const normalizedAddress = address.toLowerCase();
  const normalizedSignature = signature.startsWith("0x")
    ? signature
    : `0x${signature}`;

  if (!isAddress(normalizedAddress)) {
    return Response.json({ error: "Invalid address format." }, { status: 400 });
  }

  if (session.address.toLowerCase() !== normalizedAddress) {
    return Response.json({ error: "Address does not match session." }, { status: 403 });
  }

  let recovered: string;

  try {
    recovered = await recoverMessageAddress({
      message,
      signature: normalizedSignature,
    });
  } catch (err) {
    return Response.json(
      { error: "Failed to recover address from signature." },
      { status: 422 }
    );
  }

  const valid = recovered.toLowerCase() === normalizedAddress;

  return Response.json({
    valid,
    expected: normalizedAddress,
    recovered: recovered.toLowerCase(),
  });
}
