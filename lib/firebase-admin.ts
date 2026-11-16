
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ServiceAccount } from "firebase-admin";

function getServiceAccount(): ServiceAccount {
  const envCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (envCredentials) {
    return JSON.parse(envCredentials) as ServiceAccount;
  }

  const localKeyPath = join(process.cwd(), "serviceAccountKey.json");
  return JSON.parse(readFileSync(localKeyPath, "utf8")) as ServiceAccount;
}

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(getServiceAccount()),
      });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
