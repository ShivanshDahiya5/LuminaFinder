import { useState, useEffect } from 'react'
import { getMovieDetails } from '../services/api'
import { SkeletonDetails } from './SkeletonLoader'

function MovieDetails({ id, isFavorite, addFavorite, removeFavorite }) {
  const [movie, setMovie] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    
    async function fetchDetails() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getMovieDetails(id)
        if (active) {
          setMovie(data)
        }
      } catch (err) {
        console.error(err)
        if (active) {
          setError('Failed to load movie details. The item might not exist.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    if (id) {
      fetchDetails()
    }
    
    return () => {
      active = false
    }
  }, [id])

  if (isLoading) {
    return <SkeletonDetails />
  }

  if (error || !movie) {
    return (
      <div className="glass-panel text-center py-16 px-4 rounded-3xl max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto border border-rose-950/30 text-rose-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-300">Error Loading Show</h3>
          <p className="text-slate-500 text-sm mt-1">{error || 'Could not find details'}</p>
        </div>