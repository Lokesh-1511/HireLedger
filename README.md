# Campus Recruitment Platform (PWA Scaffold)

Progressive Web Application base for a campus recruitment ecosystem (employers, students, career services). Built with React + Vite and structured for future integration (REST/GraphQL backend, AI candidate ranking, verifiable credentials on-chain, etc.).

## Features Implemented
- React + Vite fast dev environment
- Modular structure: components / pages / hooks / utils
- Responsive 3 → 2 → 1 column adaptive layout via CSS Grid & media queries
- Accessible navigation (skip link, aria labels, keyboard-friendly structure)
- Light/Dark theme (persisted; respects `prefers-color-scheme`)
- PWA assets: `manifest.json`, service worker (network-first for navigations, cache-first static assets)
- Core pages: Dashboard, Jobs, Candidates, Settings
- Collapsible sidebar & fixed top navbar
- Mock authentication (email/password + role) with localStorage persistence
- Student job explorer & dashboard powered by a persistent `StudentDataContext` (mock API + local storage)

## Folder Structure (excerpt)
```
src/
	components/
		layout/ (Navbar, Sidebar, Layout)
	pages/ (Dashboard, Jobs, Candidates, Settings)
	hooks/ (useTheme, useMediaQuery, useKeyboardNav)
	utils/ (constants, a11y)
	styles/ (globals.css)
	service-worker.js
	App.jsx
	main.jsx
index.html
manifest.json
```

## Scripts
- `npm run dev` – Start dev server
- `npm run build` – Production build (outputs to `dist/`)
- `npm run preview` – Preview production build locally

## Theming
Implemented with `data-theme` attribute on `<html>` and CSS custom properties. Users can toggle; initial value derived from localStorage or system preference.

## Accessibility
- Landmarks: header (banner), nav, main
- Skip to content link
- Focus outlines via `:focus-visible`
- Color contrast chosen for legibility; dark mode variables adjusted
- Live region helper (`announce()`) for future dynamic updates

## PWA
- `manifest.json` with placeholder icons (replace with final brand assets)
- Service worker provides offline shell and caches core assets
- Registration occurs after window load (`main.jsx`)

## Future Enhancements
- State management (Zustand / Redux Toolkit / React Query)
- Route-based code splitting & skeleton loading
- Form validation + accessible error patterns
- Candidate profile card components & drag/drop pipeline
- Job creation wizard
- Integration tests (Playwright) + unit tests (Vitest / React Testing Library)
- Lighthouse & axe CI checks
- i18n (formatjs / lingui)
- Edge function or serverless deploy config
- Security headers & CSP

## Student Profile Builder (New)
Multi‑step guided interface at `/profile/builder` (student role) capturing:
- Personal
- Education (repeatable entries)
- Skills (tag-based input for core, tools, languages)
- Projects (repeatable entries with description & link)
- Resume upload (single PDF)
- Certificates upload (multi-file, PDF or image)
- Review (aggregated, quick edit links)

### UI Features
- Top progress indicator with interactive step navigation.
- Sticky footer with Back / Next / Save Draft / Submit actions.
- Drag & drop file zones (resume, certificates) with size + remove controls.
- Local draft persistence (debounced save to `localStorage`).
- Inline helper text + placeholders for validation & tooltips.

### Data Model (local only)
Stored under `localStorage` key `hl_profile_builder_v1`:
```
{
	personal: { firstName, lastName, email, phone },
	education: [ { school, degree, start, end, gpa }, ... ],
	skills: { core:[], tools:[], languages:[] },
	projects: [ { name, description, link }, ... ],
	resume: { file },
	certificates: [ { file }, ... ]
}
```

### Extending / Backend Integration
1. Replace submit placeholder (`console.log`) in `ProfileBuilder.jsx` with API POST.
2. Upload flow: swap current in-memory File objects for presigned upload (S3 / GCS) then store returned URLs.
3. Add schema validation (Zod / Yup) before submission.
4. Provide progress & error states per file (resume/certificates). 
5. Add versioning / last-updated metadata.

### Validation TODOs
- Required: firstName, lastName, email, at least one education entry, resume file.
- File type & size enforcement (e.g., PDF < 2MB).
- Duplicate skill tag detection.
- Project link URL validation.

### Future Enhancements
- AI skill extraction from resume.
- Auto-suggest education institutions.
- Certificate OCR parsing.
- Accessibility: live region for step changes & upload announcements.

## Student Data Layer & Jobs Experience (New)

