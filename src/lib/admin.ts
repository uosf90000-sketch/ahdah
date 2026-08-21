import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const TEMP_ADMIN_EMAIL = "admin@eahdatuk.com";

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminIdentity(user: { email: string; emailVerifiedAt: Date | null }) {
  const email = user.email.trim().toLowerCase();

  // Temporary bootstrap admin while eahdatuk.com does not have hosted email yet.
  // This exact address may sign in with the normal password flow without email verification.
  if (email === TEMP_ADMIN_EMAIL) return true;

  // Any additional production admins must be explicitly configured and verified.
  if (!user.emailVerifiedAt) return false;
  return configuredAdminEmails().has(email);
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?error=" + encodeURIComponent("سجّل الدخول بحساب الإدارة"));
  if (!isAdminIdentity(user)) redirect("/dashboard");
  return user;
}
