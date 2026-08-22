import { getCSRFToken } from "@/lib/csrf";

export async function CSRFInput() {
  const token = await getCSRFToken();
  return <input type="hidden" name="_csrf_token" value={token} />;
}
