// Load env
import dotenv from "dotenv";
dotenv.config({ path: "config.env", quiet: true });

// import
import admin from "firebase-admin";
import APIError from "./apiError.js";

// ============================================================
// 🔹 Check Env Vars Integrity
// ============================================================
const requiredEnv = [
  "FIREBASE_TYPE",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_CLIENT_ID",
  "FIREBASE_AUTH_URI",
  "FIREBASE_TOKEN_URI",
  "FIREBASE_AUTH_PROVIDER_CERT_URL",
  "FIREBASE_CLIENT_CERT_URL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new APIError(`Missing Firebase ENV key: ${key}`, 500);
  }
}

// ============================================================
// 🔹 Rebuild Firebase JSON Securely
// ============================================================
const firebaseConfig = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

// ============================================================
// 🔹 Initialize Admin SDK Safely
// ============================================================
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
    console.log("🟢 Firebase Admin SDK initialized successfully");
  } catch (err) {
    throw new APIError(
      "🔴 Failed to initialize Firebase Admin SDK: " + err.message,
      500
    );
  }
}

export default admin;
