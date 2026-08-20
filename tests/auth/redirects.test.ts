import { describe, expect, it } from "vitest";
import { getSafeAuthRedirectUrl } from "@/lib/auth/redirects";

const ORIGIN = "https://mondibet.example";

describe("getSafeAuthRedirectUrl", () => {
  it("allows same-origin paths with query strings", () => {
    expect(getSafeAuthRedirectUrl("/participant?tab=bets", ORIGIN).toString()).toBe(
      "https://mondibet.example/participant?tab=bets",
    );
  });

  it.each([
    "https://attacker.example/phishing",
    "//attacker.example/phishing",
    "\\\\attacker.example/phishing",
    "javascript:alert(1)",
  ])("replaces unsafe redirect %s with the dashboard", (requestedPath) => {
    expect(getSafeAuthRedirectUrl(requestedPath, ORIGIN).toString()).toBe(
      "https://mondibet.example/dashboard",
    );
  });

  it("uses the dashboard when the redirect is missing or malformed", () => {
    expect(getSafeAuthRedirectUrl(null, ORIGIN).toString()).toBe(
      "https://mondibet.example/dashboard",
    );
    expect(getSafeAuthRedirectUrl("https://%", ORIGIN).toString()).toBe(
      "https://mondibet.example/dashboard",
    );
  });
});
