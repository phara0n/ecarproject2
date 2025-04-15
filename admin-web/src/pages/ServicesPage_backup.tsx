import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CalendarIcon, PlusIcon, ListFilterIcon, RefreshCw, AlertCircle, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { AddServiceEventForm } from '@/components/services/AddServiceEventForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Define the Service interface based on the actual API response
interface Service {
  id: number;
  // Field names with both French and English possibilities
  vehicule_id?: number;
  vehicle_id?: number;
  type_service?: string;
  service_type?: string;
  statut?: string;
  status?: string;
  date_planifiee?: string;
  scheduled_date?: string;
  mecanicien?: string;
  mechanic?: string;
  // Additional fields that might be present
  prix?: number;
  price?: number;
  description?: string;
  date_creation?: string;
  created_at?: string;
  vehicule_immatriculation?: string;
  vehicle_license_plate?: string;
}

// Define the ServiceEvent interface (adjust fields based on your API)
interface ServiceEvent {
  id: number;
  vehicle_registration?: string;
  service_type_name?: string;
  title?: string;
  description?: string;
  date_scheduled?: string;
  status?: string;
  mileage?: number;
  notes?: string;
  // Add other relevant fields from your API
}

// Interface for Vehicle data
interface Vehicle {
  id: string;
  registration_number: string;
}

