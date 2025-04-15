import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw, AlertCircle, TrendingUpIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

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
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [mileageRecords, setMileageRecords] = useState<MileageRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch mileage records from the API
  const fetchMileageRecords = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/mileage-records/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

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
    fetchMileageRecords();
  }, [token]);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Suivi Kilométrique</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchMileageRecords} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouvel Enregistrement
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
              <CardTitle className="text-sm font-medium">Total Enregistrements</CardTitle>
              <CardDescription>Nombre</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalRecords}</div>
              )}
            </CardContent>
          </Card>
          <Card>
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
          <Card>
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

        {/* Mileage records table */}
        <Card>
          <CardHeader>
            <CardTitle>Enregistrements de Kilométrage</CardTitle>
            <CardDescription>Historique de tous les relevés kilométriques</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Kilométrage</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Commentaire</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : mileageRecords.length > 0 ? (
                  // Display mileage records
                  mileageRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.id}</TableCell>
                      <TableCell>
                        {getMileageField(record, ['vehicule_immatriculation', 'vehicle_license_plate'])}
                      </TableCell>
                      <TableCell>
                        {formatNumber(getMileageField(record, ['kilometrage', 'mileage']))} km
                      </TableCell>
                      <TableCell>
                        {getMileageField(record, ['date', 'created_at'])}
                      </TableCell>
                      <TableCell>
                        {getMileageField(record, ['source']) === 'client' ? 'Client' : 'Admin'}
                      </TableCell>
                      <TableCell>
                        {getMileageField(record, ['commentaire', 'comment'])}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Détails</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No records
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
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