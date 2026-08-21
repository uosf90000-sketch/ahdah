"use client";

import { SAUDI_CITIES } from "@/lib/domain";

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
        {SAUDI_CITIES.map((place) => <option key={place} value={place} />)}
      </datalist>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-500">اختر من الاقتراحات أو اكتب أي مدينة أو محافظة سعودية بنفسك.</p>
    </div>
  );
}
