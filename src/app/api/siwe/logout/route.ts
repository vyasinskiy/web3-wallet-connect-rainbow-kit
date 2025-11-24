import { cookies } from "next/headers";
import { clearCookieOptions, siweCookies } from "@/lib/siweSession";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(siweCookies.session, "", clearCookieOptions());
  cookieStore.set(siweCookies.nonce, "", clearCookieOptions());
  return Response.json({ ok: true });
}
