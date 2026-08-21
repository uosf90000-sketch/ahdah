import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function configuredAdminUserIds() {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export function isAdminIdentity(user: { id: string; email: string; emailVerifiedAt: Date | null }) {
  if (configuredAdminUserIds().has(user.id)) return true;
  if (!user.emailVerifiedAt) return false;
  return configuredAdminEmails().has(user.email.trim().toLowerCase());
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?error=" + encodeURIComponent("سجّل الدخول بحساب الإدارة"));
  if (!isAdminIdentity(user)) redirect("/dashboard");
  return user;
}
