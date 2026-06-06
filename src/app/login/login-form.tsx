import { signInWithGoogle } from "@/app/auth/actions";

interface LoginFormProps {
  loginError?: string;
}

export function LoginForm({ loginError = "" }: LoginFormProps) {
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

      {loginError ? <p className="form-message error">{loginError}</p> : null}
    </div>
  );
}
