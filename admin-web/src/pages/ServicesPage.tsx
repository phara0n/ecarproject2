import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, AlertCircle, Eye, Edit, Trash2, Search, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Types de base
interface ServiceEvent {
  id: number;
  vehicle_info?: { id?: number; registration_number: string; make?: string; model?: string };
  service_type_info?: { name: string; description?: string };
  event_date: string;
  status: string; 
  title?: string;
  mileage_at_service?: number;
  notes?: string;
}

interface VehicleListItem {
  id: number;
  registration_number: string;
  make?: string;
  model?: string;
}

interface ServiceTypeItem {
  id: number;
  name: string;
}

interface ServicePrediction {
  id: number;
  vehicle_id: number;
  service_type_id: number;
  predicted_due_date: string | null;
  predicted_due_mileage: number | null;
  prediction_source: string;
  generated_at: string;
  vehicle_info?: { registration_number: string };
  service_type_info?: { name: string };
}

// Typage pour les records de kilométrage
interface MileageRecord {
  id: number;
  kilometrage?: number;
  mileage?: number;
  date?: string;
  created_at?: string;
  source?: string;
  commentaire?: string;
  comment?: string;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Planifié',
  planifie: 'Planifié',
  inprogress: 'En cours',
  encours: 'En cours',
  completed: 'Terminé',
  termine: 'Terminé',
  cancelled: 'Annulé',
  annule: 'Annulé',
};
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'outline',
  planifie: 'outline',
  inprogress: 'secondary',
  encours: 'secondary',
  completed: 'default',
  termine: 'default',
  cancelled: 'destructive',
  annule: 'destructive',
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR');
};

const serviceFormSchema = z.object({
  vehicle: z.string().min(1, 'Véhicule requis'),
  service_type: z.string().min(1, 'Type requis'),
  event_date: z.string().min(1, 'Date et heure requises'),
  mileage: z.string().min(1, 'Kilométrage requis'),
  notes: z.string().optional(),
});
type ServiceFormValues = z.infer<typeof serviceFormSchema>;

