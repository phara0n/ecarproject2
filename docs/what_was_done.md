# Completed Tasks Log

**$(date +%Y-%m-%d):**

*   **Project Initialization:**
    *   Reviewed project requirements document (`project.mdc`).
    *   Created project directory: `ecar-project/`.
    *   Created documentation directory: `ecar-project/docs/`.
    *   Created initial documentation files:
        *   `docs/what_was_done.md`
        *   `docs/for_mehd.md`
        *   `docs/checkpoint.md`

*   **Backend Setup (Django):**
    *   Created `backend` directory.
    *   Installed `python3.12-venv` package.
    *   Set up Python virtual environment (`.venv`).
    *   Installed Django framework (`pip install django`).
    *   Initialized Django project (`core`) using `django-admin startproject`.
    *   Generated `requirements.txt` file.
    *   Configured `settings.py` (Language, Timezone, Allowed Hosts for dev).
    *   Installed PostgreSQL and created database (`ecardb`) and user (`ecaruser`).
    *   Installed `psycopg2-binary` and updated `requirements.txt`.
    *   Configured `settings.py` for PostgreSQL connection.
    *   Created `garage` Django app.
    *   Defined `Vehicle` and `MileageRecord` models in `garage/models.py`.
    *   Created and applied initial database migrations.
    *   Installed Django REST Framework and `psycopg2-binary`, updated `requirements.txt`.
    *   Added `rest_framework` and `garage` to `INSTALLED_APPS`.
    *   Created `VehicleSerializer` and `MileageRecordSerializer` in `garage/serializers.py`.
    *   Created `VehicleViewSet` and `MileageRecordViewSet` in `garage/views.py`.
    *   Configured API URLs in `garage/urls.py` and `core/urls.py` (with `/api/v1/` versioning).
    *   Created Django superuser.
    *   Registered `Vehicle` and `MileageRecord` models with the Django admin (`garage/admin.py`).
    *   Successfully ran development server and tested admin/API access.

*   **Vehicle Ownership & RBAC:**
    *   Added `owner` ForeignKey to `Vehicle` model linking to `User`.
    *   Created Data Migration to establish `Customers`, `Mechanics`, `Admins` Django Groups.
    *   Updated `RegisterSerializer` to add new users to `Customers` group.
    *   Defined basic Role Permission classes (`IsAdminUser`, `IsMechanicUser`, `IsCustomerUser`).
    *   Refined ViewSet permissions (`get_permissions`, `get_queryset`, `perform_create`) for Vehicles, Mileage Records, Service Events, and Predictions based on ownership and roles.

*   **Customer Profile & Validation:**
    *   Added `CustomerProfile` model (OneToOne with User) for `phone_number`.
    *   Added `RegexValidator` for Tunisian phone numbers.
    *   Updated `RegisterSerializer` to handle `phone_number` and create `CustomerProfile`.
    *   Updated `UserAdmin` to display profile inline.
    *   Added `RegexValidator` for Tunisian license plates to `Vehicle.registration_number`.

*   **Invoice Management (Basic):**
    *   Added `Invoice` model with `FileField` and `DecimalField` for amount.
    *   Configured `MEDIA_ROOT` and `MEDIA_URL` for development file uploads.
    *   Created `InvoiceSerializer`, `InvoiceViewSet` (Admin-only upload), and registered URL/Admin.

*   **Prediction Logic Enhancements:**
    *   Added `initial_mileage` field to `Vehicle` model.
    *   Updated `VehicleViewSet` to automatically create the first `MileageRecord` on vehicle creation.
    *   Refined `update_predictions_for_vehicle` logic to handle missing initial `MileageRecord` and use `initial_mileage` as baseline.
    *   Implemented Average Daily KM calculation (`calculate_avg_daily_km`).
    *   Updated prediction logic to estimate due date based on Average Daily KM and choose the earlier of rule-based date or estimated date.
    *   Updated `ServiceEvent` signal handler to auto-create first `MileageRecord` if none exists.

*   **Bug Fixes:**
    *   Corrected syntax error in `tunisian_plate_validator` regex.
    *   Fixed `NameError` for `tunisian_phone_validator` in `RegisterSerializer`.
    *   Removed incorrect imports (`ProtectedField`) from `views.py`.

*   **Password Reset:** Implemented using Django's built-in auth views and templates; configured console email backend for development.
*   **Testing Framework:** Set up basic structure using `APITestCase`; added initial tests for User Registration and Vehicle API endpoints, including permission checks.
*   **Error Localization:** Created custom DRF exception handler (`core/exceptions.py`) with a basic dictionary for French translations; configured DRF to use it.
*   **RBAC Simplification:** Removed 'Mechanics' group and related logic; simplified permissions to Customer/Admin where applicable.
*   **Validation Fix:** Corrected Tunisian License Plate regex validator to accept both 'TU' and 'RS' formats.
*   **Bug Fixes:** Resolved test failures related to database creation permissions, serializer User model references, and `write_only` field handling.

*   **Admin Dashboard Setup (Vite + React + TS + Shadcn):**
    *   Initialized project in `admin-dashboard/` using Vite (React + TypeScript template).
    *   Installed and configured Tailwind CSS v4.
    *   Installed and configured Shadcn UI (including path aliases).
    *   Added basic dashboard layout components (`AppSidebar`, `SiteHeader`, etc.) and `LoginForm` component (likely from v0.dev).
    *   Installed `react-router-dom`.
    *   Configured basic routing in `main.tsx` and `App.tsx` for `/login` and `/` (dashboard layout with placeholder content).
    *   Updated Node.js to latest LTS (v22+) using `nvm` to meet `react-router-dom` requirements and reinstalled dependencies. 