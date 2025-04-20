import { createContext, useContext } from "react";

// Define the shape of the user object (align with Django API response)
interface User {
  id: number | string; // Or UUID
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  // Add other relevant user fields provided by Django API
  // e.g., roles: string[];
}

// Define the shape of the Auth Context state and actions
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>; // Async for API call
  logout: () => void;
  checkAuthStatus: () => Promise<void>; // Async for potential API call
  refreshToken: () => Promise<string | null>; // Async function to refresh the expired token, returns the new token
  authAxios: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, options?: any) => Promise<any>;
    put: (url: string, options?: any) => Promise<any>;
    delete: (url: string, options?: any) => Promise<any>;
    patch: (url: string, options?: any) => Promise<any>;
  };
}

// Create the context with a default value (initially undefined, or null state)
// We will throw an error if used outside a provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Define props for the provider component
// import { AuthProviderProps } from './types';

// Placeholder for the actual provider implementation (will be created next)
// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => { ... };

// Export the context itself if needed elsewhere, though using the hook is preferred
export default AuthContext;

// Export User interface for reuse
export type { User, AuthContextType }; 