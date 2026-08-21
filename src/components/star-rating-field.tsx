"use client";

import { useState } from "react";

export function StarRatingField({ name = "score", defaultValue = 5 }: { name?: string; defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-row-reverse justify-end gap-1" role="radiogroup" aria-label="التقييم من خمس نجوم">
        {[5, 4, 3, 2, 1].map((score) => {
          const active = score <= value;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={value === score}
              aria-label={`${score} من 5`}
              onClick={() => setValue(score)}
              className={`min-h-12 min-w-12 rounded-xl text-3xl transition ${active ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}
            >
              ★
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">{value} من 5</p>
    </div>
  );
}
