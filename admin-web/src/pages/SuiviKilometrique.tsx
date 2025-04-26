import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/formatters';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Define the MileageRecord interface based on the actual API response
interface MileageRecord {
  id: number;
  // Field names with both French and English possibilities
  vehicule_id?: number;
  vehicle_id?: number;
  vehicule_immatriculation?: string;
  vehicle_license_plate?: string;
  kilometrage?: number;
  mileage?: number;
  date?: string;
  created_at?: string;
  source?: string; // 'client' or 'admin'
  commentaire?: string;
  comment?: string;
}

// Interface pour les véhicules
interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
}

const SuiviKilometrique = () => {
  const { authAxios, token, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [mileageRecords, setMileageRecords] = useState<MileageRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [vehicleMap, setVehicleMap] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  
  // États pour le modal d'ajout
  const [isAddMileageOpen, setIsAddMileageOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [mileage, setMileage] = useState<string>('');
  const [mileageDate, setMileageDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Function to fetch mileage records from the API
  const fetchMileageRecords = async () => {
    setIsLoading(true);
    setError(null);
    
    if (!token || !isAuthenticated) return;
    
    try {
      const response = await authAxios.get('api/v1/mileage-records/');

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des enregistrements de kilométrage: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('API response:', responseData);

      // Extract mileage records from nested data field if needed
      const mileageData = responseData.data || responseData;
      
      if (!Array.isArray(mileageData)) {
        throw new Error('Format de réponse API inattendu pour les enregistrements de kilométrage');
      }

      // Log the entire first record to see exact structure
      if (mileageData.length > 0) {
        console.log('First mileage record structure (complete):', JSON.stringify(mileageData[0], null, 2));
      }

      setMileageRecords(mileageData);
    } catch (err) {
      console.error('Error fetching mileage records:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch mileage records on component mount
  useEffect(() => {
    if (!token || !isAuthenticated) return;
    fetchMileageRecords();
  }, [token, isAuthenticated]);

  // Fetch la liste des véhicules pour mapping id->plaque
  useEffect(() => {
    if (!token || !isAuthenticated) return;
    const fetchVehicles = async () => {
      try {
        const response = await authAxios.get('/api/v1/vehicles/');
        if (!response.ok) throw new Error('Erreur lors du chargement des véhicules');
        const data = await response.json();
        const arr = data.data || data || [];
        // Créer le mapping id -> plaque
        const map: Record<number, string> = {};
        arr.forEach((v: any) => { if (v.id && v.registration_number) map[v.id] = v.registration_number; });
        setVehicleMap(map);
      } catch (e) {
        setVehicleMap({});
      }
    };
    fetchVehicles();
  }, [token, isAuthenticated]);

  // Function to fetch vehicles for the dropdown
  const fetchVehiclesForDropdown = async () => {
    if (!token || !isAuthenticated) return;
    setIsVehiclesLoading(true);
    try {
      const response = await authAxios.get('api/v1/vehicles/');
      if (!response.ok) throw new Error('Erreur lors du chargement des véhicules');
      const data = await response.json();
      const vehiclesData = data.data || data;
      if (!Array.isArray(vehiclesData)) {
        throw new Error('Format de réponse API inattendu pour les véhicules');
      }
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setSubmitError(err instanceof Error ? err.message : 'Impossible de récupérer les véhicules');
    } finally {
      setIsVehiclesLoading(false);
    }
  };

  // Récupérer les véhicules lors de l'ouverture du modal
  useEffect(() => {
    if (isAddMileageOpen) {
      fetchVehiclesForDropdown();
    }
  }, [isAddMileageOpen]);

  // Helper to get the best available field with fallbacks
  const getMileageField = (record: MileageRecord, fields: string[], defaultValue: string = '-') => {
    for (const field of fields) {
      const value = record[field as keyof MileageRecord];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
    return defaultValue;
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setSubmitError(null);
    
    // Validate vehicle selection
    if (!selectedVehicle) {
      setSubmitError('Veuillez sélectionner un véhicule');
      return;
    }

    // Validate mileage
    if (!mileage || isNaN(parseFloat(mileage)) || parseFloat(mileage) <= 0) {
      setSubmitError('Veuillez entrer un kilométrage valide');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Construire l'objet à envoyer
      const mileageData = {
        vehicle_id: parseInt(selectedVehicle),
        mileage: parseFloat(mileage),
        date: mileageDate,
        comment: comment,
        source: 'ADMIN'  // Enregistrement ajouté depuis le panel admin (en majuscules)
      };
      
      console.log('Envoi des données:', mileageData);
      
      // Envoyer la requête POST pour créer l'enregistrement
      const response = await authAxios.post('api/v1/mileage-records/', {
        json: mileageData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.detail || 'Échec de la création de l\'enregistrement');
      }
      
      // Fermer le modal et rafraîchir la liste
      setIsAddMileageOpen(false);
      fetchMileageRecords();
      
      // Réinitialiser le formulaire
      setSelectedVehicle(null);
      setMileage('');
      setMileageDate(new Date().toISOString().split('T')[0]);
      setComment('');
    } catch (err) {
      console.error('Error creating mileage record:', err);
      setSubmitError(
        err instanceof Error 
          ? err.message 
          : 'Une erreur est survenue lors de la création de l\'enregistrement'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats safely (handling empty array)
  const calculateStats = () => {
    if (mileageRecords.length === 0) {
      return { 
        totalRecords: 0, 
        avgMileage: 0, 
        latestMileage: 0 
      };
    }

    const totalRecords = mileageRecords.length;
    
    // Calculate average mileage
    const totalMileage = mileageRecords.reduce((sum, record) => {
      const mileage = Number(getMileageField(record, ['kilometrage', 'mileage'], '0'));
      return sum + mileage;
    }, 0);
    
    const avgMileage = totalMileage / totalRecords;
    
    // Get latest mileage record
    const sortedRecords = [...mileageRecords].sort((a, b) => {
      const dateA = new Date(String(getMileageField(a, ['date', 'created_at']))).getTime();
      const dateB = new Date(String(getMileageField(b, ['date', 'created_at']))).getTime();
      return dateB - dateA;
    });
    
    const latestMileage = Number(getMileageField(sortedRecords[0], ['kilometrage', 'mileage'], '0'));

    return { totalRecords, avgMileage, latestMileage };
  };

  const { totalRecords, avgMileage, latestMileage } = calculateStats();

  // Helper to safely format numbers
  const formatNumber = (value?: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num !== undefined && num !== null && !isNaN(num)
      ? num.toLocaleString('fr-FR') 
      : '0';
  };

  // Filtrage côté client sur plaque, ID, commentaire
  const filteredRecords = mileageRecords.filter(record => {
    const id = getMileageField(record, ['vehicule_id', 'vehicle_id', 'vehicle']);
    const plaque = (typeof id === 'number' && vehicleMap[id]) ? vehicleMap[id] : (typeof id === 'string' && vehicleMap[parseInt(id)]) ? vehicleMap[parseInt(id)] : '';
    const comment = getMileageField(record, ['commentaire', 'comment'], '');
    const searchLower = String(search).toLowerCase();
    return (
      (plaque && String(plaque).toLowerCase().includes(searchLower)) ||
      (id && String(id).toLowerCase().includes(searchLower)) ||
      (comment && String(comment).toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="p-6 space-y-6 bg-background text-primary min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Suivi Kilométrique</h1>
        <div className="flex gap-2 items-center">
          <Button className="bg-muted text-primary hover:bg-accent rounded-lg border-none shadow-sm" onClick={fetchMileageRecords} disabled={isLoading} type="button">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            className="bg-primary text-white hover:bg-primary/80 rounded-lg shadow" 
            onClick={() => setIsAddMileageOpen(true)} 
            type="button"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouvel Enregistrement
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="my-4 bg-destructive/10 border-destructive text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-muted text-primary rounded-lg shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Enregistrements</CardTitle>
              <CardDescription>Nombre total</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalRecords}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-muted text-primary rounded-lg shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Kilométrage Moyen</CardTitle>
              <CardDescription>Tous véhicules</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatNumber(avgMileage)} km
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-muted text-primary rounded-lg shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dernier Kilométrage</CardTitle>
              <CardDescription>Enregistrement le plus récent</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatNumber(latestMileage)} km
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Champ de recherche au-dessus du tableau */}
        <div className="flex justify-center mb-4">
          <input
            type="text"
            placeholder="Rechercher (plaque, ID, commentaire...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input input-bordered pl-3 pr-2 py-1 rounded-lg bg-muted text-primary border-none focus:ring-2 focus:ring-primary"
            style={{ minWidth: 320 }}
          />
        </div>
        <Card className="md:col-span-3 bg-muted text-primary rounded-lg shadow">
          <CardHeader>
            <CardTitle>Historique des Kilométrages</CardTitle>
            <CardDescription>Liste de tous les enregistrements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">ID</TableHead>
                  <TableHead className="text-primary">Véhicule</TableHead>
                  <TableHead className="text-primary">Kilométrage</TableHead>
                  <TableHead className="text-primary">Date</TableHead>
                  <TableHead className="text-primary">Source</TableHead>
                  <TableHead className="text-primary">Commentaire</TableHead>
                  {/* <TableHead>Actions</TableHead> */} {/* Actions non définies pour l'instant */} 
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="hover:bg-accent">
                      <TableCell><Skeleton className="h-6 w-8 bg-accent" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 bg-accent" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 bg-accent" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 bg-accent" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 bg-accent" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 bg-accent" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredRecords.length > 0 ? (
                  // Display filtered mileage records
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-accent">
                      <TableCell className="font-medium">{record.id}</TableCell>
                      <TableCell>
                        {(() => {
                          // Cherche la plaque via mapping si possible
                          const id = getMileageField(record, ['vehicule_id', 'vehicle_id', 'vehicle']);
                          if (typeof id === 'number' && vehicleMap[id]) return vehicleMap[id];
                          if (typeof id === 'string' && vehicleMap[parseInt(id)]) return vehicleMap[parseInt(id)];
                          // Sinon fallback sur les champs texte
                          return getMileageField(record, ['vehicule_immatriculation', 'vehicle_license_plate', 'vehicle']);
                        })()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatNumber(getMileageField(record, ['kilometrage', 'mileage'], '0'))} km
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const dateValue = getMileageField(record, ['recorded_at', 'date', 'created_at'], '');
                          return dateValue ? formatDate(String(dateValue)) : '-';
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const badgeClass =
                            "px-2 py-0.5 rounded-full text-xs font-medium " +
                            (getMileageField(record, ['source']) === 'client'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-secondary/10 text-secondary-foreground');
                          return (
                            <span className={badgeClass}>
                              {String(getMileageField(record, ['source'], 'N/A')).toUpperCase()}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{getMileageField(record, ['commentaire', 'comment'])}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No records
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Aucun enregistrement de kilométrage trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal d'ajout de kilométrage */}
      <Dialog open={isAddMileageOpen} onOpenChange={setIsAddMileageOpen}>
        <DialogContent className="sm:max-w-[550px] bg-background text-primary rounded-lg shadow-lg p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl">Nouvel Enregistrement Kilométrique</DialogTitle>
            <DialogDescription>Ajoutez un nouvel enregistrement de kilométrage.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection du véhicule */}
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-sm font-medium">Véhicule</Label>
              <Select onValueChange={setSelectedVehicle} value={selectedVehicle || ''} disabled={isVehiclesLoading}>
                <SelectTrigger id="vehicle" className="w-full bg-muted/50 border border-input hover:bg-muted focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder={isVehiclesLoading ? 'Chargement...' : 'Sélectionner un véhicule...'} />
                </SelectTrigger>
                <SelectContent className="bg-background border border-input shadow-lg">
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()} className="hover:bg-muted focus:bg-muted">
                      {v.registration_number} ({v.make} {v.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kilométrage */}
            <div className="space-y-2">
              <Label htmlFor="mileage" className="text-sm font-medium">Kilométrage (km)</Label>
              <Input 
                id="mileage" 
                type="number" 
                step="1" 
                min="0"
                value={mileage} 
                onChange={(e) => setMileage(e.target.value)} 
                className="w-full bg-muted/50 border border-input hover:bg-muted focus:ring-1 focus:ring-primary" 
                placeholder="Entrer le kilométrage..."
                required 
              />
            </div>

            {/* Date de l'enregistrement */}
            <div className="space-y-2">
              <Label htmlFor="mileage-date" className="text-sm font-medium">Date</Label>
              <Input 
                id="mileage-date" 
                type="date" 
                value={mileageDate} 
                onChange={(e) => setMileageDate(e.target.value)} 
                className="w-full bg-muted/50 border border-input hover:bg-muted focus:ring-1 focus:ring-primary" 
                required 
              />
            </div>

            {/* Commentaire */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm font-medium">Commentaire (optionnel)</Label>
              <Textarea 
                id="comment" 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                className="w-full bg-muted/50 border border-input hover:bg-muted focus:ring-1 focus:ring-primary" 
                placeholder="Entrez un commentaire optionnel..."
                rows={3}
              />
            </div>

            {submitError && (
              <Alert variant="destructive" className="mt-4 bg-destructive/10 border-destructive text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto bg-muted/50 hover:bg-muted">
                  Annuler
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? 'Ajout en cours...' : 'Ajouter Enregistrement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuiviKilometrique;