import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, Wrench, Users, CalendarDays, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDate } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';

// Types pour les données de l'API
interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  owner_username?: string;
  created_at: string;
}

interface ServiceEvent {
  id: number;
  vehicle: number;
  service_type: number;
  event_date: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  service_type_info?: {
    name: string;
  };
  vehicle_info?: {
    registration_number: string;
  };
}

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  date_joined?: string;
}

interface MileageRecord {
  id: number;
  vehicle: number;
  mileage: number;
  recorded_at: string;
  source: string;
  recorded_by_username?: string;
}

interface Invoice {
  id: number;
  vehicle_id: number;
  service_event_id?: number;
  file?: string;
  final_amount: number;
  created_at: string;
  vehicle_info?: {
    registration_number: string;
  }
}

interface RecentActivity {
  id: number;
  description: string;
  user: string;
  time: string;
}

const DashboardPage = () => {
  const { authAxios, token, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour stocker les données de l'API
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [mileageRecords, setMileageRecords] = useState<MileageRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // État pour les activités récentes
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Fonction pour charger toutes les données nécessaires
  const fetchDashboardData = async () => {
    if (!token || !isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Charger les véhicules
      const vehiclesPromise = authAxios.get('api/v1/vehicles/')
        .then(response => response.json())
        .then(data => data.data || data || []);
      
      // Charger les événements de service
      const serviceEventsPromise = authAxios.get('api/v1/service-events/')
        .then(response => response.json())
        .then(data => data.data || data || []);
      
      // Charger les utilisateurs (clients)
      const usersPromise = authAxios.get('api/v1/users/customers/')
        .then(response => response.json())
        .then(data => data.data || data || []);
      
      // Charger les enregistrements de kilométrage
      const mileageRecordsPromise = authAxios.get('api/v1/mileage-records/')
        .then(response => response.json())
        .then(data => data.data || data || []);
      
      // Charger les factures
      const invoicesPromise = authAxios.get('api/v1/invoices/')
        .then(response => response.json())
        .then(data => data.data || data || []);
      
      // Attendre que toutes les promesses soient résolues
      const [vehiclesData, serviceEventsData, usersData, mileageRecordsData, invoicesData] = 
        await Promise.all([vehiclesPromise, serviceEventsPromise, usersPromise, mileageRecordsPromise, invoicesPromise]);
      
      // Mettre à jour les états avec les données récupérées
      setVehicles(vehiclesData);
      setServiceEvents(serviceEventsData);
      setUsers(usersData);
      setMileageRecords(mileageRecordsData);
      setInvoices(invoicesData);
      
      // Générer les activités récentes
      generateRecentActivities(vehiclesData, serviceEventsData, mileageRecordsData, invoicesData);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour générer les activités récentes basées sur les données
  const generateRecentActivities = (
    vehicles: Vehicle[],
    services: ServiceEvent[],
    mileages: MileageRecord[],
    invoices: Invoice[]
  ) => {
    // Extraire les 20 derniers éléments à partir de toutes les sources
    const activities: { element: Vehicle | ServiceEvent | MileageRecord | Invoice, type: string, date: Date }[] = [];
    
    // Ajouter les véhicules récemment ajoutés
    vehicles.forEach(vehicle => {
      activities.push({
        element: vehicle,
        type: 'vehicle',
        date: new Date(vehicle.created_at)
      });
    });
    
    // Ajouter les événements de service récents
    services.forEach(service => {
      activities.push({
        element: service,
        type: 'service',
        date: new Date(service.event_date)
      });
    });
    
    // Ajouter les enregistrements de kilométrage récents
    mileages.forEach(mileage => {
      activities.push({
        element: mileage,
        type: 'mileage',
        date: new Date(mileage.recorded_at)
      });
    });
    
    // Ajouter les factures récentes
    invoices.forEach(invoice => {
      activities.push({
        element: invoice,
        type: 'invoice',
        date: new Date(invoice.created_at)
      });
    });
    
    // Trier les activités par date (les plus récentes d'abord)
    activities.sort((a, b) => {
      // Valider les dates avant de les comparer
      const dateA = isValidDate(a.date) ? a.date.getTime() : 0;
      const dateB = isValidDate(b.date) ? b.date.getTime() : 0;
      return dateB - dateA;
    });
    
    // Fonction helper pour vérifier si une date est valide
    function isValidDate(date: Date): boolean {
      return date instanceof Date && !isNaN(date.getTime());
    }
    
    // Convertir en format d'activité récente pour l'affichage
    const recentActivitiesList: RecentActivity[] = activities.slice(0, 10).map((activity, index) => {
      let description = '';
      let user = '';
      let registrationNumber = '';
      
      // Vérifier si la date est valide
      if (!isValidDate(activity.date)) {
        console.warn('Date invalide détectée:', activity);
        // Utiliser la date actuelle pour les dates invalides
        activity.date = new Date();
      }
      
      // Avant le switch, déclarer toutes les variables nécessaires
      let vehicle: Vehicle;
      let service: ServiceEvent;
      let mileage: MileageRecord;
      let vehicleForMileage: Vehicle | undefined;
      let invoice: Invoice;

      switch (activity.type) {
        case 'vehicle':
          vehicle = activity.element as Vehicle;
          description = `Nouveau véhicule ajouté : ${vehicle.registration_number}`;
          user = vehicle.owner_username || 'Admin';
          break;
        case 'service':
          service = activity.element as ServiceEvent;
          registrationNumber = service.vehicle_info?.registration_number || `ID:${service.vehicle}`;
          description = `Service ${service.service_type_info?.name || 'ID:' + service.service_type} ${service.status === 'COMPLETED' ? 'complété' : (service.status === 'IN_PROGRESS' ? 'en cours' : 'planifié')} pour ${registrationNumber}`;
          user = 'Mécanicien';
          break;
        case 'mileage':
          mileage = activity.element as MileageRecord;
          vehicleForMileage = vehicles.find(v => v.id === mileage.vehicle);
          registrationNumber = vehicleForMileage?.registration_number || `ID:${mileage.vehicle}`;
          description = `Kilométrage mis à jour pour ${registrationNumber}: ${mileage.mileage.toLocaleString('fr-FR')} km`;
          user = mileage.recorded_by_username || (mileage.source === 'CLIENT' ? 'Client' : 'Admin');
          break;
        case 'invoice':
          invoice = activity.element as Invoice;
          registrationNumber = invoice.vehicle_info?.registration_number || `ID:${invoice.vehicle_id}`;
          description = `Nouvelle facture ajoutée pour ${registrationNumber}: ${invoice.final_amount.toLocaleString('fr-FR')} DT`;
          user = 'Manager';
          break;
      }
      
      // Calculer l'affichage du temps (il y a X minutes/heures/jours)
      const now = new Date();
      const diffMs = now.getTime() - activity.date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let timeAgo;
      if (diffMins < 60) {
        timeAgo = `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        timeAgo = `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffDays < 30) {
        timeAgo = `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else {
        // S'assurer que la date est valide avant d'appeler toISOString()
        timeAgo = isValidDate(activity.date) 
          ? formatDate(activity.date.toISOString()) 
          : 'date inconnue';
      }
      
      return {
        id: index,
        description,
        user,
        time: timeAgo
      };
    });
    
    setRecentActivities(recentActivitiesList);
  };
  
  // Charger les données au montage du composant
  useEffect(() => {
    fetchDashboardData();
  }, [token, isAuthenticated]);
  
  // Calculer les statistiques pour les cartes
  const calculateStats = () => {
    // Stats des véhicules
    const totalVehicles = vehicles.length;
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const vehiclesLastMonth = vehicles.filter(v => new Date(v.created_at) > lastMonthDate).length;
    const vehicleGrowthRate = totalVehicles > 0 ? (vehiclesLastMonth / totalVehicles) * 100 : 0;
    
    // Stats des services
    const pendingServices = serviceEvents.filter(s => s.status !== 'COMPLETED').length;
    const urgentServices = serviceEvents.filter(s => {
      const eventDate = new Date(s.event_date);
      const now = new Date();
      const diffDays = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return s.status !== 'COMPLETED' && diffDays <= 3;  // Considérer urgent si dans les 3 jours
    }).length;
    
    // Stats des clients
    const totalClients = users.length;
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const clientsLastWeek = users.filter(u => u.date_joined && new Date(u.date_joined) > lastWeekDate).length;
    
    // Stats des rendez-vous
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingAppointments = serviceEvents.filter(s => {
      const eventDate = new Date(s.event_date);
      eventDate.setHours(0, 0, 0, 0);
      return s.status === 'SCHEDULED' && eventDate >= today;
    }).length;
    
    const todayAppointments = serviceEvents.filter(s => {
      const eventDate = new Date(s.event_date);
      eventDate.setHours(0, 0, 0, 0);
      return s.status !== 'COMPLETED' && eventDate.getTime() === today.getTime();
    }).length;
    
    const avgMileage = mileageRecords.length > 0 
      ? mileageRecords.reduce((sum, record) => sum + record.mileage, 0) / mileageRecords.length
      : 0;

    const totalInvoiceAmount = invoices.length > 0
      ? invoices.reduce((sum, invoice) => sum + invoice.final_amount, 0)
      : 0;

    return {
      totalVehicles,
      vehicleGrowthRate,
      pendingServices,
      urgentServices,
      totalClients,
      clientsLastWeek,
      upcomingAppointments,
      todayAppointments,
      avgMileage,
      totalInvoiceAmount
    };
  };
  
  const stats = isLoading ? {
    totalVehicles: 0,
    vehicleGrowthRate: 0,
    pendingServices: 0,
    urgentServices: 0,
    totalClients: 0,
    clientsLastWeek: 0,
    upcomingAppointments: 0,
    todayAppointments: 0,
    avgMileage: 0,
    totalInvoiceAmount: 0
  } : calculateStats();

  return (
    <div className="space-y-6 p-6 bg-background text-primary min-h-screen">
      <h1 className="text-2xl font-bold text-primary">Tableau de Bord</h1>
      
      {/* Afficher les erreurs */}
      {error && (
        <Alert variant="destructive" className="my-4 bg-destructive/10 border-destructive text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-muted rounded-lg shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Véhicules</CardTitle>
            <Car className="h-4 w-4 text-primary/80" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalVehicles.toLocaleString('fr-FR')}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.vehicleGrowthRate > 0 ? '+' : ''}{stats.vehicleGrowthRate.toFixed(1)}% depuis le mois dernier
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted rounded-lg shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Services en Attente</CardTitle>
            <Wrench className="h-4 w-4 text-primary/80" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">+{stats.pendingServices}</div>
                <p className="text-xs text-muted-foreground">
                  Dont {stats.urgentServices} urgents
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted rounded-lg shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Clients Actifs</CardTitle>
            <Users className="h-4 w-4 text-primary/80" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">+{stats.totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.clientsLastWeek} depuis la semaine dernière
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted rounded-lg shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Prochains RDV</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary/80" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.todayAppointments} aujourd'hui
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area - Charts and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart Area (Placeholder) */}
        <Card className="lg:col-span-4 bg-muted rounded-lg shadow">
          <CardHeader>
            <CardTitle className="text-primary">Statistiques Visuelles (Placeholder)</CardTitle>
            <CardDescription>
              Graphiques des services, kilométrage moyen, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             {/* Chart component will go here - e.g., <BarChart ... /> */}
             <div className="h-64 flex items-center justify-center text-primary/60 bg-background rounded-md">
               (Graphique)
             </div>
          </CardContent>
        </Card>

        {/* Recent Activity Table */}
        <Card className="lg:col-span-3 bg-muted rounded-lg shadow">
          <CardHeader>
            <CardTitle className="text-primary">Activité Récente</CardTitle>
            <CardDescription>
              Dernières actions enregistrées dans le système.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">Description</TableHead>
                    <TableHead className="text-right text-primary">Temps</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <TableRow key={activity.id} className="hover:bg-accent">
                        <TableCell>
                          <div className="font-medium">{activity.description}</div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                            par {activity.user}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{activity.time}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                        Aucune activité récente trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage; 