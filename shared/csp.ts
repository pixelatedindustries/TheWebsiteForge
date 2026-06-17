/**
 * Single source of truth for the Content-Security-Policy.
 *
 * Two consumers:
 *  - `nuxt.config.ts` routeRules uses the no-nonce baseline (applies to every
 *    response, including API/asset responses where inline script never runs).
 *  - The `csp-nonce` Nitro plugin calls this with a per-request nonce and
 *    overrides the header on HTML documents, so the document policy can drop
 *    `'unsafe-inline'` for scripts entirely (S2).
 *
 * When a nonce is supplied, `script-src` allows only that nonce (+ the trusted
 * third-party origins) and NOT `'unsafe-inline'`. Browsers that understand
 * nonces ignore `'unsafe-inline'` anyway, so this is the strict, correct form.
 */
export function buildContentSecurityPolicy(nonce?: string): string {
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' https://js.paystack.co https://checkout.paystack.com https://apis.google.com`
    : // Baseline (no document nonce available, e.g. API responses): keep
      // 'unsafe-inline' as a harmless fallback since scripts never execute on
      // non-document responses. HTML documents are upgraded by the plugin.
      "script-src 'self' 'unsafe-inline' https://js.paystack.co https://checkout.paystack.com https://apis.google.com";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://checkout.paystack.com",
    // Avatars come from Google/Firebase auth providers; decorative art is data: SVG.
    "img-src 'self' data: https://*.googleusercontent.com https://*.gravatar.com https://lh3.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    scriptSrc,
    // WebGL/3D libraries (and Vite's dev HMR) spawn workers from blob: URLs.
    // Without an explicit worker-src these fall back to the strict script-src
    // and get blocked under the nonce policy.
    "worker-src 'self' blob:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.paystack.co https://*.paystack.co",
    "frame-src https://checkout.paystack.com https://*.paystack.co https://*.firebaseapp.com https://*.web.app",
  ].join("; ");
}
