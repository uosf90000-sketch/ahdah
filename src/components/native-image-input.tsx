"use client";

import { Camera as CameraIcon, Images, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

export function NativeImageInput({
  id,
  name,
  required = false,
  multiple = false,
  maxFiles = 6,
  className = "input bg-white",
}: {
  id: string;
  name: string;
  required?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [native] = useState(() => Capacitor.isNativePlatform());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(0);

  function syncCount() {
    setCount(inputRef.current?.files?.length ?? 0);
    setMessage("");
  }

  async function capturePhoto() {
    if (!native || busy) return;
    const currentFiles = Array.from(inputRef.current?.files ?? []);
    if (currentFiles.length >= maxFiles) {
      setMessage(`الحد الأقصى ${maxFiles} صور.`);
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        quality: 78,
        width: 1600,
        height: 1600,
        correctOrientation: true,
        saveToGallery: false,
      });
      if (!photo.webPath) throw new Error("missing camera path");
      const response = await fetch(photo.webPath);
      if (!response.ok) throw new Error("camera file unavailable");
      const blob = await response.blob();
      if (blob.size > 3 * 1024 * 1024) {
        setMessage("الصورة أكبر من 3MB. حاول التصوير بجودة أقل أو اختر صورة أخرى.");
        return;
      }

      const extension = photo.format === "png" ? "png" : "jpg";
      const mime = blob.type || (extension === "png" ? "image/png" : "image/jpeg");
      const file = new File([blob], `ahdatuk-${Date.now()}.${extension}`, { type: mime });
      const transfer = new DataTransfer();
      if (multiple) currentFiles.forEach((item) => transfer.items.add(item));
      transfer.items.add(file);

      if (!inputRef.current) return;
      inputRef.current.files = transfer.files;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      setCount(transfer.files.length);
      setMessage("تمت إضافة الصورة من الكاميرا.");
    } catch (error) {
      const text = error instanceof Error ? error.message.toLowerCase() : "";
      if (!text.includes("cancel") && !text.includes("user cancelled")) {
        setMessage("تعذر فتح الكاميرا. تحقق من صلاحية الكاميرا أو اختر صورة من الجهاز.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        className={className}
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        required={required}
        onChange={syncCount}
      />

      {native && (
        <button type="button" onClick={capturePhoto} disabled={busy || count >= maxFiles} className="btn-secondary w-full">
          {busy ? <LoaderCircle className="animate-spin" size={17} /> : <CameraIcon size={17} />}
          {busy ? "جاري فتح الكاميرا..." : "التقاط صورة بالكاميرا"}
        </button>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Images size={15} /> {count ? `${count} صورة مختارة` : "لم يتم اختيار صور بعد"}</span>
        {multiple && <span>الحد الأقصى {maxFiles}</span>}
      </div>
      {message && <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600">{message}</p>}
    </div>
  );
}