const ServicesPage = () => {
  const { authAxios, checkAuthStatus, isLoading: isAuthLoading, isAuthenticated, token } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const fetchServiceEvents = async () => {
    setIsDataLoading(true);
    setError(null);
    console.log("[ServicesPage] Fetching service events using authAxios...");

    try {
      // Use authAxios instead of fetch directly
      const response = await authAxios.get('/api/v1/service-events/');
      
      console.log("[ServicesPage] Raw API response:", response.data);

      // Adapt based on actual API response structure (e.g., responseData.data)
      const fetchedEvents = response.data.data || response.data || [];
      console.log("[ServicesPage] Parsed service events:", fetchedEvents);
      // Map API data to ServiceEvent interface if necessary
      setServiceEvents(fetchedEvents.map((event: any) => ({
        id: event.id,
        vehicle_registration: event.vehicle?.registration_number || event.vehicle_registration || 'N/A',
        service_type_name: event.service_type?.name || event.service_type_name || event.type_service || 'N/A',
        title: event.title || 'Titre non disponible',
        description: event.description || '',
        date_scheduled: event.date_scheduled || event.date || 'Date non planifiée',
        status: event.status || 'Statut inconnu',
        mileage: event.mileage,
        notes: event.notes || ''
      })));
    } catch (error) {
      console.error("[ServicesPage] Error fetching service events:", error);
      
      // Check for 404 specifically
      if (error.response && error.response.status === 404) {
        setError("L'endpoint API pour les services n'est pas encore disponible (404). Données fictives affichées.");
        // Use placeholder data if endpoint doesn't exist yet
        setServiceEvents([
          { id: 1, vehicle_registration: '123TU4567', service_type_name: 'Vidange', date_scheduled: '2024-07-15', mileage: 55000, notes: 'Filtre à huile changé' },
          { id: 2, vehicle_registration: '987TU6543', service_type_name: 'Freins', date_scheduled: '2024-07-10', mileage: 120000, notes: 'Plaquettes avant remplacées' },
        ]);
      } else {
        // Set a general error message for other error types
        setError(error.response?.data?.detail || "Une erreur inconnue est survenue lors de la récupération des services.");
        
        // Keep placeholder data if API fails for reasons other than 404 and list is empty
        if (serviceEvents.length === 0) {
          setServiceEvents([
            { id: 1, vehicle_registration: '123TU4567', service_type_name: 'Vidange', date_scheduled: '2024-07-15', mileage: 55000, notes: 'Filtre à huile changé' },
            { id: 2, vehicle_registration: '987TU6543', service_type_name: 'Freins', date_scheduled: '2024-07-10', mileage: 120000, notes: 'Plaquettes avant remplacées' },
          ]);
        }
      }
    } finally {
      setIsDataLoading(false);
    }
  };

  // Function to fetch vehicles for the form using authAxios
  const fetchVehicles = async () => {
    // Check if authAxios is available before fetching
    if (!authAxios) {
      console.warn("fetchVehicles: authAxios not available yet.");
      return;
    }
    console.log("[ServicesPage] Fetching vehicles using authAxios...");
    try {
      // Use authAxios GET request
      const response = await authAxios.get('/api/v1/vehicles/');

      const responseData = response.data; // Data is directly available with axios
      const vehiclesData = responseData.data || responseData;
      
      if (Array.isArray(vehiclesData)) {
        const formattedVehicles = vehiclesData.map((vehicle: any) => ({ // Add type annotation
          id: vehicle.id,
          registration_number: vehicle.registration_number || vehicle.plaque_immatriculation || `Véhicule #${vehicle.id}`
        }));
        setVehicles(formattedVehicles);
        console.log("[ServicesPage] Vehicles fetched successfully.");
      } else {
        console.warn("[ServicesPage] Unexpected vehicle data format:", vehiclesData);
        setVehicles([]); // Set empty array if format is wrong
      }
    } catch (err) {
      // Axios errors often have response data
      console.error('Failed to fetch vehicles for form:', err.response?.data || err.message || err);
      setVehicles([]); // Set empty array on error
    }
  };

  // Fetch initial data ONLY when authentication is complete AND token is available
  useEffect(() => {
    console.log(`[ServicesPage Effect] Auth Loading: ${isAuthLoading}, Authenticated: ${isAuthenticated}, Token Present: ${!!token}`);
    // Only proceed if auth is not loading, user is authenticated, AND token exists
    if (!isAuthLoading && isAuthenticated && token && authAxios) {
      console.log("[ServicesPage Effect] Auth complete and token available. Fetching initial data...");
      setIsDataLoading(true); // Ensure loading state is set before fetches
      fetchVehicles();
      fetchServiceEvents();
    } else {
      console.log("[ServicesPage Effect] Conditions not met for initial fetch.");
      // If auth loading finished but user is not authenticated or no token
      if (!isAuthLoading && (!isAuthenticated || !token)) {
         setError("Utilisateur non authentifié ou token manquant.");
         setIsDataLoading(false); // Stop data loading indicator
      }
      // If still loading auth, do nothing, wait for next run
    }
    // Depend on auth state AND the token value itself
  }, [isAuthLoading, isAuthenticated, token, authAxios]);

  // Fetch vehicles when add modal is opened (depends on token implicitly via authAxios)
  useEffect(() => {
    // Ensure token is present before fetching
    if (isAddModalOpen && authAxios && token) {
      console.log("[ServicesPage Add Modal Effect] Fetching vehicles...");
      fetchVehicles();
    } else {
      console.log(`[ServicesPage Add Modal Effect] Conditions not met. Open: ${isAddModalOpen}, AuthAxios: ${!!authAxios}, Token: ${!!token}`);
    }
  }, [isAddModalOpen, authAxios, token]); // Add token dependency

  const handleServiceAdded = () => {
    console.log("[ServicesPage] Service added, refreshing data...");
    // Refresh only if authenticated and token exists
    if (isAuthenticated && authAxios && token) {
       fetchServiceEvents();
       fetchVehicles();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Services</h1>
        <div className="flex space-x-2">
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
            <ListFilterIcon className="w-4 h-4 mr-2" />
            Liste
          </Button>
          <Button variant={viewMode === 'calendar' ? 'default' : 'outline'} onClick={() => setViewMode('calendar')}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendrier
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter une Intervention
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Services Planifiés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceEvents.filter(e => e.status === 'scheduled').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Services En Cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceEvents.filter(e => e.status === 'in_progress').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Services Terminés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceEvents.filter(e => e.status === 'completed').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Service list view */}
        {viewMode === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Gérez les services de véhicules planifiés et en cours</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Plaque</TableHead>
                    <TableHead>Type/Titre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date Planifiée</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isDataLoading ? (
                    // Loading skeleton rows
                    Array(5).fill(0).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : serviceEvents.length > 0 ? (
                    // Display serviceEvents
                    serviceEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.id}</TableCell>
                        <TableCell>{event.vehicle_registration}</TableCell>
                        <TableCell>{event.title || event.service_type_name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs capitalize bg-gray-100 text-gray-800">
                            {event.status?.replace('_', ' ') || 'Inconnu'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {event.date_scheduled ? format(new Date(event.date_scheduled), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Détails</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // No serviceEvents
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Aucun événement de service trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Calendar view (placeholder) */}
        {viewMode === 'calendar' && (
          <Card>
            <CardHeader>
              <CardTitle>Calendrier des Services</CardTitle>
              <CardDescription>Visualisez les services par date</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <p className="text-muted-foreground">Le calendrier des services sera implémenté prochainement.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Render the Add Service Event Form Modal */}
      <AddServiceEventForm
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        vehicles={vehicles}
        onAdd={handleServiceAdded}
      />
    </div>
  );
};

export default ServicesPage; 