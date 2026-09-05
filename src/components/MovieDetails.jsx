import { useState, useEffect } from 'react'
import { getMovieDetails } from '../services/api'
import { SkeletonDetails } from './SkeletonLoader'

function MovieDetails({ id, isFavorite, addFavorite, removeFavorite }) {
  const [movie, setMovie] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
