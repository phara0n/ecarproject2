import React from 'react';
import { Route, Routes, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/sonner"; // Import Sonner Toaster

// Import layout and page components
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import VehiclesPage from '@/pages/VehiclesPage';
import ServicesPage from '@/pages/ServicesPage';
import ClientPage from '@/pages/client/ClientPage';
import FacturesPage from '@/pages/FacturesPage';
import SuiviKilometrique from '@/pages/SuiviKilometrique';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Loader component (simple version)
const FullPageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    Chargement de l'application...
  </div>
);

// Layout wrapper for protected routes
const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth(); // isLoading n'est plus nécessaire ici

  // Le chargement initial est géré globalement dans App
  // if (isLoading) { return <FullPageLoader />; }

  if (!isAuthenticated) {
    console.log("ProtectedLayout: Not authenticated, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedLayout: Authenticated, rendering layout.");
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

// Component to handle redirection if user is already logged in and tries to access /login
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth(); // isLoading n'est plus nécessaire ici

  // Le chargement initial est géré globalement dans App
  // if (isLoading) { return <FullPageLoader />; }

  if (isAuthenticated) {
    console.log("PublicRoute: Authenticated, redirecting from login to dashboard.");
    return <Navigate to="/" replace />;
  }

  return children;
};

// --- Main App Component ---
function AppRoutes() {
  // Ce composant ne rend les routes qu'une fois le chargement initial terminé
  return (
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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/customers" element={<ClientPage />} />
        <Route path="/factures" element={<FacturesPage />} />
        <Route path="/mileage" element={<SuiviKilometrique />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  const { isLoading } = useAuth(); // Obtenir l'état de chargement initial

  return (
    <ThemeProvider defaultTheme="system" storageKey="ecar-admin-theme">
      {isLoading ? <FullPageLoader /> : <AppRoutes />} {/* Afficher Loader ou Routes */}
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
