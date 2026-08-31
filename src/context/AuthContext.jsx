import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContextObject';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('lumina_token') || null);
  const [user, setUser] = useState(null);
const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' or 'register'
  const [isLoadingUser, setIsLoadingUser] = useState(true);