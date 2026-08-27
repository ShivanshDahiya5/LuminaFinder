/**
 * Upgraded API service connecting to full-stack backend endpoints.
 * Interoperable with multi-source worldwide Movie & Book providers (iTunes, TVMaze, Google Books, Open Library).
 */

async function fetchJson(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error [${url}]:`, error);
    throw error;
  }
}

/**
 * Searches worldwide movies & TV shows
 * @param {string} query 
 * @param {string} region (e.g., 'all', 'us', 'gb', 'jp', 'fr', 'in', 'es', 'de')
 */
export async function searchMovies(query, region = 'all') {
  if (!query || !query.trim()) return [];
  const url = `/api/movies/search?q=${encodeURIComponent(query.trim())}&region=${region}`;
  return await fetchJson(url);
}

/**
 * Fetches movie/show details including cast & streaming data
 * @param {string} id 
 */
export async function getMovieDetails(id) {
  if (!id) throw new Error('Movie/Show ID is required');
  const url = `/api/movies/${id}`;
  return await fetchJson(url);
}

/**
 * Searches worldwide books & literature
 * @param {string} query 
 * @param {string} lang (e.g., 'all', 'en', 'ja', 'fr', 'es', 'de', 'hi', 'zh')
 */
export async function searchBooks(query, lang = 'all') {
  if (!query || !query.trim()) return [];
  const url = `/api/books/search?q=${encodeURIComponent(query.trim())}&lang=${lang}`;
  return await fetchJson(url);
}

/**
 * Fetches comprehensive book details
 * @param {string} id 
 */
export async function getBookDetails(id) {
  if (!id) throw new Error('Book ID is required');
  const url = `/api/books/${id}`;
  return await fetchJson(url);
}

/**
 * Fetches trending worldwide media highlights
 */
export async function getTrending() {
  const url = `/api/trending`;
  return await fetchJson(url);
}

/**
 * Backend API sync for user library favorites
 */
export async function fetchUserFavorites(token) {
  if (!token) return [];
  return await fetchJson('/api/favorites', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function addFavoriteApi(item, token) {
  if (!token) return null;
  return await fetchJson('/api/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(item)
  });
}

export async function removeFavoriteApi(type, id, token) {
  if (!token) return null;
  return await fetchJson(`/api/favorites/${type}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
