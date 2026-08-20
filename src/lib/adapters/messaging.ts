export interface MessagingAdapter {
  managesOtpVerification: boolean;
  sendOtp(input: { phone: string; otp?: string; shipmentRef: string }): Promise<void>;
  verifyOtp?(input: { phone: string; otp: string; shipmentRef: string }): Promise<boolean>;
}

function normalizeSaudiPhone(phone: string) {
  const compact = phone.replace(/[\s()-]/g, "");
  if (/^\+9665\d{8}$/.test(compact)) return compact;
  if (/^9665\d{8}$/.test(compact)) return `+${compact}`;
  if (/^05\d{8}$/.test(compact)) return `+966${compact.slice(1)}`;
  throw new Error("Recipient phone must be a valid Saudi mobile number");
}

class ConsoleMessagingAdapter implements MessagingAdapter {
  managesOtpVerification = false;

  async sendOtp({ phone, otp, shipmentRef }: { phone: string; otp?: string; shipmentRef: string }) {
    if (!otp) throw new Error("Console OTP adapter requires an OTP value");
    console.info(`[mock-message] OTP ${otp} for ${shipmentRef} -> ${phone}`);
  }
}

class AuthenticaMessagingAdapter implements MessagingAdapter {
  managesOtpVerification = true;
  private readonly baseUrl = process.env.AUTHENTICA_BASE_URL?.trim() || "https://api.authentica.sa";

  private apiKey() {
    const key = process.env.AUTHENTICA_API_KEY?.trim();
    if (!key) throw new Error("AUTHENTICA_API_KEY is required when MESSAGING_DRIVER=authentica");
    return key;
  }

  private async request(path: string, body: Record<string, string>) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Authorization": this.apiKey(),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Keep the provider response private; callers only need a safe error.
    }

    if (!response.ok) {
      console.error("Authentica request failed", { path, status: response.status });
      if (response.status === 429) throw new Error("Authentica rate limit exceeded");
      if (response.status === 401) throw new Error("Authentica API key is invalid");
      throw new Error("Authentica OTP request failed");
    }
    return payload;
  }

  async sendOtp({ phone }: { phone: string; otp?: string; shipmentRef: string }) {
    await this.request("/api/v2/send-otp", { method: "sms", phone: normalizeSaudiPhone(phone) });
  }

  async verifyOtp({ phone, otp }: { phone: string; otp: string; shipmentRef: string }) {
    const payload = await this.request("/api/v2/verify-otp", {
      phone: normalizeSaudiPhone(phone),
      otp: otp.trim(),
    }) as { verified?: boolean; data?: { verified?: boolean } } | null;
    return payload?.verified === true || payload?.data?.verified === true;
  }
}

function createMessagingAdapter(): MessagingAdapter {
  const driver = process.env.MESSAGING_DRIVER?.trim().toLowerCase() || "console";
  if (driver === "authentica") return new AuthenticaMessagingAdapter();
  if (driver !== "console") throw new Error(`Unsupported MESSAGING_DRIVER: ${driver}`);
  return new ConsoleMessagingAdapter();
}

export const messagingAdapter: MessagingAdapter = createMessagingAdapter();
