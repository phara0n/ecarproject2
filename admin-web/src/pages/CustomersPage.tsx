import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw, SearchIcon, AlertCircle, Users, UserCheck, BadgeCheck, UserPlus, ChevronDown, Eye, Edit, Trash, KeyRound, HelpCircle, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthProvider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the User interface based on the actual API response
interface User {
  id: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_staff?: boolean;
  is_active?: boolean;
  date_joined?: string;
  // Additional fields that might be in the API response
  last_login?: string;
  vehicles?: any[]; // We'll use this to calculate vehicles count
  vehicles_count?: number;
  profile?: {
    phone_number?: string;
    email_verified?: boolean;
  };
}

// Define form schema for client creation/editing
const clientFormSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères" }),
  email: z.string().email({ message: "Format d'email invalide" }),
  first_name: z.string().min(1, { message: "Le prénom est requis" }),
  last_name: z.string().min(1, { message: "Le nom est requis" }),
  phone_number: z.string().regex(/^\+216 \d{2} \d{3} \d{3}$/, {
    message: "Format de téléphone tunisien requis (+216 XX XXX XXX)"
  }),
  is_active: z.boolean().default(true),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const CustomersPage = () => {
  const { token, authAxios } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      phone_number: "+216 ",
      is_active: true,
    },
  });

  const editForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      phone_number: "+216 ",
      is_active: true,
    },
  });

  // Function to fetch customers data from the API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching customers from API...');
      // Use the customers endpoint to get all customers
      const response = await authAxios.get('/api/v1/users/customers/');

      if (response.status !== 200) {
        throw new Error(`Erreur lors de la récupération des clients: ${response.statusText}`);
      }

      let customersData: User[] = [];
      const responseData = response.data;
      
      // Handle different API response formats
      if (Array.isArray(responseData)) {
        console.log('API returned an array of customers');
        customersData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        console.log('API returned data wrapper with customers array');
        customersData = responseData.data;
      } else {
        console.error('Unexpected API response format:', responseData);
        throw new Error('Format de réponse API inattendu');
      }
      
      console.log(`Retrieved ${customersData.length} customers from API`);
      
      // Fetch vehicles for each customer to get accurate count
      const usersWithDetails = await Promise.all(
        customersData.map(async (user) => {
          try {
            // For phone number, check profile field that might contain it
            let phoneNumber = user.phone_number;
            if (!phoneNumber && user.profile && user.profile.phone_number) {
              phoneNumber = user.profile.phone_number;
            }
            
            // Try to fetch vehicles for this customer
            const vehiclesResponse = await authAxios.get(`/api/v1/vehicles/?owner_id=${user.id}`);
            const vehiclesData = vehiclesResponse.data;
            
            // Properly parse the vehicle count from the response
            // The API appears to be returning all vehicles, not just those for the specific owner_id
            let vehiclesCount = 0;
            
            if (Array.isArray(vehiclesData)) {
              // Filter to only count vehicles that actually belong to this user
              const userVehicles = vehiclesData.filter(v => v.owner_id === user.id || v.owner_username === user.username);
              vehiclesCount = userVehicles.length;
              console.log(`User ${user.id} (${user.username}): API returned ${vehiclesData.length} vehicles, filtered to ${vehiclesCount} owned vehicles`);
            } else if (vehiclesData.data && Array.isArray(vehiclesData.data)) {
              const userVehicles = vehiclesData.data.filter(v => v.owner_id === user.id || v.owner_username === user.username);
              vehiclesCount = userVehicles.length;
              console.log(`User ${user.id} (${user.username}): API returned ${vehiclesData.data.length} vehicles, filtered to ${vehiclesCount} owned vehicles`);
            }
            
            return {
              ...user,
              phone_number: phoneNumber,
              vehicles_count: vehiclesCount,
              // Set to active by default if not specified
              is_active: user.is_active !== undefined ? user.is_active : true
            };
          } catch (error) {
            console.error(`Error fetching details for user ${user.id}:`, error);
            return {
              ...user,
              vehicles_count: 0
            };
          }
        })
      );
      
      setUsers(usersWithDetails);
      console.log('Updated users with vehicle counts and phone numbers:', usersWithDetails);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération des données utilisateur');
      
      // If API call fails completely, show a more informative error but don't leave the UI empty
      if (users.length === 0) {
        toast.error('Erreur de chargement', {
          description: 'Impossible de charger les clients depuis le serveur. Veuillez réessayer plus tard.',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authAxios]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  // Helper function to get user's full name
  const getUserFullName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.last_name) {
      return user.last_name;
    } else {
      return user.username || 'Nom inconnu';
    }
  };

  // Format the date_joined timestamp into a readable date format
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non spécifié';
    try {
    const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Format de date incorrect';
    }
  };

  // Calculate user statistics
  const calculateStats = () => {
    if (!users.length) return { total: 0, active: 0, staffCount: 0 };
    
    return {
      total: users.length,
      active: users.filter(user => user.is_active).length,
      staffCount: users.filter(user => user.is_staff).length
    };
  };

  // Filter users based on search term and status filter
  const filteredUsers = users.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearchTerm = 
      getUserFullName(user).toLowerCase().includes(searchTermLower) ||
      (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
      (user.phone_number && user.phone_number.toLowerCase().includes(searchTermLower));

    let matchesStatusFilter = true;
    if (statusFilter === 'active') {
      matchesStatusFilter = !!user.is_active;
    } else if (statusFilter === 'inactive') {
      matchesStatusFilter = !user.is_active;
    }

    return matchesSearchTerm && matchesStatusFilter;
  });

  const handleAddNewClient = async (data: ClientFormValues) => {
    console.log('Adding new client:', data);
    
    try {
      // Use the register endpoint instead of users/customers
      const response = await authAxios.post('/api/v1/register/', {
        ...data,
        // Include required fields for registration
        password: "TempPassword123!", // Default password that user will need to change
        password2: "TempPassword123!" // Confirmation password for validation
      });
      
      if (response.status === 201 || response.status === 200) {
        const newUser = response.data;
        setUsers(prevUsers => [...prevUsers, newUser]);
        
        toast.success('Client ajouté', {
          description: 'Le client a été ajouté avec succès. Un mot de passe temporaire a été généré.',
        });
        
        setIsAddDialogOpen(false);
        form.reset();
        
        // Refresh the clients list to get the updated data
        fetchUsers();
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error adding client:', err);
      toast.error('Erreur', {
        description: err instanceof Error 
          ? err.message 
          : "Une erreur s'est produite lors de l'ajout du client."
      });
    }
  };

  const handleEditClient = async (data: ClientFormValues) => {
    if (!selectedUser) return;
    
    console.log('Editing client:', data);
    
    try {
      // Call the API to update the user
      const response = await authAxios.put(`/api/v1/users/${selectedUser.id}/`, data);
      
      if (response.status === 200) {
        const updatedUser = response.data;
        
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id ? updatedUser : user
          )
        );
        
        toast.success('Client mis à jour', {
          description: 'Les informations du client ont été mises à jour avec succès.',
        });
        
        setIsEditDialogOpen(false);
        editForm.reset();
        setSelectedUser(null);
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error updating client:', err);
      toast.error('Erreur', {
        description: err instanceof Error 
          ? err.message 
          : "Une erreur s'est produite lors de la mise à jour du client."
      });
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedUser) return;
    
    try {
      // Call the API to delete the user
      const response = await authAxios.delete(`/api/v1/users/${selectedUser.id}/`);
      
      if (response.status === 204) {
        // Remove the user from the local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));
        
        toast.success('Client supprimé', {
          description: 'Le client a été supprimé avec succès.',
        });
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error('Erreur', {
        description: err instanceof Error 
          ? err.message 
          : "Une erreur s'est produite lors de la suppression du client."
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      // Generate a secure temporary password
      const tempPassword = "TempPassword" + Math.floor(Math.random() * 10000) + "!";
      
      // Call the API to update the user's password
      const response = await authAxios.post(`/api/v1/users/${selectedUser.id}/reset-password/`, {
        password: tempPassword,
        password2: tempPassword // Confirmation password if required by API
      });
      
      if (response.status === 200 || response.status === 204) {
        toast.success('Mot de passe réinitialisé', {
          description: `Le mot de passe temporaire est: ${tempPassword}`,
        });
        
        setIsResetPasswordDialogOpen(false);
        setSelectedUser(null);
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error('Erreur', {
        description: err instanceof Error 
          ? err.message 
          : "Une erreur s'est produite lors de la réinitialisation du mot de passe."
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '+216 ',
      is_active: user.is_active || false,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  // Fetch user data on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = calculateStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full md:w-64"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              <SelectItem value="active">Clients actifs</SelectItem>
              <SelectItem value="inactive">Clients inactifs</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Rafraîchir la liste des clients"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter un client
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-24" /> : stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clients Actifs
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-24" /> : stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Personnel
            </CardTitle>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-24" /> : stats.staffCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>
            Vue d'ensemble de tous les clients enregistrés dans le système
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Show loading skeletons while data is being fetched
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Statut
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Indique si le compte client est actif (peut se connecter) ou inactif (accès restreint)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Véhicules
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Nombre de véhicules associés à ce client</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Inscription
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Date à laquelle le client s'est inscrit dans le système</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Statut
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Indique si le compte client est actif (peut se connecter) ou inactif (accès restreint)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Véhicules
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Nombre de véhicules associés à ce client</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Inscription
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Date à laquelle le client s'est inscrit dans le système</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{getUserFullName(user)}</TableCell>
                    <TableCell>{user.email || 'Non spécifié'}</TableCell>
                    <TableCell>{user.phone_number || 'Non spécifié'}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.vehicles_count || 0}</TableCell>
                    <TableCell>{formatDate(user.date_joined)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <span className="sr-only">Ouvrir le menu</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => { setSelectedUser(user); setIsResetPasswordDialogOpen(true); }}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Réinitialiser mot de passe
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(user)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Aucun client trouvé
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-950 text-slate-50 border-slate-800">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau client</DialogTitle>
            <DialogDescription className="text-slate-400">
              Créez un compte client pour un nouvel utilisateur. Un mot de passe temporaire sera généré.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddNewClient)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-50">Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="johnsmith" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-50">Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-50">Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-50">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.smith@example.com" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-50">Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+216 XX XXX XXX" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                    </FormControl>
                    <FormDescription className="text-slate-400">
                      Format: +216 XX XXX XXX
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md bg-slate-800 border-slate-700 p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-slate-50">
                        Client actif
                      </FormLabel>
                      <FormDescription className="text-slate-400">
                        Les clients inactifs ne peuvent pas se connecter au système.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}
                  className="bg-slate-800 text-slate-50 border-slate-700 hover:bg-slate-700 hover:text-slate-50">
                  Annuler
                </Button>
                <Button type="submit" className="bg-yellow-500 text-black hover:bg-yellow-400">
                  Ajouter le client
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-950 text-slate-50 border-slate-800">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription className="text-slate-400">
              Modifiez les informations du client sélectionné.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditClient)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-50">Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="johnsmith" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-50">Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-50">Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-50">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.smith@example.com" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-50">Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+216 XX XXX XXX" {...field} className="bg-slate-800 border-slate-700 text-slate-50" />
                    </FormControl>
                    <FormDescription className="text-slate-400">
                      Format: +216 XX XXX XXX
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md bg-slate-800 border-slate-700 p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-slate-50">
                        Client actif
                      </FormLabel>
                      <FormDescription className="text-slate-400">
                        Les clients inactifs ne peuvent pas se connecter au système.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}
                  className="bg-slate-800 text-slate-50 border-slate-700 hover:bg-slate-700 hover:text-slate-50">
                  Annuler
                </Button>
                <Button type="submit" className="bg-yellow-500 text-black hover:bg-yellow-400">
                  Enregistrer les modifications
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-950 text-slate-50 border-slate-800">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-slate-400">
              Cette action est irréversible. Le client sera définitivement supprimé du système.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <p className="text-sm text-slate-400">
                Vous êtes sur le point de supprimer le client <span className="font-semibold text-slate-50">{getUserFullName(selectedUser)}</span>.
              </p>
            )}
          </div>
          <DialogFooter className="pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-slate-800 text-slate-50 border-slate-700 hover:bg-slate-700 hover:text-slate-50">
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteClient}
              className="bg-red-500 text-white hover:bg-red-600">
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-950 text-slate-50 border-slate-800">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription className="text-slate-400">
              Un mot de passe temporaire sera généré pour le client. Assurez-vous de le communiquer de manière sécurisée.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <p className="text-sm text-slate-400">
                Vous êtes sur le point de réinitialiser le mot de passe pour <span className="font-semibold text-slate-50">{getUserFullName(selectedUser)}</span>.
              </p>
            )}
            <Alert className="mt-4 bg-slate-800 border-slate-700">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="text-slate-50">Important</AlertTitle>
              <AlertDescription className="text-slate-400">
                Un mot de passe temporaire sera généré. Veuillez le communiquer au client de manière sécurisée.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}
              className="bg-slate-800 text-slate-50 border-slate-700 hover:bg-slate-700 hover:text-slate-50">
              Annuler
            </Button>
            <Button type="button" onClick={handleResetPassword}
              className="bg-yellow-500 text-black hover:bg-yellow-400">
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen} modal={true}>
        <DialogContent className="sm:max-w-[725px] bg-slate-950 text-slate-50 border-slate-800">
          <DialogHeader>
            <DialogTitle>Détails du client</DialogTitle>
            <DialogDescription className="text-slate-400">
              Informations détaillées sur le client, ses véhicules et historique.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <>
              <Tabs defaultValue="informations" className="w-full">
                <TabsList className="w-full bg-slate-800">
                  <TabsTrigger value="informations" className="data-[state=active]:bg-slate-700">Informations</TabsTrigger>
                  <TabsTrigger value="vehicles" className="data-[state=active]:bg-slate-700">Véhicules</TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-slate-700">Historique</TabsTrigger>
                </TabsList>
                
                <TabsContent value="informations" className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-400">Nom complet</h3>
                        <p className="text-base font-medium text-slate-50">{getUserFullName(selectedUser)}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-400">Email</h3>
                        <p className="text-base font-medium text-slate-50">{selectedUser.email || 'Non spécifié'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-400">Date d'inscription</h3>
                        <p className="text-base font-medium text-slate-50">{formatDate(selectedUser.date_joined)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-400">Nom d'utilisateur</h3>
                        <p className="text-base font-medium text-slate-50">{selectedUser.username}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-400">Téléphone</h3>
                        <p className="text-base font-medium text-slate-50">{selectedUser.phone_number || 'Non spécifié'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-400">Statut</h3>
                        <div>
                          {selectedUser.is_active ? (
                            <Badge variant="outline" className="bg-green-950 text-green-400 border-green-800">
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-950 text-red-400 border-red-800">
                              Inactif
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="vehicles">
                  <div className="py-4">
                    {selectedUser.vehicles_count && selectedUser.vehicles_count > 0 ? (
                      <p className="text-slate-50">Le client possède {selectedUser.vehicles_count} véhicule(s).</p>
                    ) : (
                      <div className="text-center p-6 bg-slate-800 rounded-md">
                        <p className="text-slate-400">Aucun véhicule associé à ce client.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="history">
                  <div className="py-4">
                    <div className="text-center p-6 bg-slate-800 rounded-md">
                      <p className="text-slate-400">Historique non disponible pour le moment.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button 
                  variant="outline" 
                  onClick={() => openEditDialog(selectedUser)}
                  className="bg-slate-800 text-slate-50 border-slate-700 hover:bg-slate-700 hover:text-slate-50"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsDetailOpen(false);
                    setIsResetPasswordDialogOpen(true);
                  }}
                  className="bg-slate-800 text-slate-50 border-slate-700 hover:bg-slate-700 hover:text-slate-50"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Réinitialiser mot de passe
                </Button>
                <Button 
                  onClick={() => setIsDetailOpen(false)}
                  className="bg-yellow-500 text-black hover:bg-yellow-400"
                >
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage; 