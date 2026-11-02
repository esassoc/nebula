// Auth0 error codes meaning the stored session can no longer get a token; only signing in again fixes it.
// They arrive as a GenericError whose `error` is the code, through auth.error$ and through any API call
// whose token fetch failed, so both places recognise them here.
const SESSION_REJECTED_ERRORS = ['invalid_grant', 'missing_refresh_token', 'login_required'];

export function isAuth0SessionRejected(err: unknown): boolean {
  return SESSION_REJECTED_ERRORS.includes((err as { error?: string } | null)?.error);
}
