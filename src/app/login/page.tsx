import Link from "next/link";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="shell auth-shell">
      <section className="auth-layout">
        <div className="brand auth-brand">
          <div className="brand-title">Mondibet</div>
          <div className="brand-subtitle">Sign in with Google</div>
        </div>

        <LoginForm loginError={error} />

        <Link className="text-link" href="/">
          Back to overview
        </Link>
      </section>
    </main>
  );
}
