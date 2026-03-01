interface GetUserResult {
  user: any | null;
  rateLimited: boolean;
}

export function isAuthRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { status?: number; code?: string };
  return (
    candidate.status === 429 || candidate.code === "over_request_rate_limit"
  );
}

function isStaleTokenError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "refresh_token_not_found" ||
    candidate.code === "refresh_token_already_used" ||
    candidate.code === "bad_jwt"
  );
}

export async function getUserWithRateLimitHandling(
  supabase: any,
): Promise<GetUserResult> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return { user: null, rateLimited: isAuthRateLimitError(error) };
    }

    return { user: user ?? null, rateLimited: false };
  } catch (error) {
    if (isAuthRateLimitError(error)) {
      return { user: null, rateLimited: true };
    }

    if (isStaleTokenError(error)) {
      return { user: null, rateLimited: false };
    }

    throw error;
  }
}
