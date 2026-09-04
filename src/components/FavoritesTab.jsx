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