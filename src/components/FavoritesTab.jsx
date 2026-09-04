import { useState } from 'react'
import { useAuth } from '../context/useAuth'

function FavoritesTab({ favorites, removeFavorite }) {
  const { user, openLoginModal, openRegisterModal } = useAuth()
  const [filterType, setFilterType] = useState('all') // 'all', 'movie', 'book'

  const filteredFavorites = favorites.filter(item => {
    if (filterType === 'all') return true
    return item.type === filterType
  })
