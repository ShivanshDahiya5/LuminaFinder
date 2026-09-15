/**
 * Client-side media API service.
 * Calls all external APIs directly from the browser — no backend required.
 * All providers (TVMaze, iTunes, Google Books, Open Library, Wikipedia) support CORS.
 */

const TVMAZE_BASE     = 'https://api.tvmaze.com';
const OPEN_LIBRARY    = 'https://openlibrary.org';
const GOOGLE_BOOKS    = 'https://www.googleapis.com/books/v1/volumes';
const ITUNES          = 'https://itunes.apple.com/search';
const WIKI_SEARCH     = 'https://en.wikipedia.org/w/api.php';
const WIKI_SUMMARY    = 'https://en.wikipedia.org/api/rest_v1/page/summary';

async function fetchSafe(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ─── Normalizers ────────────────────────────────────────────────────────────

function normalizeITunesMovie(item) {
  const year = item.releaseDate ? item.releaseDate.split('-')[0] : 'N/A';
  return {
    id: `itunes_${item.trackId}`,
    title: item.trackName || item.collectionName,
    subtitle: `${year} • ${item.country || 'Global'}`,
    image: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null,
    rating: item.contentAdvisoryRating || 'NR',
    type: 'movie',
    genres: item.primaryGenreName ? [item.primaryGenreName] : ['Movie'],
    description: item.longDescription || item.shortDescription || 'Global motion picture release.',
    originCountry: item.country || 'Global',
    releaseYear: year,
    previewUrl: item.previewUrl || null,
    link: item.trackViewUrl || null,
    source: 'iTunes',
  };
}

function normalizeTVMazeShow(item) {
  const show = item.show || item;
  const year = show.premiered ? show.premiered.split('-')[0] : 'N/A';
  const country = show.network?.country?.name || show.webChannel?.country?.name || 'Global';
  return {
    id: `tvmaze_${show.id}`,
    title: show.name,
    subtitle: `${year} • ${country}`,
    image: show.image?.original || show.image?.medium || null,
    rating: show.rating?.average || null,
    type: 'movie',
    genres: show.genres?.length ? show.genres : ['TV & Film'],
    description: show.summary ? show.summary.replace(/<[^>]*>/g, '') : 'No summary available.',
    originCountry: country,
    releaseYear: year,
    previewUrl: null,
    link: show.officialSite || show.url || null,
    source: 'TVMaze',
  };
}

function normalizeGoogleBook(item) {
  const info = item.volumeInfo || {};
  const img = info.imageLinks;
  const coverUrl = img?.thumbnail
    ? img.thumbnail.replace('http://', 'https://').replace('&edge=curl', '')
    : (img?.smallThumbnail ? img.smallThumbnail.replace('http://', 'https://') : null);
  const authors = info.authors ? info.authors.join(', ') : 'Unknown Author';
  const year = info.publishedDate ? info.publishedDate.split('-')[0] : 'N/A';
  return {
    id: `gbook_${item.id}`,
    title: info.title,
    subtitle: `${authors} (${year})`,
    authors: info.authors || ['Unknown Author'],
    image: coverUrl,
    rating: info.averageRating || null,
    type: 'book',
    genres: info.categories ? info.categories.slice(0, 3) : ['Literature'],
    description: info.description || info.subtitle || 'Worldwide published volume.',
    publishedDate: info.publishedDate || 'Unknown',
    publisher: info.publisher || 'Global Publisher',
    pageCount: info.pageCount ? `${info.pageCount} pages` : 'N/A',
    language: info.language ? info.language.toUpperCase() : 'Global',
    previewLink: info.previewLink || info.infoLink || null,
    infoLink: info.infoLink || null,
    source: 'Google Books',
  };
}

function normalizeOpenLibraryBook(item) {
  const workId = item.key ? item.key.replace('/works/', '') : String(item.cover_edition_key || Math.random());
  const authors = item.author_name ? item.author_name.join(', ') : 'Unknown Author';
  const year = item.first_publish_year ? String(item.first_publish_year) : 'N/A';
  return {
    id: `openlib_${workId}`,
    title: item.title,
    subtitle: `${authors} (${year})`,
    authors: item.author_name || ['Unknown Author'],
    image: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : null,
    rating: item.ratings_average ? parseFloat(item.ratings_average.toFixed(1)) : null,
    type: 'book',
    genres: item.subject ? item.subject.slice(0, 3) : ['General'],
    description: item.first_sentence ? item.first_sentence[0] : 'Open Library public catalog record.',
    publishedDate: year,
    publisher: 'Open Library',
    pageCount: 'N/A',
    language: item.language ? item.language[0]?.toUpperCase() : 'Global',
    previewLink: `https://openlibrary.org${item.key}`,
    infoLink: `https://openlibrary.org${item.key}`,
    source: 'Open Library',
  };
}

// ─── Bollywood / Wikipedia search ───────────────────────────────────────────

async function searchBollywoodViaWikipedia(query) {
  const terms = [`${query} film`, `${query} Bollywood`, `${query} Hindi film`, `${query} Indian film`];
  const searchResults = await Promise.allSettled(
    terms.map(t =>
      fetchSafe(`${WIKI_SEARCH}?action=query&list=search&srsearch=${encodeURIComponent(t)}&srnamespace=0&srlimit=4&format=json&origin=*`, 6000)
    )
  );

  const FILM_KW = /\b(film|movie|cinema|bollywood|hindi|indian|pictu)\b/i;
  const EXCLUDE = /^(list of|lists of|category:|index of|portal:|template:|wikipedia:|discography|soundtrack|filmography|actor|director|singer|channel|television|tv channel|network)/i;
  const filmTitleSet = new Set();

  for (const r of searchResults) {
    if (r.status !== 'fulfilled' || !r.value?.query?.search) continue;
    for (const page of r.value.query.search) {
      const t = page.title;
      const sn = page.snippet || '';
      if (EXCLUDE.test(t)) continue;
      const isFT = /\(\d{4}\s*film\)|\(film\)|\(movie\)/i.test(t);
      const snFilm = /\b(film|directed by|starring|released|Indian|Bollywood|Hindi-language)\b/i.test(sn);
      if (isFT || (FILM_KW.test(t) && snFilm)) filmTitleSet.add(t);
    }
  }
  if (filmTitleSet.size === 0) return [];

  const summaries = await Promise.allSettled(
    [...filmTitleSet].slice(0, 10).map(title =>
      fetchSafe(`${WIKI_SUMMARY}/${encodeURIComponent(title.replace(/ /g, '_'))}`, 5000)
    )
  );

  const results = [];
  for (const s of summaries) {
    if (s.status !== 'fulfilled' || !s.value || s.value.type === 'disambiguation') continue;
    const p = s.value;
    const extract = p.extract || '';
    const desc = p.description || '';
    const isFD = /\b(film|movie)\b/i.test(desc);
    const isFT = /\(\d{4}\s*film\)|\(film\)|\(movie\)/i.test(p.title || '');
    if (!isFD && !isFT) continue;
    const isIndian = /\b(Indian|Bollywood|Hindi|Kannada|Tamil|Telugu|Malayalam|Marathi|Punjabi)\b/i.test(extract + desc);
    if (!isIndian) continue;
    const yearMatch = (p.title || '').match(/\((\d{4})/) || (p.description || '').match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : 'N/A';
    const genres = [];
    if (/action/i.test(extract)) genres.push('Action');
    if (/comedy/i.test(extract)) genres.push('Comedy');
    if (/drama/i.test(extract)) genres.push('Drama');
    if (/romance/i.test(extract)) genres.push('Romance');
    if (/thriller/i.test(extract)) genres.push('Thriller');
    if (/biograph/i.test(extract)) genres.push('Biography');
    if (!genres.length) genres.push('Bollywood');
    const cleanTitle = (p.title || '').replace(/\s*\(\d{4}[^)]*\)/, '').replace(/\s*\([^)]*film[^)]*\)/i, '').trim();
    results.push({
      id: `wiki_${p.pageid}`, title: cleanTitle, subtitle: `${year} • India`,
      image: p.originalimage?.source || p.thumbnail?.source || null,
      rating: null, type: 'movie', genres,
      description: extract.slice(0, 400) || desc || 'Indian film.',
      originCountry: 'India', releaseYear: year, previewUrl: null,
      link: p.content_urls?.desktop?.page || null, source: '🎬 Bollywood',
    });
  }
  return results;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function searchMovies(query, region = 'all') {
  if (!query?.trim()) return [];
  const q = query.trim();
  const isIndia = region?.toLowerCase() === 'in';
  const isAll = !region || region === 'all';
  const cc = !isAll ? region.toLowerCase() : null;

  const itunesUrls = isAll
    ? ['us', 'gb', 'au'].map(c => `${ITUNES}?media=movie&entity=movie&term=${encodeURIComponent(q)}&country=${c}&limit=15`)
    : [`${ITUNES}?media=movie&entity=movie&term=${encodeURIComponent(q)}&country=${cc}&limit=25`];

  const tvmazeUrl = `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(q)}`;
  const allUrls = [...itunesUrls, tvmazeUrl];
  const allRes = await Promise.allSettled(allUrls.map(u => fetchSafe(u)));

  const results = [];
  const seen = new Set();
  const tvIdx = allUrls.length - 1;

  if (isIndia) {
    for (const item of await searchBollywoodViaWikipedia(q)) {
      const k = item.title.toLowerCase().trim();
      if (!seen.has(k)) { seen.add(k); results.push(item); }
    }
  }

  for (let i = 0; i < tvIdx; i++) {
    const r = allRes[i];
    if (r.status === 'fulfilled' && r.value?.results) {
      for (const item of r.value.results) {
        if (!item.trackId) continue;
        const norm = normalizeITunesMovie(item);
        const k = norm.title.toLowerCase().trim();
        if (!seen.has(k)) { seen.add(k); results.push(norm); }
      }
    }
  }

  const tvRes = allRes[tvIdx];
  if (tvRes.status === 'fulfilled' && Array.isArray(tvRes.value)) {
    for (const item of tvRes.value) {
      if (!item.show) continue;
      if (!isAll && cc) {
        const sc = (item.show.network?.country?.code || item.show.webChannel?.country?.code || '').toLowerCase();
        const sl = (item.show.language || '').toLowerCase();
        const isIndianShow = isIndia && (sc === 'in' || sl === 'hindi' || sl === 'hi');
        if (!isIndianShow && sc && sc !== cc) continue;
      }
      const norm = normalizeTVMazeShow(item);
      const k = norm.title.toLowerCase().trim();
      if (!seen.has(k)) { seen.add(k); results.push(norm); }
    }
  }
  return results;
}

