import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views, SlotInfo, EventProps } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/fr';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

// Configurer le localisateur moment pour le français
moment.locale('fr');
const localizer = momentLocalizer(moment);

// Définir l'interface pour les événements de service
interface ServiceEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    id: number;
    vehicleId: number;
    licensePlate: string;
    status: string;
    serviceType: string;
    color: string;
  };
}

// Codes couleur pour les différents types de services
const serviceColors = {
  "Vidange": "#4CAF50",
  "Révision": "#2196F3",
  "Freins": "#F44336",
  "Pneus": "#FF9800",
  "Climatisation": "#9C27B0",
  "Autre": "#607D8B"
};

// Codes couleur pour les différents statuts
const statusColors = {
  "Planifié": "#3498db",
  "En Cours": "#f39c12",
  "Terminé": "#2ecc71",
  "Annulé": "#e74c3c"
};

const ServicesCalendarView: React.FC = () => {
  const { authAxios } = useAuth();
  const [events, setEvents] = useState<ServiceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fonction pour récupérer les services depuis l'API
  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAxios.get('api/v1/service-events/').json();
      
      const servicesData = Array.isArray(response) ? response : 
                        (response.results || response.data || []);
      
      console.log("Services data:", servicesData);

      // Transformer les données de service en événements de calendrier
      const calendarEvents = servicesData.map((service: any) => {
        // Obtenir la date de service ou utiliser la date actuelle
        const serviceDate = service.date_scheduled || service.created_at || new Date();
        const startDate = new Date(serviceDate);
        
        // Fin par défaut à 1 heure après le début
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        // Déterminer la couleur en fonction du type de service ou du statut
        const serviceType = service.service_type || service.type_service || "Autre";
        const status = service.status || service.statut || "Planifié";
        
        const color = statusColors[status as keyof typeof statusColors] || 
                     serviceColors[serviceType as keyof typeof serviceColors] || 
                     "#607D8B";

        return {
          id: service.id,
          title: service.title || serviceType,
          start: startDate,
          end: endDate,
          resource: {
            id: service.id,
            vehicleId: service.vehicle_id || service.vehicule_id,
            licensePlate: service.vehicle_registration_number || service.immatriculation || "Non spécifié",
            status: status,
            serviceType: serviceType,
            color: color
          }
        };
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Erreur lors de la récupération des services:", error);
      setError(error instanceof Error 
        ? error.message 
        : "Une erreur s'est produite lors de la récupération des services");
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les services au chargement
  useEffect(() => {
    fetchServices();
  }, []);

  // Gestionnaire pour le clic sur un créneau de calendrier
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const startDate = new Date(slotInfo.start);
    const endDate = new Date(slotInfo.end);
    
    console.log("Créneau sélectionné:", {
      start: formatDate(startDate.toString(), true),
      end: formatDate(endDate.toString(), true)
    });
    
    // TODO: Ouvrir une modale pour créer un nouveau service
    // Cela pourrait être une redirection vers la page d'ajout de service existante
    // avec les dates pré-remplies, ou une modale personnalisée
  };

  // Gestionnaire pour le déplacement d'un événement (drag & drop)
  const handleEventDrop = ({ event, start, end }: any) => {
    console.log("Événement déplacé:", {
      id: event.id,
      title: event.title,
      newStart: formatDate(start.toString(), true),
      newEnd: formatDate(end.toString(), true)
    });
    
    // Mettre à jour l'événement localement en attendant la confirmation de l'API
    const updatedEvents = events.map(evt => 
      evt.id === event.id ? { ...evt, start, end } : evt
    );
    
    setEvents(updatedEvents);
    
    // TODO: Appeler l'API pour mettre à jour la date du service
    // authAxios.put(`api/v1/service-events/${event.id}/`, { json: { date_scheduled: start } }).json()
  };

  // Personnalisation de l'apparence des événements
  const eventStyleGetter = (event: ServiceEvent) => {
    const color = event.resource?.color || "#607D8B";
    
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: '#fff',
        borderRadius: '4px',
        opacity: 0.9,
        fontSize: '0.8rem',
        padding: '2px 5px',
        cursor: 'pointer'
      }
    };
  };

  // Rendu des événements personnalisés
  const EventComponent = ({ event }: EventProps<ServiceEvent>) => (
    <div>
      <div className="font-semibold">{event.title}</div>
      <div className="text-xs">{event.resource?.licensePlate}</div>
      <div className="text-xs">{event.resource?.status}</div>
    </div>
  );

  // Boutons de navigation personnalisés
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex justify-between items-center mb-4 p-2">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onNavigate('TODAY')}
        >
          Aujourd'hui
        </Button>
        <Button 
          variant="outline"
          size="icon"
          onClick={() => onNavigate('PREV')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline"
          size="icon"
          onClick={() => onNavigate('NEXT')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold">{label}</span>
      </div>
      <div className="flex space-x-2">
        <TabsList>
          <TabsTrigger 
            value="month" 
            onClick={() => onView('month')}
            className={currentView === 'month' ? 'bg-primary text-primary-foreground' : ''}
          >
            Mois
          </TabsTrigger>
          <TabsTrigger 
            value="week" 
            onClick={() => onView('week')}
            className={currentView === 'week' ? 'bg-primary text-primary-foreground' : ''}
          >
            Semaine
          </TabsTrigger>
          <TabsTrigger 
            value="day" 
            onClick={() => onView('day')}
            className={currentView === 'day' ? 'bg-primary text-primary-foreground' : ''}
          >
            Jour
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  );

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Calendrier des Services</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="h-[750px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day']}
            defaultView={Views.WEEK}
            defaultDate={new Date()}
            selectable
            resizable
            onSelectSlot={handleSelectSlot}
            onEventDrop={handleEventDrop}
            onView={(view) => setCurrentView(view as string)}
            onNavigate={(date) => setCurrentDate(date)}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent as any,
              toolbar: CustomToolbar
            }}
            formats={{
              dateFormat: 'D',
              dayFormat: 'ddd D',
              dayHeaderFormat: 'dddd D MMMM',
              monthHeaderFormat: 'MMMM YYYY',
              dayRangeHeaderFormat: ({ start, end }) => {
                return `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM YYYY')}`;
              },
            }}
            messages={{
              today: "Aujourd'hui",
              previous: "Précédent",
              next: "Suivant",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
              agenda: "Agenda",
              date: "Date",
              time: "Heure",
              event: "Événement",
              allDay: "Toute la journée",
              noEventsInRange: "Aucun événement dans cette plage de dates."
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ServicesCalendarView; 