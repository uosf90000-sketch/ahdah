import assert from "node:assert/strict";
import test from "node:test";
import { validateShipmentInput } from "../src/lib/domain.ts";

const base = {
  fromCity: "الرياض",
  toCity: "جدة",
  transportPreference: "ANY",
  weightKg: "10",
  category: "DOCUMENTS",
  contents: "جواز سفر",
  approximateValueSar: "100",
  requestedDeliveryAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  recipientName: "محمد",
  recipientPhone: "0500000000",
};

test("يقبل وزن 10 كجم ووصفًا قصيرًا غير فارغ", () => {
  const data = validateShipmentInput(base);
  assert.equal(data.weightKg, 10);
  assert.equal(data.contents, "جواز سفر");
});
