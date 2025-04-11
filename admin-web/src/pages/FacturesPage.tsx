import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw, AlertCircle, FileIcon, DownloadIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthProvider';

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
  montant?: number;
  amount?: number;
  date_creation?: string;
  created_at?: string;
  description?: string;
}

const FacturesPage = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch invoices from the API
  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/invoices/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des factures: ${response.statusText}`);
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

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, [token]);

  // Helper to get the best available field with fallbacks
  const getInvoiceField = (invoice: Invoice, fields: string[], defaultValue: string = '-') => {
    for (const field of fields) {
      const value = invoice[field as keyof Invoice];
      if (value !== undefined && value !== null) {
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
      const amount = Number(getInvoiceField(invoice, ['montant', 'amount'], '0'));
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Factures</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchInvoices} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouvelle Facture
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
              <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
              <CardDescription>Nombre</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalInvoices}</div>
              )}
            </CardContent>
          </Card>
          <Card>
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
          <Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Factures</CardTitle>
            <CardDescription>Gérez vos factures de services</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Fichier</TableHead>
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
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : invoices.length > 0 ? (
                  // Display invoices
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.id}</TableCell>
                      <TableCell>
                        {getInvoiceField(invoice, ['vehicule_immatriculation', 'vehicle_license_plate'])}
                      </TableCell>
                      <TableCell>
                        {getInvoiceField(invoice, ['evenement_service_id', 'service_event_id'])}
                      </TableCell>
                      <TableCell>
                        {getInvoiceField(invoice, ['date_creation', 'created_at'])}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(getInvoiceField(invoice, ['montant', 'amount']))}
                      </TableCell>
                      <TableCell>
                        {getInvoiceField(invoice, ['fichier', 'file']) !== '-' ? (
                          <FileIcon className="h-5 w-5 text-primary" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">Détails</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No invoices
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Aucune facture trouvée
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

export default FacturesPage; 