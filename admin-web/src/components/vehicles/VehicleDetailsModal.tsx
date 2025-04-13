import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, X, RefreshCcw, UserRound, Phone, Mail, Edit, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CustomerDetails {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  phone_number?: string;
  profile?: {
    phone_number?: string;
    email_verified?: boolean;
  };
}

interface Vehicle {
  id: number;
  registration_number?: string;
  make?: string;
  model?: string;
  year?: number;
  initial_mileage?: number;
  average_daily_km?: number;
  owner_username?: string;
  owner_id?: number;
  // Fallback fields
  immatriculation?: string;
  marque?: string;
  modele?: string;
  annee?: number;
  kilometrage?: string;
  license_plate?: string;
  brand?: string;
  mileage?: number;
}

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  vehicle, 
}) => {
  console.log(`[VehicleDetailsModal] Rendering. isOpen: ${isOpen}, vehicle ID: ${vehicle?.id}`);

  const { token, refreshToken, authAxios } = useAuth();
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Reference to the close button for focus management
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Effect to set focus when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      // Set focus to close button after modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    console.log(`[VehicleDetailsModal] useEffect triggered. isOpen: ${isOpen}, vehicle?.owner_username: ${vehicle?.owner_username}, customerDetails exists: ${!!customerDetails}`);
    
    if (isOpen && vehicle?.owner_username && !customerDetails) {
      console.log(`[VehicleDetailsModal] useEffect condition met, calling fetchCustomerDetails for ${vehicle.owner_username}`);
      fetchCustomerDetails(vehicle.owner_username);
    }
    
    if (!isOpen || !vehicle) {
        console.log(`[VehicleDetailsModal] useEffect cleanup/reset condition met.`);
        setCustomerDetails(null);
        setCustomerError(null);
        setIsLoadingCustomer(false);
    }
  }, [isOpen, vehicle, token, customerDetails]);

  // Effect to reset edit mode when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setEditedVehicle(null);
    }
  }, [isOpen]);

  // Effect to initialize edited vehicle when entering edit mode
  useEffect(() => {
    if (isEditMode && vehicle) {
      setEditedVehicle({
        ...vehicle
      });
    }
  }, [isEditMode, vehicle]);

  // Function to fetch customer profile with detailed info
  const fetchCustomerProfile = async (username: string) => {
    console.log(`[VehicleDetailsModal] Attempting to fetch detailed customer profile for: ${username}`);
    setIsLoadingCustomer(true);
    setCustomerError(null);
    
    try {
      // Try directly getting user information again to see if we get updated info
      // Since the profile specific endpoint seems to be missing
      const response = await fetch(`/api/v1/users/customers/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Token expired, try to use refresh token functionality if available
      if (response.status === 401 && refreshToken) {
        console.log(`[VehicleDetailsModal] Token expired, attempting to refresh...`);
        await refreshToken();
        // Retry with new token
        return fetchCustomerProfile(username);
      }

      if (!response.ok) {
        console.log(`[VehicleDetailsModal] Customer profile endpoint failed with status: ${response.status}`);
        throw new Error(`Erreur lors de la récupération du profil client: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(`[VehicleDetailsModal] Customer profile data fetched:`, responseData);
      
      // Improved customer data parsing - handle different response formats
      let customersArray = [];
      if (responseData.data && Array.isArray(responseData.data)) {
        customersArray = responseData.data;
      } else if (Array.isArray(responseData)) {
        customersArray = responseData;
      }
      
      console.log(`[VehicleDetailsModal] Extracted customers array:`, customersArray);
      
      // Find the specific customer with matching username
      const userData = customersArray.find((user: any) => user.username === username);
      
      if (!userData) {
        throw new Error(`Utilisateur ${username} non trouvé`);
      }
      
      console.log(`[VehicleDetailsModal] Found updated customer profile:`, userData);
      
      // Update customer details with the new information
      setCustomerDetails(userData);
      
    } catch (err) {
      console.error(`[VehicleDetailsModal] Error fetching customer profile:`, err);
      setCustomerError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération du profil');
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const fetchCustomerDetails = async (username: string) => {
    console.log(`[VehicleDetailsModal] fetchCustomerDetails function started for username: ${username}`);
    setIsLoadingCustomer(true);
    setCustomerError(null);
    
    try {
      // Using /api/v1/users/customers/ endpoint instead of individual user endpoint that's 404ing
      const response = await fetch(`/api/v1/users/customers/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Token expired, try to use refresh token functionality if available
      if (response.status === 401 && refreshToken) {
        console.log(`[VehicleDetailsModal] Token expired, attempting to refresh...`);
        await refreshToken();
        // Retry with new token
        return fetchCustomerDetails(username);
      }

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des détails du client: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(`[VehicleDetailsModal] Customers data fetched:`, responseData);
      
      // Improved customer data parsing - handle different response formats
      let customersArray = [];
      if (responseData.data && Array.isArray(responseData.data)) {
        customersArray = responseData.data;
      } else if (Array.isArray(responseData)) {
        customersArray = responseData;
      }
      
      console.log(`[VehicleDetailsModal] Extracted customers array:`, customersArray);
      
      // Find the specific customer with matching username
      const userData = customersArray.find((user: any) => user.username === username);
      
      if (!userData) {
        console.log(`[VehicleDetailsModal] No customer found with username: ${username}`);
        console.log(`[VehicleDetailsModal] Available usernames:`, customersArray.map((u: any) => u.username));
        throw new Error(`Utilisateur ${username} non trouvé`);
      }
      
      console.log(`[VehicleDetailsModal] Found matching customer:`, userData);
      
      // Check if phone and email are missing
      if (!userData.phone && !userData.email) {
        console.log(`[VehicleDetailsModal] Customer ${username} is missing phone and email. Will attempt to fetch profile.`);
      }
      
      setCustomerDetails(userData);
    } catch (err) {
      console.error(`[VehicleDetailsModal] Error fetching customer details:`, err);
      setCustomerError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // Helper to get the best available field with fallbacks
  const getVehicleField = (fields: string[], defaultValue: string = '-') => {
    for (const field of fields) {
      const value = vehicle[field as keyof Vehicle];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
    return defaultValue;
  };

  // Format number with French locale
  const formatNumber = (value?: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num !== undefined && num !== null && !isNaN(num)
      ? num.toLocaleString('fr-FR') 
      : '0';
  };

  if (!vehicle) {
    console.log(`[VehicleDetailsModal] No vehicle provided, rendering null.`);
    return null; 
  }

  // Handler for the Fetch Profile button
  const handleFetchProfile = () => {
    if (vehicle?.owner_username) {
      fetchCustomerProfile(vehicle.owner_username);
    }
  };

  // Create descriptive modal title for screen readers
  const vehicleName = `${getVehicleField(['make', 'marque', 'brand'])} ${getVehicleField(['model', 'modele'])}`;
  const modalTitle = `Détails du ${vehicleName} (${getVehicleField(['registration_number', 'immatriculation', 'license_plate'])})`;
  
  console.log(`[VehicleDetailsModal] Rendering Dialog component.`);

  // Function to handle input changes for edit mode
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editedVehicle) {
      setEditedVehicle({
        ...editedVehicle,
        [name]: value
      });
    }
  };

  // Function to handle saving vehicle changes
  const handleSaveChanges = async () => {
    if (!editedVehicle || !vehicle.id) return;
    
    setIsSaving(true);
    
    try {
      console.log('[VehicleDetailsModal] Saving vehicle changes:', editedVehicle);
      
      // Extract owner_id from the customer details if available
      const ownerId = customerDetails?.id || vehicle.owner_id;
      
      const response = await authAxios.put(`/api/v1/vehicles/${vehicle.id}/`, {
        registration_number: editedVehicle.registration_number,
        make: editedVehicle.make,
        model: editedVehicle.model,
        year: editedVehicle.year,
        initial_mileage: editedVehicle.initial_mileage,
        owner_id: ownerId // Add the required owner_id field
      });
      
      if (response.status === 200) {
        toast.success('Véhicule mis à jour', {
          description: 'Les modifications ont été enregistrées avec succès.',
        });
        
        // Update the vehicle data in the parent component
        Object.assign(vehicle, editedVehicle);
        
        // Exit edit mode
        setIsEditMode(false);
        setEditedVehicle(null);
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('[VehicleDetailsModal] Error saving vehicle:', err);
      toast.error('Erreur', {
        description: err instanceof Error ? err.message : "Une erreur s'est produite lors de la sauvegarde.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onOpenChange}
    >
      <DialogContent 
        className="max-w-2xl"
        aria-labelledby="vehicle-details-title"
        aria-describedby="vehicle-details-description"
        role="dialog"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle id="vehicle-details-title" className="text-foreground">{modalTitle}</DialogTitle>
          <DialogDescription id="vehicle-details-description" className="text-muted-foreground">
            {isEditMode ? 'Modifier les informations du véhicule' : 'Informations complètes sur le véhicule'}
          </DialogDescription>
          <DialogClose asChild>
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8"
              aria-label="Fermer la boîte de dialogue"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        {isEditMode && editedVehicle ? (
          // Edit mode - show edit form
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="registration_number" className="text-sm font-medium">
                  Plaque d'immatriculation
                </label>
                <Input
                  id="registration_number"
                  name="registration_number"
                  value={editedVehicle.registration_number || ''}
                  onChange={handleInputChange}
                  placeholder="123TU1234"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="make" className="text-sm font-medium">
                  Marque
                </label>
                <Input
                  id="make"
                  name="make"
                  value={editedVehicle.make || ''}
                  onChange={handleInputChange}
                  placeholder="Renault"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="model" className="text-sm font-medium">
                  Modèle
                </label>
                <Input
                  id="model"
                  name="model"
                  value={editedVehicle.model || ''}
                  onChange={handleInputChange}
                  placeholder="Clio"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium">
                  Année
                </label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={editedVehicle.year || ''}
                  onChange={handleInputChange}
                  placeholder="2020"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="initial_mileage" className="text-sm font-medium">
                  Kilométrage initial
                </label>
                <Input
                  id="initial_mileage"
                  name="initial_mileage"
                  type="number"
                  value={editedVehicle.initial_mileage || ''}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMode(false)}
                disabled={isSaving}
                className="mr-auto"
              >
                Annuler
              </Button>
              <Button 
                type="button" 
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // View mode - show vehicle details
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card className="border bg-card">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2 text-foreground" id="vehicle-info-heading">Informations Véhicule</h3>
                  <div className="space-y-2" aria-labelledby="vehicle-info-heading">
                    <div className="grid grid-cols-2">
                      <span className="text-muted-foreground">Plaque</span>
                      <span className="font-medium text-foreground">{getVehicleField(['registration_number', 'immatriculation', 'license_plate'])}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-muted-foreground">Marque</span>
                      <span className="font-medium text-foreground">{getVehicleField(['make', 'marque', 'brand'])}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-muted-foreground">Modèle</span>
                      <span className="font-medium text-foreground">{getVehicleField(['model', 'modele'])}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-muted-foreground">Année</span>
                      <span className="font-medium text-foreground">{getVehicleField(['year', 'annee'])}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-muted-foreground">Kilométrage Initial</span>
                      <span className="font-medium text-foreground">{formatNumber(getVehicleField(['initial_mileage', 'kilometrage', 'mileage'], '0'))} km</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-muted-foreground">Moyenne Quotidienne</span>
                      <span className="font-medium text-foreground">{formatNumber(getVehicleField(['average_daily_km', 'km_quotidien_moyen', 'avg_daily_km'], '0'))} km/jour</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border bg-card">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground whitespace-nowrap" id="owner-info-heading">Propriétaire</h3>
                    {vehicle.owner_username && (
                      <Button 
                        onClick={handleFetchProfile}
                        variant="outline" 
                        size="sm"
                        className="h-8 px-2 text-xs sm:text-sm flex-shrink-0"
                        disabled={isLoadingCustomer}
                        aria-label="Récupérer le profil complet"
                      >
                        <RefreshCcw className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                        <span className="whitespace-nowrap">Profil complet</span>
                      </Button>
                    )}
                  </div>
                  
                  {customerError && (
                    <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erreur</AlertTitle>
                      <AlertDescription>{customerError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {isLoadingCustomer ? (
                    <div className="space-y-2" aria-label="Chargement des informations du propriétaire">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : customerDetails ? (
                    <div className="space-y-2" aria-labelledby="owner-info-heading">
                      <div className="grid grid-cols-2 items-center">
                        <span className="text-muted-foreground flex items-center">
                          <UserRound className="h-3.5 w-3.5 mr-1.5" />
                          Nom
                        </span>
                        <span className="font-medium text-foreground">{customerDetails.first_name} {customerDetails.last_name}</span>
                      </div>
                      <div className="grid grid-cols-2 items-center">
                        <span className="text-muted-foreground flex items-center">
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                          Email
                        </span>
                        <span className="font-medium text-foreground">
                          {customerDetails.email || (
                            <span className="text-muted-foreground italic">Non disponible</span>
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 items-center">
                        <span className="text-muted-foreground flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          Téléphone
                        </span>
                        <span className="font-medium text-foreground">
                          {customerDetails.phone_number || customerDetails.profile?.phone_number || (
                            <span className="text-muted-foreground italic">Non disponible</span>
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 items-center">
                        <span className="text-muted-foreground">Identifiant</span>
                        <span className="font-medium text-foreground">{customerDetails.username}</span>
                      </div>
                      
                      {(!customerDetails.email || !customerDetails.phone) && (
                        <Alert className="mt-3" role="status">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Informations incomplètes</AlertTitle>
                          <AlertDescription>
                            Certaines informations de contact sont manquantes.
                            {vehicle.owner_username && (
                              <Button 
                                onClick={handleFetchProfile}
                                variant="link" 
                                className="p-0 ml-1 h-auto text-foreground underline"
                              >
                                Récupérer le profil complet
                              </Button>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : vehicle.owner_username ? (
                    <div className="p-4 text-muted-foreground">
                      Informations du propriétaire non disponibles pour {vehicle.owner_username}
                    </div>
                  ) : (
                    <div className="p-4 text-muted-foreground">
                      Aucun propriétaire associé à ce véhicule
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button 
                onClick={() => setIsEditMode(true)}
                variant="secondary"
                className="mr-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Fermer les détails du véhicule"
              >
                Fermer
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}; 