import { useAuth } from "@/context/AuthContext"; // CORRECTED IMPORT PATH
import { ModeToggle } from "@/components/ui/mode-toggle"; // Import our new ModeToggle
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, User, Settings, LogOut } from 'lucide-react'; // Import icons

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth(); // Get user, auth status, and logout fn
  const iconProps = { className: "mr-2 h-4 w-4" };

  // Function to generate initials (handles potential null user)
  const getUserInitials = () => {
    if (!user) return "";
    const name = user.first_name && user.last_name 
                 ? `${user.first_name} ${user.last_name}` 
                 : user.username;
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - potentially page title or breadcrumbs */}
        <div>
          {/* Example: <h2 className="text-lg font-semibold">Tableau de Bord</h2> */}
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle using our new ModeToggle component */}
          <ModeToggle />

          {/* Render Notifications and User Menu only if authenticated */}
          {isAuthenticated && user && (
            <>
              {/* Notifications Button */}
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {/* Add actual image URL if available from user object */}
                      {/* <AvatarImage src={user.imageUrl} alt={user.username} /> */}
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User {...iconProps} /> Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings {...iconProps} /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}> {/* Call logout from context */}
                    <LogOut {...iconProps} /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 