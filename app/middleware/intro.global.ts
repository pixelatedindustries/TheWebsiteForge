/**
 * Returning-visitor fast path.
 *
 * The first time someone clicks "Enter the site" we set a `twf_entered` cookie
 * (see app/pages/index.vue → enter()). On every later visit to the base route
 * this middleware redirects them straight to `/home` BEFORE the intro page (and
 * its heavy three.js black-hole canvas) ever mounts. Because the flag lives in a
 * cookie, the redirect happens during SSR too — so returning visitors never see
 * the intro flash or pay the WebGL load cost.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== "/") return;
  const entered = useCookie<string | null>("twf_entered");
  if (entered.value === "1") {
    return navigateTo("/home", { replace: true });
  }
});
