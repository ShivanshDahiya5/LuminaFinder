/**
 * Client-side auth using localStorage.
 * Passwords are hashed with bcryptjs (pure-JS, works in browsers).
 * No backend or database required.
 */
import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContextObject';
import bcrypt from 'bcryptjs';

const USERS_KEY   = 'lumina_users';
const SESSION_KEY = 'lumina_session';

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(() => loadSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Keep session in sync if multiple tabs change it
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SESSION_KEY) setUser(loadSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const register = useCallback(async (email, username, password) => {
    if (!email || !username || !password) throw new Error('Email, username and password are required.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

    const users = loadUsers();
    const emailNorm = email.toLowerCase().trim();

    if (users.find(u => u.email === emailNorm)) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      email: emailNorm,
      username: username.trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);

    const session = { id: newUser.id, email: newUser.email, username: newUser.username };
    saveSession(session);
    setUser(session);
    setIsAuthModalOpen(false);
    return session;
  }, []);

  const login = useCallback(async (email, password) => {
    if (!email || !password) throw new Error('Email and password are required.');

    const users = loadUsers();
    const found = users.find(u => u.email === email.toLowerCase().trim());
    if (!found) throw new Error('Invalid email or password.');

    const valid = await bcrypt.compare(password, found.passwordHash);
    if (!valid) throw new Error('Invalid email or password.');

    const session = { id: found.id, email: found.email, username: found.username };
    saveSession(session);
    setUser(session);
    setIsAuthModalOpen(false);
    return session;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const openLoginModal    = () => { setAuthModalMode('login');    setIsAuthModalOpen(true); };
  const openRegisterModal = () => { setAuthModalMode('register'); setIsAuthModalOpen(true); };
  const closeAuthModal    = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token: user?.id ?? null,   // token is now the userId — used as the favorites key
        isLoadingUser,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshUser: () => setUser(loadSession()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}