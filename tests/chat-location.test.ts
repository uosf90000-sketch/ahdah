import { describe, expect, it } from "vitest";
import { validateShipmentInput } from "@/lib/domain";

const base = {
  fromCity: "جدة",
  toCity: "ينبع",
  transportPreference: "ANY",
  weightKg: "10",
  category: "DOCUMENTS",
  contents: "مستندات رسمية داخل ظرف مغلق",
  approximateValueSar: "100",
  requestedDeliveryAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  recipientName: "محمد",
  recipientPhone: "0500000000",
};

describe("shipment locations", () => {
  it("allows creating a shipment without exact locations", () => {
    const data = validateShipmentInput(base);
    expect(data.pickupLat).toBeNull();
    expect(data.pickupLng).toBeNull();
    expect(data.deliveryLat).toBeNull();
    expect(data.deliveryLng).toBeNull();
  });

  it("keeps valid coordinates when supplied", () => {
    const data = validateShipmentInput({
      ...base,
      pickupLat: "21.543333",
      pickupLng: "39.172779",
      deliveryLat: "24.08954",
      deliveryLng: "38.061798",
    });
    expect(data.pickupLat).toBe(21.543333);
    expect(data.deliveryLng).toBe(38.061798);
  });
});
