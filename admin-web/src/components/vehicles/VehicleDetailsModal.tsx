import React, { useState, useEffect, useRef} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, X, RefreshCcw, UserRound, Phone, Mail, Edit, Save, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Vehicle } from "@/types/vehicle";

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
  // TOUS les hooks doivent être ici, AVANT toute logique conditionnelle
  const { token, refreshToken, authAxios, isAuthenticated } = useAuth();
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [availableOwners, setAvailableOwners] = useState<CustomerDetails[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);

  // Tous les useEffect ici
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && vehicle?.owner_username && 
        (!customerDetails || (customerDetails && customerDetails.username !== vehicle.owner_username))) {
      fetchCustomerDetails(vehicle.owner_username);
    }
    if (!isOpen || !vehicle) {
      setCustomerDetails(null);
      setCustomerError(null);
      setIsLoadingCustomer(false);
    }
  }, [isOpen, vehicle, token, customerDetails]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setEditedVehicle(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEditMode && vehicle) {
      setEditedVehicle({ ...vehicle });
    }
  }, [isEditMode, vehicle]);

  // useEffect pour charger les propriétaires disponibles (jamais conditionnel)
  useEffect(() => {
    if (isEditMode && availableOwners.length === 0 && token && !isLoadingOwners) {
      fetchAvailableOwners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, availableOwners.length, token, isLoadingOwners]);

  const fetchCustomerDetails = async (username: string) => {
    if (!token || !isAuthenticated) return;
    setIsLoadingCustomer(true);
    setCustomerError(null);
    try {
      const response = await authAxios.get('api/v1/users/customers/');
      if (response.status === 401 && refreshToken) {
        await refreshToken();
        setIsLoadingCustomer(false);
        return;
      }
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(`Erreur lors de la récupération des détails du client: ${response.statusText}`);
      }
      const responseData = await response.json();
      let customersArray = [];
      if (responseData.data && Array.isArray(responseData.data)) {
        customersArray = responseData.data;
      } else if (Array.isArray(responseData)) {
        customersArray = responseData;
      }
      const userData = customersArray.find((user: CustomerDetails) => user.username === username);
      if (!userData) {
        throw new Error(`Utilisateur ${username} non trouvé`);
      }
      setCustomerDetails(userData);
    } catch (err: any) {
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

  // La logique conditionnelle/return null vient APRES les hooks
  if (!vehicle) {
    return null;
  }

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

  // Fonction pour récupérer la liste des propriétaires disponibles
  const fetchAvailableOwners = async () => {
    if (!isEditMode) return;
    if (isLoadingOwners) return;
    if (availableOwners.length > 0) return;
    if (!token || !isAuthenticated) return;
    setIsLoadingOwners(true);
    try {
      const response = await authAxios.get('api/v1/users/customers/');
      if (response.status === 401 && refreshToken) {
        await refreshToken();
        setIsLoadingOwners(false);
        return;
      }
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(`Erreur lors de la récupération des propriétaires: ${response.statusText}`);
      }
      const responseData = await response.json();
      let ownersArray = [];
      if (responseData.data && Array.isArray(responseData.data)) {
        ownersArray = responseData.data;
      } else if (Array.isArray(responseData)) {
        ownersArray = responseData;
      }
      setAvailableOwners(ownersArray);
    } catch (error) {
      toast.error("Impossible de charger la liste des propriétaires", {
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      });
    } finally {
      setIsLoadingOwners(false);
    }
  };

  // Fonction pour gérer le changement de propriétaire
  const handleOwnerChange = (ownerId: string) => {
    if (editedVehicle && ownerId) {
      const selectedOwner = availableOwners.find(owner => owner.id.toString() === ownerId);
      
      setEditedVehicle({
        ...editedVehicle,
        owner_id: parseInt(ownerId),
        // Mettre à jour le nom du propriétaire pour l'affichage (pas envoyé au backend)
        owner_username: selectedOwner?.username || ''
      });
    }
  };

  // Function to handle saving vehicle changes
  const handleSaveChanges = async () => {
    if (!editedVehicle || !vehicle.id) return;
    setIsSaving(true);
    try {
      console.log('[VehicleDetailsModal] Saving vehicle changes:', editedVehicle);
      const payload = {
        registration_number: editedVehicle.registration_number,
        make: editedVehicle.make,
        model: editedVehicle.model,
        year: editedVehicle.year,
        initial_mileage: editedVehicle.initial_mileage,
        owner_id: editedVehicle.owner_id
      };
      console.log('[VehicleDetailsModal] Sending payload with owner_id:', payload);
      const response = await authAxios.put(`api/v1/vehicles/${vehicle.id}/`, { json: payload });
      if (response.status === 200) {
        toast.success('Véhicule mis à jour', {
          description: 'Les modifications ont été enregistrées avec succès.',
        });
        Object.assign(vehicle, editedVehicle);
        setIsEditMode(false);
        setEditedVehicle(null);
      } else {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('[VehicleDetailsModal] Error saving vehicle:', err);
      if (err.response) {
        const errorData = await err.response.json();
        toast.error('Erreur', { description: JSON.stringify(errorData) });
      } else if (
        err instanceof Error && (
          err.message.includes('Authentification requise') ||
          err.message.includes('session expirée') ||
          err.message.includes('token_not_valid')
        )
      ) {
        navigate('/login');
        return;
      } else {
        toast.error('Erreur', {
          description: err instanceof Error ? err.message : "Une erreur s'est produite lors de la sauvegarde.",
        });
      }
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
              
              {/* Nouveau champ pour sélectionner un propriétaire */}
              <div className="space-y-2">
                <label htmlFor="owner_id" className="text-sm font-medium flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Propriétaire
                </label>
                <Select 
                  onValueChange={handleOwnerChange} 
                  defaultValue={editedVehicle.owner_id?.toString() || ''}
                  disabled={isLoadingOwners}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un propriétaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOwners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id.toString()}>
                        {owner.first_name} {owner.last_name} ({owner.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoadingOwners && <p className="text-xs text-muted-foreground">Chargement des propriétaires...</p>}
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