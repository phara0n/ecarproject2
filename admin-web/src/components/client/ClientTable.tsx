import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Client } from './types';
import { formatDate, formatPhone } from '@/utils/formatters';
import { useClientModal } from './ClientModalContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export const ClientTable = ({ refreshKey }: { refreshKey?: number }) => {
  const { authAxios } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { openModal } = useClientModal();

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAxios.get(`api/v1/users/customers/`);
      const data = await response.json();
      const clientList = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.data)
            ? data.data
            : [];
      setClients(clientList);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError('Erreur lors de la récupération des clients. ' + err.message);
      } else {
        setError('Erreur lors de la récupération des clients.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [refreshKey]);

  const handleView = (client: Client) => openModal('view', client);
  const handleEdit = (client: Client) => openModal('edit', client);
  const handleDelete = (client: Client) => openModal('delete', client);
  // Si 'resetPassword' n'est pas dans ClientModalAction, commenter ou adapter selon le type
  // const handleReset = (client: Client) => openModal('resetPassword', client);

  // Filtrage côté client
  const filteredClients = clients.filter(client => {
    const searchLower = search.toLowerCase();
    return (
      (client.first_name && client.first_name.toLowerCase().includes(searchLower)) ||
      (client.last_name && client.last_name.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.phone_number && client.phone_number.toLowerCase().includes(searchLower)) ||
      (client.profile?.phone_number && client.profile.phone_number.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full bg-muted rounded-lg" />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-destructive/10 border-destructive text-destructive rounded-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-lg shadow p-4" style={{ background: 'oklch(0.26 0.03 262.69)' }}>
      {/* Champ de recherche */}
      <div className="mb-4 flex items-center gap-2">
        <Input
          type="text"
          placeholder="Rechercher un client (nom, email, téléphone...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs bg-muted rounded-lg focus:ring-primary"
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-primary">Nom</TableHead>
              <TableHead className="text-primary">Email</TableHead>
              <TableHead className="text-primary">Téléphone</TableHead>
              <TableHead className="text-primary">Actif</TableHead>
              <TableHead className="text-primary">Date d'inscription</TableHead>
              <TableHead className="text-primary">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map(client => (
              <TableRow key={client.id}>
                <TableCell>{client.first_name} {client.last_name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{formatPhone(client.phone_number || client.profile?.phone_number)}</TableCell>
                <TableCell>{client.is_active ? 'Oui' : 'Non'}</TableCell>
                <TableCell>{formatDate(client.date_joined)}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="sm" className="bg-muted text-primary hover:bg-accent rounded-lg" onClick={() => handleView(client)}>Voir</Button>
                  <Button size="sm" className="bg-muted text-primary hover:bg-accent rounded-lg" onClick={() => handleEdit(client)}>Éditer</Button>
                  <Button size="sm" className="bg-destructive text-white hover:bg-destructive/80 rounded-lg" onClick={() => handleDelete(client)}>Supprimer</Button>
                  {/* <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg" onClick={() => handleReset(client)}>Reset PW</Button> */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 