import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseSessionToken, siweCookies } from "@/lib/siweSession";
import ProtectedClient from "./protected-client";
import styles from "./page.module.css";

export default async function ProtectedPage() {
  const cookieStore = await cookies();
  const session = parseSessionToken(cookieStore.get(siweCookies.session)?.value);

  if (!session) {
    redirect("/");
  }

  return (
    <div className={styles.page}>
      <ProtectedClient sessionAddress={session.address} />
    </div>
  );
}