export async function getMovieDetails(id) {
  if (!id) throw new Error('Movie/Show ID is required');

  if (id.startsWith('tvmaze_')) {
    const realId = id.replace('tvmaze_', '');
    const data = await fetchSafe(`${TVMAZE_BASE}/shows/${realId}?embed=cast`);
    if (!data) throw new Error('Movie/Show not found');
    return {
      id, title: data.name, subtitle: data.premiered ? data.premiered.split('-')[0] : 'N/A',
      image: data.image?.original || data.image?.medium || null,
      rating: data.rating?.average || null, type: 'movie', genres: data.genres || [],
      description: data.summary ? data.summary.replace(/<[^>]*>/g, '') : 'No summary available.',
      premiered: data.premiered || 'Unknown', status: data.status || 'Released',
      runtime: data.runtime ? `${data.runtime} min` : 'N/A',
      network: data.network?.name || data.webChannel?.name || 'Worldwide Network',
      officialSite: data.officialSite || null,
      cast: data._embedded?.cast?.slice(0, 10).map(m => ({
        name: m.person.name, character: m.character.name,
        image: m.person.image?.medium || m.person.image?.original || null,
      })) || [],
    };
  }

  if (id.startsWith('itunes_')) {
    const realId = id.replace('itunes_', '');
    const data = await fetchSafe(`${ITUNES}?id=${realId}&entity=movie`);
    if (data?.results?.length) {
      const item = data.results[0];
      const norm = normalizeITunesMovie(item);
      return { ...norm, status: 'Released', runtime: item.trackTimeMillis ? `${Math.round(item.trackTimeMillis / 60000)} min` : 'N/A', network: item.studio || 'Global Studio', officialSite: item.trackViewUrl || null, cast: [] };
    }
  }

  if (id.startsWith('wiki_')) {
    const pageId = id.replace('wiki_', '');
    const wikiData = await fetchSafe(`${WIKI_SEARCH}?action=query&pageids=${pageId}&prop=info|extracts|pageimages&exintro=true&piprop=original&format=json&origin=*`, 6000);
    const page = wikiData?.query?.pages?.[pageId];
    if (page?.title) {
      const encoded = encodeURIComponent(page.title.replace(/ /g, '_'));
      const summaryData = await fetchSafe(`${WIKI_SUMMARY}/${encoded}`, 5000);
      const extract = summaryData?.extract || page.extract?.replace(/<[^>]*>/g, '') || 'No description available.';
      const image = summaryData?.originalimage?.source || summaryData?.thumbnail?.source || null;
      const yearMatch = (page.title || '').match(/\((\d{4})/) || extract.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : 'N/A';
      const genres = [];
      if (/action/i.test(extract)) genres.push('Action');
      if (/comedy/i.test(extract)) genres.push('Comedy');
      if (/drama/i.test(extract)) genres.push('Drama');
      if (/romance/i.test(extract)) genres.push('Romance');
      if (/thriller/i.test(extract)) genres.push('Thriller');
      if (/biograph/i.test(extract)) genres.push('Biography');
      if (!genres.length) genres.push('Bollywood');
      const cleanTitle = (page.title || '').replace(/\s*\(\d{4}[^)]*\)/, '').replace(/\s*\([^)]*film[^)]*\)/i, '').trim();
      return {
        id, title: cleanTitle, subtitle: year, image, rating: null, type: 'movie', genres,
        description: extract, premiered: year, status: 'Released', runtime: 'N/A',
        network: 'Indian Cinema', officialSite: summaryData?.content_urls?.desktop?.page || `https://en.wikipedia.org/?curid=${pageId}`, cast: [], source: '🎬 Bollywood',
      };
    }
  }

  throw new Error('Media item details not found.');
}

