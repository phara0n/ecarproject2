import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils"; // Utility for combining class names
import { LayoutDashboard, Car, Wrench, Users, Settings, LogOut, FileText, Gauge } from 'lucide-react'; // Import icons

const Sidebar = () => {
  const iconProps = { className: "mr-2 h-4 w-4" }; // Common icon props

  const navItems = [
    { href: '/', label: 'Tableau de Bord', icon: <LayoutDashboard {...iconProps} /> },
    { href: '/vehicles', label: 'Véhicules', icon: <Car {...iconProps} /> },
    { href: '/services', label: 'Services', icon: <Wrench {...iconProps} /> },
    { href: '/customers', label: 'Clients', icon: <Users {...iconProps} /> },
    { href: '/factures', label: 'Factures', icon: <FileText {...iconProps} /> },
    { href: '/mileage', label: 'Suivi Kilométrique', icon: <Gauge {...iconProps} /> },
    { href: '/settings', label: 'Paramètres', icon: <Settings {...iconProps} /> },
  ];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen fixed flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-sidebar-foreground">ECAR Admin</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            className={({ isActive }) => cn(
              "w-full justify-start",
              isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              "block p-0"
            )}
            end // Use 'end' prop for exact matching on the root route
          >
            {({ isActive }) => (
               <Button 
                 variant={isActive ? "secondary" : "ghost"} 
                 className={cn(
                   "w-full justify-start",
                   isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                 )}
               >
                 {item.icon}
                 {item.label}
               </Button>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        {/* User profile/logout section */}
        <Button variant="outline" className="w-full justify-start border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground">
          <LogOut {...iconProps} />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar; 