interface APIErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export interface AuthSessionUser {
  id: string;
  email: string;
}

export class AuthAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

async function parseAPIError(response: Response, fallbackMessage: string): Promise<AuthAPIError> {
  let message = fallbackMessage;
  let code = 'INTERNAL_ERROR';

  try {
    const body = (await response.json()) as APIErrorResponse;
    if (body.error?.message) {
      message = body.error.message;
    }
    if (body.error?.code) {
      code = body.error.code;
    }
  } catch {
    // Preserve fallback values when response body is not JSON.
  }

  return new AuthAPIError(message, response.status, code);
}

export async function getSession(): Promise<AuthSessionUser | null> {
  const response = await fetch('/api/auth/session');
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw await parseAPIError(response, 'Failed to fetch auth session');
  }

  const body = (await response.json()) as { user?: AuthSessionUser };
  if (!body.user?.id) {
    return null;
  }

  return body.user;
}

export function startGoogleOAuth(): void {
  window.location.href = '/api/auth/google/start';
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', { method: 'POST' });
  if (!response.ok && response.status !== 204) {
    throw await parseAPIError(response, 'Failed to logout');
  }
}
