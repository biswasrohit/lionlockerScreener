"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/results/actions";

const INITIAL: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL);

  return (
    <form className="sheet" action={action} style={{ maxWidth: 420 }}>
      <div className="sheet-head">
        <span className="label">Team only</span>
        <h1>Results</h1>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="password">
          Team password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="text-input"
          autoComplete="current-password"
          required
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      {state.error ? (
        <p id="login-error" className="notice" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Checking..." : "View results"}
      </button>
    </form>
  );
}
