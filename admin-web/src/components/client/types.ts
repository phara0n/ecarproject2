// Types de base pour la gestion des clients

export type Client = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_active: boolean;
  date_joined?: string;
  last_login?: string;
  vehicles_count?: number;
  profile?: {
    phone_number?: string;
    email_verified?: boolean;
  };
};

export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}; 