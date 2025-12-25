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
        title: 'Chào mừng trở lại!',
        description: `Đăng nhập với tên ${username}`,
      });
    } catch (error: any) {
      toast({
        title: 'Đăng nhập thất bại',
        description: error.response?.data?.message || 'Thông tin đăng nhập không hợp lệ',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signUp = async (username: string, password: string, firstname: string, lastname: string) => {
    try {
      await authApi.signUp({ username, password, firstname, lastname });
      toast({
        title: 'Tạo tài khoản thành công!',
        description: 'Bạn có thể đăng nhập bằng thông tin của mình',
      });
    } catch (error: any) {
      toast({
        title: 'Đăng ký thất bại',
        description: error.response?.data?.message || 'Không thể tạo tài khoản',
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
      title: 'Đã đăng xuất',
      description: 'Hẹn gặp lại!',
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
