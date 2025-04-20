import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, ChevronsUpDown, Check, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";

// Type definitions
interface AddVehicleModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onVehicleAdded: () => void;
}

interface VehicleFormData {
  registration_number: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  initial_mileage: string;
}

interface CustomerFormData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  password2: string;
}

interface Customer {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface ValidationErrors {
  registration_number?: string;
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  initial_mileage?: string;
  owner?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_username?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_password?: string;
  customer_password2?: string;
}

type FormFields = keyof VehicleFormData | keyof CustomerFormData | 'owner';

// Créer un schéma de validation Zod pour les plaques d'immatriculation tunisiennes
const licensePlateSchema = z.string()
  .min(1, { error: "La plaque d'immatriculation est requise" })
  // Utilisation du nouveau système d'erreur de Zod v4
  .regex(/^\d{1,3}(TU|RS)\d{1,4}$/i, {
    error: (issue) => `Format de plaque d'immatriculation invalide. Utilisez le format: 123TU1234 ou 123RS1234. Reçu: "${issue.input}"`
  });

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ isOpen, onOpenChange, onVehicleAdded }) => {
  const { authAxios } = useAuth();

  // State Management
  const [addMode, setAddMode] = useState<'select' | 'create'>('select');
  const [vehicleFormData, setVehicleFormData] = useState<VehicleFormData>({
    registration_number: '',
    make: '',
    model: '',
    year: '',
    vin: '',
    initial_mileage: '',
  });
  const [customerFormData, setCustomerFormData] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password2: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<FormFields, boolean>>>({});

  // Re-add state for customer selection
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCustomerListLoading, setIsCustomerListLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [customerListError, setCustomerListError] = useState<string | null>(null);

  // Reset form - update to handle mode and all states
  const resetForm = () => {
    setAddMode('select');
    setVehicleFormData({ registration_number: '', make: '', model: '', year: '', vin: '', initial_mileage: '' });
    setCustomerFormData({ first_name: '', last_name: '', username: '', email: '', phone: '', password: '', password2: '' });
    setSelectedOwnerId(null);
    setCustomers([]);
    setServerError(null);
    setValidationErrors({});
    setTouchedFields({});
    setIsCustomerListLoading(false);
    setCustomerListError(null);
    setPopoverOpen(false);
  };

  // Effect to reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Update the fetchCustomers function to use authAxios
  const fetchCustomers = async () => {
    setIsCustomerListLoading(true);
    setCustomerListError(null);
    setCustomers([]);
    setSelectedOwnerId(null);

    try {
      console.log("[AddVehicleModal] Fetching customers from /api/v1/users/customers/");
      
      // Use Ky client through authAxios - separate response and json steps
      const response = await authAxios.get('api/v1/users/customers/');
      const responseData = await response.json();
      console.log("[AddVehicleModal] Customer list response:", responseData);
      
      const userList: Customer[] = Array.isArray(responseData.results) 
        ? responseData.results 
        : (Array.isArray(responseData.data)
            ? responseData.data
            : (Array.isArray(responseData) ? responseData : []));

      if (Array.isArray(userList)) {
        setCustomers(userList);
        console.log("[AddVehicleModal] Set customers:", userList);
      } else {
        console.warn("[AddVehicleModal] Invalid customer data format received.");
        throw new Error('Format de données client invalide.');
      }

    } catch (err) {
      const error: any = err;
      console.error("[AddVehicleModal] Error fetching customers:", error);
      // Handle Ky errors
      let errorMessage = 'Impossible de charger les clients';
      if (error.response && error.response.status) {
        errorMessage = `Erreur ${error.response.status}: ${error.response.statusText || 'Impossible de charger les clients'}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setCustomerListError(errorMessage);
    } finally {
      setIsCustomerListLoading(false);
    }
  };

  // Update the useEffect dependency to use authAxios instead of token
  useEffect(() => {
    if (isOpen && addMode === 'select') {
      fetchCustomers();
    }
    if (addMode !== 'select') {
      setSelectedOwnerId(null);
      const { owner, ...restErrors } = validationErrors;
      setValidationErrors(restErrors);
    }
  }, [isOpen, addMode]);

  // Get customer display name helper
  const getCustomerDisplayName = (customer: Customer | undefined) => {
    if (!customer) return "";
    // Prioritize First Name and Last Name
    if (customer.first_name && customer.last_name) {
      return `${customer.first_name} ${customer.last_name}`;
    }
    // Fallback to username if names are missing
    return customer.username;
  };

  // Update validation logic for both modes
  const validateField = (name: FormFields, value: string) => {
    const errors: ValidationErrors = { ...validationErrors };
    const phoneRegex = /^\+216\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Clear errors for the other mode's customer fields when validating one mode
    if (addMode === 'select' && name === 'owner') {
      delete errors.customer_first_name; delete errors.customer_last_name; delete errors.customer_username;
      delete errors.customer_email; delete errors.customer_phone; delete errors.customer_password;
    } else if (addMode === 'create' && name.startsWith('customer_')) {
      delete errors.owner;
    }
    
    switch (name) {
      case 'registration_number':
        const plateRegex = /^\d{3}TU\d{4}$/;
        if (!value) errors.registration_number = 'La plaque d\'immatriculation est requise';
        else if (!plateRegex.test(value)) errors.registration_number = 'Format invalide. Exemple: 123TU1234';
        else delete errors.registration_number;
        break;
      case 'make':
        if (!value) errors.make = 'La marque est requise'; else delete errors.make;
        break;
      case 'model':
        if (!value) errors.model = 'Le modèle est requis'; else delete errors.model;
        break;
      case 'year':
        if (value && (isNaN(Number(value)) || Number(value) < 1900 || Number(value) > new Date().getFullYear() + 1)) errors.year = 'Année invalide';
        else delete errors.year;
        break;
      case 'vin':
        if (value && value.length > 0 && value.length !== 17) errors.vin = 'Le VIN doit contenir 17 caractères';
        else delete errors.vin;
        break;
      case 'initial_mileage':
        if (!value) errors.initial_mileage = 'Le kilométrage initial est requis';
        else if (isNaN(Number(value)) || Number(value) < 0) errors.initial_mileage = 'Le kilométrage doit être un nombre positif';
        else delete errors.initial_mileage;
        break;
      case 'owner':
        if (addMode === 'select' && !selectedOwnerId) {
          errors.owner = 'Le propriétaire est requis';
        } else {
          delete errors.owner;
        }
        break;
      case 'first_name':
        if (addMode === 'create' && !value) errors.customer_first_name = 'Prénom requis'; else delete errors.customer_first_name;
        break;
      case 'last_name':
        if (addMode === 'create' && !value) errors.customer_last_name = 'Nom requis'; else delete errors.customer_last_name;
        break;
      case 'username':
        if (addMode === 'create' && !value) errors.customer_username = 'Nom d\'utilisateur requis';
        else if (addMode === 'create' && value.length < 3) errors.customer_username = 'Au moins 3 caractères';
        else delete errors.customer_username;
        break;
      case 'email':
        if (addMode === 'create' && !value) errors.customer_email = 'Email requis';
        else if (addMode === 'create' && !emailRegex.test(value)) errors.customer_email = 'Email invalide';
        else delete errors.customer_email;
        break;
      case 'phone':
        if (addMode === 'create' && !value) errors.customer_phone = 'Téléphone requis';
        else if (addMode === 'create' && !phoneRegex.test(value)) errors.customer_phone = 'Format: +216XXXXXXXX';
        else delete errors.customer_phone;
        break;
      case 'password':
        if (addMode === 'create' && !value) errors.customer_password = 'Mot de passe requis';
        else if (addMode === 'create' && value.length < 8) errors.customer_password = 'Doit contenir au moins 8 caractères';
        else delete errors.customer_password;
        if (addMode === 'create' && customerFormData.password2 && value !== customerFormData.password2) {
          errors.customer_password2 = 'Les mots de passe ne correspondent pas';
        } else if (addMode === 'create' && customerFormData.password2) {
          delete errors.customer_password2;
        }
        break;
      case 'password2':
        if (addMode === 'create' && !value) errors.customer_password2 = 'Confirmation requise';
        else if (addMode === 'create' && value !== customerFormData.password) errors.customer_password2 = 'Les mots de passe ne correspondent pas';
        else delete errors.customer_password2;
        break;
    }
    
    setValidationErrors(errors);
    const fieldErrorKey = name.startsWith('customer_') ? name as keyof ValidationErrors : (name === 'owner' ? 'owner' : name as keyof ValidationErrors);
    return !errors[fieldErrorKey];
  };

  // Update validateForm for both modes
  const validateForm = () => {
    const currentErrors: ValidationErrors = {};
    let isValid = true;

    // Validate vehicle fields (always required)
    if (!vehicleFormData.registration_number || !/^\d{3}TU\d{4}$/.test(vehicleFormData.registration_number)) { currentErrors.registration_number = 'Plaque invalide'; isValid = false; }
    if (!vehicleFormData.make) { currentErrors.make = 'Marque requise'; isValid = false; }
    if (!vehicleFormData.model) { currentErrors.model = 'Modèle requis'; isValid = false; }
    if (!vehicleFormData.initial_mileage || isNaN(Number(vehicleFormData.initial_mileage)) || Number(vehicleFormData.initial_mileage) < 0) { currentErrors.initial_mileage = 'Kilométrage invalide'; isValid = false; }
    if (vehicleFormData.year && (isNaN(Number(vehicleFormData.year)) || Number(vehicleFormData.year) < 1900 || Number(vehicleFormData.year) > new Date().getFullYear() + 1)) { currentErrors.year = 'Année invalide'; isValid = false; }
    if (vehicleFormData.vin && vehicleFormData.vin.length > 0 && vehicleFormData.vin.length !== 17) { currentErrors.vin = 'VIN invalide'; isValid = false; }

    // Validate based on mode
    if (addMode === 'select') {
      if (!selectedOwnerId) { currentErrors.owner = 'Propriétaire requis'; isValid = false; }
    } else { // 'create' mode
      if (!customerFormData.first_name) { currentErrors.customer_first_name = 'Prénom requis'; isValid = false; }
      if (!customerFormData.last_name) { currentErrors.customer_last_name = 'Nom requis'; isValid = false; }
      if (!customerFormData.username || customerFormData.username.length < 3) { currentErrors.customer_username = 'Nom d\'utilisateur invalide'; isValid = false; }
      if (!customerFormData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerFormData.email)) { currentErrors.customer_email = 'Email invalide'; isValid = false; }
      if (!customerFormData.phone || !/^\+216\d{8}$/.test(customerFormData.phone)) { currentErrors.customer_phone = 'Téléphone invalide'; isValid = false; }
      if (!customerFormData.password || customerFormData.password.length < 8) { currentErrors.customer_password = 'Mot de passe invalide (min 8 caractères)'; isValid = false; }
      if (!customerFormData.password2) { currentErrors.customer_password2 = 'Confirmation requise'; isValid = false; }
      else if (customerFormData.password !== customerFormData.password2) { currentErrors.customer_password2 = 'Ne correspond pas'; isValid = false; }
    }

    setValidationErrors(currentErrors);

    // Mark all *relevant* fields as touched
    const vehicleTouched = Object.keys(vehicleFormData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    const customerTouched = addMode === 'create'
      ? Object.keys(customerFormData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      : { owner: true };
    setTouchedFields({ ...vehicleTouched, ...customerTouched } as Partial<Record<FormFields, boolean>>);

    return isValid;
  };

  // Update handleInputChange
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    field: FormFields
  ) => {
    if (field === 'registration_number') {
      const value = e.target.value.toUpperCase();
      setVehicleFormData({
        ...vehicleFormData,
        registration_number: value
      });
      
      // Valider avec le schéma Zod
      try {
        licensePlateSchema.parse(value);
        // Si valide, effacer l'erreur
        setValidationErrors({
          ...validationErrors,
          registration_number: undefined
        });
      } catch (error) {
        // Si le format est incorrect et que l'utilisateur a commencé à taper
        if (value && value.length > 2) {
          setValidationErrors({
            ...validationErrors,
            registration_number: "Format de plaque d'immatriculation invalide. Utilisez le format: 123TU1234 ou 123RS1234"
          });
        }
      }
    } else {
      // Gestion normale pour les autres champs
      if (field in vehicleFormData) {
        setVehicleFormData(prev => ({
          ...prev,
          [field]: e.target.value
        }));
        // Clear error when field is edited
        if (validationErrors[field as keyof ValidationErrors]) {
          setValidationErrors({
            ...validationErrors,
            [field]: undefined
          });
        }
      } else if (field in customerFormData) {
        setCustomerFormData(prev => ({
          ...prev,
          [field]: e.target.value
        }));
        // Clear error when field is edited
        if (validationErrors[field as keyof ValidationErrors]) {
          setValidationErrors({
            ...validationErrors,
            [field]: undefined
          });
        }
      }
    }
  };

  // Re-introduce handleOwnerSelect
  const handleOwnerSelect = (ownerId: number) => {
    setSelectedOwnerId(ownerId);
    setPopoverOpen(false);
    setTouchedFields(prev => ({ ...prev, owner: true }));
    validateField('owner', String(ownerId));
  };

  // Update handleSubmit for both modes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
    if (!validateForm()) {
      console.log("Validation Errors:", validationErrors);
      return;
    }
    
    setIsLoading(true);
    let ownerIdToUse: number | null = null;

    // --- Step 1: Determine Owner ID (either selected or newly created) ---
    if (addMode === 'select') {
      ownerIdToUse = selectedOwnerId;
    } else { // 'create' mode
      try {
        console.log("[AddVehicleModal] Creating customer:", customerFormData);
        const customerPayload = {
          username: customerFormData.username,
          password: customerFormData.password,
          password2: customerFormData.password2,
          email: customerFormData.email,
          first_name: customerFormData.first_name,
          last_name: customerFormData.last_name,
          phone_number: customerFormData.phone,
        };

        // Use direct ky for customer creation (no token needed for registration)
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const customerResponse = await fetch(`${baseURL}/api/v1/register/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerPayload),
        });

        if (!customerResponse.ok) {
          let errorMessage = `Erreur ${customerResponse.status} lors de la création du client`;
          try {
            const errorData = await customerResponse.json();
            if (typeof errorData === 'object' && errorData !== null) {
              const fieldErrors = Object.entries(errorData)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('; ');
              if (fieldErrors) {
                errorMessage += `: ${fieldErrors}`;
              } else {
                errorMessage += `: ${customerResponse.statusText}`;
              }
            } else {
              errorMessage += `: ${customerResponse.statusText}`;
            }
          } catch (parseError) {
            errorMessage += `: ${customerResponse.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const newCustomerData = await customerResponse.json();
        console.log("[AddVehicleModal] Raw customer creation response body:", JSON.stringify(newCustomerData, null, 2));

        // Extract the customer ID as before...
        let createdId: number | string | null | undefined = null;

        if (typeof newCustomerData === 'object' && newCustomerData !== null) {
            createdId = 
                newCustomerData.id ||          // Direct ID
                newCustomerData.pk ||          // Primary key
                newCustomerData.user_id ||     // User ID field
                newCustomerData.data?.id ||     // ID nested in 'data'
                newCustomerData.data?.pk ||     // PK nested in 'data'
                newCustomerData.data?.user?.id; // ID nested in 'data.user'
        }

        console.log("[AddVehicleModal] Attempted to extract ID. Value found:", createdId);

        if (!createdId) {
          console.error("Could not find customer ID in response:", newCustomerData);
          throw new Error("Impossible de trouver l'ID du client dans la réponse de l'API après création.");
        }
        ownerIdToUse = Number(createdId);

      } catch (err) {
        // Error handling for customer creation as before...
        console.error("[AddVehicleModal] Error creating customer:", err);
        let specificErrorMessage = 'Échec création client';
        if (err instanceof Error && err.message.includes('Erreur 400')) { 
          try {
            const jsonErrorString = err.message.substring(err.message.indexOf(':') + 1).trim();
            const errorData = JSON.parse(jsonErrorString); 
            
            if (typeof errorData === 'object' && errorData !== null) {
               const fieldErrors = Object.entries(errorData)
                 .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                 .join('; ');
               if (fieldErrors) {
                   specificErrorMessage = `Erreurs de validation: ${fieldErrors}`;
               } else if (errorData.detail) {
                   specificErrorMessage = errorData.detail; 
               } else if (errorData.error) { 
                   if (typeof errorData.error === 'object' && errorData.error !== null) {
                       specificErrorMessage = errorData.error.message || JSON.stringify(errorData.error);
                   } else {
                      specificErrorMessage = String(errorData.error);
                   }
               }
            } else {
                specificErrorMessage = jsonErrorString;
            }
          } catch (parseErr) {
             specificErrorMessage = err.message; 
          }
        } else if (err instanceof Error) {
             specificErrorMessage = err.message;
        }
        setServerError(specificErrorMessage);
        setIsLoading(false);
        return;
      }
    }

    // --- Step 2: Create Vehicle (if owner ID is determined) ---
    if (ownerIdToUse !== null) {
      try {
        console.log(`[AddVehicleModal] Creating vehicle for owner ID: ${ownerIdToUse}`);
        const vehiclePayload = {
          registration_number: vehicleFormData.registration_number,
          make: vehicleFormData.make,
          model: vehicleFormData.model,
          year: vehicleFormData.year ? parseInt(vehicleFormData.year, 10) : null,
          vin: vehicleFormData.vin || null,
          initial_mileage: parseInt(vehicleFormData.initial_mileage, 10),
          owner_id: ownerIdToUse
        };

        // Use authAxios with Ky syntax for vehicle creation
        const response = await authAxios.post('api/v1/vehicles/', {
          json: vehiclePayload
        });
        const responseData = await response.json();
        
        console.log("[AddVehicleModal] Vehicle created successfully:", responseData);
        onVehicleAdded();
        onOpenChange(false);
      } catch (err) {
        const error: any = err;
        console.error("[AddVehicleModal] Error creating vehicle:", error);
        // Handle Ky errors
        const action = addMode === 'create' ? `Client créé (ID: ${ownerIdToUse}), mais ` : '';
        let errorMessage = 'Erreur inconnue';
        
        if (error.response) {
          try {
            const errorData = await error.response.json();
            errorMessage = errorData?.detail || errorData?.error || JSON.stringify(errorData);
          } catch (parseError) {
            errorMessage = `Erreur ${error.response.status}: ${error.response.statusText}`;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        setServerError(`${action}échec ajout véhicule: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      setServerError("Erreur interne: ID propriétaire non déterminé.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-card text-card-foreground">
        <DialogHeader className="px-6 pt-6 pb-2 bg-card text-card-foreground">
          <DialogTitle className="text-xl font-semibold text-foreground">Ajouter un Véhicule</DialogTitle>
          <DialogDescription className="text-foreground/80">
            Sélectionnez un propriétaire existant ou créez-en un nouveau, puis entrez les détails du véhicule.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(85vh-200px)] px-6 bg-card text-card-foreground">
          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          {customerListError && addMode === 'select' && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{customerListError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6 py-4">
            <RadioGroup
              defaultValue="select"
              value={addMode}
              onValueChange={(value) => setAddMode(value as 'select' | 'create')}
              className="flex space-x-4 border-b pb-4 mb-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="select" id="r1" />
                <Label htmlFor="r1" className="font-medium">Sélectionner Client Existant</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create" id="r2" />
                <Label htmlFor="r2" className="font-medium">Créer Nouveau Client</Label>
              </div>
            </RadioGroup>

            {addMode === 'select' ? (
            <div className="space-y-2">
              <Label htmlFor="owner" className="text-sm font-semibold text-foreground" aria-required="true">
                  Propriétaire <span className="text-destructive font-bold ml-1">*</span>
              </Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className={cn(
                        "w-full justify-between font-normal h-10 text-left bg-background hover:bg-accent hover:text-accent-foreground",
                      touchedFields.owner && validationErrors.owner ? "border-destructive" : ""
                    )}
                    disabled={isCustomerListLoading || customers.length === 0}
                  >
                    {selectedOwnerId
                        ? getCustomerDisplayName(customers.find((c) => c.id === selectedOwnerId))
                        : isCustomerListLoading ? "Chargement..." : (customers.length === 0 ? "Aucun client disponible" : "Sélectionnez...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover text-popover-foreground">
                  <Command className="bg-popover text-popover-foreground">
                      <CommandInput placeholder="Rechercher..." className="text-foreground" />
                    <CommandList className="bg-popover text-popover-foreground">
                      <CommandEmpty>Aucun client trouvé</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={getCustomerDisplayName(customer)}
                            onSelect={() => handleOwnerSelect(customer.id)}
                            className={cn(
                                touchedFields.owner && validationErrors.owner ? "border-destructive" : "",
                                customer.id === selectedOwnerId ? "bg-accent" : ""
                              )}
                            >
                              <Check className={cn(
                                touchedFields.owner && validationErrors.owner ? "text-destructive" : "",
                                customer.id === selectedOwnerId ? "text-primary" : ""
                              )}/>
                            <span className="text-foreground">{getCustomerDisplayName(customer)}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {touchedFields.owner && validationErrors.owner && (
                <p className="text-sm text-destructive font-medium mt-1">{validationErrors.owner}</p>
              )}
            </div>
            ) : (
              <Card className="border border-border/60 shadow-sm bg-card">
                <CardContent className="p-4 pt-4">
                  <div className="text-lg font-semibold mb-4 text-foreground">Nouveau Client</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-sm font-semibold text-foreground" aria-required="true">
                        Prénom <span className="text-destructive font-bold ml-1">*</span>
                      </Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={customerFormData.first_name}
                        onChange={(e) => handleInputChange(e, 'first_name')}
                        className={cn("h-10 bg-background text-foreground", touchedFields.first_name && validationErrors.customer_first_name ? "border-destructive" : "border-input")}
                        placeholder="Prénom"
                      />
                      {touchedFields.first_name && validationErrors.customer_first_name && (<p className="text-sm text-destructive font-medium">{validationErrors.customer_first_name}</p>)}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-semibold text-foreground" aria-required="true">
                        Nom <span className="text-destructive font-bold ml-1">*</span>
                      </Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={customerFormData.last_name}
                        onChange={(e) => handleInputChange(e, 'last_name')}
                        className={cn("h-10 bg-background text-foreground", touchedFields.last_name && validationErrors.customer_last_name ? "border-destructive" : "border-input")}
                        placeholder="Nom de famille"
                      />
                      {touchedFields.last_name && validationErrors.customer_last_name && (<p className="text-sm text-destructive font-medium">{validationErrors.customer_last_name}</p>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-semibold text-foreground" aria-required="true">
                        Nom d'utilisateur <span className="text-destructive font-bold ml-1">*</span>
                      </Label>
                      <Input
                        id="username"
                        name="username"
                        value={customerFormData.username}
                        onChange={(e) => handleInputChange(e, 'username')}
                        className={cn("h-10 bg-background text-foreground", touchedFields.username && validationErrors.customer_username ? "border-destructive" : "border-input")}
                        placeholder="utilisateur123"
                      />
                      {touchedFields.username && validationErrors.customer_username && (<p className="text-sm text-destructive font-medium">{validationErrors.customer_username}</p>)}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground" aria-required="true">
                        Email <span className="text-destructive font-bold ml-1">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={customerFormData.email}
                        onChange={(e) => handleInputChange(e, 'email')}
                        className={cn("h-10 bg-background text-foreground", touchedFields.email && validationErrors.customer_email ? "border-destructive" : "border-input")}
                        placeholder="email@example.com"
                      />
                      {touchedFields.email && validationErrors.customer_email && (<p className="text-sm text-destructive font-medium">{validationErrors.customer_email}</p>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-foreground" aria-required="true">
                        Téléphone <span className="text-destructive font-bold ml-1">*</span>
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={customerFormData.phone}
                        onChange={(e) => handleInputChange(e, 'phone')}
                        className={cn("h-10 bg-background text-foreground", touchedFields.phone && validationErrors.customer_phone ? "border-destructive" : "border-input")}
                        placeholder="+216XXXXXXXX"
                      />
                      {touchedFields.phone && validationErrors.customer_phone ? (
                        <p className="text-sm text-destructive font-medium">{validationErrors.customer_phone}</p>
                      ) : (
                        <p className="text-sm text-foreground/70 font-medium">Format: +216XXXXXXXX</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-foreground" aria-required="true">
                        Mot de passe <span className="text-destructive font-bold ml-1">*</span>
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={customerFormData.password}
                        onChange={(e) => handleInputChange(e, 'password')}
                        className={cn("h-10 bg-background text-foreground", touchedFields.password && validationErrors.customer_password ? "border-destructive" : "border-input")}
                        placeholder="********"
                      />
                      {touchedFields.password && validationErrors.customer_password && (<p className="text-sm text-destructive font-medium">{validationErrors.customer_password}</p>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password2" className="text-sm font-semibold text-foreground" aria-required="true">
                        Confirmer Mot de passe <span className="text-destructive font-bold ml-1">*</span>
                      </Label>
                      <Input
                        id="password2"
                        name="password2"
                        type="password"
                        value={customerFormData.password2}
                        onChange={(e) => handleInputChange(e, 'password2')}
                        className={cn("h-10 bg-background text-foreground", touchedFields.password2 && validationErrors.customer_password2 ? "border-destructive" : "border-input")}
                        placeholder="********"
                      />
                      {touchedFields.password2 && validationErrors.customer_password2 && (<p className="text-sm text-destructive font-medium">{validationErrors.customer_password2}</p>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border border-border/60 shadow-sm bg-card">
              <CardContent className="p-4 pt-4">
                <div className="text-lg font-semibold mb-4 text-foreground">Informations du véhicule</div>
                
                <div className="space-y-2 mb-4">
                  <Label htmlFor="registration_number" className="text-sm font-semibold text-foreground" aria-required="true">
                    Plaque d'immatriculation
                    <span className="text-destructive font-bold ml-1" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="registration_number"
                    name="registration_number"
                    value={vehicleFormData.registration_number}
                    onChange={(e) => handleInputChange(e, 'registration_number')}
                    className={cn(
                      "h-12 text-lg font-medium bg-background text-foreground",
                      touchedFields.registration_number && validationErrors.registration_number 
                        ? "border-destructive" 
                        : "border-input"
                    )}
                    placeholder="123TU4567"
                  />
                  {touchedFields.registration_number && validationErrors.registration_number ? (
                    <p className="text-sm text-destructive font-medium">{validationErrors.registration_number}</p>
                  ) : (
                    <p className="text-sm text-foreground/70 font-medium">Format: 123TU4567</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="make" className="text-sm font-semibold text-foreground" aria-required="true">
                      Marque
                      <span className="text-destructive font-bold ml-1" aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="make"
                      name="make"
                      value={vehicleFormData.make}
                      onChange={(e) => handleInputChange(e, 'make')}
                      className={cn(
                        "h-10 bg-background text-foreground",
                        touchedFields.make && validationErrors.make ? "border-destructive" : "border-input"
                      )}
                      placeholder="Peugeot"
                    />
                    {touchedFields.make && validationErrors.make && (
                      <p className="text-sm text-destructive font-medium">{validationErrors.make}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm font-semibold text-foreground" aria-required="true">
                      Modèle
                      <span className="text-destructive font-bold ml-1" aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="model"
                      name="model"
                      value={vehicleFormData.model}
                      onChange={(e) => handleInputChange(e, 'model')}
                      className={cn(
                        "h-10 bg-background text-foreground",
                        touchedFields.model && validationErrors.model ? "border-destructive" : "border-input"
                      )}
                      placeholder="208"
                    />
                    {touchedFields.model && validationErrors.model && (
                      <p className="text-sm text-destructive font-medium">{validationErrors.model}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-semibold text-foreground">
                      Année
                    </Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      value={vehicleFormData.year}
                      onChange={(e) => handleInputChange(e, 'year')}
                      className={cn(
                        "h-10 bg-background text-foreground",
                        touchedFields.year && validationErrors.year ? "border-destructive" : "border-input"
                      )}
                      placeholder="2023"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                    {touchedFields.year && validationErrors.year && (
                      <p className="text-sm text-destructive font-medium">{validationErrors.year}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="initial_mileage" className="text-sm font-semibold text-foreground" aria-required="true">
                      Kilométrage
                      <span className="text-destructive font-bold ml-1" aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="initial_mileage"
                      name="initial_mileage"
                      type="number"
                      value={vehicleFormData.initial_mileage}
                      onChange={(e) => handleInputChange(e, 'initial_mileage')}
                      className={cn(
                        "h-10 bg-background text-foreground",
                        touchedFields.initial_mileage && validationErrors.initial_mileage 
                          ? "border-destructive" 
                          : "border-input"
                      )}
                      placeholder="15000"
                      min="0"
                    />
                    {touchedFields.initial_mileage && validationErrors.initial_mileage ? (
                      <p className="text-sm text-destructive font-medium">{validationErrors.initial_mileage}</p>
                    ) : (
                      <p className="text-sm text-foreground/70 font-medium">Kilomètres</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-border/60 shadow-sm bg-card">
              <CardContent className="p-4 pt-4">
                <div className="text-sm font-semibold mb-4 flex items-center text-foreground">
                  <span>Informations additionnelles</span>
                  <span className="text-sm text-foreground/70 ml-2">(optionnel)</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin" className="text-sm font-semibold text-foreground flex items-center">
                    <span>Numéro de Châssis (VIN)</span>
                    <Info className="h-4 w-4 ml-1 text-primary" aria-label="Information sur le VIN" />
                  </Label>
                  <Input
                    id="vin"
                    name="vin"
                    value={vehicleFormData.vin}
                    onChange={(e) => handleInputChange(e, 'vin')}
                    className={cn(
                      "font-mono bg-background text-foreground",
                      touchedFields.vin && validationErrors.vin ? "border-destructive" : "border-input"
                    )}
                    placeholder="WVWZZZ1JZXW000001"
                    maxLength={17}
                  />
                  {touchedFields.vin && validationErrors.vin ? (
                    <p className="text-sm text-destructive font-medium">{validationErrors.vin}</p>
                  ) : (
                    <p className="text-sm text-foreground/70 font-medium">17 caractères alphanumériques</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center">
              <p className="text-sm text-foreground/80 font-medium">
                Les champs avec <span className="text-destructive font-bold" aria-hidden="true">*</span> sont obligatoires.
              </p>
            </div>
          </div>
        </form>
        
        <DialogFooter className="px-6 py-4 border-t border-border bg-card text-card-foreground">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading} 
            className="min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? 'Sauvegarde...' : (addMode === 'create' ? 'Créer Client et Véhicule' : 'Ajouter Véhicule')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleModal; 