export const CURRENT_POLICY_VERSION = "2026-08-22";
export const POLICY_CONSENT_COOKIE = "ahdah_policy_consent";
export const POLICY_CONSENT_MAX_AGE = 10 * 60;

export function policyConsentAccepted(formData: FormData) {
  return formData.get("acceptPolicies") === "on";
}
