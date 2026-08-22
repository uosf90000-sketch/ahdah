import { getCurrentUser } from "@/lib/auth";
import { MobileNavClient } from "@/components/mobile-nav-client";

export async function MobileNav() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <MobileNavClient />;
}

