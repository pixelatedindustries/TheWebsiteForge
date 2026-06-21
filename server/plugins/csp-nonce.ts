import { randomBytes } from "node:crypto";
import { buildContentSecurityPolicy } from "../../shared/csp";

/**
 * Per-document CSP nonce (S2).
 *
 * Generates a fresh nonce for every rendered HTML document, stamps it on every
 * `<script>` tag Nuxt injects, and overrides the response's Content-Security-
 * Policy with a `script-src` that allows ONLY that nonce (no `'unsafe-inline'`).
 * API and asset responses keep the baseline header from `routeRules` — inline
 * script can't execute there, so it's irrelevant.
 *
 * Because the nonce is unpredictable and unique per response, an injected inline
 * `<script>` (the classic XSS payload) won't carry a valid nonce and the browser
 * refuses to run it.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("render:html", (html, { event }) => {
    const nonce = randomBytes(16).toString("base64");

    // Add the nonce to every script tag that doesn't already have one.
    const stamp = (sections: string[]) =>
      sections.map((tag) =>
        tag.replace(/<script(?![^>]*\snonce=)/g, `<script nonce="${nonce}"`),
      );
    html.head = stamp(html.head);
    html.bodyPrepend = stamp(html.bodyPrepend);
    html.bodyAppend = stamp(html.bodyAppend);

    // Override the baseline CSP for this document with the strict nonce policy.
    setResponseHeader(
      event,
      "Content-Security-Policy",
      buildContentSecurityPolicy(nonce),
    );
  });
});
