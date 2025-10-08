# Deployment Guide

This project uses Vite (React) + Firebase Hosting.

---
## Prerequisites
- Node 18+ (recommended LTS)
- Firebase CLI installed globally:
  ```bash
  npm install -g firebase-tools
  ```
- A Firebase project created in the Firebase console

---
## Environment Variables
Create a local `.env` (or `.env.local`) with your Firebase web config (values from the Firebase console > Project Settings > General > Web App):
```
VITE_FIREBASE_API_KEY=... 
VITE_FIREBASE_AUTH_DOMAIN=... 
VITE_FIREBASE_PROJECT_ID=... 
VITE_FIREBASE_STORAGE_BUCKET=... 
VITE_FIREBASE_MESSAGING_SENDER_ID=... 
VITE_FIREBASE_APP_ID=... 
VITE_FIREBASE_MEASUREMENT_ID=... # optional
```
Do not commit secret keys used only for server contexts (none are required here beyond the public web config).

---
## One-Time Setup
Initialize hosting if not already:
```bash
firebase login
firebase use --add   # select your project and create an alias like 'prod'
```
`.firebaserc` already contains a placeholder. Update it with your real project id(s):
```json
{
  "projects": { "default": "your-real-project-id", "prod": "your-real-project-id" }
}
```

---
## Build & Deploy
Use the provided npm scripts:
```bash
npm run build        # creates dist/
npm run deploy       # builds (again) then deploys hosting
```
For CI (non-interactive):
```bash
npm run deploy:ci
```
For ephemeral preview channels (per commit hash):
```bash
npm run deploy:preview
```
This creates a channel like: https://preview-<hash>--<project-id>.web.app

---
## Local Emulation (Hosting Only)
```bash
npm run serve:hosting
```
Navigate to the printed localhost URL.

If you later add Firestore/Functions emulators, extend the command:
```bash
firebase emulators:start --only hosting,firestore,functions
```

---
## SPA Rewrites & Caching
`firebase.json` is configured to:
- Rewrite all routes to `/index.html` (SPA routing)
- Cache hashed build assets aggressively (1 year, immutable)
- Prevent service worker (`sw.js`) from being cached incorrectly

---
## Deployment Checklist
- [ ] `.env` populated
- [ ] `npm install` completed
- [ ] `npm run build` passes without errors
- [ ] Firebase project selected (`firebase use <alias>`)
- [ ] `npm run deploy` executed

---
## Rollback
List deploy history:
```bash
firebase hosting:versions:list
firebase hosting:rollback <versionId>
```

---
## Common Issues
| Symptom | Resolution |
|---------|------------|
| 404 on refresh | Ensure rewrites in `firebase.json` include `{ "source": "**", "destination": "/index.html" }` |
| Old assets served | Invalidate browser cache or bump build (hashed assets usually prevent this) |
| Missing env values | Confirm they start with `VITE_` and restart dev server |
| Auth domain mismatch | Add the hosting domain to Firebase Auth > Settings > Authorized domains |

---
## Next Steps (Optional)
- Add ESLint + CI job (`npm run lint`)
- Add performance budgets (Lighthouse CI)
- Add real-time preview integration for PRs (GitHub Actions + `deploy:preview`)
- Introduce functions for secure admin actions

---
Happy shipping!
