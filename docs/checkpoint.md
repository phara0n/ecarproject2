# Checkpoint

**Current Status:** Backend Core Implemented; **Admin Dashboard Frontend Initialized (Vite, Shadcn, Basic Routing)**

**Date:** $(date +%Y-%m-%d)

## Overview

*   Backend API: Stable base for Users, Vehicles, Mileage, Services, Predictions, Invoices.
*   **Admin Dashboard:**
    *   Project created using Vite (React + TS).
    *   Tailwind CSS v4 and Shadcn UI installed and configured.
    *   Basic layout components (`AppSidebar`, `SiteHeader`, etc.) and `LoginForm` added.
    *   `react-router-dom` installed and basic routes (`/login`, `/`) configured.
*   Backend Dependencies: JWT Auth, Password Reset, Validation (TN Phone/Plate), Basic Docs/Tests/Localization functional.

## Completed Tasks (Recent Frontend Focus)

*   **Admin Dashboard Setup:** Vite init, Tailwind config, Shadcn init, Component addition (Layout, Login Form), React Router install/setup, Node.js update via nvm.
*   **(Previous Backend):** Core Models/API, Auth, Validation, RBAC (Cust/Admin), Predictions (Phase 1), Invoice Upload, Basic Docs/Tests/Localization, Password Reset, Bug Fixes.

## Current Goals

*   **Admin Dashboard:**
    *   Connect sidebar navigation links.
    *   Integrate layout components into dashboard routes.
    *   Implement basic login form state/mock logic.
    *   Implement theme toggle (Dark/Light).
*   **Backend (`Rule Alignment`):**
    *   API Response Format (`backend.mdc`).
    *   Ethical AI (`project_rules.mdc`: privacy, explainability, etc.).
    *   Enhance API (Filtering, Pagination, Errors), Testing, Docs, Localization.

## Blockers/Risks

*   Complexity of Backend Rule Alignment tasks (API format, Ethical AI).
*   Frontend-Backend API integration (Authentication, Data Fetching).

## Next Steps

1.  **Admin Dashboard:** Connect sidebar navigation using `Link` component.
2.  **Admin Dashboard:** Integrate actual components (cards, charts, tables) into dashboard routes (e.g., replacing placeholder on `/`).
3.  **Admin Dashboard:** Implement mock login logic in `LoginForm`.
4.  **Backend (Parallel):** Continue work on API Response Format or Ethical AI privacy features.

**Previous Backend Next Steps (Now Parallel/Background):**
*   API Response Format (`backend.mdc`).
*   Ethical AI - Privacy (`project_rules.mdc`).
*   Enhance API Docs (`backend.mdc`).
*   Enhance Testing.
*   Refine Localization.

# Project Checkpoint

## Frontend (admin-web)

- **Status:** Core Structure & Mock Auth Complete
- Initialized React + TS project (Vite).
- Configured Tailwind CSS v4 & Shadcn UI.
- Base routing (`react-router-dom`) implemented (`/login`, `/`, `/*`).
- Core layout components created (`AppLayout`, `Sidebar`, `Header`) using Shadcn & `lucide-react` icons.
- Theme toggle (light/dark/system) implemented using `next-themes`.
- Basic `DashboardPage` structure with Shadcn `Card` components.
- Basic `LoginPage` form structure with Shadcn `Input`, `Label`, `Button`.
- **Authentication:**
    - Created `AuthContext` and `AuthProvider` using React Context API.
    - Implemented state management for `user`, `token`, `isAuthenticated`, `isLoading`.
    - Implemented mock `login`, `logout`, `checkAuthStatus` functions (using `localStorage` for token persistence).
    - Integrated context into `LoginPage` (calls `login`, handles state/errors, navigates).
    - Integrated context into `ProtectedLayout` (checks `isLoading`, `isAuthenticated` for route protection).
    - Integrated context into `PublicRoute` wrapper for `/login`.
    - Integrated context into `Header` (displays user info, calls `logout`, conditional rendering).

## Next Steps (Frontend)

1.  **Backend Integration:**
    - Replace mock API calls in `AuthProvider.tsx` with actual `fetch`/`axios` calls to Django endpoints (e.g., `/api/auth/login`, `/api/auth/token/verify/`, `/api/user/me/`).
    - Ensure error handling for API requests is robust.
    - Align `User` interface in `AuthContext.tsx` with actual Django API response.
2.  **Build Page Content:**
    - Start adding features to `DashboardPage.tsx` (e.g., simple charts, recent activity table placeholder).
    - Create components for other sections (Vehicles, Services, Customers, Settings) based on `frontend.mdc`.
    - Use appropriate Shadcn components (Table, Calendar, Forms, etc.).
3.  **Refinement:**
    - Replace basic loading messages with Shadcn `Spinner` or `Skeleton` components.
    - Implement role-based access control visibility (e.g., hide/show sidebar items or page elements based on `user.roles`).
    - Add form validation (e.g., using `react-hook-form` and `zod`).

### API Documentation

*   **Status:** Partially Implemented.
*   **Tooling:** `drf-yasg` is configured to generate OpenAPI/Swagger documentation.
*   **Access:** Documentation is available at `/swagger/` and `/redoc/` endpoints.
*   **Compliance Gaps (`backend.mdc`):**
    *   Needs more exhaustive endpoint descriptions.
    *   Requires specific code examples (cURL, Python, JS).
    *   Needs explicit documentation of the standard `data/error/metadata` response structure, especially for errors.
    *   Must show examples of French-only error messages.
    *   Missing documentation for Rate Limits (if applicable).
    *   Missing a dedicated Changelog.
*   **Next Steps:** Review live documentation, enhance docstrings in `views.py` and `serializers.py` to fill gaps.
*   **Update (2024-07-29):** Enhanced documentation for authentication endpoints (`/register`, `/token`, `/token/refresh`) using `@swagger_auto_schema` in `garage/views.py` and `core/urls.py`. This includes detailed descriptions and examples.
*   **Update (2024-07-29):** Generated a static `swagger.json` file (OpenAPI spec) from the running backend server and saved it to `docs/swagger.json`.
*   **Update (2024-07-29):** Added endpoint `GET /api/v1/users/me/` (View: `CurrentUserView`, URL: `garage/urls.py`) to fetch logged-in user details. Requires authentication. Documented via `@swagger_auto_schema`.