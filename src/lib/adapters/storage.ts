import sharp from "sharp";
import { DomainValidationError } from "@/lib/domain";

export interface StorageAdapter {
  saveImages(files: File[], prefix: string): Promise<string[]>;
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_OUTPUT_DIMENSION = 2400;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

// We never accept these formats. Blocking their loaders adds defense-in-depth if a
// polyglot or malformed file gets past the lightweight signature check below.
sharp.block({ operation: ["VipsForeignLoadNsgif", "VipsForeignLoadTiff", "VipsForeignLoadVips"] });

function hasValidSignature(type: string, bytes: Buffer) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

async function sanitizeImage(type: string, bytes: Buffer) {
  try {
    const image = sharp(bytes, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
    })
      // Applies EXIF orientation before re-encoding. Metadata is stripped because
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
  } catch {
    throw new DomainValidationError(["تعذر معالجة إحدى الصور. استخدم صورة JPEG أو PNG أو WebP سليمة"]);
  }
}

class MockDatabaseStorageAdapter implements StorageAdapter {
  async saveImages(files: File[], prefix: string) {
    if (!files.length) throw new DomainValidationError(["أضف صورة واضحة واحدة على الأقل للمحتويات"]);
    if (files.length > 6) throw new DomainValidationError(["الحد الأعلى 6 صور"]);
    if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
      throw new DomainValidationError(["إجمالي حجم الصور يجب ألا يتجاوز 10 ميجابايت"]);
    }

    return Promise.all(
      files.map(async (file, index) => {
        if (!allowedTypes.has(file.type)) throw new DomainValidationError([`نوع الصورة ${file.name} غير مدعوم`]);
        if (file.size > MAX_IMAGE_BYTES) throw new DomainValidationError([`الصورة ${file.name} أكبر من 3 ميجابايت`]);
        const bytes = Buffer.from(await file.arrayBuffer());
        if (!hasValidSignature(file.type, bytes)) throw new DomainValidationError([`محتوى الصورة ${file.name} غير صالح`]);

        const sanitized = await sanitizeImage(file.type, bytes);
        return `data:${file.type};name=${encodeURIComponent(`${prefix}-${index + 1}`)};base64,${sanitized.toString("base64")}`;
      }),
    );
  }
}

export const storageAdapter: StorageAdapter = new MockDatabaseStorageAdapter();
