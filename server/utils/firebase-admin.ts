import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

/**
 * Lazily initialise the Firebase Admin SDK from service-account env vars and
 * verify client ID tokens server-side. Used to authenticate the /admin area.
 */
let app: App | null = null;

function getAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Private keys are stored with literal \n in .env — turn them back into newlines.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Firebase Admin is not configured (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).",
    });
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return app;
}

export function verifyIdToken(token: string): Promise<DecodedIdToken> {
  return getAuth(getAdminApp()).verifyIdToken(token);
}