Built a dedicated `StudentDataContext` that seeds realistic sample jobs, applications, interviews, notifications, and skills while persisting student choices to `localStorage` (`hl_student_portal_v1`). This enables student surfaces to share a consistent, stateful experience without a backend.

- `StudentJobs.jsx` now sources data/actions from the context, replacing alert placeholders with real apply/withdraw/save flows, stage progression, and a details modal.
- `StudentDashboard.jsx` mirrors the same data for profile progress, job recommendations, application status lanes, interview schedule, skill goals, and notifications.
- Actions trigger live toasts for feedback and write through to the persistent store so both pages stay in sync on refresh.
- Filters, saved jobs, and application stages survive reloads and are safe-guarded against malformed local storage.

## Authentication
Authentication now exclusively uses Firebase Google Sign-In. The previous mock email/password + role selector has been removed to eliminate divergence from real identity flows.

### Current Flow
1. User clicks "Continue with Google".
2. On success we `ensureUser` (creates Firestore `users/<uid>` doc if missing with default `role: student`).
3. Session persisted locally (for fast reload) but authorization decisions rely on the live Firestore doc role.
4. `ProtectedRoute` now only trusts the in-memory Firebase-backed session (no localStorage fallback without a Firebase auth user).

### Role Management
- Default role: `student`.
- To assign `recruiter` or `admin`, update the Firestore document `users/<uid>` manually (or via seed script / future admin UI):
	```json
	{
		"role": "recruiter",
		"companyId": "<uid or company doc id>",
		"companyName": "Your Company Name"
	}
	```
- Recruiter dashboards rely on `companyId` for primary job queries.

### Role Assignment (Simplified)
During registration the user selects a role and that role is assigned immediately to their Firestore user document (no pending workflow). Post-login role change requests can still be made via the role request panel if you keep that feature enabled.

User doc fields involved:
```json
{
	"role": "student",
	"requestedRole": "recruiter",
	"requestedRoleReason": "Need recruiter tools",
	"requestedRoleAt": <timestamp>
}
```

Security Note: Add Firestore security rules / admin UI before relying on this workflow in production. Without rules, any authenticated user could still attempt writes directly.

### Future Enhancements
- Admin UI for role assignment.
- Custom claims (Firebase) to enforce role-based security rules server-side.
- Email/password or enterprise SSO integration if required.

### Firebase Google Authentication
Firebase client SDK integrated for Google sign-in.

Files:
```
src/firebase.js               # Initializes Firebase app + auth
src/context/AuthContext.jsx   # Now wires Firebase auth state listener & popup login
src/pages/AuthPage.jsx        # Adds "Continue with Google" button (popup flow)
```

Environment variables (see `.env.example`):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```
If vars are absent, the provided demo config is used (not suitable for production).

Auth flow details:
1. User clicks Google button → `signInWithPopup`.
2. `ensureUser` creates/updates Firestore user doc; role defaults to `student` if unset.
3. Session object contains `{ uid, role, firestore }` snapshot; route protection uses this.
4. Logout invokes Firebase `signOut` and clears session.

Next recommended hardening:
- Use Firebase custom claims for authoritative role.
- Security rules enforcing role-based read/write.
- Domain restriction (e.g., campus email) gating sign-in.
- Optional backend token exchange for server-side authorization.


## Routing & Layout Notes
- `/login` renders outside the main app layout (no sidebar/nav) for focus.
- Root path `/` auto-redirects: authenticated → `/dashboard/:role`, otherwise `/login`.
- Role-based restrictions: recruiter/admin required for Jobs & Candidates.

## Service Worker & Dev Troubleshooting
If you previously saw an older project at `http://localhost:5173/`, a leftover service worker likely served cached assets.

Steps to clear:
1. Open browser DevTools → Application (or Storage) → Service Workers → Unregister all for this origin.
2. Clear site data (cache + storage) if necessary.
3. Hard reload (Ctrl+Shift+R / Cmd+Shift+R).

In development the SW now only registers in production builds (`import.meta.env.PROD`) to avoid stale caching confusion. The SW file moved to `/sw.js` for predictable scope.

## Deployment Notes
When deploying ensure service worker path remains valid; consider moving to `/sw.js` at root and adjusting registration for production.

## Replacing Icons
Replace files in `/icons` keeping filenames & sizes. Update `manifest.json` if adding maskable icons.

## License
MIT (add a LICENSE file if distribution is intended)

