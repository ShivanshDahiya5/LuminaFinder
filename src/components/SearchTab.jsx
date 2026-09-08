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

   const [trending, setTrending] = useState({ heroSpotlight: null, movies: [], books: [], anime: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTrending, setIsLoadingTrending] = useState(true)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(() => initialShowTrending ? false : !!sessionStorage.getItem('search-query'))

  // Reset to trending mode if explicitly requested by navigation
  useEffect(() => {
    if (initialShowTrending) {
      setQuery('')
      setResults([])
      setHasSearched(false)
      sessionStorage.removeItem('search-query')
      sessionStorage.removeItem('search-results')
    }
  }, [initialShowTrending])

  const performSearch = useCallback(async (searchQuery, type, selectedRegion = region, selectedLang = lang) => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    
    try {
      let data = []
      if (type === 'movie') {
        data = await searchMovies(searchQuery, selectedRegion)
      } else {
        data = await searchBooks(searchQuery, selectedLang)
      }
      setResults(data)
      sessionStorage.setItem('search-results', JSON.stringify(data))
    } catch (err) {
      console.error(err)
      setError('Failed to fetch search results from worldwide APIs. Please try again.')
      setResults([])
      sessionStorage.removeItem('search-results')
    } finally {
      setIsLoading(false)
    }
  }, [region, lang])

  // Load trending media on initial mount
  useEffect(() => {
    getTrending()
      .then((data) => setTrending(data))
      .catch((e) => console.error('Failed to load trending data:', e))
      .finally(() => setIsLoadingTrending(false))
  }, [])

  // Auto-fetch if query exists on mount without cached results
  useEffect(() => {
    let active = true
    const cachedResults = sessionStorage.getItem('search-results')
    if (!cachedResults && query) {
      Promise.resolve().then(() => {
        if (active) performSearch(query, mediaType, region, lang)
      })
    }
    return () => {
      active = false
    }
  }, [query, mediaType, region, lang, performSearch])

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('search-query', query)
    sessionStorage.setItem('search-type', mediaType)
  }, [query, mediaType])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    performSearch(query, mediaType, region, lang)
  }

  const handleTypeChange = (type) => {
    setMediaType(type)
    setResults([])
    sessionStorage.removeItem('search-results')
    setHasSearched(false)
    
    if (query.trim()) {
      performSearch(query, type, region, lang)
    }
  }

  const handleRegionChange = (e) => {
    const val = e.target.value
    setRegion(val)
    if (query.trim() && mediaType === 'movie') {
      performSearch(query, 'movie', val, lang)
    }
  }

  const handleLangChange = (e) => {
    const val = e.target.value
    setLang(val)
    if (query.trim() && mediaType === 'book') {
      performSearch(query, 'book', region, val)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    performSearch(suggestion, mediaType, region, lang)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setHasSearched(false)
    sessionStorage.removeItem('search-query')
    sessionStorage.removeItem('search-results')
  }

  return (
    <div className="w-full space-y-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          Worldwide Multi-Source Catalog Activated
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-tight">
          Find movies, shows & books worldwide.
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          Search iTunes, TVMaze, Google Books, and Open Library simultaneously with region and language controls.
        </p>
      </div>

      {/* Control Panel: Type Switcher & Search Form */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4 border border-slate-800 shadow-xl">
        {/* Toggle Pills & Region/Lang Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 bg-slate-950 p-1.5 rounded-2xl w-full sm:w-[320px] border border-slate-800/60">
            <button
              id="type-movie-btn"
              onClick={() => handleTypeChange('movie')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                mediaType === 'movie'
                  ? 'bg-slate-900 border border-slate-800 text-purple-400 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              Movies & TV Shows
            </button>