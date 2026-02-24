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

    throw error;
  }
}
