import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusIcon, FilterIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthProvider';

// Define the Vehicle interface based on the actual API response
interface Vehicle {
  id: number;
  // Field names adapted based on API response (snake_case)
  immatriculation?: string; // Expected actual field name
  marque?: string; // Expected actual field name
  modele?: string; // Expected actual field name
  annee?: number; // Expected actual field name
  kilometrage?: number; // Expected actual field name
  km_quotidien_moyen?: number; // Expected actual field name
  license_plate?: string; // Fallback field name
  brand?: string; // Fallback field name
  model?: string; // Fallback field name
  year?: number; // Fallback field name
  mileage?: number; // Fallback field name
  avg_daily_km?: number; // Fallback field name
}

const VehiclesPage = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch vehicles from the API
  const fetchVehicles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/vehicles/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des véhicules: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('API response:', responseData);

      // Extract vehicles from nested data field if needed
      const vehiclesData = responseData.data || responseData;
      
      if (!Array.isArray(vehiclesData)) {
        throw new Error('Format de réponse API inattendu pour les véhicules');
      }

      // Log the entire first vehicle to see exact structure
      if (vehiclesData.length > 0) {
        console.log('First vehicle structure (complete):', JSON.stringify(vehiclesData[0], null, 2));
      }

      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, [token]);

  // Helper to get the best available field with fallbacks
  const getVehicleField = (vehicle: Vehicle, fields: string[], defaultValue: string = '-') => {
    for (const field of fields) {
      const value = vehicle[field as keyof Vehicle];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
    return defaultValue;
  };

  // Calculate stats safely (handling empty array)
  const calculateStats = () => {
    if (vehicles.length === 0) {
      return { totalVehicles: 0, avgMileage: 0, avgDailyKm: 0 };
    }

    const totalVehicles = vehicles.length;
    
    // Safely calculate average mileage with several field possibilities
    const totalMileage = vehicles.reduce((sum, v) => {
      const mileage = getVehicleField(v, ['kilometrage', 'mileage'], '0');
      return sum + (Number(mileage) || 0);
    }, 0);
    const avgMileage = Math.round(totalMileage / totalVehicles);
    
    // Safely calculate average daily km with several field possibilities
    const totalDailyKm = vehicles.reduce((sum, v) => {
      const dailyKm = getVehicleField(v, ['km_quotidien_moyen', 'avg_daily_km'], '0');
      return sum + (Number(dailyKm) || 0);
    }, 0);
    const avgDailyKm = Math.round(totalDailyKm / totalVehicles);

    return { totalVehicles, avgMileage, avgDailyKm };
  };

  const { totalVehicles, avgMileage, avgDailyKm } = calculateStats();

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
        <h1 className="text-3xl font-bold">Gestion des Véhicules</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FilterIcon className="w-4 h-4 mr-2" />
            Filtrer
          </Button>
          <Button variant="outline" onClick={fetchVehicles} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouveau Véhicule
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
              <CardTitle className="text-sm font-medium">Total Véhicules</CardTitle>
              <CardDescription>Parc automobile</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalVehicles}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Kilomètrage Moyen</CardTitle>
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
              <CardTitle className="text-sm font-medium">Moyenne Quotidienne</CardTitle>
              <CardDescription>km/jour</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {avgDailyKm} km/jour
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vehicles table */}
        <Card>
          <CardHeader>
            <CardTitle>Véhicules</CardTitle>
            <CardDescription>Gérez votre parc automobile</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plaque</TableHead>
                  <TableHead>Marque</TableHead>
                  <TableHead>Modèle</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Kilométrage</TableHead>
                  <TableHead>Moyenne (km/jour)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : vehicles.length > 0 ? (
                  // Display vehicles
                  vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {getVehicleField(vehicle, ['immatriculation', 'license_plate'])}
                      </TableCell>
                      <TableCell>
                        {getVehicleField(vehicle, ['marque', 'brand'])}
                      </TableCell>
                      <TableCell>
                        {getVehicleField(vehicle, ['modele', 'model'])}
                      </TableCell>
                      <TableCell>
                        {getVehicleField(vehicle, ['annee', 'year'])}
                      </TableCell>
                      <TableCell>
                        {getVehicleField(vehicle, ['kilometrage', 'mileage'], '-') !== '-' 
                          ? `${formatNumber(getVehicleField(vehicle, ['kilometrage', 'mileage']))} km`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {getVehicleField(vehicle, ['km_quotidien_moyen', 'avg_daily_km'], '-') !== '-'
                          ? `${getVehicleField(vehicle, ['km_quotidien_moyen', 'avg_daily_km'])} km/jour`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Détails</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No vehicles
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Aucun véhicule trouvé
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

export default VehiclesPage; 