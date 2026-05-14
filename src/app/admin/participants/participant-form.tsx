"use client";

import { useActionState } from "react";
import { addParticipant, type ParticipantActionState } from "./actions";

const initialState: ParticipantActionState = {
  status: "idle",
  message: "",
};

export function ParticipantForm() {
  const [state, formAction, pending] = useActionState(addParticipant, initialState);

  return (
    <form action={formAction} className="inline-form">
      <label className="field">
        <span>Display name</span>
        <input name="displayName" placeholder="Amit Cohen" required />
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" placeholder="amit@example.com" required type="email" />
      </label>
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Adding..." : "Add participant"}
      </button>
      {state.message ? (
        <p className={state.status === "error" ? "form-message error" : "form-message"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

