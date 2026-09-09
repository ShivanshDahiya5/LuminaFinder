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
            <button
              id="type-book-btn"
              onClick={() => handleTypeChange('book')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                mediaType === 'book'
                  ? 'bg-slate-900 border border-slate-800 text-blue-400 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Books & Literature
            </button>
          </div>

          {/* Region / Language Dropdown */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Filter:</span>
            {mediaType === 'movie' ? (
              <select
                value={region}
                onChange={handleRegionChange}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <select
                value={lang}
                onChange={handleLangChange}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Search bar input group */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 max-w-3xl mx-auto pt-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mediaType === 'movie'
                  ? (region === 'in' ? 'Search Bollywood, Hindi movies, Indian TV...' : 'Search global movies, anime, TV series...')
                  : 'Search books, authors, genres worldwide...'
              }
              className="w-full pl-12 pr-10 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-300"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            id="search-submit-btn"
            type="submit"
            disabled={!query.trim()}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-850 disabled:to-slate-850 disabled:text-slate-500 text-white rounded-2xl font-semibold text-sm shadow-lg hover:shadow-purple-500/20 active:scale-98 transition-all duration-300 shrink-0"
          >
            Search
          </button>
        </form>

        {/* Suggestions tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs pt-1 max-w-3xl mx-auto">
          <span className="text-slate-500 font-medium mr-1">
            {mediaType === 'movie' && region === 'in' ? '🎬 Bollywood Picks:' : 'Trending Topics:'}
          </span>
          {(mediaType === 'movie' && region === 'in' ? BOLLYWOOD_SUGGESTIONS : SUGGESTIONS[mediaType]).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSuggestionClick(tag)}
              className="px-3 py-1.5 rounded-full border border-slate-800/80 bg-slate-950/40 text-slate-400 hover:text-slate-100 hover:border-purple-500/40 hover:bg-slate-900 transition-all duration-200"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* India/Bollywood filter active notice */}
        {mediaType === 'movie' && region === 'in' && (
          <div className="flex items-center justify-center gap-2 text-[11px] text-amber-400/80 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            India & Bollywood filter active — searching iTunes India storefront + Hindi content
          </div>
        )}
      </div>

      {/* Search Results / Trending Showcase */}
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center rounded-2xl">
            {error}
          </div>
        )}

        {isLoading ? (
          <SkeletonGrid count={8} />
        ) : (
          <>
            {results.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-200">
                    Search Results ({results.length})
                  </h2>
                  <span className="text-xs text-slate-500">
                    Showing multi-source global data
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                  {results.map((item) => {
                    const favorited = isFavorite(item.id, item.type)
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="glass-card rounded-2xl p-4 flex flex-col justify-between group cursor-pointer relative overflow-hidden h-[390px] border border-slate-850 hover:border-purple-500/40 transition-all"
                        onClick={() => {
                          window.location.hash = `#/${item.type}/${item.id}`
                        }}
                        >
                        {/* Image / Thumbnail */}
                        <div className="aspect-[2/3] w-full rounded-xl bg-slate-950 overflow-hidden relative border border-slate-800/40">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/60 p-2 text-center">
                              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-[10px] uppercase font-semibold tracking-wider">{item.title}</span>
                            </div>
                          )}
                          
                          {/* Hover Details Overlay */}
                          <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                            <p className="text-[10px] text-slate-300 line-clamp-4 leading-relaxed font-light">
                              {item.description}
                            </p>
                          </div>

                          {/* Top Badges */}
                          {item.rating && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/85 backdrop-blur-md rounded-lg text-[10px] font-bold text-amber-400 border border-slate-880 flex items-center gap-1">
                              ⭐ {item.rating}
                            </span>
                          )}

                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                            item.type === 'movie'
                              ? 'bg-purple-950/90 text-purple-300 border-purple-800/40'
                              : 'bg-blue-950/90 text-blue-300 border-blue-800/40'
                          }`}>
                            {item.source || (item.type === 'movie' ? 'Movie' : 'Book')}
                          </span>
                        </div>

                        {/* Title & Info */}
                        <div className="mt-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-light">
                              {item.subtitle}
                            </p>
                          </div>