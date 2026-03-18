# Task Senpai — Tech Stack

This document describes the technologies used in the Task Senpai system, based on what exists in this repository (frontend).

## Frontend

- Framework: React (see `react`, `react-dom` in [package.json](file:///c:/My%20Development/TaskManagerFrontend/package.json))
- Build tool / dev server: Vite (see [vite.config.js](file:///c:/My%20Development/TaskManagerFrontend/vite.config.js))
- Language: JavaScript (ESM) with React components
- Styling: plain CSS files imported per component (e.g. [App.css](file:///c:/My%20Development/TaskManagerFrontend/src/App.css), [TutorialOverlay.css](file:///c:/My%20Development/TaskManagerFrontend/src/components/TutorialOverlay.css))

## UI & UX Libraries

- Icons: Heroicons (`@heroicons/react`)
- Drag & drop: `@dnd-kit/*` (used by the Kanban board)
- Toast notifications: `react-hot-toast`
- Country flags (language picker): `react-country-flag`

## Internationalization (i18n)

- `i18next` + `react-i18next`
- Locale resources are JSON files under [src/locales](file:///c:/My%20Development/TaskManagerFrontend/src/locales)
- Initialization happens in [i18n.js](file:///c:/My%20Development/TaskManagerFrontend/src/i18n.js)

## Authentication

- Google OAuth (frontend): `@react-oauth/google`
- Token decoding (frontend): `jwt-decode`
- Backend exchange endpoint: the frontend calls `POST /Auth/google` via [apiClient.js](file:///c:/My%20Development/TaskManagerFrontend/src/utils/apiClient.js) from [App.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/App.jsx)

## Backend

The backend for this system lives in a separate repository (your backend repo).

- Language: C#
- Framework/runtime: .NET (ASP.NET Core Web API)
- The frontend communicates with it via HTTPS using `VITE_API_BASE_URL` (default `https://localhost:7076/api`) and calls endpoints like `/TodoItems`, `/Goals`, and `/Auth/google`.

## Backend API (Integration Contract)

This repository does not contain backend code, but the frontend expects a backend API:

- Base URL:
  - `VITE_API_BASE_URL` (default: `https://localhost:7076/api`)
  - Defined in [apiClient.js](file:///c:/My%20Development/TaskManagerFrontend/src/utils/apiClient.js)
- User identification:
  - Requests include `X-User-Id` header when a user is present in `localStorage` (`taskSenpai.user`)
- Example endpoint families referenced throughout the UI/tests:
  - `/TodoItems` (tasks)
  - `/Goals` (goals)
  - `/Auth/google` (Google login exchange)

## Database

Database technology is not defined in this frontend repository.

- If you have a separate backend repository, document the database there (e.g., SQL Server/PostgreSQL/MySQL/SQLite), including:
  - Schema/migrations approach
  - Seed/demo data strategy
  - Connection string configuration

## Testing

- Unit/UI tests: Vitest + React Testing Library
- DOM environment: JSDOM (configured in [vite.config.js](file:///c:/My%20Development/TaskManagerFrontend/vite.config.js))
- Global mocks/setup: [setup.js](file:///c:/My%20Development/TaskManagerFrontend/src/test/setup.js)
- Coverage: `@vitest/coverage-v8` (`npm run test:coverage`)

## Linting

- ESLint (see scripts in [package.json](file:///c:/My%20Development/TaskManagerFrontend/package.json))

## Deployment Notes (Frontend)

This frontend builds to static assets (`dist/`) via `npm run build`.

Typical production hosting options:

- Static hosting (Netlify/Vercel/Cloudflare Pages/S3+CDN)
- A container serving static assets (Nginx, Caddy)

You will still need a reachable backend API endpoint and a production Google OAuth client configuration.
