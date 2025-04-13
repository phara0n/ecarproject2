import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { AddServiceEventForm } from '@/components/services/AddServiceEventForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, ListFilterIcon, CalendarIcon, AlertCircle, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Define the ServiceEvent interface
interface ServiceEvent {
  id: number;
  vehicle_info?: {
    registration_number: string;
    make?: string;
    model?: string;
  };
  service_type_info?: {
    name: string;
    description?: string;
  };
  event_date: string; // Changed from date_scheduled to match serializer
  status: string; 
  title?: string; // Keep title for manual overrides or specific names
  mileage_at_service?: number;
  notes?: string;
}

// Interface for Vehicle data
interface Vehicle {
  id: number; // Assuming ID is number
  registration_number: string;
  make?: string;
  model?: string;
}

// Helper function to convert status values to proper display labels
const getStatusLabel = (status: string | null | undefined): string => {
  if (!status) return 'Inconnu';
  
  // Normalize status to lowercase without spaces, underscores, or dashes for comparison
  const normalizedStatus = status.toLowerCase().replace(/[\s_-]/g, '');
  
  // Map of normalized status values to their display labels
  const statusMap: Record<string, string> = {
    'scheduled': 'Planifié',
    'planifie': 'Planifié',
    'inprogress': 'En cours',
    'encours': 'En cours',
    'completed': 'Terminé',
    'termine': 'Terminé',
    'cancelled': 'Annulé',
    'annule': 'Annulé',
  };
  
  // Return the mapped label or capitalize the original status if no mapping exists
  return statusMap[normalizedStatus] || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};

