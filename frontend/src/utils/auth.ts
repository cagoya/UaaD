import type { AuthRole, AuthSession } from '../types/auth';
import { normalizeUserRole } from '../types/user';

const AUTH_STORAGE_KEY = 'auth_session';
const LEGACY_TOKEN_KEY = 'token';

export type LoginRedirectReason = 'session_expired';

interface BuildLoginPathOptions {
  redirectTo?: string | null;
  reason?: LoginRedirectReason | null;
}

interface StoredAuthSession {
  token?: string;
  expiresAt?: string | null;
  expires_at?: string | null;
  userId?: number | null;
  user_id?: number | null;
  role?: AuthRole | null;
  username?: string | null;
}

function readStoredNumber(...values: Array<number | null | undefined>) {
  const matched = values.find((value) => typeof value === 'number' && Number.isFinite(value));
  return typeof matched === 'number' ? matched : null;
}

export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (rawSession) {
      const parsedSession = JSON.parse(rawSession) as StoredAuthSession;
      if (typeof parsedSession.token === 'string' && parsedSession.token) {
        const normalizedRole =
          typeof parsedSession.role === 'string' && parsedSession.role
            ? normalizeUserRole(parsedSession.role)
            : null;

        return {
          token: parsedSession.token,
          expiresAt: parsedSession.expiresAt ?? parsedSession.expires_at ?? null,
          userId: readStoredNumber(parsedSession.userId, parsedSession.user_id),
          role: normalizedRole,
          username: typeof parsedSession.username === 'string' ? parsedSession.username : null,
        };
      }
    }
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  const legacyToken = window.localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacyToken) {
    return null;
  }

  return {
    token: legacyToken,
    expiresAt: null,
    userId: null,
    role: null,
    username: null,
  };
}

export function setStoredAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.setItem(LEGACY_TOKEN_KEY, session.token);
}

export function clearStoredAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function getDefaultAuthenticatedPath(role?: AuthRole | null) {
  return role === 'MERCHANT' ? '/merchant/dashboard' : '/';
}

export function normalizeRedirectPath(path?: string | null) {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/login')) {
    return null;
  }

  return path;
}

export function buildLoginPath(options: BuildLoginPathOptions = {}) {
  const searchParams = new URLSearchParams();
  const redirectPath = normalizeRedirectPath(options.redirectTo);

  if (redirectPath) {
    searchParams.set('redirect', redirectPath);
  }

  if (options.reason) {
    searchParams.set('reason', options.reason);
  }

  const queryString = searchParams.toString();
  return queryString ? `/login?${queryString}` : '/login';
}

export function getPostLoginPath(role: AuthRole | null, requestedPath?: string | null) {
  const normalizedRequestedPath = normalizeRedirectPath(requestedPath);

  if (!normalizedRequestedPath) {
    return getDefaultAuthenticatedPath(role);
  }

  if (normalizedRequestedPath.startsWith('/merchant') && role !== 'MERCHANT') {
    return getDefaultAuthenticatedPath(role);
  }

  return normalizedRequestedPath;
}
