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