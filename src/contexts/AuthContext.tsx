import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, usersApi, UserDTO } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, firstname: string, lastname: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (storedToken && storedUsername) {
      setToken(storedToken);
      // Fetch user data
      usersApi.getByUsername(storedUsername)
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const newToken = await authApi.signIn({ username, password });
      localStorage.setItem('token', newToken);
      localStorage.setItem('username', username);
      setToken(newToken);
      
      const userData = await usersApi.getByUsername(username);
      setUser(userData);
      
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${username}`,
      });
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signUp = async (username: string, password: string, firstname: string, lastname: string) => {
    try {
      await authApi.signUp({ username, password, firstname, lastname });
      toast({
        title: 'Account created!',
        description: 'You can now sign in with your credentials',
      });
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.response?.data?.message || 'Could not create account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUser(null);
    toast({
      title: 'Signed out',
      description: 'See you next time!',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
