import LayoutClient from "./LayoutClient";

import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { getUserProfile } from "@/services/userService";

async function getUser() {
  try {
    const session = await getSession();
    if (!session) return null;
    return await getUserProfile(session.id);
  } catch (error) {
    console.error("Failed to fetch user for layout:", error);
    return null;
  }
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <LayoutClient initialUser={user}>
      {children}
    </LayoutClient>
  );
}
