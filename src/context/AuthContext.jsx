import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContextObject';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('lumina_token') || null);
  const [user, setUser] = useState(null);
const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' or 'register'
  const [isLoadingUser, setIsLoadingUser] = useState(true);

    // Fetch current user details if token exists
  const fetchCurrentUser = useCallback(async (authToken) => {
    if (!authToken) {
      setUser(null);
      setIsLoadingUser(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('lumina_token');
        setToken(null);
        setUser(null);
      }
      } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (token) {
        fetchCurrentUser(token);
      } else {
        setIsLoadingUser(false);
      }