## CSS Architecture (Modular Redesign 2025-10)

The styling system was refactored from a single monolithic `globals.css` into a layered, modular architecture for clearer ownership, faster iteration, and lower regression risk.

### Layer Overview
1. Core Tokens: `styles/modules/tokens.css` – Design primitives (color palette, semantic roles, spacing, radii, shadows, motion curves, typography). Includes compatibility aliases for legacy variable names during transition.
2. Base: `styles/modules/base.css` – Resets, element defaults, typography scaling, dark mode root variables.
3. Layout: `styles/modules/layout.css` – Global structural grid (sidebar + main), responsive breakpoints, scroll behaviors.
4. Components: `styles/modules/components.css` – Reusable design system atoms/molecules (buttons, cards/surfaces, badges, forms, progress, tabs, chips, etc.). No page‑specific selectors.
5. Utilities: `styles/modules/utilities.css` – Small single‑responsibility classes (spacing stacks, flex/grid helpers, text truncation, visually-hidden, shadow helpers).
6. Features: `styles/features/*.css` – Cross‑page interactive/behavioral UI (toasts, command palette, skeleton loaders, banners, modals, splash screen). Imported globally in `index.css`.
7. Pages: `styles/pages/*.css` – Page‑scoped layout & aesthetic rules (grid templates, KPI card variants, table formatting). Imported only by the corresponding React page component.

### Import Flow
Global bundle (`globals.css` → `index.css`) now only includes core + feature layers:
```
@import './modules/tokens.css';
@import './modules/base.css';
@import './modules/layout.css';
@import './modules/components.css';
@import './modules/utilities.css';
/* Feature layers */
@import './features/toasts.css';
@import './features/command-palette.css';
@import './features/skeletons.css';
@import './features/banners.css';
@import './features/modals.css';
@import './features/splash.css';
```
Individual page components import their own stylesheet, e.g.:
```
// in pages/RecruiterDashboard.jsx
import '../styles/pages/RecruiterDashboard.css';
```

### Conventions
- Naming: `.role-entity-section` or `.recruiter-analytics-card`; avoid deeply nested selectors (>3 levels) to maintain clarity.
- Page root: Each page file defines a top-level wrapper class (e.g., `.recruiter-applicants-layout`) used as a scoping boundary.
- No overrides: Page CSS must not modify core component class definitions directly; instead extend via wrapper context or new semantic classes.
- Dark mode: Prefer using semantic CSS vars (e.g., `var(--surface-elevated)`) so themes propagate automatically.
- Responsive: Use minmax auto-fill grids and clamp typography where possible; only introduce media queries for breakpoint-specific structural shifts.

### Adding a New Page
1. Create `styles/pages/NewPageName.css` with a unique root wrapper class.
2. Limit selectors to that root scope + descendants.
3. Import the file at top of the new page component.
4. Reuse utilities/components before adding bespoke rules.

### Migration Notes
- Legacy module page imports (`modules/student-dashboard.css`, etc.) were fully removed from `index.css`.
- Compatibility CSS variables retained in `tokens.css` (`--accent-*`, `--elevate-*`) to avoid breaking earlier component references. Plan: remove after audit & rename to semantic equivalents.

### Future Hardening
- Introduce linting (Stylelint) with a layering rule set (e.g., stylelint-order) to enforce import order.
- Consider CSS logical properties for RTL readiness.
- Evaluate extracting components to CSS Modules or a zero-runtime utility generator if scale increases.

### Performance
- Page-specific CSS is only parsed on navigation when using code splitting (future enhancement once routes are lazily loaded).
- Shared feature + core layers remain in the initial render path for consistent UX.

### Testing
- Visual regression: integrate Playwright + per-page screenshot baselines.
- Accessibility audit: axe-core run per page wrapper root.

---
## Firestore Integration (2025-10-07)

Initial Firestore data layer added with typed (JSDoc) model definitions and service helpers.

### Files
```
src/firebase.js                     # Firebase app + auth
src/services/firestoreModels.js     # JSDoc typedefs for all collections
src/services/firestoreService.js    # CRUD + ensureUser + profile helpers
src/services/firestoreSeed.js       # Dev-only in-app seed helper (window.__hireledgerSeed)
scripts/seedFirestore.js            # Node/Esm script to populate mock data
src/context/AuthContext.jsx         # Now invokes ensureUser on auth state
```

