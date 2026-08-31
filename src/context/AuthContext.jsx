import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContextObject';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('lumina_token') || null);
  const [user, setUser] = useState(null);