const ServicesPage: React.FC = () => {
  const { authAxios, isLoading: isAuthLoading, isAuthenticated, token } = useAuth();
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedEvent, setSelectedEvent] = useState<ServiceEvent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // --- Data Fetching Functions ---

  const fetchServiceEvents = async () => {
    if (!authAxios) return; 
    console.log("[ServicesPage] Fetching service events...");
    setIsDataLoading(true);
    setError(null);
    try {
      const response = await authAxios.get('/api/v1/service-events/');
      // Adjust based on actual API response structure
      const data = response.data?.results || response.data?.data || response.data || [];
      console.log("[ServicesPage] Service events data received:", data);
      
      // Log status values to debug
      if (Array.isArray(data) && data.length > 0) {
        console.log("[ServicesPage] Status values in API response:", data.map(event => {
          return {
            id: event.id,
            status: event.status,
            raw: event
          };
        }));
      }
      
      // Map data more accurately based on the serializer structure
      setServiceEvents(data.map((event: any) => ({
        id: event.id,
        vehicle_info: event.vehicle_info || { registration_number: 'N/A' },
        service_type_info: event.service_type_info || { name: 'Type Inconnu' },
        event_date: event.event_date, // Use event_date
        status: event.status || 'inconnu', // Assuming status exists directly
        title: event.title, // Use title if available
        mileage_at_service: event.mileage_at_service,
        notes: event.notes
      })));
    } catch (err) {
      console.error("[ServicesPage] Error fetching service events:", err);
      setError("Impossible de charger les événements de service: " + (err.response?.data?.detail || err.message));
      setServiceEvents([]);
    } finally {
      setIsDataLoading(false);
    }
  };

  const fetchVehicles = async () => {
    if (!authAxios) return;
    console.log("[ServicesPage] Fetching vehicles...");
    try {
      const response = await authAxios.get('/api/v1/vehicles/');
      const data = response.data?.results || response.data?.data || response.data || [];
      console.log("[ServicesPage] Vehicles data received:", data);
      // Map vehicle data more accurately
      setVehicles(data.map((vehicle: any) => ({
        id: vehicle.id,
        registration_number: vehicle.registration_number || 'N/A',
        make: vehicle.make,
        model: vehicle.model
      })));
    } catch (err) {
      console.error("[ServicesPage] Error fetching vehicles:", err);
      setVehicles([]);
    }
  };

  // --- Effects ---

  // Main effect for fetching data after authentication is confirmed
  useEffect(() => {
    console.log(`[ServicesPage Main Effect] Auth Loading: ${isAuthLoading}, Authenticated: ${isAuthenticated}, Token: ${!!token}, AuthAxios: ${!!authAxios}`);
    if (!isAuthLoading && isAuthenticated && token && authAxios) {
      console.log("[ServicesPage Main Effect] Conditions met. Fetching initial data...");
      fetchServiceEvents();
      fetchVehicles(); // Fetch vehicles needed for the Add form
    } else if (!isAuthLoading && (!isAuthenticated || !token)) {
      console.log("[ServicesPage Main Effect] Not authenticated or token missing after load.");
      setError("Authentification requise ou session expirée.");
      setIsDataLoading(false);
      setServiceEvents([]);
      setVehicles([]);
    }
  }, [isAuthLoading, isAuthenticated, token, authAxios]);

  // Effect to fetch vehicles when the modal opens (if not already loaded)
  useEffect(() => {
    if (isAddModalOpen && vehicles.length === 0 && !isDataLoading && authAxios && token) {
      console.log("[ServicesPage Modal Effect] Modal opened, fetching vehicles...");
      fetchVehicles();
    }
  }, [isAddModalOpen, vehicles.length, isDataLoading, authAxios, token]);

  // --- Handlers ---
  const handleRefresh = () => {
     if (!isAuthLoading && isAuthenticated && token && authAxios) {
        console.log("[ServicesPage] Manual Refresh triggered.")
        fetchServiceEvents();
        fetchVehicles();
     }
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    handleRefresh(); // Refresh list after adding
  };
  
  const handleViewDetails = (event: ServiceEvent) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  // --- Render Logic ---

  // Loading state during initial auth check
  if (isAuthLoading) {
    return <div className="p-6">Vérification de l'authentification...</div>;
  }

  // Display error if any
  if (error && !isDataLoading) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Calculate stats based on fetched serviceEvents
  const stats = {
      planned: serviceEvents.filter(e => {
        const normalizedStatus = e.status?.toLowerCase().replace(/[\s_-]/g, '') || '';
        return normalizedStatus === 'scheduled' || normalizedStatus === 'planifie';
      }).length,
      inProgress: serviceEvents.filter(e => {
        const normalizedStatus = e.status?.toLowerCase().replace(/[\s_-]/g, '') || '';
        return normalizedStatus === 'inprogress' || normalizedStatus === 'encours';
      }).length,
      completed: serviceEvents.filter(e => {
        const normalizedStatus = e.status?.toLowerCase().replace(/[\s_-]/g, '') || '';
        return normalizedStatus === 'completed' || normalizedStatus === 'termine';
      }).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Services</h1>
        <div className="flex space-x-2">
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')} size="sm">
            <ListFilterIcon className="w-4 h-4 mr-2" />
            Liste
          </Button>
          <Button variant={viewMode === 'calendar' ? 'default' : 'outline'} onClick={() => setViewMode('calendar')} size="sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendrier
          </Button>
           <Button variant="outline" onClick={handleRefresh} size="sm" disabled={isDataLoading}> 
              <RefreshCw className={`w-4 h-4 mr-2 ${isDataLoading ? 'animate-spin' : ''}`} />
             Actualiser
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter Intervention
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Planifiés</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{isDataLoading ? <Skeleton className="h-8 w-10 inline-block"/> : stats.planned}</div></CardContent>
          </Card>
           <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">En Cours</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{isDataLoading ? <Skeleton className="h-8 w-10 inline-block"/> : stats.inProgress}</div></CardContent>
          </Card>
           <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Terminés</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{isDataLoading ? <Skeleton className="h-8 w-10 inline-block"/> : stats.completed}</div></CardContent>
          </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {viewMode === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>Liste des Interventions</CardTitle>
              <CardDescription>Interventions planifiées, en cours et terminées.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Plaque</TableHead>
                    <TableHead>Titre/Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date Planifiée</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isDataLoading && (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={`skel-${index}`}>
                        <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))
                  )}
                  {!isDataLoading && serviceEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        Aucune intervention trouvée.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isDataLoading && serviceEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.id}</TableCell>
                      <TableCell>{event.vehicle_info?.registration_number || 'N/A'}</TableCell>
                      <TableCell>{event.title || event.service_type_info?.name || 'Sans titre'}</TableCell>
                      <TableCell>
                        <span className="capitalize">{getStatusLabel(event.status)}</span>
                      </TableCell>
                      <TableCell>
                        {event.event_date ? format(new Date(event.event_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(event)}
                        >
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {viewMode === 'calendar' && (
          <Card>
            <CardHeader>
              <CardTitle>Calendrier des Services</CardTitle>
              <CardDescription>Visualisation par date (à implémenter).</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
              Calendrier non disponible pour le moment.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Service Event Modal */}
      {vehicles.length > 0 ? (
        <AddServiceEventForm
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          vehicles={vehicles} // Pass fetched vehicles
          onAdd={handleAddSuccess} // Use the new handler
        />
      ) : isAddModalOpen && (
        // If modal should be open but we have no vehicles, show error or fetch them
        <div>
          {console.log("[ServicesPage] Attempted to open AddServiceEventForm but no vehicles available")}
          {!isAuthLoading && fetchVehicles()} {/* Attempt to fetch vehicles if not already loading */}
        </div>
      )}
      
      {/* Service Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent 
          className="sm:max-w-[500px] dark:bg-slate-900 dark:border-slate-800"
          aria-labelledby="service-details-title"
          aria-describedby="service-details-description"
          role="dialog"
          aria-modal="true"
        >
          <DialogHeader>
            <DialogTitle id="service-details-title" className="text-foreground">
              Détails de l'intervention
            </DialogTitle>
            <DialogDescription id="service-details-description" className="text-muted-foreground">
              Informations détaillées sur l'intervention de service
            </DialogDescription>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8"
                aria-label="Fermer les détails de l'intervention"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          
          {selectedEvent && (
            <>
              <div className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">ID</div>
                      <div className="text-foreground">{selectedEvent.id}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Titre</div>
                      <div className="text-foreground">{selectedEvent.title || selectedEvent.service_type_info?.name || 'Sans titre'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Véhicule</div>
                      <div className="text-foreground">{selectedEvent.vehicle_info?.registration_number || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Kilométrage</div>
                      <div className="text-foreground">
                        {selectedEvent.mileage_at_service 
                          ? `${selectedEvent.mileage_at_service} km`
                          : 'Non spécifié'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Type de service</div>
                      <div className="text-foreground">{selectedEvent.service_type_info?.name || 'Non spécifié'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Date planifiée</div>
                      <div className="text-foreground">
                        {selectedEvent.event_date 
                          ? format(new Date(selectedEvent.event_date), 'dd/MM/yyyy')
                          : 'Non spécifiée'
                        }
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Statut</div>
                      <Badge variant={
                        selectedEvent.status === 'scheduled' ? 'outline' : 
                        selectedEvent.status === 'in_progress' ? 'secondary' :
                        selectedEvent.status === 'completed' ? 'default' : 
                        'destructive'
                      }>
                        {getStatusLabel(selectedEvent.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {selectedEvent.notes && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
                    <div className="text-foreground p-3 bg-background dark:bg-slate-800 border rounded-md">
                      {selectedEvent.notes}
                    </div>
                  </div>
                )}
                
                {selectedEvent.service_type_info?.description && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Description du type de service</div>
                    <div className="text-foreground text-sm p-3 bg-background dark:bg-slate-800 border rounded-md">
                      {selectedEvent.service_type_info.description}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesPage; 