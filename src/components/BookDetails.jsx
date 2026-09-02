import { useState, useEffect } from 'react'
import { getBookDetails } from '../services/api'
import { SkeletonDetails } from './SkeletonLoader'

function BookDetails({ id, isFavorite, addFavorite, removeFavorite }) {
  const [book, setBook] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
