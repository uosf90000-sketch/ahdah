CREATE TYPE "AccountRole" AS ENUM ('SENDER', 'TRAVELER', 'BOTH');
CREATE TYPE "ShipmentStatus" AS ENUM ('NEW', 'RECEIVING_OFFERS', 'TRAVELER_ACCEPTED', 'INSPECTED', 'WITH_TRAVELER', 'ARRIVED', 'DELIVERED', 'CANCELLED');
CREATE TYPE "ShipmentCategory" AS ENUM ('DOCUMENTS', 'CLOTHING', 'ELECTRONICS', 'GIFTS', 'PERSONAL_ITEMS', 'OTHER');
CREATE TYPE "PhotoKind" AS ENUM ('ORIGINAL', 'INSPECTION', 'DELIVERY');
CREATE TYPE "TripStatus" AS ENUM ('OPEN', 'FULL', 'DEPARTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "PaymentStatus" AS ENUM ('RESERVED', 'CAPTURED', 'RELEASED', 'CANCELLED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "role" "AccountRole" NOT NULL DEFAULT 'BOTH',
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL,
  "refCode" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "fromCity" TEXT NOT NULL,
  "toCity" TEXT NOT NULL,
  "weightKg" DECIMAL(8,2) NOT NULL,
  "lengthCm" DECIMAL(8,2) NOT NULL,
  "widthCm" DECIMAL(8,2) NOT NULL,
  "heightCm" DECIMAL(8,2) NOT NULL,
  "category" "ShipmentCategory" NOT NULL,
  "contents" TEXT NOT NULL,
  "approximateValueSar" DECIMAL(12,2) NOT NULL,
  "requestedDeliveryAt" TIMESTAMP(3) NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientPhone" TEXT NOT NULL,
  "status" "ShipmentStatus" NOT NULL DEFAULT 'NEW',
  "qrToken" TEXT NOT NULL,
  "deliveryOtpHash" TEXT,
  "deliveryOtpExpiresAt" TIMESTAMP(3),
  "acceptedOfferId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShipmentPhoto" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "kind" "PhotoKind" NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShipmentPhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Trip" (
  "id" TEXT NOT NULL,
  "travelerId" TEXT NOT NULL,
  "fromCity" TEXT NOT NULL,
  "toCity" TEXT NOT NULL,
  "departureAt" TIMESTAMP(3) NOT NULL,
  "airline" TEXT NOT NULL,
  "flightNumber" TEXT,
  "availableWeightKg" DECIMAL(8,2) NOT NULL,
  "status" "TripStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Offer" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "travelerId" TEXT NOT NULL,
  "priceSar" DECIMAL(10,2) NOT NULL,
  "note" TEXT,
  "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inspection" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "travelerId" TEXT NOT NULL,
  "matchedDescription" BOOLEAN NOT NULL,
  "matchedPhotos" BOOLEAN NOT NULL,
  "noProhibitedItems" BOOLEAN NOT NULL,
  "packageSealed" BOOLEAN NOT NULL,
  "notes" TEXT,
  "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StatusEvent" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "actorId" TEXT,
  "status" "ShipmentStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "amountSar" DECIMAL(10,2) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'RESERVED',
  "provider" TEXT NOT NULL DEFAULT 'mock',
  "providerRef" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rating" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "Shipment_refCode_key" ON "Shipment"("refCode");
CREATE UNIQUE INDEX "Shipment_qrToken_key" ON "Shipment"("qrToken");
CREATE UNIQUE INDEX "Shipment_acceptedOfferId_key" ON "Shipment"("acceptedOfferId");
CREATE INDEX "Shipment_senderId_status_idx" ON "Shipment"("senderId", "status");
CREATE INDEX "Shipment_fromCity_toCity_requestedDeliveryAt_idx" ON "Shipment"("fromCity", "toCity", "requestedDeliveryAt");
CREATE INDEX "ShipmentPhoto_shipmentId_kind_idx" ON "ShipmentPhoto"("shipmentId", "kind");
CREATE INDEX "Trip_travelerId_status_idx" ON "Trip"("travelerId", "status");
CREATE INDEX "Trip_fromCity_toCity_departureAt_status_idx" ON "Trip"("fromCity", "toCity", "departureAt", "status");
CREATE UNIQUE INDEX "Offer_shipmentId_tripId_key" ON "Offer"("shipmentId", "tripId");
CREATE INDEX "Offer_travelerId_status_idx" ON "Offer"("travelerId", "status");
CREATE UNIQUE INDEX "Inspection_shipmentId_key" ON "Inspection"("shipmentId");
CREATE INDEX "StatusEvent_shipmentId_createdAt_idx" ON "StatusEvent"("shipmentId", "createdAt");
CREATE UNIQUE INDEX "Payment_shipmentId_key" ON "Payment"("shipmentId");
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");
CREATE UNIQUE INDEX "Rating_shipmentId_authorId_targetId_key" ON "Rating"("shipmentId", "authorId", "targetId");
CREATE INDEX "Rating_targetId_idx" ON "Rating"("targetId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShipmentPhoto" ADD CONSTRAINT "ShipmentPhoto_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShipmentPhoto" ADD CONSTRAINT "ShipmentPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_acceptedOfferId_fkey" FOREIGN KEY ("acceptedOfferId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
