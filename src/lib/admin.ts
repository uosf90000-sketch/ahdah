import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const DEFAULT_ADMIN_DOMAIN = "eahdatuk.com";

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminIdentity(user: { email: string; emailVerifiedAt: Date | null }) {
  if (!user.emailVerifiedAt) return false;
  const email = user.email.trim().toLowerCase();
  const explicit = configuredAdminEmails();
  if (explicit.has(email)) return true;
  const domain = (process.env.ADMIN_EMAIL_DOMAIN ?? DEFAULT_ADMIN_DOMAIN).trim().toLowerCase();
  return Boolean(domain && email.endsWith(`@${domain}`));
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?error=" + encodeURIComponent("سجّل الدخول بحساب الإدارة"));
  if (!isAdminIdentity(user)) redirect("/dashboard");
  return user;
}
