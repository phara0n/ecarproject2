import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

// Form schema validation
const serviceEventSchema = z.object({
  vehicle: z.string().nonempty({ message: "Véhicule requis" }),
  service_type: z.string().nonempty({ message: "Type de service requis" }),
  title: z.string().nonempty({ message: "Titre requis" }),
  description: z.string().optional(),
  date_scheduled: z.date(),
  status: z.string().nonempty({ message: "Statut requis" }),
  mileage_at_service: z.string().nonempty({ message: "Kilométrage requis" }),
});

type ServiceEventFormValues = z.infer<typeof serviceEventSchema>;

interface AddServiceEventFormProps {
  open: boolean;
  onClose: () => void;
  vehicles: { id: string; registration_number: string }[];
  onAdd: () => void;
}

interface ServiceType {
  id: number;
  name: string;
  description?: string;
}

// Define a more flexible ServiceType interface to handle potential format differences
interface ServiceTypeResponse {
  id: number;
  name?: string;
  nom?: string; // French alternative
  description?: string;
  [key: string]: unknown; // Allow any other properties
}

// Helper function to normalize ServiceType data
const normalizeServiceType = (data: ServiceTypeResponse): ServiceType => {
  return {
    id: data.id,
    name: data.name || data.nom || `Type ${data.id}`, // Use either name field or fallback
    description: data.description
  };
};

// Style definitions for dropdown items with proper contrast
const dropdownItemClass = "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-popover-foreground bg-popover outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// Helper function for safe date formatting
const safeFormatDate = (date: Date | undefined, formatString: string, fallbackFormat: boolean = true): string => {
  if (!date) return '';
  
  try {
    return format(date, formatString);
  } catch (err) {
    console.error("[AddServiceEventForm] Error formatting date:", err);
    return fallbackFormat ? new Date(date).toLocaleDateString() : '';
  }
};

