"use client";

import { useActionState } from "react";
import {
  sendMagicLink,
  signInWithGoogle,
  type LoginActionState,
} from "@/app/auth/actions";

const initialState: LoginActionState = {
  status: "idle",
  message: "",
};

interface LoginFormProps {
  loginError?: string;
}

export function LoginForm({ loginError = "" }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  return (
    <div className="form-panel">
      <form action={signInWithGoogle}>
        <button className="google-button" type="submit">
          <span aria-hidden="true" className="google-mark">
            G
          </span>
          Continue with Google
        </button>
      </form>

      <div className="form-divider">
        <span>or use email</span>
      </div>

      <form action={formAction} className="stack-form-plain">
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            inputMode="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <button className="secondary-button full-width-button" disabled={pending} type="submit">
          {pending ? "Sending..." : "Send magic link"}
        </button>
      </form>

      {loginError ? <p className="form-message error">{loginError}</p> : null}
      {state.message ? (
        <p className={state.status === "error" ? "form-message error" : "form-message"}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