### Key Helpers (firestoreService.js)
- ensureUser(firebaseUser)
- getUser / updateUser
- upsertStudentProfile / upsertRecruiterProfile / upsertAdminProfile
- createJob / listJobs
- createApplication / createInterview / createAssessment / createVerification
- addNotification(uid, notification)
- sendMessage
- createInstitution
- upsertAnalytics(metricId, data)

All writes automatically set `createdAt` + `updatedAt` via `serverTimestamp()`; updates only adjust `updatedAt`.

### Data Shape Intellisense
Importing `firestoreModels.js` in an editor surface provides auto‑completion for object literals (VS Code picks up the JSDoc typedefs).

### Seeding Data
Two options:
1. Node Script (preferred for initial bulk seed):
	 - Ensure environment variables or fallback config exists in `src/firebase.js`.
	 - Run (experimental) via a Node ESM context:
		 ```bash
		 node scripts/seedFirestore.js
		 ```
	 - Creates mock users (student/recruiter/admin), profiles, jobs, applications, assessment, verification, notification, message, institution, analytics metric.

2. In-app (dev only):
	 - Open browser console after starting `npm run dev`.
	 - Call `window.__hireledgerSeed()` once.
	 - Skips if `import.meta.env.PROD` is true.

3. Extended Rich Dataset:
	 - For multi-user scenario and relational links (multiple students, multiple jobs, applications, interview, notifications) run:
		 ```bash
		 node scripts/seedFirestoreExtended.js
		 ```
	 - Idempotent where practical (won't duplicate same title/company jobs or user docs).
	 - Adds:
		 - 4 student users + profiles
		 - 2 recruiter users + profile
		 - 1 admin user + profile
		 - 3 jobs (active/draft mix)
		 - Applications (each student applies to first two active jobs)
		 - 1 interview scheduled for first application
		 - Notifications for first two students
	 - Safe to re-run; only new missing docs added (jobs matched by title & companyId, applications by jobId/studentId).

All seeding scripts now import the single Firestore instance (`db`) exported from `src/firebase.js` to avoid creating multiple isolated SDK instances. If you change Firebase config, update it only in that file.

### Frontend Migration to Firestore Source of Truth (2025-10-08)
The previous in-browser mock state for student and recruiter dashboards has been replaced with real-time Firestore subscriptions:

- `StudentDataContext` now listens to: `jobs`, `applications (where studentId == uid)`, `interviews (where studentId == uid)`, and user-scoped `notifications` subcollection.
- `RecruiterDataContext` now listens to: `jobs (where companyId == recruiterUid)`, `applications (where recruiterId == uid)`, `interviews (where recruiterId == uid)`, plus `verifications` and `messages` filtered by recruiter participation.
- Application progress stages are derived from the Firestore `status` field instead of a local `stageIndex`.
- Local mock arrays & persistent localStorage seeds were removed; only transient UI preferences (filters, skill visualization) remain locally (skills will move to Firestore in a later iteration).
- Actions (apply, advance stage, withdraw, create job, schedule interview, message applicants) now perform Firestore writes.

Pending Enhancements:
- Saved jobs persistence (planned: `users/<uid>/savedJobs`).
- Skill tracking & goals stored per user. (Implemented: student skills now stored in `users/<uid>/skills` with real-time subscription.)
- Diversity and verification enrichment (currently placeholder aggregation).
- Firestore security rules and role-based enforcement.

If you previously relied on the mock data, re-run seeding scripts to populate Firestore, then authenticate and the UI will reflect live collections.

### Recruiter Focused Permanent Seed (New)
For a minimal, stable dataset powering recruiter dashboards without in-app mock logic, use the dedicated recruiter seed script:

```
# PowerShell or bash
npm run seed:recruiter
```

What it ensures (idempotent where possible):
- Recruiter user (UID: `recruiter-demo-001`) + recruiter profile sub-doc
- Student user (UID: `student-demo-001`) + student profile for linking an application
- Company doc (`companies/company-demo-001`)
- Two jobs (if none exist for that recruiter):
	- Backend Engineer Intern
	- Frontend Engineer
- One application tying the demo student to the Backend Intern job

Rerunning will skip creating duplicate jobs/applications if jobs already exist for `companyId == recruiter-demo-001`.

Usage Notes:
- Script path: `scripts/seedRecruiterData.js`
- Backed by the same `db` instance from `src/firebase.js`; ensure env vars are set or fallback config is acceptable.
- Safe to run before logging in; after seeding, authenticate (Google or mock auth) and recruiter pages will subscribe to the Firestore data.

Removal of In-App Seeding:
All prior temporary demo seeding and UI buttons were removed from runtime to avoid production contamination. The external script is now the sole source for recruiter sample data.

### Recruiter Job Posting (Draft vs Publish)
The Recruiter "Post a Job" page now persists directly to Firestore:
- Save Draft: Creates a job document with `status: 'draft'` (hidden from students)
- Publish: Creates a job with `status: 'active'` plus a `postedAt` timestamp (immediately visible to students, who subscribe to all non-draft jobs)

Implementation details:
- Firestore write handled in `RecruiterDataContext.addJob(jobDraft, { publish })`
- `postedAt` is only set for published jobs (serverTimestamp)
- Student feed (`StudentDataContext`) filters out `status === 'draft'`

Planned enhancements:
- Edit existing draft → publish flow
- Soft close (set `status: 'closed'`) with student notification fan-out
- Rich text / markdown job descriptions with sanitization

### Companies & Auth User Creation (New)

Additional scripts extend the dataset beyond basic documents:

1. Companies Collection:
	```bash
	npm run seed:companies
	```
	- Creates/ensures company docs under `companies` (idempotent by `name`).
	- Backfills recruiter profile sub-docs with a `companyId` reference so listings can join recruiter → company.
	- Uses client SDK (sufficient for local dev). For production provisioning prefer Admin SDK.

2. Auth Users (Firebase Authentication) with Deterministic Passwords:
	```bash
	# Requires a Firebase service account JSON (download from console) saved locally, e.g.: serviceAccount.json
	node scripts/createAuthUsers.js serviceAccount.json
	```
	- Uses `firebase-admin` to create auth users for each seeded Firestore user UID.
	- Skips creation if user already exists.
	- Development password for ALL created accounts: `Password123!`
	- Users created:
	  - Students: stu-alice, stu-bob, stu-cara, stu-dan
	  - Recruiters: rec-techcorp, rec-datadash
	  - Admin: admin-super

	Login Guidance:
	- Email + password (above) if you implement email/password UI.
	- Google popup auth flow will create a different firebase user (Google-managed UID). To test seeded accounts specifically, wire an email/password login form or use Firebase Auth Emulator.

Security Note: Never use the dev password in production. Rotate and manage via Firebase Console or an admin provisioning pipeline.

### Auth Flow Changes
`AuthContext` now:
1. On `signInWithPopup` → ensures user document (default role = student) then stores Firestore snapshot under `session.firestore`.
2. On `onAuthStateChanged` → re‑ensures doc (refreshes lastLogin, timestamps) and merges locally stored role if previously changed.

### Next Steps (Recommended)
- Add Firestore Security Rules enforcing role-based access.
- Introduce custom claims for role instead of local override (Cloud Functions or Admin SDK backend endpoint).
- Replace local contexts (e.g., StudentDataContext) with real-time `onSnapshot` listeners progressively.
- Implement offline persistence (enable IndexedDB cache via Firestore settings) if needed.
- Add batch/transaction operations for multi-document state changes (e.g., application status + notification).

### Example Usage
```js
import { createJob } from './services/firestoreService';

async function postJob() {
	const job = await createJob({
		title: 'Backend Engineer',
		description: 'Own microservice development',
		companyId: currentUser.uid,
		companyName: 'TechCorp',
		location: 'Remote',
		type: 'Full-Time',
		status: 'active'
	});
	console.log('Created job', job);
}
```

---
Refactor completed: 2025-10-07.

### Profile Builder Validation & Persistence (2025-10-08)
The multi-step Student Profile Builder now performs client-side validation and submits to Firestore:
- Per-section validation with inline error lists (personal, education, skills, projects, etc.).
- Progress indicator flags steps containing errors.
- On successful submission a consolidated `studentProfile` sub-document is upserted at `users/<uid>/studentProfile/studentProfile` using existing `upsertStudentProfile` service helper.
- Mapping consolidates tag inputs (core/tools/languages) into a single `skills` array for the profile document.
- Projects are normalized (name → title, description, link) and empty entries are ignored.
- Certificates & resume remain local placeholders pending storage upload integration (future: cloud storage + URL persistence).

Pending follow-ups:
- File upload to storage & replace in-memory File objects with URLs.
- Enforce file type & size limits.
- Deduplicate skill tags and align with structured skills collection if introduced.
- Mark profile completion status for dashboard display.

---

## Backend API (Initial Node.js Scaffold 2025-10-07)

An Express-based lightweight API has been added under `server/` to back the evolving frontend. Currently it uses an in-memory data seed (no external DB) mirroring the React contexts so the integration path is clear.

### Tech Stack
- Node.js + Express (ES Module syntax)
- In-memory data store (`server/src/data/seed.js`)
- Basic services per domain (jobs, applicants, interviews, verifications, assessments, auth)
- Middleware: CORS, JSON body parsing, request logger, unified error + 404 handlers

### Directory Outline
```
server/
	package.json
	src/
		server.js          # Bootstraps HTTP server
		app.js             # Express app composition
		config/env.js      # dotenv + config wrapper
		data/seed.js       # Initial data objects (acts as temp DB)
		middleware/        # requestLogger, error handlers
		services/          # Business logic & mutations
		routes/            # REST routers mounted under /api/*
```

### Scripts
Root (frontend):
```
npm run dev          # Frontend only (Vite)
npm run dev:full     # Frontend + backend concurrently
```
Backend (inside `server/`):
```
npm run dev          # Nodemon watch mode
npm start            # Plain node
```

### Environment
Copy `.env.example` to `.env` inside `server/` to adjust `PORT` (default 4000).

### Unified Response Shape
Success: `{ "success": true, "data": <payload> }`
Error: `{ "success": false, "error": "Message" }`

### Endpoints Overview
Base URL: `http://localhost:4000/api`

| Domain | Method | Path | Description |
| ------ | ------ | ---- | ----------- |
| Health | GET | `/` (root) | API heartbeat ("HireLedger API OK") |
| Auth | POST | `/auth/login` | Mock login (email/password) returns token + user |
| Jobs | GET | `/jobs` | List jobs |
| Jobs | POST | `/jobs` | Create job { title, company, location } |
| Jobs | GET | `/jobs/:id` | Fetch single job |
| Jobs | PATCH | `/jobs/:id` | Update partial fields |
| Jobs | DELETE | `/jobs/:id` | Remove job |
| Applicants | GET | `/applicants` | List applicants |
| Applicants | POST | `/applicants` | Create applicant |
| Applicants | PATCH | `/applicants/:id` | Update applicant status/data |
| Applicants | DELETE | `/applicants/:id` | Delete applicant |
| Applicants | POST | `/applicants/bulk-message` | Attach bulk message to applicants |
| Interviews | GET | `/interviews` | List interviews |
| Interviews | POST | `/interviews` | Create interview (title,candidate,day[,date]) |
| Interviews | PATCH | `/interviews/:id` | Update interview slot |
| Interviews | DELETE | `/interviews/:id` | Remove interview |
| Verifications | GET | `/verifications` | List verification items |
| Verifications | POST | `/verifications` | Request verification { name } |
| Verifications | PATCH | `/verifications/:id` | Update status (default verified) |
| Assessments | GET | `/assessments/roles` | List assessment roles |
| Assessments | GET | `/assessments/roles/:role` | Get role stats |
| Assessments | POST | `/assessments/roles/:role/attempts` | Record attempt { scorePct, elapsedSec } |

### Sample cURL
```
curl http://localhost:4000/api/jobs
curl -X POST http://localhost:4000/api/jobs -H "Content-Type: application/json" -d '{"title":"Data Analyst","company":"DataCorp"}'
```

### Integration Plan (Frontend → API)
1. Replace context local mutations with `fetch` wrappers (introduce a lightweight API client module).
2. Migrate persistence from `localStorage` to server responses; keep local cache for offline fallback.
3. Introduce optimistic UI updates with rollback on failure.

### Future Hardening
- Replace in-memory seed with Postgres (Prisma) or Mongo + Mongoose schemas.
- Proper auth (JWT/OAuth) + password hashing + refresh tokens.
- Input validation (Zod or Joi) and request-level schema enforcement.
- Rate limiting & helmet security headers.
- Centralized logging (pino/winston) + request ID correlation.
- Unit tests (Vitest / Jest) & integration tests (Supertest) for routes & services.
- Dockerfile + docker-compose for API + DB.
- Pagination & filtering queries (e.g., /jobs?status=open&page=1&limit=20).
- WebSocket or SSE channel for real-time interview & verification updates.

### Known Limitations (Current Scaffold)
- All data resets on server restart.
- No authentication guard middleware yet (public endpoints).
- No concurrency control (race conditions possible under parallel calls).
- No validation; malformed payloads could cause inconsistent entries.

---
