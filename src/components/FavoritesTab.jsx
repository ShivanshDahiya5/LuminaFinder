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