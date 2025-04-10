import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoginForm } from '@/components/login-form'; // Assuming this is the correct export

// Placeholder pages/components for dashboard routes
const DashboardHomePage = () => <h2 className="text-xl font-semibold">Welcome to the Dashboard!</h2>;
const ClientsPage = () => <h2>Clients</h2>;
const CarsPage = () => <h2>Cars</h2>;
// ... add other placeholder pages as needed

// Simple authentication check (replace with real logic later)
const isAuthenticated = () => {
  // TODO: Implement real authentication check (e.g., check for JWT in localStorage)
  return false; // Default to false for now
};

function App() {
  // Redirect logic based on authentication
  // If not authenticated and trying to access dashboard, redirect to login
  // If authenticated and trying to access login, redirect to dashboard

  // For now, we will just define the routes without complex auth logic
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />

      {/* Protected Dashboard Routes - wrap with layout */}
      {/* Later, we can add a check here to redirect to /login if not authenticated */}
      <Route
        path="/"
        element={
          <DashboardLayout>
            <DashboardHomePage />
          </DashboardLayout>
        }
      />
      <Route
        path="/clients"
        element={
          <DashboardLayout>
            <ClientsPage />
          </DashboardLayout>
        }
      />
       <Route
        path="/cars"
        element={
          <DashboardLayout>
            <CarsPage />
          </DashboardLayout>
        }
      />
      {/* Add other dashboard routes here, wrapping them in DashboardLayout */}

      {/* Optional: Redirect root to dashboard or login */}
      {/* <Route path="/" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} /> */}
      {/* For simplicity now, root path '/' will show the dashboard home */}

      {/* Optional: Catch-all route for 404 */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;