export async function searchBooks(query, lang = 'all') {
  if (!query?.trim()) return [];
  const q = query.trim();
  let googleUrl = `${GOOGLE_BOOKS}?q=${encodeURIComponent(q)}&maxResults=25`;
  if (lang && lang !== 'all') googleUrl += `&langRestrict=${lang}`;
  const openLibUrl = `${OPEN_LIBRARY}/search.json?q=${encodeURIComponent(q)}&limit=20`;

  const [gbRes, olRes] = await Promise.allSettled([fetchSafe(googleUrl), fetchSafe(openLibUrl)]);
  const results = [];
  const seen = new Set();

  if (gbRes.status === 'fulfilled' && gbRes.value?.items) {
    for (const item of gbRes.value.items) {
      const norm = normalizeGoogleBook(item);
      const k = norm.title?.toLowerCase().trim();
      if (k && !seen.has(k)) { seen.add(k); results.push(norm); }
    }
  }
  if (olRes.status === 'fulfilled' && olRes.value?.docs) {
    for (const item of olRes.value.docs) {
      const norm = normalizeOpenLibraryBook(item);
      const k = norm.title?.toLowerCase().trim();
      if (k && !seen.has(k)) { seen.add(k); results.push(norm); }
    }
  }
  return results;
}

export async function getBookDetails(id) {
  if (!id) throw new Error('Book ID is required');

  if (id.startsWith('gbook_')) {
    const realId = id.replace('gbook_', '');
    const data = await fetchSafe(`${GOOGLE_BOOKS}/${realId}`);
    if (!data) throw new Error('Book details not found');
    return normalizeGoogleBook(data);
  }

  if (id.startsWith('openlib_')) {
    const realId = id.replace('openlib_', '');
    const data = await fetchSafe(`${OPEN_LIBRARY}/works/${realId}.json`);
    if (!data) throw new Error('Book details not found');
    const coverUrl = data.covers?.length && data.covers[0] > 0 ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : null;
    let desc = 'No description available.';
    if (data.description) desc = typeof data.description === 'string' ? data.description : (data.description.value || desc);
    return {
      id, title: data.title, subtitle: data.subtitle || '',
      authors: ['Open Library Author'], image: coverUrl, rating: null, type: 'book',
      genres: data.subjects ? data.subjects.slice(0, 5) : ['Literature'],
      description: desc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
      publisher: 'Open Library', publishedDate: data.first_publish_date || 'Unknown',
      pageCount: 'N/A', previewLink: `https://openlibrary.org/works/${realId}`,
      infoLink: `https://openlibrary.org/works/${realId}`, buyLink: null,
    };
  }

  throw new Error('Book ID format unrecognised.');
}

