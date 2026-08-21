import assert from "node:assert/strict";
import test from "node:test";
import {
  assertTransition,
  canTransition,
  DomainValidationError,
  isTripMatch,
  validateOfferInput,
  validateShipmentInput,
} from "../src/lib/domain.ts";

const now = new Date("2026-08-20T12:00:00.000Z");

test("يطابق رحلة حسب المسار والوزن دون تقييد بموعد المرسل", () => {
  const result = isTripMatch(
    { fromCity: "جدة", toCity: "الرياض", departureAt: new Date("2026-08-22T21:00:00Z"), availableWeightKg: 10, status: "OPEN" },
    { fromCity: "جدة", toCity: "الرياض", requestedDeliveryAt: new Date("2026-08-22T17:00:00Z"), weightKg: 10, status: "RECEIVING_OFFERS" },
    now,
  );
  assert.equal(result, true);
});

test("يرفض المطابقة عند عدم كفاية الوزن أو إذا كانت الرحلة في الماضي", () => {
  const shipment = { fromCity: "جدة", toCity: "الرياض", requestedDeliveryAt: new Date("2026-08-24T12:00:00Z"), weightKg: 10, status: "NEW" };
  assert.equal(isTripMatch({ fromCity: "جدة", toCity: "الرياض", departureAt: new Date("2026-08-22T12:00:00Z"), availableWeightKg: 8 }, shipment, now), false);
  assert.equal(isTripMatch({ fromCity: "جدة", toCity: "الرياض", departureAt: new Date("2026-08-19T12:00:00Z"), availableWeightKg: 10 }, shipment, now), false);
});

test("يسمح فقط بانتقالات الحالة المتسلسلة", () => {
  assert.equal(canTransition("INSPECTED", "WITH_TRAVELER"), true);
  assert.equal(canTransition("INSPECTED", "DELIVERED"), false);
  assert.throws(() => assertTransition("TRAVELER_ACCEPTED", "ARRIVED"), DomainValidationError);
});

test("يتحقق من السعر", () => {
  assert.deepEqual(validateOfferInput({ priceSar: "145", note: "استلام مساءً" }), { priceSar: 145, note: "استلام مساءً" });
  assert.throws(() => validateOfferInput({ priceSar: "2", note: "" }), DomainValidationError);
});

test("يتحقق من الوزن وموقعي الاستلام والتسليم", () => {
  const valid = validateShipmentInput({
    fromCity: "جدة",
    toCity: "الرياض",
    pickupLat: "21.543333",
    pickupLng: "39.172779",
    pickupNote: "البوابة الرئيسية",
    deliveryLat: "24.713552",
    deliveryLng: "46.675296",
    deliveryNote: "مدخل العمارة",
    weightKg: "10",
    category: "GIFTS",
    contents: "هدايا عائلية مغلفة بعناية كاملة",
    approximateValueSar: "800",
    requestedDeliveryAt: "2099-08-24T12:00:00Z",
    recipientName: "عبدالله",
    recipientPhone: "0500000000",
  });
  assert.equal(valid.weightKg, 10);
  assert.equal(valid.pickupLat, 21.543333);
  assert.equal(valid.deliveryLng, 46.675296);
  assert.throws(() => validateShipmentInput({ ...valid, deliveryLat: "", requestedDeliveryAt: "2099-08-24T12:00:00Z" }), DomainValidationError);
  assert.throws(() => validateShipmentInput({ ...valid, weightKg: "0.1", requestedDeliveryAt: "2099-08-24T12:00:00Z" }), DomainValidationError);
});
