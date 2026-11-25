"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null as { error?: string } | null);
  return (
    <form action={action} className="login__form">
      <label className="adm-label" htmlFor="password">
        Password
      </label>
      <input id="password" name="password" type="password" className="adm-input" autoComplete="current-password" autoFocus required />
      {state?.error && <p className="mf__error">{state.error}</p>}
      <button type="submit" className="adm-btn adm-btn--block" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
