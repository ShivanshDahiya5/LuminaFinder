import { useState } from 'react'
import { useAuth } from '../context/useAuth'

function FavoritesTab({ favorites, removeFavorite }) {
  const { user, openLoginModal, openRegisterModal } = useAuth()
  const [filterType, setFilterType] = useState('all') // 'all', 'movie', 'book'

  const filteredFavorites = favorites.filter(item => {
    if (filterType === 'all') return true
    return item.type === filterType
  })

  return (
    <div className="w-full space-y-8 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              My Media Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
              {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            Your personal collection of saved movies, TV shows, and literature.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 text-xs">
          <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="text-slate-300 font-medium">
            {user ? `Cloud DB Synced (${user.username})` : 'Guest Storage (Local)'}
          </span>
        </div>
      </div>

      {/* Guest Account Banner */}
      {!user && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Save your library across all devices</h4>
              <p className="text-xs text-slate-400">Sign in or register for a free account to sync your saved titles directly to SQLite server storage.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openLoginModal}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={openRegisterModal}
              className="px-4 py-2 border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {favorites.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-850">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === 'all' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Saved ({favorites.length})
            </button>
            <button
              onClick={() => setFilterType('movie')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === 'movie' ? 'bg-slate-900 text-purple-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Movies & TV ({favorites.filter(f => f.type === 'movie').length})
            </button>
            <button
              onClick={() => setFilterType('book')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === 'book' ? 'bg-slate-900 text-blue-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Books ({favorites.filter(f => f.type === 'book').length})
            </button>
          </div>
        </div>
      )}

{/* Library Grid */}
      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {filteredFavorites.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="glass-card rounded-2xl p-4 flex flex-col justify-between group cursor-pointer relative overflow-hidden h-[380px] border border-slate-850 hover:border-slate-700 transition-all"
              onClick={() => {
                window.location.hash = `#/${item.type}/${item.id}`
              }}
              >
              {/* Cover Image */}
              <div className="aspect-[2/3] w-full rounded-xl bg-slate-950 overflow-hidden relative border border-slate-800/40">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-600 bg-slate-900/60 p-2 text-center">
                    No Cover Image
                  </div>
                )}
                
                {/* Rating Badge */}
                {item.rating && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/85 backdrop-blur-md rounded-lg text-[10px] font-bold text-amber-400 border border-slate-800">
                    ⭐ {item.rating}
                  </span>
                )}
                {/* Media Type Badge */}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                  item.type === 'movie' ? 'bg-purple-950/90 text-purple-300 border-purple-800/40' : 'bg-blue-950/90 text-blue-300 border-blue-800/40'
                }`}>
                  {item.type === 'movie' ? 'Show/Movie' : 'Book'}
                </span>
              </div>

              {/* Info Container */}
              <div className="mt-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-light">
                    {item.subtitle}
                  </p>
                </div>

                {/* Remove button */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {item.genres ? (Array.isArray(item.genres) ? item.genres[0] : item.genres) : 'Saved'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFavorite(item.id, item.type)
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20 transition-all hover:scale-110 active:scale-95"
                    title="Remove from library"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
        <div className="glass-panel text-center py-20 px-4 rounded-3xl max-w-md mx-auto space-y-4 border border-slate-800">
          <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto border border-slate-800 text-slate-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>