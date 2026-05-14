import Link from "next/link";
import { signOut } from "@/app/auth/actions";

export default function NotInvitedPage() {
  return (
    <main className="shell auth-shell">
      <section className="notice-panel">
        <h1>You are not invited yet</h1>
        <p>
          This app is limited to participants created by the admin. Ask the organizer to add
          your email, then sign in again with the same address.
        </p>
        <div className="header-actions">
          <form action={signOut}>
            <button className="secondary-button" type="submit">
              Sign out
            </button>
          </form>
          <Link className="primary-link" href="/login">
            Try another email
          </Link>
        </div>
      </section>
    </main>
  );
}
