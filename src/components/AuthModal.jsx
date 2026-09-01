import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';

function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, setAuthModalMode, login, register } = useAuth();
