import { useState, useCallback } from 'react';
import { ClientTable } from '@/components/client/ClientTable';
import { ClientModals } from '@/components/client/ClientModals';
import { ClientModalProvider, useClientModal } from '@/components/client/ClientModalContext';
import { Client } from '@/components/client/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

// Bouton d'ajout de client
const AddClientButton = () => {
  const { openModal } = useClientModal();
  // Client vide pour création
  const emptyClient: Client = {
    id: 0,
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    is_active: true,
    profile: {},
  };
  return (
    <Button className="bg-primary text-white hover:bg-primary/80 rounded-lg shadow" onClick={() => openModal('edit', emptyClient)}>
      <PlusCircle className="w-4 h-4 mr-2" />
      Ajouter un client
    </Button>
  );
};

export const ClientPage = () => {
  // Ajout d'un trigger de rafraîchissement
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshClients = useCallback(() => setRefreshKey(k => k + 1), []);

  return (
    <ClientModalProvider refreshClients={refreshClients}>
      <div className="p-6 space-y-6 bg-background text-primary min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Gestion des clients</h1>
          <AddClientButton />
        </div>
       
              
        <Card className="bg-muted rounded-lg shadow">
          <CardHeader>
            <CardTitle>Liste des clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientTable refreshKey={refreshKey} />
          </CardContent>
        </Card>

        <ClientModals />
      </div>
    </ClientModalProvider>
  );
};

export default ClientPage; 