import { createContext, useContext, useState, ReactNode } from 'react';
import { Client } from './types';

export type ClientModalAction = 'view' | 'edit' | 'delete' | 'reset' | null;

interface ClientModalContextType {
  action: ClientModalAction;
  selectedClient: Client | null;
  openModal: (action: ClientModalAction, client: Client) => void;
  closeModal: () => void;
  refreshClients: () => void;
}

const ClientModalContext = createContext<ClientModalContextType | undefined>(undefined);

export const useClientModal = () => {
  const ctx = useContext(ClientModalContext);
  if (!ctx) throw new Error('useClientModal must be used within ClientModalProvider');
  return ctx;
};

export const ClientModalProvider = ({ children, refreshClients }: { children: ReactNode; refreshClients: () => void }) => {
  const [action, setAction] = useState<ClientModalAction>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const openModal = (modalAction: ClientModalAction, client: Client) => {
    setAction(modalAction);
    setSelectedClient(client);
  };
  const closeModal = () => {
    setAction(null);
    setSelectedClient(null);
  };

  return (
    <ClientModalContext.Provider value={{ action, selectedClient, openModal, closeModal, refreshClients }}>
      {children}
    </ClientModalContext.Provider>
  );
};

export { ClientModalContext }; 