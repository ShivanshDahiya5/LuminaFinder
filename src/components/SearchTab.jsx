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

                          {/* Card Footer: Genre & Favorite */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900">
                            <span className="text-[10px] text-slate-500 line-clamp-1 uppercase tracking-wider font-semibold max-w-[70%]">
                              {item.genres[0] || 'General'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (favorited) {
                                  removeFavorite(item.id, item.type);
                                } else {
                                  addFavorite(item);
                                }
                              }}className={`p-1.5 rounded-lg border transition-all duration-300 hover:scale-110 active:scale-95 ${
                                favorited
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30'
                              }`}
                              title={favorited ? 'Remove from library' : 'Save to library'}
                            >
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      )
                  })}
                </div>
              </div>
            ) : (
              hasSearched && (
                <div className="glass-panel text-center py-16 px-4 rounded-3xl max-w-md mx-auto space-y-4 border border-slate-800">
                  <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto border border-slate-800">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-300">No matching titles found</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Try broadening your search query or selecting "Worldwide All" in the country/language filter.
                    </p>
                  </div>
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )
            )}

            {/* Default State / Trending Tab: Worldwide Trending Highlights Hub */}
            {!hasSearched && (
              <div className="space-y-8 pt-2">
                {/* Header Title & Category Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
                      <span className="text-amber-400">🔥</span> Global Trending Highlights
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Real-time top ranked movies, TV series, literature & anime across worldwide APIs
                    </p>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-850">
                    {[
                      { id: 'all', label: '🌟 All Highlights' },
                      { id: 'movies', label: '🎬 Movies & TV' },
                      { id: 'books', label: '📚 Bestsellers' },
                      { id: 'anime', label: '🎌 Anime Hits' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setTrendingCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          trendingCategory === cat.id
                            ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoadingTrending ? (
                  <SkeletonGrid count={8} />
                ) : (
                  <div className="space-y-10">
                    {/* Featured Spotlight Banner */}
                    {trending.heroSpotlight && (trendingCategory === 'all' || trendingCategory === 'movies') && (
                      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-950 p-6 md:p-8 shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                          <div 
                            className="w-40 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 shrink-0 relative group cursor-pointer"
                            onClick={() => window.location.hash = `#/${trending.heroSpotlight.type}/${trending.heroSpotlight.id}`}
                          >
                            {trending.heroSpotlight.image ? (
                              <img 
                                src={trending.heroSpotlight.image} 
                                alt={trending.heroSpotlight.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              />
                              ) : (
                              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-slate-500">
                                {trending.heroSpotlight.title}
                              </div>
                            )}
                            <span className="absolute top-2 left-2 px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-lg shadow-md flex items-center gap-1">
                              👑 #1 SPOTLIGHT
                            </span>
                          </div>

                          <div className="flex-1 space-y-3 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
                                🔥 Global #1 Trending
                              </span>
                              {trending.heroSpotlight.rating && (
                                <span className="px-2.5 py-1 bg-slate-900/80 text-amber-400 border border-slate-800 rounded-full text-xs font-bold flex items-center gap-1">
                                  ⭐ {trending.heroSpotlight.rating}
                                </span>
                              )}
                              <span className="px-2.5 py-1 bg-slate-900/80 text-slate-300 border border-slate-800 rounded-full text-xs font-semibold">
                                {trending.heroSpotlight.originCountry || 'Worldwide'}
                              </span>
                            </div>

                            <h3 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                              {trending.heroSpotlight.title}
                            </h3>

                            <p className="text-xs md:text-sm text-slate-300 line-clamp-3 leading-relaxed font-light">
                              {trending.heroSpotlight.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                              <button
                                onClick={() => window.location.hash = `#/${trending.heroSpotlight.type}/${trending.heroSpotlight.id}`}
                                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                              >
                                View Details & Cast
                              </button>
                              <button
                                onClick={() => {
                                  const favorited = isFavorite(trending.heroSpotlight.id, trending.heroSpotlight.type)
                                  favorited 
                                    ? removeFavorite(trending.heroSpotlight.id, trending.heroSpotlight.type) 
                                    : addFavorite(trending.heroSpotlight)
                                }}
                                className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-2"
                              >
                                <svg className={`w-4 h-4 ${isFavorite(trending.heroSpotlight.id, trending.heroSpotlight.type) ? 'text-rose-500 fill-current' : 'text-slate-400'}`} viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                {isFavorite(trending.heroSpotlight.id, trending.heroSpotlight.type) ? 'Saved in Library' : 'Save to Library'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Trending Movies Section */}
                    {(trendingCategory === 'all' || trendingCategory === 'movies') && trending.movies && trending.movies.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-bold text-purple-300 flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                            Popular Movies & TV Series Worldwide
                          </h3>
                          <span className="text-xs text-slate-500">iTunes & TVMaze Charts</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                          {trending.movies.map((item, idx) => {
                            const favorited = isFavorite(item.id, item.type)
                            return (
                              <div
                                key={item.id}
                                className="glass-card rounded-2xl p-3 flex flex-col justify-between cursor-pointer border border-slate-850 hover:border-purple-500/40 transition-all h-[360px] group relative"
                                onClick={() => {
                                  window.location.hash = `#/${item.type}/${item.id}`
                                }}
                              >
                                <div className="aspect-[2/3] w-full rounded-xl bg-slate-950 overflow-hidden relative">
                                  {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No Image</div>
                                  )}

                                  {/* Rank Badge */}
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg text-[10px] font-black text-amber-400 shadow">
                                    #{idx + 1}
                                  </span>

                                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-purple-950/90 rounded text-[9px] font-bold text-purple-300 border border-purple-800/30">
                                    {item.releaseYear}
                                  </span>
                                </div>
                                <div className="mt-2.5 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">{item.title}</h4>
                                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.subtitle}</p>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 mt-2">
                                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{item.genres[0] || 'Film'}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        favorited ? removeFavorite(item.id, item.type) : addFavorite(item)
                                      }}
                                      className={`p-1.5 rounded-lg border transition-all ${
                                        favorited ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-rose-400'
                                      }`}
                                    >
                                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Trending Books Section */}
                    {(trendingCategory === 'all' || trendingCategory === 'books') && trending.books && trending.books.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-bold text-blue-300 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Worldwide Bestselling Books & Literature
                          </h3>
                          <span className="text-xs text-slate-500">Google Books & Open Library</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                          {trending.books.map((item, idx) => {
                            const favorited = isFavorite(item.id, item.type)
                            return (
                              <div
                                key={item.id}
                                className="glass-card rounded-2xl p-3 flex flex-col justify-between cursor-pointer border border-slate-850 hover:border-blue-500/40 transition-all h-[360px] group relative"
                                onClick={() => {
                                  window.location.hash = `#/${item.type}/${item.id}`
                                }}
                              >
                                <div className="aspect-[2/3] w-full rounded-xl bg-slate-950 overflow-hidden relative">
                                  {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No Cover</div>
                                  )}

                                  {/* Rank Badge */}
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg text-[10px] font-black text-amber-400 shadow">
                                    #{idx + 1}
                                  </span>

                                  {item.rating && (
                                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-950/80 rounded text-[9px] text-amber-400 font-bold border border-slate-800">
                                      ⭐ {item.rating}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2.5 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">{item.title}</h4>
                                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.subtitle}</p>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 mt-2">
                                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{item.genres[0] || 'Literature'}</span>