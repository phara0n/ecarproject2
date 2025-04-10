import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthProvider"; // Import useAuth
import { DataTable } from "@/components/ui/data-table"; // Import the DataTable component
import { columns, Vehicle } from "@/components/tables/vehicles/columns"; // Import columns and type

// Function to fetch vehicles from the API
async function getVehicles(token: string | null): Promise<Vehicle[]> {
  console.log("Fetching vehicles from API...");
  if (!token) {
    console.log("No token available, cannot fetch vehicles.");
    // Optionally throw an error or return empty array based on desired behavior
    // throw new Error("Authentication token is missing."); 
    return [];
  }

  try {
    const response = await fetch('/api/v1/vehicles/', { // <<<--- API ENDPOINT
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
    }

    const responseData = await response.json();

    // IMPORTANT: Check if the actual vehicle list is nested (e.g., inside responseData.data)
    // Adjust this line based on your actual API response structure
    const vehiclesData = responseData.data || responseData; // <<<--- ADJUST IF NEEDED

    if (!Array.isArray(vehiclesData)) {
      console.error("API response for vehicles is not an array:", responseData);
      throw new Error("Format de réponse API inattendu pour les véhicules.");
    }
    
    console.log("Vehicles fetched successfully.");
    // TODO: Ensure the data structure matches the Vehicle type defined in columns.tsx
    // You might need to map/transform the data here if the API fields don't match exactly
    // e.g., adding owner_name if it's nested or needs separate fetch
    return vehiclesData as Vehicle[];

  } catch (error) {
    console.error("Error fetching vehicles:", error);
    throw error; // Re-throw error to be handled by the component
  }
}

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State for error messages
  const { token, isLoading: isAuthLoading } = useAuth(); // Get token and auth loading state

  useEffect(() => {
    // Only fetch vehicles if authentication is not loading and token exists
    if (!isAuthLoading) {
      setIsLoading(true);
      setError(null);
      getVehicles(token)
        .then(data => {
          setVehicles(data);
        })
        .catch(err => {
          console.error("Failed to fetch vehicles in component:", err);
          setError(err.message || "Impossible de charger les véhicules.");
        })
        .finally(() => {
           setIsLoading(false);
        });
    } else {
       // If auth is still loading, set table loading state accordingly
       setIsLoading(true); 
    }
  }, [token, isAuthLoading]); // Re-run effect if token or auth loading state changes

  // Display loading state for auth check or data fetching
  if (isLoading || isAuthLoading) {
      return (
          <div className="container mx-auto py-6 space-y-6">
              <h1 className="text-2xl font-semibold text-foreground">Gestion des Véhicules</h1>
              <div>Chargement des données...</div> {/* Replace with Skeleton loader later */}
          </div>
      );
  }
  
  // Display error state
  if (error) {
      return (
          <div className="container mx-auto py-6 space-y-6">
              <h1 className="text-2xl font-semibold text-foreground">Gestion des Véhicules</h1>
              <div className="text-destructive">Erreur: {error}</div>
          </div>
      );
  }

  // Display table when loaded and no error
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Gestion des Véhicules</h1>
      
      {/* TODO: Add filters or action buttons here later (e.g., Add New Vehicle button) */}
      
      <DataTable 
        columns={columns} 
        data={vehicles} 
        filterColumnId="license_plate" // Filter by license plate
        filterPlaceholder="Filtrer par plaque..."
      />
    </div>
  );
};

export default VehiclesPage; 