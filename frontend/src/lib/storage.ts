import type { AuthSession } from "../types";

const STORAGE_KEY = "techminds.auth";

const parseSession = (value: string | null, remember: boolean): AuthSession | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Omit<AuthSession, "remember">;
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

  return (
    parseSession(window.localStorage.getItem(STORAGE_KEY), true) ??
    parseSession(window.sessionStorage.getItem(STORAGE_KEY), false)
  );
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
