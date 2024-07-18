import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  userId: string | null;
  email: string | null;
  login: (email: string) => Promise<void>;
  register: (email: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('userEmail');
    if (storedUserId) setUserId(storedUserId);
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const login = async (email: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login`, { email });
      const { id } = response.data;
      setUserId(id);
      setEmail(email);
      localStorage.setItem('userId', id);
      localStorage.setItem('userEmail', email);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const register = async (email: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, { email });
      const { id } = response.data;
      setUserId(id);
      setEmail(email);
      localStorage.setItem('userId', id);
      localStorage.setItem('userEmail', email);
    } catch (error) {
      console.error('Registration failed', error);
    }
  };

  const logout = () => {
    setUserId(null);
    setEmail(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
  };

  return (
    <AuthContext.Provider value={{ userId, email, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
