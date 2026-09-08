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