import sharp from "sharp";

const MAX_INPUT_PIXELS = 40_000_000;
const MAX_OUTPUT_DIMENSION = 2400;

// These formats are never accepted by the app. Blocking their libvips loaders
// adds defense-in-depth against malformed/polyglot files.
sharp.block({ operation: ["VipsForeignLoadNsgif", "VipsForeignLoadTiff", "VipsForeignLoadVips"] });

export async function sanitizeImageBuffer(type: string, bytes: Buffer) {
  const image = sharp(bytes, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
    sequentialRead: true,
  })
    // Apply EXIF orientation before re-encoding. Metadata is stripped because
    // withMetadata/keepMetadata is intentionally never called.
    .rotate()
    .resize({
      width: MAX_OUTPUT_DIMENSION,
      height: MAX_OUTPUT_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (type === "image/jpeg") return image.jpeg({ quality: 88, progressive: true }).toBuffer();
  if (type === "image/png") return image.png({ compressionLevel: 9 }).toBuffer();
  if (type === "image/webp") return image.webp({ quality: 88 }).toBuffer();
  throw new Error("Unsupported image type");
}

