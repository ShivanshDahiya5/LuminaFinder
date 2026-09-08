import { useState, useEffect, useCallback } from 'react'
import { searchMovies, searchBooks, getTrending } from '../services/api'
import { SkeletonGrid } from './SkeletonLoader'

const SUGGESTIONS = {
  movie: ['Stranger Things', 'Attack on Titan', 'Interstellar', 'Squid Game', 'The Dark Knight', 'Spirited Away', 'Money Heist'],
  book: ['Harry Potter', 'The Hobbit', 'Dune', 'Atomic Habits', 'Three-Body Problem', 'One Hundred Years of Solitude', 'The Little Prince']
}

const BOLLYWOOD_SUGGESTIONS = [
  'Pathaan', 'RRR', 'Jawan', 'Dangal', '3 Idiots', 'Lagaan', 'Dil Chahta Hai', 'Kabhi Khushi Kabhie Gham'
]

const REGION_OPTIONS = [
  { label: '🌍 Worldwide All', value: 'all' },
  { label: '🇺🇸 United States', value: 'us' },
  { label: '🇯🇵 Japan / Anime', value: 'jp' },
  { label: '🇬🇧 United Kingdom', value: 'gb' },
  { label: '🇫🇷 France', value: 'fr' },
  { label: '🇮🇳 India / Bollywood', value: 'in' },
  { label: '🇪🇸 Spain', value: 'es' },
  { label: '🇩🇪 Germany', value: 'de' }
]

const LANG_OPTIONS = [
  { label: '🌐 All Languages', value: 'all' },
  { label: '🇬🇧 English', value: 'en' },
  { label: '🇯🇵 Japanese (日本語)', value: 'ja' },
  { label: '🇫🇷 French (Français)', value: 'fr' },
  { label: '🇪🇸 Spanish (Español)', value: 'es' },
  { label: '🇩🇪 German (Deutsch)', value: 'de' },
  { label: '🇮🇳 Hindi (हिन्दी)', value: 'hi' },
  { label: '🇨🇳 Chinese (中文)', value: 'zh' }
]

function SearchTab({ initialShowTrending = false, isFavorite, addFavorite, removeFavorite }) {
  // Retrieve search state from sessionStorage if available
  const [query, setQuery] = useState(() => initialShowTrending ? '' : (sessionStorage.getItem('search-query') || ''))
  const [mediaType, setMediaType] = useState(() => sessionStorage.getItem('search-type') || 'movie')
  const [region, setRegion] = useState('all')
  const [lang, setLang] = useState('all')
  const [trendingCategory, setTrendingCategory] = useState('all')

  const [results, setResults] = useState(() => {
    if (initialShowTrending) return []
    try {
      const cached = sessionStorage.getItem('search-results')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })