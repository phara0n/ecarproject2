import React, { useState, useEffect, ReactNode } from 'react';
import AuthContext, { AuthContextType, User, useAuth } from './AuthContext'; // Import context definition

// Define props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading to check auth status

  // Helper function to fetch user data after getting a token
  const fetchUserData = async (authToken: string) => {
    console.log("Fetching user data with token...");
    try {
      const response = await fetch('/api/v1/users/me/', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }
      
      const responseData = await response.json(); // Get the full wrapped response
      console.log("Raw user data response:", responseData);

      // Extract the actual user object from the nested 'data' field
      const userData: User | null = responseData.data; // <<<--- EXTRACT USER FROM NESTED FIELD

      if (!userData) {
         console.error("User data missing in API response structure:", responseData);
         throw new Error("Structure de réponse utilisateur API inattendue.");
      }

      console.log("User data extracted:", userData);
      setUser(userData); // Set the *extracted* user object
      setToken(authToken); 
      localStorage.setItem('authToken', authToken);
    } catch (error) {
      console.error("Error fetching or processing user data:", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      throw error; 
    }
  };

  // Function to check auth status on initial load (using API)
  const checkAuthStatus = async () => {
    setIsLoading(true);
    console.log("Checking auth status...");
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      console.log("Token found in localStorage. Verifying...");
      try {
        // TODO: Optionally add a dedicated token verification endpoint (/api/auth/token/verify/)
        // For now, we assume fetching user data verifies the token implicitly.
        await fetchUserData(storedToken);
        console.log("Auth status checked: Token valid, user logged in.");
      } catch (error) {
        console.log("Token verification failed or user fetch failed.");
        // Error handling is done within fetchUserData (clears state/token)
      }
    } else {
      console.log("No token found. User is not logged in.");
      setUser(null);
      setToken(null);
    }
    setIsLoading(false);
  };

  // Run checkAuthStatus on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Login function (using API)
  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    console.log("Attempting login via API with:", credentials.username);
    try {
      const response = await fetch('/api/v1/token/', { // <<<--- CORRECTED LOGIN ENDPOINT
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        let errorMsg = "Erreur de connexion inconnue.";
        try {
          const errorData = await response.json();
          // Extract error message from common Django REST Framework formats
          if (errorData.detail) {
            errorMsg = errorData.detail;
          } else if (errorData.non_field_errors) {
            errorMsg = errorData.non_field_errors.join(' ');
          } else {
            // Try to serialize other potential errors
            errorMsg = JSON.stringify(errorData);
          }
        } catch (jsonError) {
          // If parsing error JSON fails, use status text
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
      }

      const responseData = await response.json(); // Renamed variable for clarity
      
      // Extract token from the nested data object
      const authToken = responseData.data?.access; // <<<--- CORRECTED TOKEN EXTRACTION
      
      if (!authToken) {
        // Handle cases where response is OK but token is missing in the expected structure
        console.error("API response structure unexpected or missing access token:", responseData);
        throw new Error("Token non reçu ou structure de réponse API inattendue.");
      }

      console.log("Login API call successful. Token received. Fetching user data...");
      // After getting the token, fetch user data
      await fetchUserData(authToken);
      console.log("Login and user fetch successful.");
      
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      throw error; // Re-throw error for LoginPage to handle
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function (remains the same for now, potentially add API call later)
  const logout = () => {
    console.log("Logging out...");
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    // TODO: Optionally call Django logout endpoint (/api/auth/logout/)
    console.log("Logout complete.");
    // Redirect is handled by ProtectedLayout reloading
  };

  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Re-export useAuth for convenience
export { useAuth }; 