"use client";

import { SAUDI_CITIES } from "@/lib/domain";

const EXTRA_SAUDI_PLACES = [
  "الدرعية", "الخرج", "الدلم", "المزاحمية", "شقراء", "الدوادمي", "عفيف", "المجمعة", "الزلفي", "الغاط", "رماح", "حوطة بني تميم", "الأفلاج", "وادي الدواسر", "السليل",
  "رابغ", "القنفذة", "الليث", "خليص", "الجموم", "بحرة", "الكامل", "أضم", "تربة", "رنية", "الخرمة", "ميسان",
  "ينبع", "العلا", "بدر", "خيبر", "مهد الذهب", "الحناكية", "العيص",
  "بريدة", "عنيزة", "الرس", "البكيرية", "المذنب", "البدائع", "رياض الخبراء", "عيون الجواء", "الأسياح",
  "الظهران", "الأحساء", "الهفوف", "المبرز", "القطيف", "الجبيل", "رأس تنورة", "بقيق", "الخفجي", "حفر الباطن", "النعيرية", "قرية العليا",
  "خميس مشيط", "محايل عسير", "بيشة", "النماص", "تنومة", "سراة عبيدة", "ظهران الجنوب", "أحد رفيدة", "رجال ألمع", "المجاردة", "بارق",
  "صبيا", "أبو عريش", "صامطة", "بيش", "الدرب", "العارضة", "ضمد", "فرسان", "أحد المسارحة",
  "نجران", "شرورة", "حبونا", "بدر الجنوب", "يدمة",
  "ضباء", "الوجه", "أملج", "تيماء", "حقل", "البدع",
  "بقعاء", "الشنان", "الغزالة",
  "سكاكا", "دومة الجندل", "القريات", "طبرجل",
  "الباحة", "بلجرشي", "المندق", "المخواة", "قلوة",
  "عرعر", "رفحاء", "طريف", "العويقيلة",
] as const;

const SAUDI_PLACE_SUGGESTIONS = Array.from(new Set<string>([...SAUDI_CITIES, ...EXTRA_SAUDI_PLACES]));

type SaudiPlaceInputProps = {
  id: string;
  name: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
};

export function SaudiPlaceInput({
  id,
  name,
  label,
  value,
  onChange,
  required = true,
  className = "",
  placeholder = "اكتب المدينة أو المحافظة",
}: SaudiPlaceInputProps) {
  const listId = `${id}-saudi-places`;

  return (
    <div className={className}>
      <label className="label" htmlFor={id}>{label}</label>
      <input
        className="input"
        id={id}
        name={name}
        type="text"
        list={listId}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        maxLength={80}
        autoComplete="off"
        required={required}
      />
      <datalist id={listId}>
        {SAUDI_PLACE_SUGGESTIONS.map((place) => <option key={place} value={place} />)}
      </datalist>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-500">اختر من الاقتراحات أو اكتب أي مدينة أو محافظة سعودية بنفسك.</p>
    </div>
  );
}
