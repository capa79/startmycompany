"use client";

import { useActionState } from "react";
import type { FormState } from "../auth-actions";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

// Skjema som viser feil- og okmelding fra en serverhandling
export function ActionForm({ action, children, submit, className }: { action: Action; children: React.ReactNode; submit: string; className?: string }) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className={className ?? "stack"}>
      {children}
      {state?.error && (
        <p className="alert error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="alert ok" role="status">
          {state.ok}
        </p>
      )}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "…" : submit}
      </button>
    </form>
  );
}
