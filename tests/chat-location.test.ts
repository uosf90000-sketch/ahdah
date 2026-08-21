import assert from "node:assert/strict";
import test from "node:test";
import { validateShipmentInput } from "../src/lib/domain.ts";

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

test("يسمح بإنشاء العُهدة بدون المواقع الدقيقة", () => {
  const data = validateShipmentInput(base);
  assert.equal(data.pickupLat, null);
  assert.equal(data.pickupLng, null);
  assert.equal(data.deliveryLat, null);
  assert.equal(data.deliveryLng, null);
});

test("يحفظ الإحداثيات الصحيحة عند إرسالها", () => {
  const data = validateShipmentInput({
    ...base,
    pickupLat: "21.543333",
    pickupLng: "39.172779",
    deliveryLat: "24.08954",
    deliveryLng: "38.061798",
  });
  assert.equal(data.pickupLat, 21.543333);
  assert.equal(data.deliveryLng, 38.061798);
});
