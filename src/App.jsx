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

    if (token) {
      try {
        await removeFavoriteApi(type, id, token)
      } catch (e) {
        console.error('Failed to remove favorite from DB:', e)
      }
    }
  }

  const isFavorite = (id, type) => {
    return favorites.some(f => String(f.id) === String(id) && f.type === type)
  }

  // Render active route component
  const renderPage = () => {
    switch (route.path) {
      case '/':
        return (
          <SearchTab 
            isFavorite={isFavorite} 
            addFavorite={addFavorite} 
            removeFavorite={removeFavorite} 
          />
        )
        case '/trending':
        return (
          <SearchTab 
            initialShowTrending={true}
            isFavorite={isFavorite} 
            addFavorite={addFavorite} 
            removeFavorite={removeFavorite} 
          />
        )
        case '/favorites':
        return (
          <FavoritesTab 
            favorites={favorites} 
            removeFavorite={removeFavorite} 
          />
        )
        case '/movie':
        return (
          <MovieDetails 
            id={route.params.id} 
            isFavorite={isFavorite} 
            addFavorite={addFavorite} 
            removeFavorite={removeFavorite} 
          />
        )
        case '/book':
        return (
          <BookDetails 
            id={route.params.id} 
            isFavorite={isFavorite} 
            addFavorite={addFavorite} 
            removeFavorite={removeFavorite} 
          />
        )
        default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <h2 className="text-2xl font-bold mb-2">404 - Not Found</h2>
            <p className="mb-6">The page you are looking for does not exist.</p>
            <a href="#/" className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              Return Home
            </a>
          </div>
        )
    }
  }
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Auth Modal Dialog */}
      <AuthModal />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-900/80 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"></div>
        {/* Logo / Brand Name */}
          <a id="brand-logo-link" href="#/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent group-hover:opacity-95 transition-opacity">
              Lumina<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-extrabold">Finder</span>
            </span>
          </a>

          {/* Navigation & Auth Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 sm:gap-2">
              <a
                id="nav-explore"
                href="#/"
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                  route.path === '/' || route.path === '/movie' || route.path === '/book'
                    ? 'bg-slate-900 border border-slate-800 text-white shadow-inner shadow-slate-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="hidden sm:inline">Explore</span>
              </a>