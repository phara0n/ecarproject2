import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/formatters';

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

const SuiviKilometrique = () => {
  const { authAxios, token, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [mileageRecords, setMileageRecords] = useState<MileageRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [vehicleMap, setVehicleMap] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');

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
          <Button className="bg-primary text-white hover:bg-primary/80 rounded-lg shadow" type="button"> {/* TODO: Open modal */}
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
    </div>
  );
};

export default SuiviKilometrique;