export function AddServiceEventForm({ 
  open, 
  onClose, 
  vehicles, 
  onAdd 
}: AddServiceEventFormProps) {
  const { authAxios } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempSelectedVehicle, setTempSelectedVehicle] = useState<string>("");
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false);
  const [serviceTypesError, setServiceTypesError] = useState<string | null>(null);
  
  // Ref for initial focus when dialog opens
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  
  // Ref for the cancel button (for focus management)
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Status options
  const statuses = [
    { value: "scheduled", label: "Planifié" },
    { value: "in_progress", label: "En cours" },
    { value: "completed", label: "Terminé" },
    { value: "cancelled", label: "Annulé" },
  ];

  const form = useForm<ServiceEventFormValues>({
    resolver: zodResolver(serviceEventSchema),
    defaultValues: {
      vehicle: "",
      service_type: "",
      title: "",
      description: "",
      date_scheduled: new Date(),
      status: "scheduled",
      mileage_at_service: "0",
    },
  });

  // Fetch service types when component mounts
  useEffect(() => {
    const fetchServiceTypes = async () => {
      setIsLoadingServiceTypes(true);
      setServiceTypesError(null);
      
      try {
        console.log("[AddServiceEventForm] Fetching service types...");
        const response = await authAxios.get("api/v1/service-types/");
        const data = response.data;
        // Gestion du cas token expiré ou invalide
        if (data && data.error && data.error.code === 'token_not_valid') {
          setServiceTypesError("Session expirée, veuillez vous reconnecter.");
          setServiceTypes([]);
          return;
        }
        
        // Ensure serviceTypes is always an array
        if (Array.isArray(data)) {
          console.log("[AddServiceEventForm] Setting serviceTypes from direct array");
          setServiceTypes(data.map(normalizeServiceType));
        } else if (data && Array.isArray(data.data)) {
          // Handle nested data structure if API returns {data: [...]}
          console.log("[AddServiceEventForm] Setting serviceTypes from nested data.data array");
          setServiceTypes(data.data.map(normalizeServiceType));
        } else if (data && data.results && Array.isArray(data.results)) {
          // Handle pagination format {results: [...]}
          console.log("[AddServiceEventForm] Setting serviceTypes from data.results array");
          setServiceTypes(data.results.map(normalizeServiceType));
        } else if (data && typeof data === 'object') {
          // If it's an object but not in any expected format, try to extract values
          console.log("[AddServiceEventForm] Attempting to convert object to array");
          const extractedTypes = Object.values(data).filter((v): v is ServiceTypeResponse => !!v && typeof v === 'object' && 'id' in v);
          
          if (extractedTypes.length > 0) {
            console.log("[AddServiceEventForm] Extracted types from object:", extractedTypes);
            setServiceTypes(extractedTypes.map(normalizeServiceType));
          } else {
            // Last resort - create dummy data for testing
            console.log("[AddServiceEventForm] Creating dummy service type data for testing");
            setServiceTypesError("Format de données inattendu - utilisation de données de test");
            setServiceTypes([
              { id: 1, name: "Vidange (Test)" },
              { id: 2, name: "Révision (Test)" },
              { id: 3, name: "Freins (Test)" }
            ]);
          }
        } else {
          // Set empty array as fallback
          console.error("[AddServiceEventForm] Unexpected service types data format:", data);
          setServiceTypesError("Format de données inattendu");
          setServiceTypes([]);
        }
      } catch (error) {
        console.error("[AddServiceEventForm] Failed to fetch service types:", error);
        setServiceTypesError("Erreur lors du chargement des types de service");
        // Create dummy data for testing
        console.log("[AddServiceEventForm] Creating dummy service type data after error");
        setServiceTypes([
          { id: 1, name: "Vidange (Test)" },
          { id: 2, name: "Révision (Test)" },
          { id: 3, name: "Freins (Test)" }
        ]);
      } finally {
        setIsLoadingServiceTypes(false);
      }
    };

    fetchServiceTypes();
  }, [authAxios]);

  // Log form state changes
  const watchedVehicle = form.watch("vehicle");
  useEffect(() => {
    console.log("Form State - Vehicle:", watchedVehicle);
  }, [watchedVehicle]);

  // Focus handling for modal
  useEffect(() => {
    if (open) {
      // Set focus to first field when modal opens
      setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Keyboard trap handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close dialog on ESC
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const onSubmit = async (data: ServiceEventFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create final submission data
      const tempSelectedVehicle = data.vehicle;
      
      const submissionData = {
        title: data.title,
        description: data.description || "",
        date_scheduled: safeFormatDate(data.date_scheduled, "yyyy-MM-dd", false),
        event_date: safeFormatDate(data.date_scheduled, "yyyy-MM-dd", false),
        status: data.status,
        vehicle_id: parseInt(data.vehicle),
        service_type_id: parseInt(data.service_type),
        mileage_at_service: parseInt(data.mileage_at_service),
        notes: ""
      };
      
      // If date formatting failed, use ISO date
      if (!submissionData.date_scheduled) {
        const isoDate = new Date(data.date_scheduled).toISOString().split('T')[0];
        submissionData.date_scheduled = isoDate;
        submissionData.event_date = isoDate;
      }
      
      // Debug vehicle and service_type values
      console.log(`[AddServiceEventForm] Vehicle ID: ${submissionData.vehicle_id}, from: ${tempSelectedVehicle}`);
      console.log(`[AddServiceEventForm] Service Type ID: ${submissionData.service_type_id}, from: ${data.service_type}`);
      console.log(`[AddServiceEventForm] Event Date: ${submissionData.event_date}, Date Scheduled: ${submissionData.date_scheduled}`);
      
      try {
        const response = await authAxios.post("api/v1/service-events/", submissionData);
        console.log("[AddServiceEventForm] API response:", response.data);
        
        toast.success("Événement de service ajouté", {
          description: "L'événement de service a été créé avec succès.",
        });
        
        onAdd();
        onClose();
        form.reset();
      } catch (error: unknown) {
        console.error("[AddServiceEventForm] API error response:", error);
        let errorMsg = "Impossible d'ajouter l'événement de service.";
        
        // Display more specific error message if available
        const err = error as { response?: { data?: unknown } };
        const errorData = err?.response?.data;
        if (errorData && typeof errorData === 'object') {
          console.debug("DEBUG: Original error data:", errorData);
          let fieldErrors = "";
          // Handle different error response formats
          if ('error' in errorData && typeof (errorData as any).error === 'object' && (errorData as any).error !== null) {
            // Format: { metadata: {...}, data: null, error: {...} }
            console.debug("Error format: metadata/data/error structure");
            fieldErrors = Object.entries((errorData as any).error)
              .filter(([key]) => key !== 'detail' && key !== 'code')
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
          } else {
            // Standard format: { field1: [errors], field2: [errors] }
            console.debug("Error format: standard field->errors structure");
            fieldErrors = Object.entries(errorData)
              .filter(([key]) => key !== 'detail' && key !== 'code')
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
          }
          if (fieldErrors) {
            errorMsg += ` Erreurs: ${fieldErrors}`;
          } else if ('detail' in errorData) {
            errorMsg += ` ${(errorData as any).detail}`;
          } else if ('error' in errorData && (errorData as any).error && 'detail' in (errorData as any).error) {
            errorMsg += ` ${(errorData as any).error.detail}`;
          } else {
            errorMsg += ` Erreur: ${JSON.stringify(errorData)}`;
          }
        }
        
        toast.error("Erreur", {
          description: errorMsg,
        });

        // Gestion de l'erreur d'authentification
        if (
          error &&
          (error instanceof Error && error.message.includes('Authentification requise'))
        ) {
          navigate('/login');
          return;
        }
      }
    } catch (error) {
      // Handle unexpected errors in the form submission process itself
      console.error("[AddServiceEventForm] Unexpected error in form submission:", error);
      toast.error("Erreur inattendue", {
        description: "Une erreur s'est produite lors de la soumission du formulaire.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .text-force-white {
          color: white !important;
        }
        .dark .popover-content-custom * {
          color: white !important;
        }
        .dark .select-content-custom * {
          color: white !important;
        }
        .dark .select-trigger-custom * {
          color: white !important;
        }
        .dark .select-value-custom {
          color: white !important;
        }
        .dark .vehicle-button-custom {
          color: white !important;
        }
      `}} />
      <DialogContent 
        className="sm:max-w-[500px]"
        onKeyDown={handleKeyDown}
        aria-labelledby="service-event-dialog-title"
        aria-describedby="service-event-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="service-event-dialog-title">Ajouter un évènement de service</DialogTitle>
          <DialogDescription id="service-event-dialog-description">
            Créez un nouvel évènement de service pour un véhicule.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel className="text-foreground flex items-center">
                Véhicule<span aria-hidden="true" className="text-destructive ml-1">*</span>
              </FormLabel>
              <div className="relative">
                <button
                  ref={initialFocusRef}
                  type="button"
                  id="vehicle-select-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={!document.getElementById("vehicle-select-content")?.classList.contains("hidden")}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[invalid]:border-destructive vehicle-button-custom"
                  onClick={() => document.getElementById("vehicle-select-content")?.classList.toggle("hidden")}
                  aria-invalid={form.formState.errors.vehicle ? "true" : "false"}
                  aria-describedby={form.formState.errors.vehicle ? "vehicle-error" : undefined}
                >
                  <span className="text-force-white">
                    {tempSelectedVehicle 
                      ? vehicles?.find(v => String(v.id) === tempSelectedVehicle)?.registration_number || "Inconnu"
                      : "Sélectionner un véhicule"}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div 
                  id="vehicle-select-content" 
                  role="listbox"
                  aria-labelledby="vehicle-select-trigger"
                  className="absolute left-0 z-50 mt-1 hidden max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
                >
                  <div className="p-1">
                    {Array.isArray(vehicles) && vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        role="option"
                        aria-selected={tempSelectedVehicle === String(vehicle.id)}
                        className={dropdownItemClass}
                        tabIndex={0} // Make options focusable
                        onClick={() => {
                          console.log("Vehicle Select onClick:", vehicle.id);
                          const vehicleIdString = String(vehicle.id);
                          setTempSelectedVehicle(vehicleIdString);
                          form.setValue("vehicle", vehicleIdString, { shouldValidate: true });
                          document.getElementById("vehicle-select-content")?.classList.add("hidden");
                          document.getElementById("vehicle-select-trigger")?.focus(); // Return focus
                        }}
                        onKeyDown={(e) => { // Allow selection with Enter/Space
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const vehicleIdString = String(vehicle.id);
                            setTempSelectedVehicle(vehicleIdString);
                            form.setValue("vehicle", vehicleIdString, { shouldValidate: true });
                            document.getElementById("vehicle-select-content")?.classList.add("hidden");
                            document.getElementById("vehicle-select-trigger")?.focus(); // Return focus
                          }
                        }}
                      >
                        {tempSelectedVehicle === String(vehicle.id) && (
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 6 9 17l-5-5"/></svg>
                          </span>
                        )}
                        <span className="text-popover-foreground">{vehicle.registration_number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <FormMessage id="vehicle-error" role="alert" className="text-destructive">{form.formState.errors.vehicle?.message}</FormMessage>
              <div className="sr-only" aria-live="polite">
                {form.formState.errors.vehicle ? form.formState.errors.vehicle.message : ''}
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="service_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground flex items-center">
                    Type de service<span aria-hidden="true" className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingServiceTypes}
                    aria-invalid={form.formState.errors.service_type ? "true" : "false"}
                    aria-describedby={form.formState.errors.service_type ? "service-type-error" : undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="data-[invalid]:border-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-trigger-custom">
                        <SelectValue placeholder={isLoadingServiceTypes ? "Chargement..." : "Sélectionner un type"} className="text-force-white select-value-custom" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent 
                      position="popper" 
                      className="bg-popover text-popover-foreground select-content-custom"
                    >
                      {Array.isArray(serviceTypes) && serviceTypes.length > 0 ? (
                        serviceTypes.map((type) => (
                          <SelectItem 
                            key={type.id} 
                            value={String(type.id)} 
                            className="text-popover-foreground text-force-white"
                          >
                            {type.name}
                          </SelectItem>
                        ))
                      ) : serviceTypesError ? (
                        <SelectItem value="error" disabled className="text-force-white">
                          Erreur: {serviceTypesError}
                        </SelectItem>
                      ) : isLoadingServiceTypes ? (
                        <SelectItem value="loading" disabled className="text-force-white">
                          Chargement...
                        </SelectItem>
                      ) : (
                        <SelectItem value="empty" disabled className="text-force-white">
                          Aucun type de service disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage id="service-type-error" role="alert" className="text-destructive">{form.formState.errors.service_type?.message}</FormMessage>
                  <div className="sr-only" aria-live="polite">
                    {form.formState.errors.service_type ? form.formState.errors.service_type.message : ''}
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground flex items-center">
                    Titre<span aria-hidden="true" className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="text-foreground data-[invalid]:border-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                      aria-invalid={form.formState.errors.title ? "true" : "false"}
                      aria-describedby={form.formState.errors.title ? "title-error" : undefined}
                    />
                  </FormControl>
                  <FormMessage id="title-error" role="alert" className="text-destructive">{form.formState.errors.title?.message}</FormMessage>
                  <div className="sr-only" aria-live="polite">
                    {form.formState.errors.title ? form.formState.errors.title.message : ''}
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="text-foreground data-[invalid]:border-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </FormControl>
                  {/* Description is optional, so no error message needed here unless specific validation fails */}
                  <FormMessage className="text-destructive" role="alert">{form.formState.errors.description?.message}</FormMessage>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date_scheduled"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-foreground flex items-center">
                    Date prévue<span aria-hidden="true" className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal text-force-white",
                            !field.value && "text-muted-foreground",
                            form.formState.errors.date_scheduled && "border-destructive",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          )}
                          aria-invalid={form.formState.errors.date_scheduled ? "true" : "false"}
                          aria-describedby={form.formState.errors.date_scheduled ? "date-scheduled-error" : undefined}
                        >
                          {field.value ? (
                            safeFormatDate(field.value, "PPP")
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" aria-hidden="true" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 bg-popover text-popover-foreground popover-content-custom" 
                      align="start"
                    >
                      <Calendar
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Choisir une date"
                        range={false}
                        className="text-popover-foreground text-force-white"
                        {...((date: Date) => date < new Date("1900-01-01") ? { isDateUnavailable: () => true } : {})}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage id="date-scheduled-error" role="alert" className="text-destructive">{form.formState.errors.date_scheduled?.message}</FormMessage>
                  <div className="sr-only" aria-live="polite">
                    {form.formState.errors.date_scheduled ? form.formState.errors.date_scheduled.message : ''}
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground flex items-center">
                    Statut<span aria-hidden="true" className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    aria-invalid={form.formState.errors.status ? "true" : "false"}
                    aria-describedby={form.formState.errors.status ? "status-error" : undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="data-[invalid]:border-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-trigger-custom">
                        <SelectValue placeholder="Sélectionner un statut" className="text-force-white select-value-custom" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent 
                      position="popper" 
                      className="bg-popover text-popover-foreground select-content-custom"
                    >
                      {statuses.map((status) => (
                        <SelectItem 
                          key={status.value} 
                          value={status.value} 
                          className="text-popover-foreground text-force-white"
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage id="status-error" role="alert" className="text-destructive">{form.formState.errors.status?.message}</FormMessage>
                  <div className="sr-only" aria-live="polite">
                    {form.formState.errors.status ? form.formState.errors.status.message : ''}
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="mileage_at_service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground flex items-center">
                    Kilométrage au service<span aria-hidden="true" className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      placeholder="0" 
                      min="0"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="text-foreground data-[invalid]:border-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                      aria-invalid={form.formState.errors.mileage_at_service ? "true" : "false"}
                      aria-describedby={form.formState.errors.mileage_at_service ? "mileage-error" : undefined}
                    />
                  </FormControl>
                  <FormMessage id="mileage-error" role="alert" className="text-destructive">{form.formState.errors.mileage_at_service?.message}</FormMessage>
                  <div className="sr-only" aria-live="polite">
                    {form.formState.errors.mileage_at_service ? form.formState.errors.mileage_at_service.message : ''}
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Annuler l'ajout d'un événement de service"
                ref={cancelButtonRef}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="text-foreground bg-primary hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={isSubmitting ? "Ajout en cours..." : "Ajouter l'événement de service"}
              >
                <span>{isSubmitting ? "Ajout en cours..." : "Ajouter"}</span>
                {isSubmitting && (
                  <span className="ml-2" aria-hidden="true">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 