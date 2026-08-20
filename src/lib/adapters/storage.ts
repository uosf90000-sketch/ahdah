import { DomainValidationError } from "@/lib/domain";

export interface StorageAdapter {
  saveImages(files: File[], prefix: string): Promise<string[]>;
}

class MockDatabaseStorageAdapter implements StorageAdapter {
  async saveImages(files: File[], prefix: string) {
    if (!files.length) throw new DomainValidationError(["أضف صورة واضحة واحدة على الأقل للمحتويات"]);
    if (files.length > 6) throw new DomainValidationError(["الحد الأعلى 6 صور"]);

    return Promise.all(
      files.map(async (file, index) => {
        if (!file.type.startsWith("image/")) throw new DomainValidationError([`الملف ${file.name} ليس صورة`]);
        if (file.size > 3 * 1024 * 1024) throw new DomainValidationError([`الصورة ${file.name} أكبر من 3 ميجابايت`]);
        const bytes = Buffer.from(await file.arrayBuffer());
        return `data:${file.type};name=${encodeURIComponent(`${prefix}-${index + 1}`)};base64,${bytes.toString("base64")}`;
      }),
    );
  }
}

export const storageAdapter: StorageAdapter = new MockDatabaseStorageAdapter();
