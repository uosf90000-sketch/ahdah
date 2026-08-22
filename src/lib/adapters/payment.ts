import { randomUUID } from "node:crypto";

export interface PaymentAdapter {
  reserve(input: { shipmentRef: string; amountSar: number }): Promise<{ providerRef: string }>;
}

class MockPaymentAdapter implements PaymentAdapter {
  async reserve({ shipmentRef }: { shipmentRef: string; amountSar: number }) {
    return { providerRef: `mock_${shipmentRef}_${randomUUID()}` };
  }
}

export const paymentAdapter: PaymentAdapter = new MockPaymentAdapter();

