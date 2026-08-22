import { DomainValidationError } from "@/lib/domain";
import { sanitizeImageBuffer } from "@/lib/image-sanitizer";

export interface StorageAdapter {
  saveImages(files: File[], prefix: string): Promise<string[]>;
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasValidSignature(type: string, bytes: Buffer) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

class MockDatabaseStorageAdapter implements StorageAdapter {
  async saveImages(files: File[], prefix: string) {
    if (!files.length) throw new DomainValidationError(["أضف صورة واضحة واحدة على الأقل للمحتويات"]);
    if (files.length > 6) throw new DomainValidationError(["الحد الأعلى 6 صور"]);
    if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
      throw new DomainValidationError(["إجمالي حجم الصور يجب ألا يتجاوز 10 ميجابايت"]);
    }

    const urls: string[] = [];
    for (const [index, file] of files.entries()) {
      if (!allowedTypes.has(file.type)) throw new DomainValidationError([`نوع الصورة ${file.name} غير مدعوم`]);
      if (file.size > MAX_IMAGE_BYTES) throw new DomainValidationError([`الصورة ${file.name} أكبر من 3 ميجابايت`]);
      const bytes = Buffer.from(await file.arrayBuffer());
      if (!hasValidSignature(file.type, bytes)) throw new DomainValidationError([`محتوى الصورة ${file.name} غير صالح`]);

      let sanitized: Buffer;
      try {
        // Deliberately process sequentially to avoid multiplying libvips memory use
        // when a request contains the maximum number of large images.
        sanitized = await sanitizeImageBuffer(file.type, bytes);
      } catch {
        throw new DomainValidationError(["تعذر معالجة إحدى الصور. استخدم صورة JPEG أو PNG أو WebP سليمة"]);
      }
      if (sanitized.length > MAX_IMAGE_BYTES) {
        throw new DomainValidationError([`الصورة ${file.name} كبيرة جدًا بعد المعالجة`]);
      }

      urls.push(`data:${file.type};name=${encodeURIComponent(`${prefix}-${index + 1}`)};base64,${sanitized.toString("base64")}`);
    }

    return urls;
  }
}

export const storageAdapter: StorageAdapter = new MockDatabaseStorageAdapter();

