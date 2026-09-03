import { useState, useEffect } from 'react'
import { getBookDetails } from '../services/api'
import { SkeletonDetails } from './SkeletonLoader'

function BookDetails({ id, isFavorite, addFavorite, removeFavorite }) {
  const [book, setBook] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function fetchDetails() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getBookDetails(id)
        if (active) {
          setBook(data)
        }
        } catch (err) {
        console.error(err)
        if (active) {
          setError('Failed to load book details. The item might not exist.')
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

  if (error || !book) {
    return (
      <div className="glass-panel text-center py-16 px-4 rounded-3xl max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto border border-rose-955/30 text-rose-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-300">Error Loading Book</h3>
          <p className="text-slate-500 text-sm mt-1">{error || 'Could not find details'}</p>
        </div>
        <a
          href="#/"
          className="inline-block px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Back to Search
        </a>
      </div>
    )
  }

  const favorited = isFavorite(book.id, book.type)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <a
          href="#/"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-900 bg-slate-950/50 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Browse
        </a>
      </div>

      {/* Main Details Panel */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden">
        {/* Cover Image Column */}
        <div className="w-full md:w-64 shrink-0 space-y-4">
          <div className="aspect-[2/3] w-full rounded-2xl bg-slate-950 border border-slate-800/40 overflow-hidden shadow-2xl relative">
            {book.image ? (
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/60">
                <svg className="w-16 h-16 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
                </svg>
                <span className="text-xs uppercase font-bold tracking-wider">No Cover</span>
              </div>
            )}
          </div>
        </div>