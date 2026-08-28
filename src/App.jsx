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

      fetchUserFavorites(token)
        .then((backendFavs) => {
          if (active && Array.isArray(backendFavs)) {
            setFavorites(backendFavs);
            localStorage.setItem('media-favorites', JSON.stringify(backendFavs));
          }
        })
        .catch((err) => console.error('Error fetching backend favorites:', err));
        } else {
      // Token was removed (sign-out) — wipe the favourites
      if (active) {
        setFavorites([]);
        localStorage.removeItem('media-favorites');
      }
    }
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token && favorites.length > 0) {
      localStorage.setItem('media-favorites', JSON.stringify(favorites))
    }
  }, [favorites, token])

  const parseRoute = () => {
    const hash = window.location.hash || '#/'
    
    if (hash === '#/' || hash === '') {
      return { path: '/', params: {} }
    }
    if (hash === '#/trending') {
      return { path: '/trending', params: {} }
    }
    if (hash === '#/favorites') {
      return { path: '/favorites', params: {} }
    }

    // Match #/movie/:id
    const movieMatch = hash.match(/^#\/movie\/([^/]+)$/)
    if (movieMatch) {
      return { path: '/movie', params: { id: movieMatch[1] } }
    }

    // Match #/book/:id
    const bookMatch = hash.match(/^#\/book\/([^/]+)$/)
    if (bookMatch) {
      return { path: '/book', params: { id: bookMatch[1] } }
    }

    return { path: '/', params: {} } // fallback
  }

  // Handle hash change events
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute())
    }
    
  handleHashChange()
  window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Helper functions to manage favorites
  const addFavorite = async (item) => {
    if (!favorites.some(f => String(f.id) === String(item.id) && f.type === item.type)) {
      const updated = [...favorites, item]
      setFavorites(updated)

      if (token) {
        try {
          await addFavoriteApi(item, token)
        } catch (e) {
          console.error('Failed to sync favorite to DB:', e)
        }
      }
    }
  }

  const removeFavorite = async (id, type) => {
    const updated = favorites.filter(f => !(String(f.id) === String(id) && f.type === type))
    setFavorites(updated)