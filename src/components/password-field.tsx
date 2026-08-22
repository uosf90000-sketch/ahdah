"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordField({ id, name, label, autoComplete, minLength, help }: { id: string; name: string; label: string; autoComplete: string; minLength?: number; help?: string }) {
  const [visible, setVisible] = useState(false);
  const helpId = help ? `${id}-help` : undefined;
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input className="input pl-14" id={id} type={visible ? "text" : "password"} name={name} autoComplete={autoComplete} minLength={minLength} required aria-describedby={helpId} />
        <button type="button" onClick={() => setVisible((value) => !value)} className="absolute left-1.5 top-1.5 grid h-11 w-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-palm-100" aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={visible}>
          {visible ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
        </button>
      </div>
      {help && <p id={helpId} className="mt-2 text-xs text-slate-500">{help}</p>}
    </div>
  );
}

