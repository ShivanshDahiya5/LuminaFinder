import { useState, useEffect, useCallback } from 'react'
import { searchMovies, searchBooks, getTrending } from '../services/api'
import { SkeletonGrid } from './SkeletonLoader'

const SUGGESTIONS = {
  movie: ['Stranger Things', 'Attack on Titan', 'Interstellar', 'Squid Game', 'The Dark Knight', 'Spirited Away', 'Money Heist'],
  book: ['Harry Potter', 'The Hobbit', 'Dune', 'Atomic Habits', 'Three-Body Problem', 'One Hundred Years of Solitude', 'The Little Prince']
}
