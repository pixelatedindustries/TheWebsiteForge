import { useAuthStore } from "~/stores/auth";

/**
 * Client-side auth gate for the admin area (issues.md #8).
 *
 * Firebase auth state only exists on the client, so we can't decide on the
 * server. This middleware blocks navigation into `/admin/*` until the auth
 * state has hydrated, then redirects anonymous visitors to the login page —
 * so the admin shell never flashes before the layout's authorization check.
 *
 * Authorization (the ADMIN_EMAILS allowlist) is still enforced server-side on
 * every `/api/admin/*` call and re-checked in the admin layout; this only
 * handles the "is anyone signed in?" gate.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith("/admin") || to.path === "/admin/login") return;
  // Auth is client-only; the layout shows a loading gate during SSR/hydration.
  if (import.meta.server) return;

  const auth = useAuthStore();

  // Wait for the Firebase auth listener to report initial state.
  if (!auth.ready) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => auth.ready,
        (ready) => {
          if (ready) {
            stop();
            resolve();
          }
        },
      );
    });
  }

  // Not configured (no Firebase env) — let the layout render its setup message.
  if (!auth.configured) return;
  if (!auth.user) return navigateTo("/admin/login");
});
