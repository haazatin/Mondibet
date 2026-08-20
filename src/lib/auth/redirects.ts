const DEFAULT_AUTH_REDIRECT_PATH = "/dashboard";

export function getSafeAuthRedirectUrl(
  requestedPath: string | null,
  requestOrigin: string,
): URL {
  const fallback = new URL(DEFAULT_AUTH_REDIRECT_PATH, requestOrigin);

  if (!requestedPath) {
    return fallback;
  }

  try {
    const destination = new URL(requestedPath, requestOrigin);
    return destination.origin === fallback.origin ? destination : fallback;
  } catch {
    return fallback;
  }
}
