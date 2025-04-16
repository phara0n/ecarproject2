import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/context/AuthContext';
import { MoonIcon, SunIcon, SettingsIcon, UserIcon, ShieldIcon, BellIcon } from 'lucide-react';

const SettingsPage = () => {
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock save function
  const handleSave = (section: string) => {
    setIsLoading(true);
    console.log(`Saving ${section} settings...`);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Show success message (would use a toast in a real app)
      console.log(`${section} settings saved successfully!`);
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6 bg-background text-primary min-h-screen">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-primary">Paramètres</h1>
        <SettingsIcon className="ml-2 h-6 w-6 text-muted-foreground" />
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted rounded-lg p-1">
          <TabsTrigger value="general" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Général</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Profil</TabsTrigger>
          <TabsTrigger value="security" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Notifications</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-4">
          <Card className="bg-muted rounded-lg shadow">
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>Gérez les paramètres généraux de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-row items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Thème</Label>
                  <p className="text-sm text-muted-foreground">
                    Choisissez entre le mode clair et sombre
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme('light')}
                    className={`rounded-lg ${theme === 'light' ? 'bg-primary text-white' : 'bg-background text-primary hover:bg-accent'}`}
                  >
                    <SunIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme('dark')}
                    className={`rounded-lg ${theme === 'dark' ? 'bg-primary text-white' : 'bg-background text-primary hover:bg-accent'}`}
                  >
                    <MoonIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme('system')}
                    className={`rounded-lg ${theme === 'system' ? 'bg-primary text-white' : 'bg-background text-primary hover:bg-accent'}`}
                  >
                    Système
                  </Button>
                </div>
              </div>

              <div className="flex flex-row items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Mode Maintenance</Label>
                  <p className="text-sm text-muted-foreground">
                    Activez le mode maintenance pour informer les utilisateurs lors des mises à jour
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-primary text-white hover:bg-primary/80 rounded-lg" onClick={() => handleSave('general')} disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile" className="mt-4">
          <Card className="bg-muted rounded-lg shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                Profil Utilisateur
              </CardTitle>
              <CardDescription>Gérez vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" defaultValue={user?.first_name || ''} className="bg-background rounded-lg focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" defaultValue={user?.last_name || ''} className="bg-background rounded-lg focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email || ''} className="bg-background rounded-lg focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input id="username" defaultValue={user?.username || ''} disabled className="bg-accent rounded-lg" />
                <p className="text-xs text-muted-foreground">Le nom d'utilisateur ne peut pas être modifié</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-primary text-white hover:bg-primary/80 rounded-lg" onClick={() => handleSave('profile')} disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Mettre à jour'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-4">
          <Card className="bg-muted rounded-lg shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldIcon className="mr-2 h-4 w-4" />
                Sécurité
              </CardTitle>
              <CardDescription>Gérez vos paramètres de sécurité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input id="currentPassword" type="password" className="bg-background rounded-lg focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input id="newPassword" type="password" className="bg-background rounded-lg focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input id="confirmPassword" type="password" className="bg-background rounded-lg focus:ring-primary" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-primary text-white hover:bg-primary/80 rounded-lg" onClick={() => handleSave('security')} disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Changer le mot de passe'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-muted rounded-lg shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="mr-2 h-4 w-4" />
                Notifications
              </CardTitle>
              <CardDescription>Gérez vos préférences de notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-row items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications par email pour les nouvelles activités
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
                />
              </div>
              <div className="flex flex-row items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Alertes de service</Label>
                  <p className="text-sm text-muted-foreground">
                    Être alerté quand un service est programmé
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex flex-row items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Rapports hebdomadaires</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un résumé hebdomadaire des activités
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-primary text-white hover:bg-primary/80 rounded-lg" onClick={() => handleSave('notifications')} disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage; 