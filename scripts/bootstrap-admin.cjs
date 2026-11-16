
/* eslint @typescript-eslint/no-require-imports: "off" */
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function bootstrap() {
  const uid = "aSIUrk8fwmdBQfcMotDA31NBFYC3";
  const schoolId = "gths-kumbo";

  // Verify that this Firebase account exists.
  const account = await auth.getUser(uid);

  const schoolRef = db.collection("schools").doc(schoolId);
  const userRef = db.collection("users").doc(uid);

  // Never overwrite an existing school or administrator profile.
  const schoolDoc = await schoolRef.get();
  const userDoc = await userRef.get();

  if (schoolDoc.exists || userDoc.exists) {
    throw new Error(
      "A school or user profile already exists. Stopping to protect existing data."
    );
  }

  const batch = db.batch();

  batch.set(schoolRef, {
    name: "GTHS Kumbo",
    schoolId: schoolId,
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(userRef, {
    uid: uid,
    email: account.email || null,
    displayName: account.displayName || "Technical Administrator",
    schoolId: schoolId,
    role: "technical_admin",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  console.log("SUCCESS: First school created.");
  console.log("School ID:", schoolId);
  console.log("Administrator UID:", uid);
  console.log("Role: technical_admin");
}

bootstrap()
  .catch((error) => {
    console.error("BOOTSTRAP FAILED:", error.message);
    process.exitCode = 1;
  });