export async function getTrending() {
  const moviesUrl = `${ITUNES}?media=movie&entity=movie&term=blockbuster&limit=12`;
  const tvUrl     = `${TVMAZE_BASE}/shows?page=0`;
  const booksUrl  = `${GOOGLE_BOOKS}?q=subject:fiction&orderBy=newest&maxResults=12`;
  const animeUrl  = `${TVMAZE_BASE}/search/shows?q=anime`;

  const [moviesRes, tvRes, booksRes, animeRes] = await Promise.allSettled([
    fetchSafe(moviesUrl), fetchSafe(tvUrl), fetchSafe(booksUrl), fetchSafe(animeUrl),
  ]);

  const movies = [];
  const seenM = new Set();
  if (moviesRes.status === 'fulfilled' && moviesRes.value?.results) {
    moviesRes.value.results.forEach(m => {
      const n = normalizeITunesMovie(m);
      if (!seenM.has(n.title.toLowerCase())) { seenM.add(n.title.toLowerCase()); movies.push(n); }
    });
  }
  if (tvRes.status === 'fulfilled' && Array.isArray(tvRes.value)) {
    tvRes.value.slice(0, 10).forEach(show => {
      const n = normalizeTVMazeShow({ show });
      if (!seenM.has(n.title.toLowerCase())) { seenM.add(n.title.toLowerCase()); movies.push(n); }
    });
  }

  const books = [];
  const seenB = new Set();
  if (booksRes.status === 'fulfilled' && booksRes.value?.items) {
    booksRes.value.items.forEach(b => {
      const n = normalizeGoogleBook(b);
      if (!seenB.has(n.title.toLowerCase())) { seenB.add(n.title.toLowerCase()); books.push(n); }
    });
  }

  const anime = [];
  if (animeRes.status === 'fulfilled' && Array.isArray(animeRes.value)) {
    animeRes.value.slice(0, 8).forEach(item => { if (item.show) anime.push(normalizeTVMazeShow(item)); });
  }

  return { heroSpotlight: movies[0] || books[0] || null, movies: movies.slice(0, 12), books: books.slice(0, 12), anime: anime.slice(0, 8) };
}

// ─── Favorites (localStorage, per-user) ─────────────────────────────────────

function favKey(userId) { return `lumina_favs_${userId}`; }

export function fetchUserFavorites(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(favKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addFavoriteApi(item, userId) {
  if (!userId) return;
  const favs = fetchUserFavorites(userId);
  if (!favs.some(f => String(f.id) === String(item.id) && f.type === item.type)) {
    favs.push({ ...item, addedAt: new Date().toISOString() });
    localStorage.setItem(favKey(userId), JSON.stringify(favs));
  }
}

export function removeFavoriteApi(type, id, userId) {
  if (!userId) return;
  const favs = fetchUserFavorites(userId).filter(f => !(String(f.id) === String(id) && f.type === type));
  localStorage.setItem(favKey(userId), JSON.stringify(favs));
}
