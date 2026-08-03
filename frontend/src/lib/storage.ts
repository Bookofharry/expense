import type { AuthSession } from "../types";

const STORAGE_KEY = "techminds.auth";

// A stored JWT can go stale between visits (expiry, server restart, etc).
// Decoding it here lets us drop dead sessions before the UI ever trusts them.
const isTokenExpired = (token: string): boolean => {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return true;
    }
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    if (!decoded.exp) {
      return false;
    }
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const parseSession = (value: string | null, remember: boolean): AuthSession | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Omit<AuthSession, "remember">;
    if (!parsed.token || isTokenExpired(parsed.token)) {
      return null;
    }
    return {
      ...parsed,
      remember,
    };
  } catch {
    return null;
  }
};

export const getStoredSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const session =
    parseSession(window.localStorage.getItem(STORAGE_KEY), true) ??
    parseSession(window.sessionStorage.getItem(STORAGE_KEY), false);

  if (!session) {
    // Either nothing was stored, or what was stored is stale — clear it so
    // we don't keep re-parsing (and re-rejecting) a dead token on every load.
    clearStoredSession();
  }

  return session;
};

export const storeSession = (session: AuthSession) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    user: session.user,
    token: session.token,
  });

  if (session.remember) {
    window.localStorage.setItem(STORAGE_KEY, payload);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, payload);
  window.localStorage.removeItem(STORAGE_KEY);
};

export const clearStoredSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
};

const SESSION_EXPIRED_FLAG = "techminds.sessionExpired";

// Set right before the hard redirect to /login so the login screen can show
// a one-time "your session expired" notice instead of the page that
// triggered it flashing its own generic error first.
export const markSessionExpired = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(SESSION_EXPIRED_FLAG, "1");
};

export const consumeSessionExpiredFlag = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  const flagged = window.sessionStorage.getItem(SESSION_EXPIRED_FLAG) === "1";
  if (flagged) {
    window.sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
  }
  return flagged;
};
