import React, { useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import AuthContext, { AuthContextType, User } from './AuthContext';
import ky from 'ky';
import { useNavigate } from 'react-router-dom';

// Define props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // isLoading est UNIQUEMENT pour l'état initial, jusqu'à la fin de la première vérification
  const [isLoading, setIsLoading] = useState(true);
  const [authAttempts, setAuthAttempts] = useState(0);
  const MAX_AUTH_RETRIES = 3;
  // Flag pour savoir si la vérification initiale est en cours
  const [isInitialCheckRunning, setIsInitialCheckRunning] = useState(false);
  
  // Use refs to stabilize function identities
  const tokenRef = useRef<string | null>(null);
  const initialLoadingRef = useRef<boolean>(true);
  const kyInstanceRef = useRef<typeof ky | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const navigate = useNavigate();

  const getToken = useCallback((): string | null => {
    return tokenRef.current || localStorage.getItem('authToken');
  }, []);

  const logout = useCallback((silent: boolean = false) => {
    console.log("AuthProvider: Logging out...");
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    
    // Only navigate if not silent mode
    if (!silent && navigate) {
      navigate('/login');
    }
  }, [navigate]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    console.log("AuthProvider: refreshToken called");
    
    // Too many attempts, log out
    if (authAttempts >= MAX_AUTH_RETRIES) {
      console.error("AuthProvider: Max auth retries exceeded, logging out");
      logout(true);
      setAuthAttempts(0);
      return null;
    }

    const currentRefreshToken = localStorage.getItem('refreshToken');
    if (!currentRefreshToken) {
      console.error("AuthProvider: No refresh token available, logging out");
      logout(true);
      return null;
    }

    try {
      // Create a base URL for the refresh request
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      const response = await ky.post(`${baseURL}/api/v1/auth/refresh/`, {
        json: {
          refresh: currentRefreshToken
        },
        credentials: 'include'
      }).json();

      const { access, refresh } = response as { access: string; refresh: string };
      
      // Store tokens
      localStorage.setItem('authToken', access);
      localStorage.setItem('refreshToken', refresh);
      setToken(access);
      setRefreshTokenValue(refresh);
      setAuthAttempts(0); // Reset auth attempts on success
      
      // Update authenticated state if we don't already have it
      if (!isAuthenticated) {
        setIsAuthenticated(true);
      }

      console.log("AuthProvider: Token refreshed successfully");
      return access;
    } catch (error) {
      console.error("AuthProvider: Error refreshing token:", error);
      setAuthAttempts(prev => prev + 1);
      return null;
    }
  }, [logout, MAX_AUTH_RETRIES]); // Remove isAuthenticated and authAttempts from dependencies

  const fetchUserData = useCallback(async (currentToken?: string) => {
    const token = currentToken || getToken();
    if (!token) {
      console.log("AuthProvider: No token available for user data fetch");
      throw new Error('No authentication token');
    }

    console.log("AuthProvider: Fetching user data with token");
    
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/me/`;
      console.log("AuthProvider: Fetching user data from:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies if any
      });

      console.log("AuthProvider: User data fetch status:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn("AuthProvider: Unauthorized when fetching user data, token may be invalid");
          setUser(null);
          throw new Error('Unauthorized');
        }
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }

      const userData = await response.json();
      console.log("AuthProvider: User data fetched:", userData);
      
      // Extract user data, handling possible wrapper structure
      const user = userData.data || userData;
      
      if (!user || !user.id) {
        console.error("AuthProvider: Invalid user data format:", userData);
        throw new Error('Invalid user data format');
      }

      setUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (error) {
      console.error("AuthProvider: Error fetching user data:", error);
      if (error instanceof Error && error.message === 'Unauthorized') {
        // Only for 401 errors
        logout();
      }
      throw error;
    } finally {
      // Always mark initial loading as complete once we've tried to fetch user data
      if (initialLoadingRef.current) {
        console.log("AuthProvider: Initial loading complete");
        initialLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [getToken, logout]);

  // Initialize Ky instance once
  useEffect(() => {
    console.log("AuthProvider: Initializing Ky...");

    // Create the Ky extended instance with hooks for auth
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    
    const kyInstance = ky.extend({
      prefixUrl: baseURL,
      timeout: 10000,
      credentials: 'include',
      hooks: {
        beforeRequest: [
          request => {
            const currentToken = tokenRef.current || localStorage.getItem('authToken');
            if (currentToken) {
              request.headers.set('Authorization', `Bearer ${currentToken}`);
            }
          }
        ],
        afterResponse: [
          async (request, options, response) => {
            // Handle 401 Unauthorized error (token expired)
            if (response.status === 401) {
              // Try to refresh the token
              console.log("AuthProvider: Ky intercepted 401 response, attempting token refresh");
              try {
                const newToken = await refreshToken();
                if (newToken) {
                  // Clone request and retry with new token
                  const newRequest = request.clone();
                  newRequest.headers.set('Authorization', `Bearer ${newToken}`);
                  console.log("AuthProvider: Retrying request with new token");
                  return ky(newRequest);
                }
              } catch (refreshError) {
                console.error("AuthProvider: Token refresh failed in interceptor", refreshError);
                // Let the error flow through
              }
            }
            return response;
          }
        ]
      }
    });

    kyInstanceRef.current = kyInstance;
    
    console.log("AuthProvider: Ky instance initialized");
  }, []); // Empty dependency array ensures this runs only once

  // --- Vérification d'Authentification Initiale (une seule fois) ---
  useEffect(() => {
    let isMounted = true; // For avoiding state updates after unmount
    
    const runInitialCheck = async () => {
      // Empêcher exécutions multiples si HMR rapide ou autre bug
      if (isInitialCheckRunning) return;
      setIsInitialCheckRunning(true);

      console.log("AuthProvider: Starting initial auth check...");
      const storedToken = localStorage.getItem('authToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (isMounted) {
        setRefreshTokenValue(storedRefreshToken); // Définir pour les appels futurs éventuels
      }

      if (storedToken && isMounted) {
        console.log("AuthProvider: Initial check - Found auth token.");
        try {
          await fetchUserData(storedToken); // Essayer de charger les données utilisateur
          console.log("AuthProvider: Initial check - User data loaded successfully.");
        } catch (error) {
          console.warn("AuthProvider: Initial check - Fetch user data failed. Refresh might be attempted by interceptor or next logic.", error);
          // L'erreur 401 est gérée par l'interceptor Ky qui appelle refreshToken.
          // Si fetchUserData échoue pour une autre raison ou si le refresh échoue, logout(true) est appelé DANS ces fonctions.
          // Si fetchUserData réussit après un refresh (via intercepteur), l'état est déjà bon.
        }
      } else if (isMounted) {
        console.log("AuthProvider: Initial check - No auth token found.");
        // Assurer un état propre si aucun token
        logout(true); // Logout pendant check initial sans arrêter isLoading
      }

      if (isMounted) {
        console.log("AuthProvider: Initial auth check finished.");
        setIsLoading(false); // Terminer l'état de chargement initial ICI
        setIsInitialCheckRunning(false);
      }
    };

    runInitialCheck();
    
    return () => {
      isMounted = false; // Prevent state updates if component unmounts
    };
  }, []); // Run only once on component mount

  // --- Login ---
  const login = useCallback(async (credentials: { username: string; password: string }) => {
    console.log("AuthProvider: Attempting login...");
    // Ne pas utiliser setIsLoading ici, gérer l'état de chargement dans le composant LoginPage
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const tokenUrl = `${baseURL}/api/v1/token/`;
      console.log("AuthProvider: Making login request to:", tokenUrl);
      
      const response = await ky.post(tokenUrl, {
        json: credentials,
        credentials: 'include',
      }).json();

      const data = response as any;
      console.log("AuthProvider: Login response data structure:", Object.keys(data));
      console.log("AuthProvider: Full response data:", data);
      
      // Extract tokens from our custom response format that wraps data
      const tokenData = data.data || data;
      console.log("AuthProvider: Token data after unwrapping:", tokenData);
      
      const newAuthToken = tokenData.access;
      const newRefreshToken = tokenData.refresh;

      if (!newAuthToken) {
        console.log("AuthProvider: Login response missing token. Response:", data);
        console.log("AuthProvider: Unwrapped token data:", tokenData);
        throw new Error("Login missing access token.");
      }

      console.log("AuthProvider: Login API success. Setting tokens.");
      setToken(newAuthToken);
      setRefreshTokenValue(newRefreshToken);
      localStorage.setItem('authToken', newAuthToken);
      if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
      else localStorage.removeItem('refreshToken');

      try {
        // Fetch user data AFTER token setup
        await fetchUserData(newAuthToken);
        console.log("AuthProvider: Login complete, user data fetched.");
      } catch (userDataError) {
        console.error("AuthProvider: Error fetching user data after login:", userDataError);
        // If we can't fetch user data, still consider login successful but show warning
        console.warn("AuthProvider: Login succeeded but user data fetch failed. Will try again on next page load.");
        // Don't logout here, just return and let the app continue
      }

    } catch (error) {
      console.error("AuthProvider: Login failed:", error);
      logout(); // Logout complet en cas d'échec du login
      throw error; // Propager pour le formulaire
    }
  }, [fetchUserData, logout]);

  // Create a safe wrapper for Ky that checks if the instance is initialized
  const authClient = useMemo(() => ({
    get: async (url: string, options?: any) => {
      if (!kyInstanceRef.current) throw new Error("Ky client not initialized");
      return kyInstanceRef.current.get(url, options);
    },
    post: async (url: string, options?: any) => {
      if (!kyInstanceRef.current) throw new Error("Ky client not initialized");
      return kyInstanceRef.current.post(url, options);
    },
    put: async (url: string, options?: any) => {
      if (!kyInstanceRef.current) throw new Error("Ky client not initialized");
      return kyInstanceRef.current.put(url, options);
    },
    delete: async (url: string, options?: any) => {
      if (!kyInstanceRef.current) throw new Error("Ky client not initialized");
      return kyInstanceRef.current.delete(url, options);
    },
    patch: async (url: string, options?: any) => {
      if (!kyInstanceRef.current) throw new Error("Ky client not initialized");
      return kyInstanceRef.current.patch(url, options);
    }
  }), []); // No dependencies needed since we use ref

  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading, // Fournir cet état pour l'écran de chargement initial
    login,
    logout: () => logout(false), // Exposer un logout qui arrête isLoading
    checkAuthStatus: async () => { /* Implémentation si nécessaire */ },
    refreshToken,
    authAxios: authClient, // Exposer le client Ky avec la même interface qu'avant
  }), [user, token, isAuthenticated, isLoading, login, logout, refreshToken, authClient]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Réexporter useAuth pour s'assurer qu'il est disponible
// export { useAuth }; // Si useAuth est défini dans AuthContext.tsx, cette ligne peut être commentée ou retirée. 