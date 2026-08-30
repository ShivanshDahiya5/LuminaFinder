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

              <a
                id="nav-trending"
                href="#/trending"
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                  route.path === '/trending'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 shadow-inner shadow-amber-950/50'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900/30 border border-transparent'
                }`}
                onClick={() => {
                  sessionStorage.removeItem('search-query');
                  sessionStorage.removeItem('search-results');
                }}
              >
                <span className="text-amber-400 text-sm">🔥</span>
                <span className="hidden sm:inline">Trending</span>
              </a>

              <a
                id="nav-library"
                href="#/favorites"
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 relative ${
                  route.path === '/favorites'
                  ? 'bg-slate-900 border border-slate-800 text-white shadow-inner shadow-slate-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                }`}
              >
                <svg className="w-4 h-4 text-rose-500 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">My Library</span>
                {favorites.length > 0 && (
                  <span className="min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 rounded-full border border-slate-950 shadow-md">
                    {favorites.length}
                  </span>
                )}
              </a>
            </nav>

            <div className="h-6 w-[1px] bg-slate-800/80 mx-1 hidden sm:block"></div>

             {/* Authentication Buttons / User Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 transition-colors"
                >
                   <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 hidden md:inline max-w-[100px] truncate">
                    {user.username}
                    </span>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 border border-slate-800 shadow-2xl z-50 animate-scale-up"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800/60 mb-1">
                      <p className="text-xs font-semibold text-white truncate">{user.username}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    
                    <a
                      href="#/favorites"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                    >
                       <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Saved Library ({favorites.length})
                    </a>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        clearFavorites()
                        logout()
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors mt-1 border-t border-slate-800/40"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
                  ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={openLoginModal}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all"
                >Sign In</button>
                <button
                  onClick={openRegisterModal}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md shadow-purple-500/20 transition-all hidden sm:block"
                >Register</button>
                </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/50 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} LuminaFinder Full-Stack. Worldwide Media Catalog.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 transition-colors">TVMaze API</span>
            <span className="text-slate-800">|</span>
            <span className="hover:text-slate-300 transition-colors">iTunes Global</span>
            <span className="text-slate-800">|</span>
                        <span className="hover:text-slate-300 transition-colors">Google Books API</span>

          </div>
          </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App