const ServicesPage: React.FC = () => {
  const { authAxios, token, isAuthenticated, isLoading } = useAuth();
  // LOG DEBUG
  console.log('ServicesPage: mounted', { isLoading, token, isAuthenticated });
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<ServiceEvent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [mileageRecords, setMileageRecords] = useState<MileageRecord[]>([]);
  const [isMileageLoading, setIsMileageLoading] = useState(false);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [vehiclesList, setVehiclesList] = useState<VehicleListItem[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>([]);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<ServiceEvent | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [predictionVehicle, setPredictionVehicle] = useState<{ id: number; registration_number: string } | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: { vehicle: '', service_type: '', event_date: '', mileage: '', notes: '' },
  });

  useEffect(() => {
    if (isLoading || !token || !isAuthenticated) return;
    setError(null);
    setIsDataLoading(true);
    authAxios.get('api/v1/service-events/')
      .then(res => res.json())
      .then((data: { results?: ServiceEvent[]; data?: ServiceEvent[] } | ServiceEvent[]) => {
        let results: ServiceEvent[] = [];
        if (Array.isArray(data)) results = data;
        else if (typeof data === 'object' && 'results' in data && Array.isArray(data.results)) results = data.results;
        else if (typeof data === 'object' && 'data' in data && Array.isArray(data.data)) results = data.data;
        setServiceEvents(results);
      })
      .catch((err: { message?: string }) => {
        setError("Erreur lors du chargement des interventions. " + (err?.message || ''));
      })
      .finally(() => setIsDataLoading(false));
  }, [token, isAuthenticated, isLoading]);

  useEffect(() => {
    if (!selectedEvent || !isDetailsModalOpen) return;
    setIsMileageLoading(true);
    setMileageError(null);
    const vehicleId = selectedEvent.vehicle_info && selectedEvent.vehicle_info.id;
    const queryParam = vehicleId ? `vehicle_id=${vehicleId}` : selectedEvent.vehicle_info?.registration_number ? `vehicle=${encodeURIComponent(selectedEvent.vehicle_info.registration_number)}` : '';
    if (!queryParam) {
      setMileageError('Impossible de déterminer le véhicule pour le suivi kilométrique.');
      setIsMileageLoading(false);
      return;
    }
    authAxios.get(`api/v1/mileage-records/?${queryParam}`)
      .then(res => res.json())
      .then((data: { data?: MileageRecord[] } | MileageRecord[]) => {
        let records: MileageRecord[] = [];
        if (Array.isArray(data)) records = data;
        else if (typeof data === 'object' && 'data' in data && Array.isArray(data.data)) records = data.data;
        setMileageRecords(records);
      })
      .catch(() => {
        setMileageError('Erreur lors du chargement du suivi kilométrique.');
      })
      .finally(() => setIsMileageLoading(false));
  }, [selectedEvent, isDetailsModalOpen]);

  useEffect(() => {
    if (!isAddModalOpen) return;
    setIsFormLoading(true);
    setFormError(null);
    if (!token || !isAuthenticated) {
      setFormError("Erreur d'authentification. Veuillez vous reconnecter.");
      setIsFormLoading(false);
      return;
    }
    Promise.all([
      authAxios.get('api/v1/vehicles/').then(res => res.json()).then((data: VehicleListItem[] | { data?: VehicleListItem[] }) => {
        if (Array.isArray(data)) return data;
        if (typeof data === 'object' && 'data' in data && Array.isArray(data.data)) return data.data;
        return [];
      }),
      authAxios.get('api/v1/service-types/').then(res => res.json()).then((data: ServiceTypeItem[] | { data?: ServiceTypeItem[] }) => {
        if (Array.isArray(data)) return data;
        if (typeof data === 'object' && 'data' in data && Array.isArray(data.data)) return data.data;
        return [];
      })
    ])
      .then(([v, t]) => {
        setVehiclesList(v);
        setServiceTypes(t);
        if (!v.length || !t.length) setFormError("Impossible de charger les listes. Session expirée ou accès refusé.");
      })
      .catch(() => setFormError('Erreur lors du chargement des listes.'))
      .finally(() => setIsFormLoading(false));
  }, [isAddModalOpen, token, isAuthenticated]);

  // Stats
  const stats = {
    total: serviceEvents.length,
    planned: serviceEvents.filter(e => ['scheduled', 'planifie'].includes((e.status || '').toLowerCase())).length,
    inProgress: serviceEvents.filter(e => ['inprogress', 'encours'].includes((e.status || '').toLowerCase())).length,
    completed: serviceEvents.filter(e => ['completed', 'termine'].includes((e.status || '').toLowerCase())).length,
  };

  // Filtres/recherche (UI seulement, logique à brancher)
  const filteredEvents = serviceEvents.filter(e => {
    const matchesStatus = statusFilter ? (e.status || '').toLowerCase() === statusFilter : true;
    const matchesSearch = search
      ? (e.vehicle_info?.registration_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.service_type_info?.name || '').toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  // Helpers pour stats
  const getMileageField = (record: MileageRecord, fields: string[], def: string = '-') => {
    for (const f of fields) if (record[f as keyof MileageRecord] !== undefined && record[f as keyof MileageRecord] !== null) return record[f as keyof MileageRecord];
    return def;
  };
  const formatNumber = (v?: number | string) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return n !== undefined && n !== null && !isNaN(n) ? n.toLocaleString('fr-FR') : '0';
  };
  const calculateMileageStats = () => {
    if (!mileageRecords.length) return { total: 0, avg: 0, last: 0 };
    const total = mileageRecords.length;
    const totalKm = mileageRecords.reduce((sum, r) => sum + Number(getMileageField(r, ['kilometrage', 'mileage'], '0')), 0);
    const avg = totalKm / total;
    const sorted = [...mileageRecords].sort((a, b) => {
      const aDate = new Date((getMileageField(a, ['date', 'created_at']) || '') as string);
      const bDate = new Date((getMileageField(b, ['date', 'created_at']) || '') as string);
      return bDate.getTime() - aDate.getTime();
    });
    const last = Number(getMileageField(sorted[0], ['kilometrage', 'mileage'], '0'));
    return { total, avg, last };
  };
  const { total, avg, last } = calculateMileageStats();

  const handleEdit = (event: ServiceEvent) => {
    setSelectedEvent(event);
    setIsEditMode(true);
    setIsAddModalOpen(true);
    form.reset({
      vehicle: event.vehicle_info?.registration_number || '',
      service_type: event.service_type_info?.name || '',
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      mileage: event.mileage_at_service?.toString() || '',
      notes: event.notes || '',
    });
  };

  const handleAdd = () => {
    setSelectedEvent(null);
    setIsEditMode(false);
    setIsAddModalOpen(true);
    form.reset({ vehicle: '', service_type: '', event_date: '', mileage: '', notes: '' });
  };

  const handleSubmitService = async (values: ServiceFormValues) => {
    setIsFormLoading(true);
    setFormError(null);
    try {
      if (!token || !isAuthenticated) throw new Error("Non authentifié");
      let eventDateISO = values.event_date;
      if (eventDateISO && !eventDateISO.endsWith('Z') && eventDateISO.length === 16) {
        eventDateISO = eventDateISO + ':00';
      }
      if (isEditMode && selectedEvent) {
        await authAxios.patch(`api/v1/service-events/${selectedEvent.id}/`, {
          json: {
            vehicle_id: values.vehicle,
            service_type_id: values.service_type,
            event_date: eventDateISO,
            mileage_at_service: values.mileage,
            notes: values.notes,
          }
        });
      } else {
        await authAxios.post('api/v1/service-events/', {
          json: {
            vehicle_id: values.vehicle,
            service_type_id: values.service_type,
            event_date: eventDateISO,
            mileage_at_service: values.mileage,
            notes: values.notes,
          }
        });
      }
      setIsAddModalOpen(false);
      form.reset();
      setIsDataLoading(true);
      authAxios.get('api/v1/service-events/')
        .then(res => res.json())
        .then((data: { results?: ServiceEvent[]; data?: ServiceEvent[] } | ServiceEvent[]) => {
          let results: ServiceEvent[] = [];
          if (Array.isArray(data)) results = data;
          else if (typeof data === 'object' && 'results' in data && Array.isArray(data.results)) results = data.results;
          else if (typeof data === 'object' && 'data' in data && Array.isArray(data.data)) results = data.data;
          setServiceEvents(results);
        })
        .catch((err: { message?: string }) => {
          setError("Erreur lors du chargement des interventions. " + (err?.message || ''));
        })
        .finally(() => setIsDataLoading(false));
    } catch (err: any) {
      setFormError("Erreur lors de la " + (isEditMode ? "modification" : "création") + " de l'intervention. " + (err?.message || ''));
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handler pour ouvrir la modale de suppression
  const handleDeleteClick = (event: ServiceEvent) => {
    setEventToDelete(event);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  // Handler pour confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleteLoading(true);
    setDeleteError(null);
    try {
      await authAxios.delete(`api/v1/service-events/${eventToDelete.id}/`);
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
      setIsDataLoading(true);
      authAxios.get('api/v1/service-events/')
        .then(res => res.json())
        .then((data: { results?: ServiceEvent[]; data?: ServiceEvent[] } | ServiceEvent[]) => {
          let results: ServiceEvent[] = [];
          if (Array.isArray(data)) results = data;
          else if (typeof data === 'object' && 'results' in data && Array.isArray(data.results)) results = data.results;
          else if (typeof data === 'object' && 'data' in data && Array.isArray(data.data)) results = data.data;
          setServiceEvents(results);
        })
        .catch((err: { message?: string }) => {
          setError("Erreur lors du chargement des interventions. " + (err?.message || ''));
        })
        .finally(() => setIsDataLoading(false));
      // TODO: toast de succès
    } catch (err: any) {
      setDeleteError("Erreur lors de la suppression. " + (err?.message || ''));
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleShowPredictions = (event: ServiceEvent) => {
    console.log('vehicle_info:', event.vehicle_info);
    if (event.vehicle_info?.registration_number && event.vehicle_info.id) {
      setPredictionVehicle({
        id: event.vehicle_info.id,
        registration_number: event.vehicle_info.registration_number,
      });
      setIsPredictionModalOpen(true);
    } else {
      alert('ID du véhicule manquant pour cette ligne.');
    }
  };

  // Loader
  if (isDataLoading) {
    return <div className="flex flex-col gap-6 p-6">
      <div className="flex gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>;
  }

  // Erreur d'auth
  if (!token || !isAuthenticated) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>Authentification requise ou session expirée.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Erreur de fetch
  if (error) {
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

  return (
    <div className="p-6 space-y-6 bg-background text-primary min-h-screen rounded-lg shadow" style={{ background: 'oklch(0.26 0.03 262.69)' }}>
      {/* Header + stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-primary">Gestion des Services</h1>
          <div className="flex gap-4 mt-2">
            <span className="text-sm text-muted-foreground">Total : <b>{stats.total}</b></span>
            <span className="text-sm text-primary">Planifiés : <b>{stats.planned}</b></span>
            <span className="text-sm text-yellow-600">En cours : <b>{stats.inProgress}</b></span>
            <span className="text-sm text-green-600">Terminés : <b>{stats.completed}</b></span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Recherche plaque/type..."
              className="input input-bordered pl-8 pr-2 py-1 rounded-lg bg-muted text-primary border-none focus:ring-2 focus:ring-primary"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          </div>
          <select
            className="input input-bordered py-1 rounded-lg bg-muted text-primary border-none focus:ring-2 focus:ring-primary"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Tous statuts</option>
            <option value="scheduled">Planifié</option>
            <option value="inprogress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
          <Button onClick={handleAdd} size="sm" className="bg-primary text-white hover:bg-primary/80 rounded-lg shadow">
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter Intervention
          </Button>
        </div>
      </div>
      {/* Table détaillée */}
      <div className="rounded-lg shadow p-4 overflow-x-auto" style={{ background: 'oklch(0.26 0.03 262.69)' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-background dark:bg-zinc-800">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Plaque</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Statut</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted-foreground">Aucune intervention trouvée.</td></tr>
            ) : (
              filteredEvents.map(event => {
                const statusKey = (event.status || '').toLowerCase();
                return (
                  <tr key={event.id} className="border-b border-zinc-200 dark:border-zinc-800">
                    <td className="px-3 py-2">{event.id}</td>
                    <td className="px-3 py-2">{event.vehicle_info?.registration_number || 'N/A'}</td>
                    <td className="px-3 py-2">{event.service_type_info?.name || 'Type inconnu'}</td>
                    <td className="px-3 py-2">
                      <Badge className={
                        statusKey === 'completed' || statusKey === 'termine' ? 'bg-green-500 text-white' :
                        statusKey === 'inprogress' || statusKey === 'encours' ? 'bg-yellow-500 text-white' :
                        statusKey === 'cancelled' || statusKey === 'annule' ? 'bg-destructive text-white' :
                        statusKey === 'scheduled' || statusKey === 'planifie' ? 'bg-primary text-white' :
                        'bg-muted text-primary'
                      }>
                        {STATUS_LABELS[statusKey] || event.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{formatDate(event.event_date)}</td>
                    <td className="px-3 py-2 flex gap-1">
                      <Button size="icon" variant="outline" className="bg-muted hover:bg-accent text-primary rounded-lg" title="Voir" aria-label="Voir" onClick={() => { setSelectedEvent(event); setIsDetailsModalOpen(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="bg-muted hover:bg-accent text-primary rounded-lg" title="Éditer" aria-label="Éditer" onClick={() => handleEdit(event)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="bg-muted hover:bg-accent text-primary rounded-lg" title="Prédictions" aria-label="Prédictions" onClick={() => handleShowPredictions(event)}>
                        <BarChart2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="bg-destructive text-white hover:bg-destructive/80 rounded-lg" title="Supprimer" aria-label="Supprimer" onClick={() => handleDeleteClick(event)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Modale de détails */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Détails de l'intervention</DialogTitle>
            <DialogDescription>Informations détaillées sur l'intervention de service</DialogDescription>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8" aria-label="Fermer les détails de l'intervention">
                ×
              </Button>
            </DialogClose>
          </DialogHeader>
          {selectedEvent && (
            <>
              <div className="py-4 space-y-2">
                <div><span className="font-medium">ID :</span> {selectedEvent.id}</div>
                <div><span className="font-medium">Plaque :</span> {selectedEvent.vehicle_info?.registration_number || 'N/A'}</div>
                <div><span className="font-medium">Type :</span> {selectedEvent.service_type_info?.name || 'Type inconnu'}</div>
                <div><span className="font-medium">Statut :</span> <Badge variant={STATUS_COLORS[(selectedEvent.status || '').toLowerCase()] as 'outline' | 'secondary' | 'default' | 'destructive' | undefined || 'secondary'}>{STATUS_LABELS[(selectedEvent.status || '').toLowerCase()] || selectedEvent.status}</Badge></div>
                <div><span className="font-medium">Date :</span> {formatDate(selectedEvent.event_date)}</div>
                <div><span className="font-medium">Kilométrage :</span> {selectedEvent.mileage_at_service ? `${selectedEvent.mileage_at_service} km` : 'Non spécifié'}</div>
                {selectedEvent.notes && <div><span className="font-medium">Notes :</span> {selectedEvent.notes}</div>}
                {selectedEvent.service_type_info?.description && <div><span className="font-medium">Description :</span> {selectedEvent.service_type_info.description}</div>}
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Suivi kilométrique</h3>
                {isMileageLoading ? (
                  <Skeleton className="h-8 w-48" />
                ) : mileageError ? (
                  <div className="text-red-500 text-sm">{mileageError}</div>
                ) : (
                  <>
                    <div className="flex gap-4 mb-2">
                      <span className="text-sm text-muted-foreground">Total relevés : <b>{total}</b></span>
                      <span className="text-sm text-blue-600">Moyenne : <b>{formatNumber(avg)} km</b></span>
                      <span className="text-sm text-green-600">Dernier : <b>{formatNumber(last)} km</b></span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-zinc-800">
                            <th className="px-2 py-1">ID</th>
                            <th className="px-2 py-1">Km</th>
                            <th className="px-2 py-1">Date</th>
                            <th className="px-2 py-1">Source</th>
                            <th className="px-2 py-1">Commentaire</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mileageRecords.length === 0 ? (
                            <tr><td colSpan={5} className="text-center text-zinc-500">Aucun relevé trouvé.</td></tr>
                          ) : (
                            mileageRecords.map((r) => (
                              <tr key={r.id}>
                                <td className="px-2 py-1">{r.id}</td>
                                <td className="px-2 py-1">{formatNumber(getMileageField(r, ['kilometrage', 'mileage']))} km</td>
                                <td className="px-2 py-1">{getMileageField(r, ['date', 'created_at'])}</td>
                                <td className="px-2 py-1">{getMileageField(r, ['source']) === 'client' ? 'Client' : 'Admin'}</td>
                                <td className="px-2 py-1">{getMileageField(r, ['commentaire', 'comment'])}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Modale d'ajout à implémenter ici (structure prête) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background text-primary rounded-lg shadow-lg p-6 min-w-[340px] max-w-[95vw]">
            <h2 className="text-lg font-bold mb-4">{isEditMode ? 'Éditer une intervention' : 'Ajouter une intervention'}</h2>
            {formError ? (
              <div className="text-red-500 text-sm mb-2">{formError}</div>
            ) : isFormLoading ? (
              <div className="text-muted-foreground">Chargement des listes...</div>
            ) : (
              <form onSubmit={form.handleSubmit(handleSubmitService)} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Véhicule</label>
                  <select {...form.register('vehicle')} className="input input-bordered w-full bg-background text-primary rounded-lg border-none focus:ring-2 focus:ring-primary">
                    <option value="">Sélectionner...</option>
                    {Array.isArray(vehiclesList) && vehiclesList.map((v: VehicleListItem) => (
                      <option key={v.id} value={v.id} className="bg-background text-primary">{v.registration_number} {v.make} {v.model}</option>
                    ))}
                  </select>
                  {form.formState.errors.vehicle && <div className="text-red-500 text-xs">{form.formState.errors.vehicle.message}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type de service</label>
                  <select {...form.register('service_type')} className="input input-bordered w-full bg-background text-primary rounded-lg border-none focus:ring-2 focus:ring-primary">
                    <option value="">Sélectionner...</option>
                    {Array.isArray(serviceTypes) && serviceTypes.map((t: ServiceTypeItem) => (
                      <option key={t.id} value={t.id} className="bg-background text-primary">{t.name}</option>
                    ))}
                  </select>
                  {form.formState.errors.service_type && <div className="text-red-500 text-xs">{form.formState.errors.service_type.message}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date et heure</label>
                  <input type="datetime-local" {...form.register('event_date')} className="input input-bordered w-full bg-background text-primary rounded-lg border-none focus:ring-2 focus:ring-primary" />
                  {form.formState.errors.event_date && <div className="text-red-500 text-xs">{form.formState.errors.event_date.message}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kilométrage</label>
                  <input type="number" {...form.register('mileage')} className="input input-bordered w-full bg-background text-primary rounded-lg border-none focus:ring-2 focus:ring-primary" />
                  {form.formState.errors.mileage && <div className="text-red-500 text-xs">{form.formState.errors.mileage.message}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea {...form.register('notes')} className="input input-bordered w-full bg-background text-primary rounded-lg border-none focus:ring-2 focus:ring-primary" rows={2} />
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <Button type="button" variant="outline" className="bg-muted text-primary rounded-lg" onClick={() => setIsAddModalOpen(false)} disabled={isFormLoading}>Annuler</Button>
                  <Button type="submit" className="bg-primary text-white hover:bg-primary/80 rounded-lg" disabled={isFormLoading}>{isFormLoading ? (isEditMode ? 'Enregistrement...' : 'Ajout...') : (isEditMode ? 'Enregistrer' : 'Ajouter')}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Modale de confirmation de suppression */}
      {isDeleteModalOpen && eventToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 min-w-[340px] max-w-[95vw]">
            <h2 className="text-lg font-bold mb-4 text-red-600">Confirmer la suppression</h2>
            <p className="mb-4">Voulez-vous vraiment supprimer l'intervention <b>#{eventToDelete.id}</b> pour le véhicule <b>{eventToDelete.vehicle_info?.registration_number}</b>?</p>
            {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
            <div className="flex gap-2 justify-end mt-2">
              <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleteLoading}>Annuler</Button>
              <Button type="button" variant="destructive" onClick={handleConfirmDelete} disabled={isDeleteLoading}>
                {isDeleteLoading ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ServicePredictionModal
        open={isPredictionModalOpen}
        onOpenChange={setIsPredictionModalOpen}
        vehicle={predictionVehicle}
      />
    </div>
  );
};

interface ServicePredictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: { id: number; registration_number: string } | null;
}

const ServicePredictionModal: React.FC<ServicePredictionModalProps> = ({ open, onOpenChange, vehicle }) => {
  const { authAxios } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<ServicePrediction[]>([]);

  useEffect(() => {
    console.log('DEBUG prediction modal:', { open, vehicle });
    if (!open || !vehicle?.id) return;
    setLoading(true);
    setError(null);
    setPredictions([]);
    authAxios.get(`api/v1/service-predictions/?vehicle_id=${vehicle.id}`)
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPredictions(data);
        } else if (typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
          setPredictions(data.data);
        } else {
          setPredictions([]);
        }
      })
      .catch(() => setError('Erreur lors du chargement des prédictions.'))
      .finally(() => setLoading(false));
  }, [open, vehicle?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Prédictions de service</DialogTitle>
          <DialogDescription>
            {vehicle ? `Pour le véhicule ${vehicle.registration_number}` : ''}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <Skeleton className="h-8 w-48" />
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : !predictions.length ? (
          <div className="text-muted-foreground">Aucune prédiction disponible.</div>
        ) : (
          <ul className="space-y-2">
            {predictions.map((p, i) => (
              <li key={i} className="border-b pb-2">
                <div><b>Type :</b> {p.service_type_info?.name || 'Type inconnu'}</div>
                <div><b>Date estimée :</b> {p.predicted_due_date || '-'}</div>
                <div><b>Kilométrage estimé :</b> {p.predicted_due_mileage ? `${p.predicted_due_mileage} km` : '-'}</div>
                <div><b>Source :</b> {p.prediction_source === 'RULE' ? 'Règle' : p.prediction_source}</div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServicesPage;

export { ServicePredictionModal }; 