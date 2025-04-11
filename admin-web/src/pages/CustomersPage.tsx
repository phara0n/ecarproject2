import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw, SearchIcon, AlertCircle, Users, UserCheck, BadgeCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthProvider';
import { Input } from '@/components/ui/input';

// Define the User interface based on the actual API response from /api/v1/users/me/
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
}

const CustomersPage = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Function to fetch user data from the API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current user data from the /api/v1/users/me/ endpoint
      const response = await fetch('/api/v1/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des utilisateurs: ${response.statusText}`);
      }

      const userData = await response.json();
      console.log('API response from /api/v1/users/me/:', userData);

      // In a real application with admin access, you would fetch all users
      // For now, we'll use the current user data and add mock data for demonstration
      
      // Check if vehicles field exists to determine vehicles count
      const currentUser = {
        ...userData,
        vehicles_count: userData.vehicles?.length || 0
      };
      
      const usersData = [currentUser];
      
      // Add some mock users for demo purposes
      usersData.push(
        {
          id: 2,
          username: 'fatima.m',
          email: 'fatima.m@example.com',
          first_name: 'Fatima',
          last_name: 'Mansouri',
          phone_number: '+216 66 789 012',
          is_staff: false,
          is_active: true,
          date_joined: '2024-06-15T14:30:00Z',
          vehicles_count: 1
        },
        {
          id: 3,
          username: 'mohamed.t',
          email: 'mohamed.t@example.com',
          first_name: 'Mohamed',
          last_name: 'Trabelsi',
          phone_number: '+216 77 345 678',
          is_staff: false,
          is_active: true,
          date_joined: '2024-06-10T09:15:00Z',
          vehicles_count: 3
        }
      );

      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération des données utilisateur');
    } finally {
      setIsLoading(false);
    }
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
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      getUserFullName(user).toLowerCase().includes(searchTermLower) ||
      (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
      (user.phone_number && user.phone_number.toLowerCase().includes(searchTermLower))
    );
  });

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const stats = calculateStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <Input
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
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
                  <TableHead>Véhicules</TableHead>
                  <TableHead>Inscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
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
                  <TableHead>Véhicules</TableHead>
                  <TableHead>Inscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{getUserFullName(user)}</TableCell>
                    <TableCell>{user.email || 'Non spécifié'}</TableCell>
                    <TableCell>{user.phone_number || 'Non spécifié'}</TableCell>
                    <TableCell>{user.vehicles_count || 0}</TableCell>
                    <TableCell>{formatDate(user.date_joined)}</TableCell>
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
    </div>
  );
};

export default CustomersPage; 