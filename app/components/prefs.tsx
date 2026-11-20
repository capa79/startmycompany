"use client";

import { useEffect, useState, useTransition } from "react";

type Opt = { value: string; label: string };

// Språk og valuta velges hver for seg. Valget lagres med en gang det endres.
// Serverhandlingen kalles direkte (ikke via <form action>), fordi React tilbakestiller skjemaer
// etter innsending, og da ville menyen vist det gamle valget.
export function PrefSelect({ action, name, label, value, options }: { action: (f: FormData) => Promise<void>; name: string; label: string; value: string; options: Opt[] }) {
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  useEffect(() => setV(value), [value]);
  function change(next: string) {
    setV(next);
    const fd = new FormData();
    fd.set(name, next);
    start(() => action(fd));
  }
  return (
    <label className="pref">
      <span className="sr-only">{label}</span>
      <select name={name} value={v} aria-label={label} aria-busy={pending} onChange={(e) => change(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
