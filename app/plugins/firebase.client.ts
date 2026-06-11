import { initializeApp, getApps } from "firebase/app";
import { getAuth, onIdTokenChanged, type User } from "firebase/auth";
import { useAuthStore } from "~/stores/auth";

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

  const authStore = useAuthStore();
  let firebaseAuth: ReturnType<typeof getAuth> | null = null;

  if (!cfg?.apiKey) {
    // Not configured — let the UI show a setup message instead of crashing.
    authStore.setReady(true);
    authStore.setConfigured(false);
  } else {
    authStore.setConfigured(true);

    const app = getApps().length
      ? getApps()[0]!
      : initializeApp({
          apiKey: cfg.apiKey,
          authDomain: cfg.authDomain,
          projectId: cfg.projectId,
          appId: cfg.appId,
        });

    firebaseAuth = getAuth(app);

    onIdTokenChanged(firebaseAuth, (u: User | null) => {
      authStore.setUser(
        u
          ? {
              email: u.email,
              uid: u.uid,
              displayName: u.displayName,
              photoURL: u.photoURL,
            }
          : null,
      );
      authStore.setReady(true);
    });
  }

  return { provide: { firebaseAuth } };
});
