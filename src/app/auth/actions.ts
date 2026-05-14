"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginActionState {
  status: "idle" | "success" | "error";
  message: string;
}

async function getRequestOrigin(formData: FormData) {
  const formOrigin = String(formData.get("origin") ?? "").trim();

  if (formOrigin) {
    return formOrigin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function sendMagicLink(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return {
      status: "error",
      message: "Enter an email address.",
    };
  }

  const origin = await getRequestOrigin(formData);

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Supabase is not configured yet. Add environment variables and try again.",
    };
  }

  return {
    status: "success",
    message: "Magic link sent. Check your email to continue.",
  };
}

export async function signInWithGoogle(formData: FormData) {
  const origin = await getRequestOrigin(formData);

  let authUrl = "";
  let errorMessage = "";

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          prompt: "select_account",
        },
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      errorMessage = error.message;
    } else if (!data.url) {
      errorMessage = "Google sign-in did not return a redirect URL.";
    } else {
      authUrl = data.url;
    }
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Supabase is not configured yet. Add environment variables and try again.";
  }

  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect(authUrl);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
