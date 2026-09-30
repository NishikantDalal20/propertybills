import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } else {
          // Clear any partial state
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to restore authentication state:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    
    if (data.requiresVerification) {
      return data;
    }

    const { password: _password, ...safeUser } = data.user || {};
    const userToSave = Object.keys(safeUser).length > 0 ? safeUser : data.user;

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userToSave));
      setUser(userToSave);
    }
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    
    if (data.requiresOtp) {
      return data;
    }
    
    const { password: _password, ...safeUser } = data.user || {};
    const userToSave = Object.keys(safeUser).length > 0 ? safeUser : data.user;

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userToSave));
      setUser(userToSave);
    }
    return data;
  };

  const verifyOtp = async (email, otp) => {
    const data = await authService.verifyOtp(email, otp);
    
    const { password: _password, ...safeUser } = data.user || {};
    const userToSave = Object.keys(safeUser).length > 0 ? safeUser : data.user;

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userToSave));
    
    setUser(userToSave);
    return data;
  };

  const resendOtp = async (email) => {
    return await authService.resendOtp(email);
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const verifyResetOtp = async (email, otp) => {
    return await authService.verifyResetOtp(email, otp);
  };

  const resetPassword = async (email, otp, newPassword) => {
    return await authService.resetPassword(email, otp, newPassword);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
