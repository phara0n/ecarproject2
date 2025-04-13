import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthProvider'; // Import useAuth
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/sonner"; // Import Sonner Toaster

// Import layout and page components
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import VehiclesPage from '@/pages/VehiclesPage';
import ServicesPage from '@/pages/ServicesPage';
import CustomersPage from '@/pages/CustomersPage';
import FacturesPage from '@/pages/FacturesPage';
import SuiviKilometrique from '@/pages/SuiviKilometrique';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Layout wrapper for protected routes
const ProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show loading indicator while checking auth status
    // You can replace this with a proper spinner component later
    return <div>Vérification de l'authentification...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    console.log("ProtectedLayout: Not authenticated, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the layout and the nested route
  console.log("ProtectedLayout: Authenticated, rendering layout.");
  return (
    <AppLayout>
      <Outlet /> {/* Renders the nested child route (e.g., DashboardPage) */}
    </AppLayout>
  );
};

// Component to handle redirection if user is already logged in and tries to access /login
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Vérification de l'authentification...</div>;
  }

  if (isAuthenticated) {
    console.log("PublicRoute: Authenticated, redirecting from login to dashboard.");
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ecar-admin-theme">
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route element={<ProtectedLayout />}>
            {/* Routes requiring the AppLayout go here */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/factures" element={<FacturesPage />} />
            <Route path="/mileage" element={<SuiviKilometrique />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} /> {/* Catch-all route */}
        </Routes>
      </Router>
      <Toaster /> {/* Add the Toaster component here */}
    </ThemeProvider>
  );
}

export default App;
