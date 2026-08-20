export interface MessagingAdapter {
  sendOtp(input: { phone: string; otp: string; shipmentRef: string }): Promise<void>;
}

class ConsoleMessagingAdapter implements MessagingAdapter {
  async sendOtp({ phone, otp, shipmentRef }: { phone: string; otp: string; shipmentRef: string }) {
    console.info(`[mock-message] OTP ${otp} for ${shipmentRef} -> ${phone}`);
  }
}

export const messagingAdapter: MessagingAdapter = new ConsoleMessagingAdapter();
