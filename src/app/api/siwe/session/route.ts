import { cookies } from "next/headers";
import { parseSessionToken, siweCookies } from "@/lib/siweSession";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(siweCookies.session)?.value;
  const session = parseSessionToken(token);

  if (!session) {
    return Response.json({ address: null });
  }

  return Response.json({ address: session.address });
}
