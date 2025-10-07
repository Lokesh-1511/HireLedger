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

## Mock Authentication
Implemented lightweight auth layer for prototyping:
1. `AuthContext` stores `{ email, role, ts }` in `localStorage`.
2. `AuthPage` provides split-screen marketing + form UI (email, password, role select).
3. `ProtectedRoute` guards routes; optional `roles` prop restricts access.
4. Role dashboards accessed via `/dashboard/:role` (student → general dashboard, recruiter → jobs, admin → candidates + placeholder admin panel).
5. Profile dropdown (top-right) exposes Logout (clears session) and placeholder Profile link.

Replace with real identity provider (OAuth/OIDC, SSO, etc.) later; centralize tokens & refresh logic in context or a dedicated auth service module.

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
Refactor completed: 2025-10-07.
