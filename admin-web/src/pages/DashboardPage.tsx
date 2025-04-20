import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, Wrench, Users, CalendarDays } from 'lucide-react';

const DashboardPage = () => {
  // Mock data for recent activity - replace with actual data later
  const recentActivities = [
    { id: 1, description: "Nouveau véhicule ajouté : 123TU4567", user: "Admin", time: "il y a 5 minutes" },
    { id: 2, description: "Service Vidange complété pour 987TU1234", user: "Mécanicien A", time: "il y a 1 heure" },
    { id: 3, description: "Kilométrage mis à jour pour 111TU2222", user: "Client X", time: "il y a 3 heures" },
    { id: 4, description: "Nouvelle facture ajoutée pour 987TU1234", user: "Manager", time: "hier" },
  ];

  return (
    <div className="space-y-6 p-6 bg-background text-primary min-h-screen">
      <h1 className="text-2xl font-bold text-primary">Tableau de Bord</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-muted rounded-lg shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Véhicules</CardTitle>
            <Car className="h-4 w-4 text-primary/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20.1% depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted rounded-lg shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Services en Attente</CardTitle>
            <Wrench className="h-4 w-4 text-primary/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+56</div>
            <p className="text-xs text-muted-foreground">
              Dont 12 urgents
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted rounded-lg shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Clients Actifs</CardTitle>
            <Users className="h-4 w-4 text-primary/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+89</div>
            <p className="text-xs text-muted-foreground">
              +5 depuis la semaine dernière
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted rounded-lg shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Prochains RDV</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              3 aujourd'hui
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area - Charts and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart Area (Placeholder) */}
        <Card className="lg:col-span-4 bg-muted rounded-lg shadow">
          <CardHeader>
            <CardTitle className="text-primary">Statistiques Visuelles (Placeholder)</CardTitle>
            <CardDescription>
              Graphiques des services, kilométrage moyen, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             {/* Chart component will go here - e.g., <BarChart ... /> */}
             <div className="h-64 flex items-center justify-center text-primary/60 bg-background rounded-md">
               (Graphique)
             </div>
          </CardContent>
        </Card>

        {/* Recent Activity Table */}
        <Card className="lg:col-span-3 bg-muted rounded-lg shadow">
          <CardHeader>
            <CardTitle className="text-primary">Activité Récente</CardTitle>
            <CardDescription>
              Dernières actions enregistrées dans le système.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              {/* Optional: <TableCaption>Liste des activités récentes.</TableCaption> */}
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">Description</TableHead>
                  <TableHead className="text-right text-primary">Temps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-accent">
                    <TableCell>
                      <div className="font-medium">{activity.description}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        par {activity.user}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{activity.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage; 