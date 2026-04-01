// backend/config/firebaseAdmin.js
// ─────────────────────────────────
// Setup:
// 1. Firebase Console → Project Settings → Service Accounts
// 2. Click "Generate new private key" → download JSON
// 3. Add values to .env

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

module.exports = admin;