import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('volleypro_token');
    const savedUser = localStorage.getItem('volleypro_user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('volleypro_token');
        localStorage.removeItem('volleypro_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('volleypro_token', token);
    localStorage.setItem('volleypro_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (email, password, name) => {
    const response = await authApi.register({ email, password, name });
    const { token, user: userData } = response.data;
    localStorage.setItem('volleypro_token', token);
    localStorage.setItem('volleypro_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('volleypro_token');
    localStorage.removeItem('volleypro_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
