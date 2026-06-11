import { initializeApp, getApps } from "firebase/app";
import { getAuth, onIdTokenChanged, type User } from "firebase/auth";
import type { AuthUser } from "~/composables/useAuth";

/**
 * Client-only Firebase init. Creates the web app, wires the auth-state
 * listener into shared Nuxt state, and provides `$firebaseAuth`.
 * No-ops gracefully when Firebase env vars aren't set yet.
 */
export default defineNuxtPlugin(() => {
  const cfg = useRuntimeConfig().public.firebase as {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    appId?: string;
  };

  const user = useState<AuthUser | null>("auth-user", () => null);
  const ready = useState<boolean>("auth-ready", () => false);
  const configured = useState<boolean>("auth-configured", () => false);

  if (!cfg?.apiKey) {
    // Not configured — let the UI show a setup message instead of crashing.
    ready.value = true;
    configured.value = false;
    return { provide: { firebaseAuth: null } };
  }

  configured.value = true;

  const app = getApps().length
    ? getApps()[0]!
    : initializeApp({
        apiKey: cfg.apiKey,
        authDomain: cfg.authDomain,
        projectId: cfg.projectId,
        appId: cfg.appId,
      });

  const auth = getAuth(app);

  onIdTokenChanged(auth, (u: User | null) => {
    user.value = u
      ? {
          email: u.email,
          uid: u.uid,
          displayName: u.displayName,
          photoURL: u.photoURL,
        }
      : null;
    ready.value = true;
  });

  return { provide: { firebaseAuth: auth } };
});
