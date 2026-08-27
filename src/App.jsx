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