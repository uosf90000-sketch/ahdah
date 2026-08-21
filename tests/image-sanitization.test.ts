import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { storageAdapter } from "../src/lib/adapters/storage.ts";

test("uploaded JPEGs are re-encoded without EXIF metadata", async () => {
  const source = await sharp({
    create: {
      width: 32,
      height: 24,
      channels: 3,
      background: { r: 30, g: 80, b: 120 },
    },
  })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();

  const file = new File([source], "camera.jpg", { type: "image/jpeg" });
  const [dataUrl] = await storageAdapter.saveImages([file], "security-test");
  const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const sanitized = Buffer.from(encoded, "base64");
  const metadata = await sharp(sanitized).metadata();

  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.orientation, undefined);
});
