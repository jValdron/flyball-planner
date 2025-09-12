import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { recreateWsClient } from '../apollo/client';
import { LoginUser, GetCurrentUser } from '../graphql/auth';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  clubs: Array<{
    id: string;
    name: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [loginMutation] = useMutation(LoginUser);
  const [getCurrentUser] = useLazyQuery(GetCurrentUser);

  const isAuthenticated = useMemo(() => !!user && !!token, [user, token]);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const { data } = await getCurrentUser();
          if (data?.currentUser) {
            setUser(data.currentUser);
            setToken(storedToken);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Failed to get current user:', error);
          localStorage.removeItem('authToken');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [getCurrentUser]);

    const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, errors } = await loginMutation({
        variables: { username, password }
      });

      // Check for GraphQL errors first
      if (errors && errors.length > 0) {
        const errorMessage = errors[0].message;
        setError(errorMessage);
        return false;
      }

      if (data?.loginUser) {
        const { token: newToken, user: userData } = data.loginUser;

        localStorage.setItem('authToken', newToken);
        setToken(newToken);
        setUser(userData);
        recreateWsClient();
        return true;
      }

      // If no data and no errors, something went wrong
      setError('Login failed - no response from server');
      return false;
        } catch (error: any) {
      let errorMessage = 'Login failed';
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMessage = error.networkError.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setError(null);
    recreateWsClient();
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
