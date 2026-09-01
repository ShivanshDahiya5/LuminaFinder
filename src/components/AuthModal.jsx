import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';

function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, setAuthModalMode, login, register } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleModeSwitch = (mode) => {
    setError(null);
    setEmail('');
    setUsername('');
    setPassword('');
    setAuthModalMode(mode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        if (!username.trim()) {
          throw new Error('Username is required.');
        }
        await register(email, username, password);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

   return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="glass-panel max-w-md w-full rounded-3xl p-6 sm:p-8 relative border border-slate-800 shadow-2xl shadow-purple-950/20 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          title="Close dialog"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>