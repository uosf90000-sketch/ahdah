import assert from "node:assert/strict";
import test from "node:test";
import { encodeItinerary, encodeRoadStops, MULTI_ROUTE_AIRLINE, ROAD_AIRLINE, tripMatchesShipment, tripRouteCities } from "../src/lib/trip-route.ts";

const now = new Date("2026-08-21T00:00:00Z");
const roadTrip = {
  fromCity: "أبها",
  toCity: "تبوك",
  departureAt: new Date("2026-08-25T09:00:00Z"),
  airline: ROAD_AIRLINE,
  flightNumber: encodeRoadStops(["جيزان", "القنفذة", "جدة", "رابغ", "ينبع", "أملج", "الوجه", "ضبا"]),
  availableWeightKg: 20,
  status: "OPEN",
};

test("يبني مسار الطريق بنفس ترتيب المحطات", () => {
  assert.deepEqual(tripRouteCities(roadTrip), ["أبها", "جيزان", "القنفذة", "جدة", "رابغ", "ينبع", "أملج", "الوجه", "ضبا", "تبوك"]);
});

test("يطابق طلبًا بين محطتين بالاتجاه الصحيح", () => {
  assert.equal(tripMatchesShipment(roadTrip, { fromCity: "جدة", toCity: "ينبع", weightKg: 10, status: "RECEIVING_OFFERS" }, now), true);
  assert.equal(tripMatchesShipment(roadTrip, { fromCity: "رابغ", toCity: "تبوك", weightKg: 20, status: "NEW" }, now), true);
});

test("يرفض الاتجاه العكسي أو الوزن الأعلى", () => {
  assert.equal(tripMatchesShipment(roadTrip, { fromCity: "تبوك", toCity: "جدة", weightKg: 5, status: "NEW" }, now), false);
  assert.equal(tripMatchesShipment(roadTrip, { fromCity: "جدة", toCity: "ينبع", weightKg: 21, status: "NEW" }, now), false);
});

test("الطيران القديم يبقى مطابقًا للبداية والنهاية فقط", () => {
  const airTrip = { ...roadTrip, fromCity: "جدة", toCity: "تبوك", airline: "الخطوط السعودية", flightNumber: "SV100", availableWeightKg: 10 };
  assert.equal(tripMatchesShipment(airTrip, { fromCity: "جدة", toCity: "تبوك", weightKg: 8, status: "NEW" }, now), true);
  assert.equal(tripMatchesShipment(airTrip, { fromCity: "رابغ", toCity: "تبوك", weightKg: 8, status: "NEW" }, now), false);
});

test("يطابق رحلة مختلطة من الرياض طيران إلى جدة ثم طريق إلى ينبع", () => {
  const mixedTrip = {
    fromCity: "الرياض",
    toCity: "ينبع",
    departureAt: new Date("2026-08-25T09:00:00Z"),
    airline: MULTI_ROUTE_AIRLINE,
    flightNumber: encodeItinerary([
      { mode: "AIR", from: "الرياض", to: "جدة", airline: "الخطوط السعودية", flightNumber: "SV101" },
      { mode: "ROAD", from: "جدة", to: "رابغ" },
      { mode: "ROAD", from: "رابغ", to: "ينبع" },
    ]),
    availableWeightKg: 15,
    status: "OPEN",
  };

  assert.deepEqual(tripRouteCities(mixedTrip), ["الرياض", "جدة", "رابغ", "ينبع"]);
  assert.equal(tripMatchesShipment(mixedTrip, { fromCity: "الرياض", toCity: "ينبع", weightKg: 10, status: "NEW" }, now), true);
  assert.equal(tripMatchesShipment(mixedTrip, { fromCity: "الرياض", toCity: "جدة", weightKg: 10, status: "NEW" }, now), true);
  assert.equal(tripMatchesShipment(mixedTrip, { fromCity: "جدة", toCity: "ينبع", weightKg: 10, status: "NEW" }, now), true);
  assert.equal(tripMatchesShipment(mixedTrip, { fromCity: "ينبع", toCity: "جدة", weightKg: 10, status: "NEW" }, now), false);
});
