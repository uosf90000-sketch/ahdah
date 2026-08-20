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

test("يطابق رحلة حسب المسار والوقت والوزن", () => {
  const result = isTripMatch(
    { fromCity: "جدة", toCity: "الرياض", departureAt: new Date("2026-08-22T12:00:00Z"), availableWeightKg: 8, status: "OPEN" },
    { fromCity: "جدة", toCity: "الرياض", requestedDeliveryAt: new Date("2026-08-24T12:00:00Z"), weightKg: 4.5, status: "RECEIVING_OFFERS" },
    now,
  );
  assert.equal(result, true);
});

test("يرفض المطابقة عند عدم كفاية الوزن أو تأخر الرحلة", () => {
  const shipment = { fromCity: "جدة", toCity: "الرياض", requestedDeliveryAt: new Date("2026-08-24T12:00:00Z"), weightKg: 9, status: "NEW" };
  assert.equal(isTripMatch({ fromCity: "جدة", toCity: "الرياض", departureAt: new Date("2026-08-22T12:00:00Z"), availableWeightKg: 8 }, shipment, now), false);
  assert.equal(isTripMatch({ fromCity: "جدة", toCity: "الرياض", departureAt: new Date("2026-08-25T12:00:00Z"), availableWeightKg: 10 }, shipment, now), false);
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

test("يتحقق من حقول الشحنة الأساسية", () => {
  const valid = validateShipmentInput({
    fromCity: "جدة",
    toCity: "الرياض",
    weightKg: "4.5",
    lengthCm: "30",
    widthCm: "20",
    heightCm: "10",
    category: "GIFTS",
    contents: "هدايا عائلية مغلفة بعناية كاملة",
    approximateValueSar: "800",
    requestedDeliveryAt: "2099-08-24T12:00:00Z",
    recipientName: "عبدالله",
    recipientPhone: "0500000000",
  });
  assert.equal(valid.weightKg, 4.5);
  assert.equal(valid.fromCity, "جدة");
  assert.throws(() => validateShipmentInput({ ...valid, fromCity: "الرياض", requestedDeliveryAt: "2099-08-24T12:00:00Z" }), DomainValidationError);
});
