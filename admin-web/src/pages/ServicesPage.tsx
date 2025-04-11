import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CalendarIcon, PlusIcon, ListFilterIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthProvider';

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

const ServicesPage = () => {
  const { token } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch services from the API
  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/services/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des services: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('API response:', responseData);

      // Extract services from nested data field if needed
      const servicesData = responseData.data || responseData;
      
      if (!Array.isArray(servicesData)) {
        throw new Error('Format de réponse API inattendu pour les services');
      }

      // Log the entire first service to see exact structure
      if (servicesData.length > 0) {
        console.log('First service structure (complete):', JSON.stringify(servicesData[0], null, 2));
      }

      setServices(servicesData);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, [token]);

  // Helper to get the best available field with fallbacks
  const getServiceField = (service: Service, fields: string[], defaultValue: string = '-') => {
    for (const field of fields) {
      const value = service[field as keyof Service];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
    return defaultValue;
  };

  // Calculate stats safely (handling empty array)
  const calculateStats = () => {
    if (services.length === 0) {
      return { 
        plannedCount: 0, 
        inProgressCount: 0, 
        completedCount: 0 
      };
    }

    // Count services by status
    const plannedCount = services.filter(s => {
      const status = String(getServiceField(s, ['statut', 'status'])).toLowerCase();
      return status === 'planifié' || status === 'planned';
    }).length;

    const inProgressCount = services.filter(s => {
      const status = String(getServiceField(s, ['statut', 'status'])).toLowerCase();
      return status === 'en cours' || status === 'in progress';
    }).length;

    const completedCount = services.filter(s => {
      const status = String(getServiceField(s, ['statut', 'status'])).toLowerCase();
      return status === 'terminé' || status === 'completed';
    }).length;

    return { plannedCount, inProgressCount, completedCount };
  };

  const { plannedCount, inProgressCount, completedCount } = calculateStats();

  // Helper to get status class
  const getStatusClass = (status: string | number) => {
    const statusLower = String(status).toLowerCase();
    
    if (statusLower === 'planifié' || statusLower === 'planned') {
      return 'bg-blue-100 text-blue-800';
    } else if (statusLower === 'en cours' || statusLower === 'in progress') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusLower === 'terminé' || statusLower === 'completed') {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-gray-100 text-gray-800';
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
          <Button variant="outline" onClick={fetchServices} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouveau Service
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
              <CardDescription>Ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{plannedCount}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Services En Cours</CardTitle>
              <CardDescription>Actuellement</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{inProgressCount}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Services Terminés</CardTitle>
              <CardDescription>Ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{completedCount}</div>
              )}
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
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date Planifiée</TableHead>
                    <TableHead>Mécanicien</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton rows
                    Array(5).fill(0).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : services.length > 0 ? (
                    // Display services
                    services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.id}</TableCell>
                        <TableCell>
                          {getServiceField(service, ['vehicule_immatriculation', 'vehicle_license_plate'])}
                        </TableCell>
                        <TableCell>
                          {getServiceField(service, ['type_service', 'service_type'])}
                        </TableCell>
                        <TableCell>
                          <div className={`px-2 py-1 rounded-full text-xs inline-block ${
                            getStatusClass(getServiceField(service, ['statut', 'status']))
                          }`}>
                            {getServiceField(service, ['statut', 'status'])}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getServiceField(service, ['date_planifiee', 'scheduled_date'])}
                        </TableCell>
                        <TableCell>
                          {getServiceField(service, ['mecanicien', 'mechanic'])}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Détails</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // No services
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        Aucun service trouvé
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
    </div>
  );
};

export default ServicesPage; 