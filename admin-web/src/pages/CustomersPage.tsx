import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw, SearchIcon, AlertCircle, Users, UserCheck, BadgeCheck, UserPlus, ChevronDown, Eye, Edit, Trash, KeyRound, HelpCircle, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
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
import { formatDate, formatPhone } from "@/utils/formatters";

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
  username: z.string().min(3, { error: "Le nom d'utilisateur doit contenir au moins 3 caractères" }),
  email: z.string().email({ error: "Format d'email invalide" }),
  first_name: z.string().min(1, { error: "Le prénom est requis" }),
  last_name: z.string().min(1, { error: "Le nom est requis" }),
  phone_number: z.string().regex(/^\+216 \d{2} \d{3} \d{3}$/, {
    error: "Format de téléphone tunisien requis (+216 XX XXX XXX)"
  }),
  // Utilisation de stringbool pour plus de flexibilité (nouvelle fonctionnalité de Zod v4)
  is_active: z.stringbool({
    truthy: ["true", "1", "actif", "oui"],
    falsy: ["false", "0", "inactif", "non"]
  }).default(true),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const CustomersPage = () => {
  const { authAxios } = useAuth();
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
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });

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
      const response = await authAxios.get(
        `api/v1/users/customers/?page=${pagination.page}&page_size=${pagination.pageSize}`
      );
      
      // With Ky, we need to parse the JSON response
      const data = await response.json();

      // Detailed debugging for API response structure
      console.log("===== CUSTOMER API RESPONSE DEBUGGING =====");
      console.log("Raw API Response (structure):", Object.keys(data));
      
      // Extract the first user for detailed debugging
      let firstUser = null;
      if (data.results && data.results.length > 0) {
        firstUser = data.results[0];
        console.log("First user found in data.results");
      } else if (Array.isArray(data) && data.length > 0) {
        firstUser = data[0];
        console.log("First user found in direct array");
      } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        firstUser = data.data[0];
        console.log("First user found in data.data array");
      }
      
      // If we found a user, log comprehensive details about its structure
      if (firstUser) {
        console.log("FIRST USER DETAILED ANALYSIS:");
        console.log("=== Basic properties ===");
        console.log("id:", firstUser.id);
        console.log("username:", firstUser.username);
        console.log("email:", firstUser.email);
        console.log("first_name:", firstUser.first_name);
        console.log("last_name:", firstUser.last_name);
        console.log("is_active:", firstUser.is_active);
        console.log("is_staff:", firstUser.is_staff);
        
        console.log("=== Date properties ===");
        console.log("date_joined:", firstUser.date_joined);
        console.log("last_login:", firstUser.last_login);
        if (firstUser.date_joined) {
          try {
            const parsedDate = new Date(firstUser.date_joined);
            console.log("date_joined parsed:", parsedDate);
            console.log("date_joined valid:", !isNaN(parsedDate.getTime()));
          } catch (e) {
            console.log("Error parsing date_joined:", e);
          }
        }
        
        console.log("=== Contact properties ===");
        console.log("phone_number:", firstUser.phone_number);
        
        console.log("=== Profile object ===");
        if (firstUser.profile) {
          console.log("profile (keys):", Object.keys(firstUser.profile));
          console.log("profile.phone_number:", firstUser.profile.phone_number);
          console.log("profile.email_verified:", firstUser.profile.email_verified);
          // Log other profile properties
          Object.entries(firstUser.profile).forEach(([key, value]) => {
            if (key !== 'phone_number' && key !== 'email_verified') {
              console.log(`profile.${key}:`, value);
            }
          });
        } else {
          console.log("profile: not present");
        }
        
        console.log("=== Vehicles properties ===");
        console.log("vehicles_count:", firstUser.vehicles_count);
        if (firstUser.vehicles) {
          console.log("vehicles array length:", firstUser.vehicles.length);
          if (firstUser.vehicles.length > 0) {
            console.log("First vehicle (keys):", Object.keys(firstUser.vehicles[0]));
            console.log("First vehicle sample:", firstUser.vehicles[0]);
          }
        } else {
          console.log("vehicles: not present");
        }
        
        console.log("=== All available properties ===");
        Object.keys(firstUser).forEach(key => {
          if (!['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 
                'date_joined', 'last_login', 'phone_number', 'profile', 'vehicles', 'vehicles_count'].includes(key)) {
            console.log(`Additional property - ${key}:`, firstUser[key]);
          }
        });
      } else {
        console.log("No users found in the response");
      }
      
      // Analyse détaillée pour comprendre comment extraire les clients
      let extractedUsers: User[] = [];
      let totalItemsCount = 0;
      
      // Cas 1: Structure type Django REST Framework standard
      if (data.results && Array.isArray(data.results)) {
        console.log("Structure: DRF standard pagination");
        extractedUsers = data.results;
        totalItemsCount = data.count || extractedUsers.length;
      } 
      // Cas 2: Structure type { metadata, data, error }
      else if (data.data && Array.isArray(data.data)) {
        console.log("Structure: metadata/data/error pattern");
        extractedUsers = data.data;
        totalItemsCount = data.metadata?.total_count || extractedUsers.length;
      }
      // Cas 3: La réponse est directement un tableau d'utilisateurs
      else if (Array.isArray(data)) {
        console.log("Structure: direct array");
        extractedUsers = data;
        totalItemsCount = extractedUsers.length;
      }
      // Cas 4: Un tableau imbriqué dans une autre propriété
      else if (typeof data === 'object') {
        console.log("Structure: unknown object - inspecting properties");
        // Parcourir les propriétés pour trouver un tableau
        for (const key in data) {
          if (Array.isArray(data[key])) {
            console.log(`Found array in property: ${key}`);
            extractedUsers = data[key];
            totalItemsCount = extractedUsers.length;
            break;
          }
        }
      }
      
      // Si rien n'a été trouvé, tentez d'utiliser l'objet tel quel s'il ressemble à un utilisateur
      if (extractedUsers.length === 0 && typeof data === 'object' && 'id' in data) {
        console.log("Structure: single user object");
        extractedUsers = [data];
        totalItemsCount = 1;
      }
      
      // Process each user to ensure all required fields are properly set
      const processedUsers = extractedUsers.map(user => {
        console.log("Processing user:", user.id, user);
        
        // Ensure is_active is properly set (default to true if undefined)
        const processedUser = {
          ...user,
          is_active: user.is_active === undefined ? true : Boolean(user.is_active),
          
          // Handle phone number that might be in profile or directly in user
          phone_number: user.phone_number || (user.profile?.phone_number ? user.profile.phone_number : undefined),
          
          // Ensure vehicles_count is set
          vehicles_count: user.vehicles_count || (user.vehicles ? user.vehicles.length : 0),
          
          // Ensure date_joined is properly handled
          date_joined: user.date_joined || user.created_at || user.created || undefined
        };
        
        console.log(`Processed user ${user.id}:`, {
          is_active: processedUser.is_active,
          phone: processedUser.phone_number,
          vehicles: processedUser.vehicles_count,
          date_joined: processedUser.date_joined,
          date_formatted: formatUserDate(processedUser.date_joined)
        });
        
        return processedUser;
      });
      
      console.log(`Extracted and processed ${processedUsers.length} users`);
      
      // Mise à jour des valeurs de pagination
      const totalItems = Math.max(0, totalItemsCount);
      const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize));

      // Mise à jour de l'état
      setUsers(processedUsers);
      setPagination(prev => ({
        ...prev,
        totalItems,
        totalPages
      }));

      // Si aucun utilisateur n'a été trouvé malgré une réponse 200, loggez un avertissement
      if (processedUsers.length === 0) {
        console.warn("API returned 200 but no users were extracted. Response data:", data);
      }

      // Log detailed information about the first user for debugging
      if (processedUsers && processedUsers.length > 0) {
        const firstUser = processedUsers[0];
        console.log("First user sample:", {
          id: firstUser.id,
          username: firstUser.username,
          email: firstUser.email,
          fullName: `${firstUser.first_name} ${firstUser.last_name}`,
          dateJoined: firstUser.date_joined,
          formattedDateJoined: formatUserDate(firstUser.date_joined),
          phone: firstUser.phone_number,
          profilePhone: firstUser.profile?.phone_number,
          isActive: firstUser.is_active,
          vehicles: firstUser.vehicles,
          vehiclesCount: firstUser.vehicles_count,
          profile: firstUser.profile
        });
      }

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors de la récupération des utilisateurs"
      );
      console.error("Error fetching users:", error);
      
      // En cas d'erreur, réinitialiser les utilisateurs à un tableau vide
      // et s'assurer que pagination a des valeurs valides
      setUsers([]);
      setPagination(prev => ({
        ...prev,
        totalItems: 0,
        totalPages: 1
      }));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authAxios, pagination.page, pagination.pageSize]);

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

  // Calculate user statistics
  const calculateStats = () => {
    console.log("Calculating stats from users:", users);
    
    if (!users || users.length === 0) {
      console.log("No users available for stats calculation");
      return { total: 0, active: 0, staffCount: 0 };
    }
    
    const stats = {
      total: users.length,
      active: users.filter(user => user.is_active).length,
      staffCount: users.filter(user => user.is_staff).length
    };
    
    console.log("Calculated stats:", stats);
    return stats;
  };

  // Filter users based on search term and status filter
  const filteredUsers = useMemo(() => {
    console.log("Filtering users:", users.length);
    
    const filtered = users.filter((user) => {
      const searchTermLower = searchTerm.toLowerCase();
      const fullName = getUserFullName(user);
      
      const matchesSearchTerm = 
        fullName.toLowerCase().includes(searchTermLower) ||
        (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
        (user.phone_number && user.phone_number.toLowerCase().includes(searchTermLower));

      let matchesStatusFilter = true;
      if (statusFilter === 'active') {
        matchesStatusFilter = !!user.is_active;
      } else if (statusFilter === 'inactive') {
        matchesStatusFilter = !user.is_active;
      }

      const result = matchesSearchTerm && matchesStatusFilter;
      return result;
    });
    
    console.log("Filtered users result:", filtered.length, "out of", users.length);
    return filtered;
  }, [users, searchTerm, statusFilter]);

  const handleAddNewClient = async (data: ClientFormValues) => {
    console.log('Adding new client:', data);
    
    try {
      // Use the register endpoint instead of users/customers
      const response = await authAxios.post('api/v1/register/', { 
        json: {
          ...data,
          // Include required fields for registration
          password: "TempPassword123!", // Default password that user will need to change
          password2: "TempPassword123!" // Confirmation password for validation
        }
      });
      
      const newUser = await response.json();
      setUsers(prevUsers => [...prevUsers, newUser]);
      
      toast.success('Client ajouté', {
        description: 'Le client a été ajouté avec succès. Un mot de passe temporaire a été généré.',
      });
      
      setIsAddDialogOpen(false);
      form.reset();
      
      // Refresh the clients list to get the updated data
      fetchUsers();
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
      // Extract phone_number from data for profile update
      const { phone_number, ...userData } = data;
      
      // 1. First update the user's basic information 
      const userResponse = await authAxios.put(`api/v1/users/${selectedUser.id}/`, { 
        json: userData
      });
      
      let updatedUser = await userResponse.json();
      console.log('User updated:', updatedUser);
      
      // 2. Check if we need to update the profile for phone number
      if (phone_number && phone_number !== selectedUser.phone_number) {
        try {
          console.log('Updating user profile with phone number:', phone_number);
          // Try to update the profile separately - adjust endpoint as needed
          const profileResponse = await authAxios.put(`api/v1/users/${selectedUser.id}/profile/`, {
            json: { phone_number }
          });
          
          const profileData = await profileResponse.json();
          console.log('Profile updated:', profileData);
          
          // Merge the updated profile data with the user data
          updatedUser = {
            ...updatedUser,
            phone_number: phone_number,
            profile: {
              ...(updatedUser.profile || {}),
              phone_number: phone_number
            }
          };
        } catch (profileErr) {
          console.error('Error updating user profile:', profileErr);
          // Don't fail the whole operation if just the profile update fails
          toast.warning('Avertissement', {
            description: "Les informations de base du client ont été mises à jour, mais la mise à jour du numéro de téléphone a échoué."
          });
        }
      }
      
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
      // Call the API to delete the user - remove leading slash
      await authAxios.delete(`api/v1/users/${selectedUser.id}/`);
      
      // Remove the user from the local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));
      
      toast.success('Client supprimé', {
        description: 'Le client a été supprimé avec succès.',
      });
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
      
      // Call the API to update the user's password - remove leading slash
      const response = await authAxios.post(`api/v1/users/${selectedUser.id}/reset-password/`, {
        json: {
          password: tempPassword,
          password2: tempPassword // Confirmation password if required by API
        }
      });
      
      await response.json();
      
      toast.success('Mot de passe réinitialisé', {
        description: `Le mot de passe temporaire est: ${tempPassword}`,
      });
      
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
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

  // When pagination.page changes, reload the data
  useEffect(() => {
    console.log("Pagination page changed, reloading data:", pagination.page);
    fetchUsers();
  }, [pagination.page, fetchUsers]);

  const stats = calculateStats();

  // Ajouter le gestionnaire de changement de page
  const handlePageChange = (newPage: number) => {
    console.log("Changing page from", pagination.page, "to", newPage);
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Format date for customer display
  const formatUserDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      console.log("Date string is null or undefined");
      return "-";
    }
    
    console.log("Attempting to format date:", dateString);
    
    try {
      // Try using Date.parse first
      const parsedDate = new Date(dateString);
      console.log("Date parsed result:", parsedDate, "valid:", !isNaN(parsedDate.getTime()));
      
      if (!isNaN(parsedDate.getTime())) {
        // Valid date
        return new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).format(parsedDate);
      }
      
      // Fall back to manual parsing if the automatic parsing doesn't work
      console.log("Automatic parsing failed, trying manual parsing");
      
      // Try to extract date parts from ISO string - format 2023-04-25T14:30:00Z
      const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [_, year, month, day] = match;
        console.log("Manual parsing result:", { year, month, day });
        return `${day}/${month}/${year}`;
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }
    
    console.log("All date parsing methods failed");
    return "-";
  };

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
          ) : (
            <>
              {console.log("Render condition", {
                isLoading,
                usersLength: users.length,
                filteredUsersLength: filteredUsers.length,
                renderingTable: filteredUsers.length > 0 ? "TABLE" : "NO USERS MESSAGE"
              })}
              {filteredUsers.length > 0 ? (
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
                    {filteredUsers.map((user) => {
                      console.log("Rendering user:", user);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{getUserFullName(user)}</TableCell>
                          <TableCell>{user.email || 'Non spécifié'}</TableCell>
                          <TableCell>{formatPhone(user.phone_number || user.profile?.phone_number) || '-'}</TableCell>
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
                          <TableCell>{user.vehicles ? user.vehicles.length : (user.vehicles_count || 0)}</TableCell>
                          <TableCell>{formatUserDate(user.date_joined)}</TableCell>
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
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Aucun client trouvé {users.length > 0 && `(${users.length} clients filtrés)`}
                </div>
              )}
            </>
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
                        <p className="text-base font-medium text-slate-50">{formatUserDate(selectedUser.date_joined)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-400">Nom d'utilisateur</h3>
                        <p className="text-base font-medium text-slate-50">{selectedUser.username}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-400">Téléphone</h3>
                        <p className="text-base font-medium text-slate-50">{formatPhone(selectedUser.phone_number || selectedUser.profile?.phone_number) || '-'}</p>
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

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Affichage de {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.totalItems)} à {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} sur {pagination.totalItems} clients
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
          >
            Précédent
          </Button>
          {Array.from({ length: Math.max(0, Math.min(5, pagination.totalPages || 1)) }).map((_, i) => {
            const pageNumber = pagination.page > 3 ? 
              (pagination.page - 3 + i + 1) : (i + 1);
            
            if (pageNumber <= pagination.totalPages) {
              return (
                <Button
                  key={i}
                  variant={pageNumber === pagination.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={isLoading}
                >
                  {pageNumber}
                </Button>
              );
            }
            return null;
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage; 