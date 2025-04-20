import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw, AlertCircle, DownloadIcon, XIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
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
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/utils/formatters'; // Assuming this utility exists

// Define the Invoice interface based on the actual API response
interface Invoice {
  id: number;
  // Field names with both French and English possibilities
  vehicule_id?: number;
  vehicle_id?: number;
  vehicule_immatriculation?: string;
  vehicle_license_plate?: string;
  evenement_service_id?: number;
  service_event_id?: number;
  fichier?: string;
  file?: string;
  pdf_file?: string;
  pdf_file_url?: string;
  montant?: number;
  amount?: number;
  final_amount?: number;
  date_creation?: string;
  created_at?: string;
  uploaded_at?: string;
  invoice_date?: string;
  description?: string;
  vehicle_info?: {
    registration_number: string;
    make: string;
    model: string;
  };
}

// Interface for the vehicle object
interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
}

// Interface for the service event object
interface ServiceEvent {
  id: number;
  event_date: string;
  service_type_info: {
    name: string;
  };
}

const FacturesPage = () => {
  const { authAxios, token, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceEvent[]>([]);
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(false);
  const [isServicesLoading, setIsServicesLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to fetch invoices from the API
  const fetchInvoices = async () => {
    if (!token || !isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAxios.get('api/v1/invoices/');

      // Check if we got JSON back
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Réponse du serveur non valide (attendu: JSON)');
      }

      const responseData = await response.json();
      console.log('API response:', responseData);

      // Extract invoices from nested data field if needed
      const invoicesData = responseData.data || responseData;
      
      if (!Array.isArray(invoicesData)) {
        throw new Error('Format de réponse API inattendu pour les factures');
      }

      // Log the entire first invoice to see exact structure
      if (invoicesData.length > 0) {
        console.log('First invoice structure (complete):', JSON.stringify(invoicesData[0], null, 2));
      }

      setInvoices(invoicesData);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch vehicles
  const fetchVehicles = async () => {
    if (!token || !isAuthenticated) return;
    setIsVehiclesLoading(true);
    try {
      const response = await authAxios.get('api/v1/vehicles/');
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

  // Function to fetch service events for a specific vehicle
  const fetchServiceEvents = async (vehicleId: string) => {
    if (!token || !isAuthenticated) return;
    if (!vehicleId) return;
    setIsServicesLoading(true);
    setServices([]);
    
    try {
      // Avec Ky, utilisez searchParams pour les paramètres de requête
      const response = await authAxios.get('api/v1/service-events/', {
        searchParams: { vehicle_id: vehicleId }
      });
      
      const data = await response.json();
      const servicesData = data.data || data;
      if (!Array.isArray(servicesData)) {
        throw new Error('Format de réponse API inattendu pour les services');
      }
      setServices(servicesData);
    } catch (err) {
      console.error('Error fetching services:', err);
      setSubmitError(err instanceof Error ? err.message : 'Impossible de récupérer les services');
    } finally {
      setIsServicesLoading(false);
    }
  };

  // Function to download an invoice
  const downloadInvoice = async (invoice: Invoice) => {
    if (!token || !isAuthenticated) return;
    try {
      // Get file URL - prioritize pdf_file_url, then pdf_file, then file, then fichier
      const fileUrl = invoice.pdf_file_url || invoice.pdf_file || invoice.file || invoice.fichier;
      
      if (!fileUrl) {
        throw new Error('Aucun fichier disponible pour cette facture');
      }
      
      // Determine if this is a full URL or just a path
      const url = fileUrl.startsWith('http') ? fileUrl : `api/v1/media/${fileUrl}`;
      
      console.log('Attempting to download file from:', url);
      
      // Use Ky to get the file as a blob
      const response = await authAxios.get(url, {
        responseType: 'blob',
      });
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a link element and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Try to get a sensible filename
      const vehicleInfo = invoice.vehicle_info?.registration_number || 
                         getInvoiceField(invoice, ['vehicule_immatriculation', 'vehicle_license_plate']);
      const date = getInvoiceField(invoice, ['invoice_date', 'date_creation', 'created_at', 'uploaded_at']);
      const filename = `facture_${vehicleInfo}_${date}.pdf`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert("Erreur lors du téléchargement de la facture. Veuillez réessayer.");
    }
  };

  // Function to handle file upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicle || !amount || !fileInputRef.current?.files?.[0]) {
      setSubmitError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Create form data for multipart/form-data request (required for file upload)
      const formData = new FormData();
      formData.append('vehicle_id', selectedVehicle);
      formData.append('final_amount', amount);
      formData.append('invoice_date', invoiceDate);
      formData.append('pdf_file', fileInputRef.current.files[0]);
      
      if (selectedService) {
        formData.append('service_event_id', selectedService);
      }
      
      console.log('Uploading file...', fileInputRef.current.files[0].name);
      
      // Send POST request to create invoice - use Ky with FormData
      // Avec Ky, on passe directement le FormData comme body, sans l'encapsuler
      const response = await authAxios.post('api/v1/invoices/', formData);
      
      // Check response status
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Échec de la création de la facture');
      }
      
      // Close modal and refresh list
      setIsAddInvoiceOpen(false);
      fetchInvoices();
      
      // Reset form
      setSelectedVehicle(null);
      setSelectedService(null);
      setAmount('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setSubmitError(err instanceof Error ? err.message : 'Échec de la création de la facture');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Fetch vehicles when opening add invoice modal
  useEffect(() => {
    if (isAddInvoiceOpen) {
      fetchVehicles();
    }
  }, [isAddInvoiceOpen]);

  // Fetch services when a vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      fetchServiceEvents(selectedVehicle);
    }
  }, [selectedVehicle]);

  // Helper to get the best available field with fallbacks
  const getInvoiceField = (invoice: Invoice, fields: string[], defaultValue: string = '-') => {
    for (const field of fields) {
      const value = invoice[field as keyof Invoice];
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          // Si c'est un objet, on essaie d'afficher registration_number ou une propriété principale
          if ('registration_number' in (value as any)) return (value as any).registration_number;
          if ('make' in (value as any) && 'model' in (value as any)) return `${(value as any).make} ${(value as any).model}`;
          return JSON.stringify(value);
        }
        return value;
      }
    }
    return defaultValue;
  };

  // Calculate stats safely (handling empty array)
  const calculateStats = () => {
    if (invoices.length === 0) {
      return { 
        totalInvoices: 0, 
        totalAmount: 0, 
        avgAmount: 0 
      };
    }

    const totalInvoices = invoices.length;
    
    // Calculate total amount
    const totalAmount = invoices.reduce((sum, invoice) => {
      const amount = Number(getInvoiceField(invoice, ['final_amount', 'montant', 'amount'], '0'));
      return sum + amount;
    }, 0);
    
    // Calculate average amount
    const avgAmount = totalAmount / totalInvoices;

    return { totalInvoices, totalAmount, avgAmount };
  };

  const { totalInvoices, totalAmount, avgAmount } = calculateStats();

  // Helper to safely format numbers as currency
  const formatCurrency = (value?: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num !== undefined && num !== null && !isNaN(num)
      ? num.toLocaleString('fr-TN', { style: 'currency', currency: 'TND' })
      : '0 TND';
  };

  return (
    <div className="p-6 space-y-6 bg-background text-primary min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Gestion des Factures</h1>
        <div className="flex space-x-2">
          <Button className="bg-muted text-primary hover:bg-accent rounded-lg border-none shadow-sm" onClick={fetchInvoices} disabled={isLoading} type="button">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button className="bg-primary text-white hover:bg-primary/80 rounded-lg shadow" onClick={() => setIsAddInvoiceOpen(true)} type="button">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouvelle Facture
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
              <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
              <CardDescription>Nombre total d'enregistrements</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalInvoices}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-muted text-primary rounded-lg shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
              <CardDescription>Toutes factures</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(totalAmount)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-muted text-primary rounded-lg shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Montant Moyen</CardTitle>
              <CardDescription>Par facture</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(avgAmount)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invoices table */}
        <Card className="bg-muted text-primary rounded-lg shadow">
          <CardHeader>
            <CardTitle>Factures</CardTitle>
            <CardDescription>Gérez vos factures de services</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">ID</TableHead>
                  <TableHead className="text-primary">Véhicule</TableHead>
                  <TableHead className="text-primary">Date Facture</TableHead>
                  <TableHead className="text-primary">Montant (DT)</TableHead>
                  <TableHead className="text-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="hover:bg-accent">
                      <TableCell><Skeleton className="h-6 w-8 bg-accent" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 bg-accent" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 bg-accent" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 bg-accent" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 bg-accent" /></TableCell>
                    </TableRow>
                  ))
                ) : invoices.length > 0 ? (
                  // Display invoices
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-accent">
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>
                        {getInvoiceField(invoice, ['vehicle_info.registration_number', 'vehicule_immatriculation', 'vehicle_license_plate'])}
                      </TableCell>
                      <TableCell>{formatDate(String(getInvoiceField(invoice, ['invoice_date'])))}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(getInvoiceField(invoice, ['final_amount', 'montant', 'amount'], '0'))} DT
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="outline" className="bg-muted text-primary hover:bg-accent rounded-lg mr-1" onClick={() => downloadInvoice(invoice)} title="Télécharger">
                          <DownloadIcon className="w-4 h-4" />
                        </Button>
                        {/* Delete button (to implement) */}
                        <Button size="icon" variant="destructive" className="bg-destructive text-white hover:bg-destructive/80 rounded-lg" title="Supprimer">
                          <XIcon className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No invoices
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Aucune facture trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Invoice Modal */}
      <Dialog open={isAddInvoiceOpen} onOpenChange={setIsAddInvoiceOpen}>
        <DialogContent className="sm:max-w-[480px] bg-background text-primary rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle Facture</DialogTitle>
            <DialogDescription>Ajouter une nouvelle facture PDF.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            {/* Vehicle Select */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicle" className="text-right">Véhicule</Label>
              <Select onValueChange={setSelectedVehicle} value={selectedVehicle || ''} disabled={isVehiclesLoading}>
                <SelectTrigger id="vehicle" className="col-span-3 bg-muted rounded-lg focus:ring-primary">
                  <SelectValue placeholder={isVehiclesLoading ? 'Chargement...' : 'Sélectionner...'} />
                </SelectTrigger>
                <SelectContent className="bg-muted text-primary rounded-lg">
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()} className="hover:bg-accent">
                      {v.registration_number} ({v.make} {v.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Event Select (optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service" className="text-right">Service lié</Label>
              <Select 
                onValueChange={setSelectedService} 
                value={selectedService || ''} 
                disabled={!selectedVehicle || isServicesLoading}
              >
                <SelectTrigger id="service" className="col-span-3 bg-muted rounded-lg focus:ring-primary">
                  <SelectValue placeholder={!selectedVehicle ? 'Choisir véhicule d\'abord' : isServicesLoading ? 'Chargement...' : 'Sélectionner service (optionnel)'} />
                </SelectTrigger>
                <SelectContent className="bg-muted text-primary rounded-lg">
                  <SelectItem value="" className="hover:bg-accent">Aucun service spécifique</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()} className="hover:bg-accent">
                      {s.service_type_info.name} - {formatDate(s.event_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-border" />

            {/* Amount Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Montant (DT)</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="col-span-3 bg-muted rounded-lg focus:ring-primary" 
                required 
              />
            </div>

            {/* Invoice Date Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice-date" className="text-right">Date Facture</Label>
              <Input 
                id="invoice-date" 
                type="date" 
                value={invoiceDate} 
                onChange={(e) => setInvoiceDate(e.target.value)} 
                className="col-span-3 bg-muted rounded-lg focus:ring-primary" 
                required 
              />
            </div>

            {/* File Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pdf-file" className="text-right">Fichier PDF</Label>
              <Input 
                id="pdf-file" 
                type="file" 
                accept=".pdf" 
                ref={fileInputRef} 
                className="col-span-3 bg-muted rounded-lg focus:ring-primary file:bg-primary file:text-white file:rounded-lg file:border-none file:px-2 file:py-1 file:mr-2 hover:file:bg-primary/80 cursor-pointer" 
                required 
              />
            </div>

            {submitError && (
              <Alert variant="destructive" className="col-span-4 bg-destructive/10 border-destructive text-destructive rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="bg-muted text-primary hover:bg-accent rounded-lg">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/80 rounded-lg">
              {isSubmitting ? 'Ajout...' : 'Ajouter Facture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacturesPage; 