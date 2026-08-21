import { db } from "@/lib/db";

let runtimeSchemaPromise: Promise<void> | null = null;

async function applyRuntimeSchema() {
  await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleSubject" TEXT');
  await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3)');
  await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "User_googleSubject_key" ON "User"("googleSubject")');

  await db.$executeRawUnsafe('ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupLat" DOUBLE PRECISION');
  await db.$executeRawUnsafe('ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupLng" DOUBLE PRECISION');
  await db.$executeRawUnsafe('ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupNote" VARCHAR(300)');
  await db.$executeRawUnsafe('ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "deliveryLat" DOUBLE PRECISION');
  await db.$executeRawUnsafe('ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "deliveryLng" DOUBLE PRECISION');
  await db.$executeRawUnsafe('ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "deliveryNote" VARCHAR(300)');
  await db.$executeRawUnsafe('ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "transportPreference" TEXT NOT NULL DEFAULT \'ANY\'');
  await db.$executeRawUnsafe('ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "deliveryOtpAttempts" INTEGER NOT NULL DEFAULT 0');
  await db.$executeRawUnsafe('ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "deliveryOtpLastSentAt" TIMESTAMP(3)');

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ChatMessage" (
      "id" TEXT NOT NULL,
      "shipmentId" TEXT NOT NULL,
      "senderId" TEXT NOT NULL,
      "body" VARCHAR(1000) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ChatMessage_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ChatMessage_shipmentId_createdAt_idx" ON "ChatMessage"("shipmentId", "createdAt")');
  await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_createdAt_idx" ON "ChatMessage"("senderId", "createdAt")');

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PushDevice" (
      "id" TEXT NOT NULL,
      "token" VARCHAR(4096) NOT NULL,
      "platform" VARCHAR(20) NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "PushDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "PushDevice_token_key" ON "PushDevice"("token")');
  await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "PushDevice_userId_idx" ON "PushDevice"("userId")');
}

export async function ensureRuntimeSchema() {
  if (!runtimeSchemaPromise) {
    runtimeSchemaPromise = applyRuntimeSchema().catch((error) => {
      runtimeSchemaPromise = null;
      throw error;
    });
  }
  await runtimeSchemaPromise;
}
