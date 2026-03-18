# Task Senpai (Frontend)

Task Senpai is a React + Vite productivity app with multiple views (Landing, Dashboard, Board, Timeline, Calendar, Goals) plus a guided “View Demo” tutorial, i18n, Google login, and a small assistant/music companion.

This repository contains the frontend only. It talks to a backend API for tasks/goals and Google auth exchange.

## Quick Start

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run unit tests:

```bash
npm run test:run
```

## Environment Variables

Create a `.env` file (or set environment variables in your hosting provider):

- `VITE_API_BASE_URL`
  - Base URL for the backend API.
  - Default: `https://localhost:7076/api`
  - Used by [apiClient.js](file:///c:/My%20Development/TaskManagerFrontend/src/utils/apiClient.js)
- `VITE_GOOGLE_CLIENT_ID`
  - Google OAuth client ID for login.
  - Used in [App.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/App.jsx)

## App Structure

- Entry points
  - App root: [App.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/App.jsx)
  - i18n init: [i18n.js](file:///c:/My%20Development/TaskManagerFrontend/src/i18n.js)
- Views / major components
  - Landing: [LandingView.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/LandingView.jsx)
  - Dashboard: [DashboardView.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/DashboardView.jsx)
  - Board: [BoardView.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/BoardView.jsx)
  - Timeline: [TimelineView.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/TimelineView.jsx)
  - Calendar: [CalendarView.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/CalendarView.jsx)
  - Goals: [GoalsView.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/GoalsView.jsx)
- Guided demo/tutorial
  - Overlay: [TutorialOverlay.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/TutorialOverlay.jsx)
  - Styles: [TutorialOverlay.css](file:///c:/My%20Development/TaskManagerFrontend/src/components/TutorialOverlay.css)
- Companion widgets
  - Assistant: [ChatAssistant.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/ChatAssistant.jsx)
  - Music: [BackgroundMusic.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/BackgroundMusic.jsx)
- API layer
  - HTTP wrapper: [apiClient.js](file:///c:/My%20Development/TaskManagerFrontend/src/utils/apiClient.js)

## Navigation & View System

The app does not use a URL router. Instead it uses a persisted `activeView` state in [App.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/App.jsx):

- `activeView` selects which major view component renders (Landing/Dashboard/Board/Timeline/Calendar/Goals).
- The app optionally remembers the last view via `taskSenpai.settings` (`rememberLastView`, `startView`).
- The last view is stored in `taskSenpai.activeView`.

This makes the UI feel like a single “desktop app” experience while keeping state simple.

## Data Flow (Tasks)

High-level pattern (in [App.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/App.jsx)):

- Tasks are stored in `todos` state at the app root.
- Views receive `todos` and callbacks:
  - `onAddTodo`, `onUpdateTodo`, `onToggleComplete`, `onDelete`
- Board and other views are mostly “controlled” by App state and pass UI events back up.

This keeps a single source of truth for tasks while allowing each view to stay focused on UI.

## API Integration

All API calls go through [apiClient.js](file:///c:/My%20Development/TaskManagerFrontend/src/utils/apiClient.js):

- Default base URL: `https://localhost:7076/api`
- Requests automatically attach `X-User-Id` if a user is saved in `localStorage` as `taskSenpai.user`
- Convenience helpers:
  - `apiGet(path)`
  - `apiPost(path, body)`
  - `apiPut(path, body)`
  - `apiDelete(path)`

Typical usage pattern inside components:

- Fetch: `apiGet("/TodoItems")`, `apiGet("/Goals")`
- Mutate: `apiPost(...)`, `apiPut(...)`, `apiDelete(...)`
- Use `toast.success/toast.error` for user feedback (e.g. Goals CRUD in [GoalsView.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/GoalsView.jsx))

## Authentication (Google OAuth)

Login flow is implemented in [App.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/App.jsx):

- Frontend uses `@react-oauth/google` to get a Google ID token.
- The ID token is sent to the backend via `apiPost("/Auth/google", googleIdToken)` to exchange/validate and return a backend user id.
- The user payload is stored in localStorage as `taskSenpai.user`, and the app uses that id to send `X-User-Id` on requests.

## Internationalization (i18n)

The app uses `react-i18next`:

- Initialization: [i18n.js](file:///c:/My%20Development/TaskManagerFrontend/src/i18n.js)
- Locale files: [src/locales](file:///c:/My%20Development/TaskManagerFrontend/src/locales)
- Components use `const { t, i18n } = useTranslation()` and reference keys like `t("tutorial.title")`.
- Selected language is stored in `taskSenpai.language`.

## Guided “View Demo” Tutorial

The tutorial is a modal overlay implemented in [TutorialOverlay.jsx](file:///c:/My%20Development/TaskManagerFrontend/src/components/TutorialOverlay.jsx):

- Left column: step navigation
- Right area: a mock preview (icon-based illustration) and explanatory text
- Content is fully localized via `tutorial.*` keys in the locale JSON files
- Layout is designed to avoid text overflow and keep typography consistent (see [TutorialOverlay.css](file:///c:/My%20Development/TaskManagerFrontend/src/components/TutorialOverlay.css))

## Testing

This project uses Vitest + React Testing Library:

- Test config: [vite.config.js](file:///c:/My%20Development/TaskManagerFrontend/vite.config.js)
- Test setup mocks: [setup.js](file:///c:/My%20Development/TaskManagerFrontend/src/test/setup.js)
- Run:
  - `npm run test:run` (CI-friendly)
  - `npm run test` (watch mode)

## Tech Stack Details

See [README_TECH_STACK.md](file:///c:/My%20Development/TaskManagerFrontend/README_TECH_STACK.md).
