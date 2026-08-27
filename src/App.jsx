import { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import AuthModal from './components/AuthModal'
import SearchTab from './components/SearchTab'
import FavoritesTab from './components/FavoritesTab'
import MovieDetails from './components/MovieDetails'
import BookDetails from './components/BookDetails'
import { fetchUserFavorites, addFavoriteApi, removeFavoriteApi } from './services/api'


function AppContent() {
  const { user, token, openLoginModal, openRegisterModal, logout } = useAuth()

  // Navigation / Router State
  const [route, setRoute] = useState({ path: '/', params: {} })
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('media-favorites')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

   // Clear favorites state & storage (used on sign-out and before loading server copy)
  const clearFavorites = () => {
    setFavorites([])
    localStorage.removeItem('media-favorites')
  }

  // Sync favorites with backend DB when logged in; clear them when logged out
  useEffect(() => {
    let active = true;
    if (token) {
      // Clear any local/guest favourites before loading the user's server copy
      setFavorites([]);
      localStorage.removeItem('media-favorites');