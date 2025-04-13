import React, { useState, useEffect, ReactNode, useMemo } from 'react';
import AuthContext, { AuthContextType, User, useAuth } from './AuthContext'; // Import context definition
import axios, { AxiosInstance } from 'axios';

// Define props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading to check auth status
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshPromise, setRefreshPromise] = useState<Promise<string | undefined> | null>(null);

  // Create axios instance with interceptors for token handling
  const authAxios: AxiosInstance = useMemo(() => {
    console.log("Creating new authAxios instance (should happen once)"); // Add log
    const instance = axios.create({
      baseURL: '/',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    instance.interceptors.request.use(
      (config) => {
        // Read directly from localStorage
        const currentToken = localStorage.getItem('authToken');
        
        console.log("[Request Interceptor] Checking token:", currentToken ? currentToken.substring(0, 10) + '...' : 'None');
        if (currentToken) {
          config.headers['Authorization'] = `Bearer ${currentToken}`;
          console.log("[Request Interceptor] Token added to headers.");
        } else {
          console.warn("[Request Interceptor] No token found in localStorage for request to:", config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Read latest state values inside the interceptor
        const currentRefreshTokenValue = refreshTokenValue;
        const currentIsRefreshing = isRefreshing;
        const currentRefreshPromise = refreshPromise;

        // If error is 401 and not a retry and we have a refresh token
        if (error.response?.status === 401 && !originalRequest._retry && currentRefreshTokenValue) {
          originalRequest._retry = true;
          console.log("Interceptor: Caught 401. Attempting token refresh...");

          try {
            // Check if another request is already refreshing the token
            if (currentIsRefreshing && currentRefreshPromise) {
              console.log("Interceptor: Refresh already in progress, waiting...");
              const newToken = await currentRefreshPromise; // Wait for the existing refresh to complete
              if (newToken) {
                console.log("Interceptor: Using token from existing refresh for retry.");
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return instance(originalRequest); // Retry with the obtained token
              }
              throw new Error('Existing token refresh failed');
            }

            // Initiate a new token refresh
            // Use the refreshToken function directly (it uses state internally)
            const promise = refreshToken(); 
            setRefreshPromise(promise); // Store the promise to check if refresh is in progress
            setIsRefreshing(true); // Set refreshing flag
            console.log("Interceptor: Started new token refresh.");

            const newToken = await promise;

            // Reset refresh state *after* the promise resolves
            setIsRefreshing(false);
            setRefreshPromise(null);

            if (newToken) {
              console.log("Interceptor: Token refreshed successfully. Updating instance defaults and retrying...");
              instance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
            throw new Error('Token refresh failed to return a new token');
          } catch (refreshError) {
            console.error("Interceptor: Token refresh failed:", refreshError);
            setIsRefreshing(false);
            setRefreshPromise(null);
            logout(); // Logout user if refresh fails
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  // Empty dependency array ensures instance is created only once
  // Interceptors will use latest state via closures.
  }, []);

  // Helper function to fetch user data after getting a token
  const fetchUserData = async (authToken?: string) => { // Make authToken optional for calls using authAxios
    console.log("Fetching user data...");
    try {
      // Use authAxios instance - it automatically includes the latest token via interceptor
      // If an explicit authToken is provided (e.g., right after login), 
      // pass it in headers to ensure the *very latest* token is used immediately.
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await authAxios.get('/api/v1/users/me/', { headers });

      // Axios automatically throws for non-2xx status, so no need for response.ok check
      
      const responseData = response.data; // Axios wraps the response data in `data`
      console.log("Raw user data response:", responseData);

      // Try extracting from nested 'data' first, then assume flat structure
      // Also perform a basic check if it looks like a user object
      let userData: User | null = null;
      if (responseData && responseData.data && typeof responseData.data === 'object' && responseData.data.id) {
        userData = responseData.data;
        console.log("Extracted user data from nested 'data' field.");
      } else if (responseData && typeof responseData === 'object' && responseData.id) {
        userData = responseData as User;
        console.log("Extracted user data from root response object.");
      }

      if (!userData) {
         console.error("User data missing or invalid in API response structure:", responseData);
         throw new Error("Structure de réponse utilisateur API inattendue.");
      }

      console.log("User data extracted:", userData);
      setUser(userData); 
      
      // Update token state and local storage if a new token was effectively used/validated
      const tokenToStore = authToken || localStorage.getItem('authToken');
      if (tokenToStore) {
          setToken(tokenToStore); 
          localStorage.setItem('authToken', tokenToStore);
      } else {
          // This case should ideally not happen if fetchUserData is called correctly
          console.warn("fetchUserData completed but no token was available to store.");
      }

    } catch (error: any) { // Catch AxiosError
      console.error("Error fetching or processing user data:", error);
      
      // Check if it's an Axios error and get status code if possible
      let errorMessage = "Erreur lors de la récupération des données utilisateur.";
      if (axios.isAxiosError(error) && error.response) {
          console.error("Axios error details:", error.response.data);
          errorMessage = `Failed to fetch user data: ${error.response.statusText} (${error.response.status})`;
          // Specific handling for 401/403 could be added here if needed, 
          // but the interceptor should ideally handle 401s.
          if (error.response.status === 404) {
              errorMessage = "Endpoint utilisateur non trouvé (404). Vérifiez la configuration API.";
          }
      } else if (error instanceof Error) {
          errorMessage = error.message;
      }

      setUser(null);
      setToken(null); 
      localStorage.removeItem('authToken'); 
      // Consider whether to clear refresh token here. Maybe only if error is 401/403?
      // For now, let's keep it to allow manual re-login without losing refresh capability.
      // localStorage.removeItem('refreshToken'); 
      
      // Throw a new error with a more specific message if possible
      throw new Error(errorMessage); 
    }
  };

  // Function to check auth status on initial load (using API)
  const checkAuthStatus = async () => {
    setIsLoading(true);
    console.log("Checking auth status...");
    const storedToken = localStorage.getItem('authToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedToken) {
      console.log("Token found in localStorage. Verifying...");
      try {
        // TODO: Optionally add a dedicated token verification endpoint (/api/auth/token/verify/)
        // For now, we assume fetching user data verifies the token implicitly.
        await fetchUserData(storedToken);
        setRefreshTokenValue(storedRefreshToken);
        console.log("Auth status checked: Token valid, user logged in.");
      } catch (error) {
        console.log("Token verification failed or user fetch failed.");
        // If we have a refresh token, try to refresh the access token
        if (storedRefreshToken) {
          try {
            await refreshToken();
          } catch (refreshError) {
            // If refresh fails, clear everything
            setUser(null);
            setToken(null);
            setRefreshTokenValue(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
          }
        } else {
          // Error handling is done within fetchUserData (clears state/token)
          setUser(null);
          setToken(null);
          localStorage.removeItem('authToken');
        }
      }
    } else {
      console.log("No token found. User is not logged in.");
      setUser(null);
      setToken(null);
      setRefreshTokenValue(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
    setIsLoading(false);
  };

  // Function to refresh the token
  const refreshToken = async (): Promise<string | undefined> => {
    console.log("Attempting to refresh token...");
    const storedRefreshToken = localStorage.getItem('refreshToken') || refreshTokenValue;
    
    if (!storedRefreshToken) {
      console.error("No refresh token available");
      // Optionally logout user here if refresh is critical and impossible
      // logout(); 
      throw new Error("No refresh token available");
    }
    
    try {
      // Use standard fetch here, as authAxios interceptors might interfere with refresh logic
      const response = await fetch('/api/v1/token/refresh/', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: storedRefreshToken }),
      });

      if (!response.ok) {
        // If refresh fails (e.g., 401 Unauthorized), logout the user
        console.error(`Token refresh failed with status: ${response.status}`);
        logout(); // Logout on failed refresh
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data = await response.json();
      const newToken = data.access;
      
      // --- Added check for newToken ---
      if (newToken) {
        console.log("Token refreshed successfully, new token:", newToken.substring(0, 10) + "...");
        setToken(newToken);
        localStorage.setItem('authToken', newToken);
        // Update the default header for subsequent authAxios requests immediately
        authAxios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      } else {
        console.error("Refresh response did not contain an access token:", data);
        logout(); // Logout if refresh response is invalid
        throw new Error("Invalid response from token refresh endpoint.");
      }
      // --- End of added check ---
      
      return newToken;
    } catch (error) {
      console.error("Failed to refresh token (exception caught):", error);
      logout(); // Ensure logout on any exception during refresh
      throw error;
    }
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
      console.log("Login response data:", responseData);
      
      // Extract token from the nested data object - handle both formats
      let authToken, refreshValue;
      
      if (responseData.data && responseData.data.access) {
        // New format with nested data
        authToken = responseData.data.access;
        refreshValue = responseData.data.refresh;
        console.log("Using nested data format for auth tokens");
      } else if (responseData.access) {
        // Direct format at root level
        authToken = responseData.access;
        refreshValue = responseData.refresh;
        console.log("Using root level format for auth tokens");
      }
      
      if (!authToken) {
        // Handle cases where response is OK but token is missing in the expected structure
        console.error("API response structure unexpected or missing access token:", responseData);
        throw new Error("Token non reçu ou structure de réponse API inattendue.");
      }

      console.log("Login API call successful. Token received. Fetching user data...");
      // Save refresh token
      if (refreshValue) {
        setRefreshTokenValue(refreshValue);
        localStorage.setItem('refreshToken', refreshValue);
      }
      
      // Fetch user data using the NEW token
      // Pass the explicit authToken to fetchUserData to ensure it's used immediately
      await fetchUserData(authToken); 

      console.log("Login successful, user data fetched.");
      
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      setToken(null);
      setRefreshTokenValue(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
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
    setRefreshTokenValue(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
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
    refreshToken,
    authAxios,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Re-export useAuth for convenience
export { useAuth }; 