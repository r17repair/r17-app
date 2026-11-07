import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

function getAdminApp() {
  const existingApp = getApps().find((app) => app.name === "r17-server");
  if (existingApp) return existingApp;

  const databaseURL = process.env.FIREBASE_DATABASE_URL ?? process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!databaseURL) throw new Error("FIREBASE_DATABASE_URL belum dikonfigurasi.");

  if (serviceAccountJSON) {
    const serviceAccount = JSON.parse(serviceAccountJSON) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    return initializeApp(
      {
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
        }),
        databaseURL,
      },
      "r17-server",
    );
  }

  if (projectId && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return initializeApp(
      {
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        databaseURL,
      },
      "r17-server",
    );
  }

  throw new Error(
    "Kredensial Firebase Admin belum dikonfigurasi. Isi FIREBASE_SERVICE_ACCOUNT_JSON atau kredensial terpisah.",
  );
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDatabase() {
  return getDatabase(getAdminApp());
}
