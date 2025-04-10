import React from 'react';
import Sidebar from './Sidebar'; // Import the real Sidebar
import Header from './Header'; // Import the real Header

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background text-foreground"> {/* Added text-foreground for better contrast */}
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64"> {/* Adjust margin based on Sidebar width */}
        <Header />
        <main className="flex-1 p-6 overflow-y-auto bg-background text-foreground"> {/* Explicitly set background and text colors */}
          {children} {/* Page content will be rendered here */}
        </main>
      </div>
    </div>
  );
};

export default AppLayout; 