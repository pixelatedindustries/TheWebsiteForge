import type { FetchOptions } from "ofetch";

export interface AuthUser {
  email: string | null;
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Client-side auth helper around Firebase (Google sign-in). The Firebase app
 * and the auth-state listener are set up in `plugins/firebase.client.ts`,
 * which populates the shared `auth-user` / `auth-ready` states this reads.
 */
export function useAuth() {
  const user = useState<AuthUser | null>("auth-user", () => null);
  const ready = useState<boolean>("auth-ready", () => false);
  const configured = useState<boolean>("auth-configured", () => false);

  async function signInWithGoogle(): Promise<void> {
    const { $firebaseAuth } = useNuxtApp();
    if (!$firebaseAuth) throw new Error("Firebase is not configured.");
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup($firebaseAuth, provider);
  }

  async function signOut(): Promise<void> {
    const { $firebaseAuth } = useNuxtApp();
    if ($firebaseAuth) {
      const { signOut: fbSignOut } = await import("firebase/auth");
      await fbSignOut($firebaseAuth);
    }
    user.value = null;
  }

  async function getToken(forceRefresh = false): Promise<string | null> {
    const { $firebaseAuth } = useNuxtApp();
    const current = $firebaseAuth?.currentUser;
    if (!current) return null;
    return current.getIdToken(forceRefresh);
  }

  /** $fetch wrapper that attaches the Firebase ID token as a Bearer header. */
  async function adminFetch<T>(url: string, opts: FetchOptions = {}): Promise<T> {
    const token = await getToken();
    return $fetch<T>(url, {
      ...(opts as Record<string, unknown>),
      headers: {
        ...(opts.headers as Record<string, string>),
        Authorization: token ? `Bearer ${token}` : "",
      },
    }) as Promise<T>;
  }

  /**
   * Same as adminFetch but named for customer/account calls (any signed-in
   * user, not just admins). Both just attach the verified bearer token.
   */
  const authFetch = adminFetch;

  return {
    user,
    ready,
    configured,
    signInWithGoogle,
    signOut,
    getToken,
    adminFetch,
    authFetch,
  };
}
