import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  session: { token: string } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const { user } = await apiClient.getCurrentUser();
        setUser(user);
        setSession({ token: localStorage.getItem('auth_token') || '' });
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setSession(null);
      apiClient.signOut();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Check auth state periodically (every 5 minutes)
    const interval = setInterval(checkAuth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const refreshAuth = async () => {
    await checkAuth();
  };

  const signOut = async () => {
    apiClient.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};