import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { sanitizeImageBuffer } from "../src/lib/image-sanitizer.ts";

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

  const sanitized = await sanitizeImageBuffer("image/jpeg", source);
  const metadata = await sharp(sanitized).metadata();

  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.orientation, undefined);
});
