import express from 'express';

const router = express.Router();

const TVMAZE_BASE = 'https://api.tvmaze.com';
const OPEN_LIBRARY_BASE = 'https://openlibrary.org';
const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';
const ITUNES_BASE = 'https://itunes.apple.com/search';
const WIKI_SEARCH_BASE = 'https://en.wikipedia.org/w/api.php';
const WIKI_SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary';

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    console.error(`Fetch failed for ${url}:`, err.message);
    return null;
  }
}

async function searchBollywoodViaWikipedia(query) {
  // Search Wikipedia for film articles matching the query + Indian film context
  const searchTerms = [
    `${query} film`,
    `${query} Bollywood`,
    `${query} Hindi film`,
    `${query} Indian film`
  ];

  // Run parallel Wikipedia searches
  const searchResults = await Promise.allSettled(
    searchTerms.map(term => {
      const url = `${WIKI_SEARCH_BASE}?action=query&list=search&srsearch=${encodeURIComponent(term)}&srnamespace=0&srlimit=4&format=json&origin=*`;
      return fetchWithTimeout(url, 6000);
    })
  );

  // Collect unique Wikipedia page titles that look like FILM articles (not lists, channels, people)
  const filmTitleSet = new Set();
  const FILM_KEYWORDS = /\b(film|movie|cinema|bollywood|hindi|indian|pictu)\b/i;
  // Patterns that indicate this is NOT a specific film page
  const EXCLUDE_PATTERNS = /^(list of|lists of|category:|index of|portal:|template:|wikipedia:|discography|soundtrack|filmography|actor|director|singer|channel|television|tv channel|network)/i;
  for (const res of searchResults) {
    if (res.status !== 'fulfilled' || !res.value?.query?.search) continue;
    for (const page of res.value.query.search) {
      const title = page.title;
      const snippet = page.snippet || '';
      // Skip list pages, channels, people pages, etc.
      if (EXCLUDE_PATTERNS.test(title)) continue;
      // Only include pages that look like a specific film article
      // Film articles typically have year in title like "Movie (2016 film)" or "Movie (film)"
      const isFilmTitle = /\(\d{4}\s*film\)|\(film\)|\(movie\)/i.test(title);
      const snippetMentionsFilm = /\b(film|directed by|starring|released|Indian|Bollywood|Hindi-language)\b/i.test(snippet);
      if (isFilmTitle || (FILM_KEYWORDS.test(title) && snippetMentionsFilm)) {
        filmTitleSet.add(title);
      }
    }
  }

    if (filmTitleSet.size === 0) return [];

  // Fetch REST summaries for all candidate film pages in parallel
  const summaries = await Promise.allSettled(
    [...filmTitleSet].slice(0, 10).map(title => {
      const encoded = encodeURIComponent(title.replace(/ /g, '_'));
      return fetchWithTimeout(`${WIKI_SUMMARY_BASE}/${encoded}`, 5000);
    })
  );

  const results = [];
  for (const s of summaries) {
    if (s.status !== 'fulfilled' || !s.value || s.value.type === 'disambiguation') continue;
    const page = s.value;
    const extract = page.extract || '';
    const desc = page.description || '';

    // Must be clearly a film: description says so, or title has (YYYY film) pattern
    const isFilmDesc = /\b(film|movie)\b/i.test(desc);
    const isFilmTitle = /\(\d{4}\s*film\)|\(film\)|\(movie\)/i.test(page.title || '');
    if (!isFilmDesc && !isFilmTitle) continue;

    // Must be Indian/Bollywood/Hindi
    const isIndian = /\b(Indian|Bollywood|Hindi|Kannada|Tamil|Telugu|Malayalam|Marathi|Punjabi)\b/i.test(extract + desc);
    if (!isIndian) continue;

    // Extract year from title like "Dangal (2016 film)" or description
    const yearMatch = (page.title || '').match(/\((\d{4})/) || (page.description || '').match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : 'N/A';

    // Determine genre tags from description/extract
    const genreHints = [];
    if (/action/i.test(extract)) genreHints.push('Action');
    if (/comedy/i.test(extract)) genreHints.push('Comedy');
    if (/drama/i.test(extract)) genreHints.push('Drama');
    if (/romance/i.test(extract)) genreHints.push('Romance');
    if (/thriller/i.test(extract)) genreHints.push('Thriller');
    if (/horror/i.test(extract)) genreHints.push('Horror');
    if (/biograph/i.test(extract)) genreHints.push('Biography');
    if (genreHints.length === 0) genreHints.push('Bollywood');

    // Clean up display title (remove year disambiguation)
    const cleanTitle = (page.title || '').replace(/\s*\(\d{4}[^)]*\)/, '').replace(/\s*\([^)]*film[^)]*\)/i, '').trim();

    results.push({
      id: `wiki_${page.pageid}`,
      title: cleanTitle,
      subtitle: `${year} • India`,
      image: page.originalimage?.source || page.thumbnail?.source || null,
      rating: null,
      type: 'movie',
      genres: genreHints,
      description: extract.slice(0, 400) || page.description || 'Indian film.',
      originCountry: 'India',
      releaseYear: year,
      previewUrl: null,
      link: page.content_urls?.desktop?.page || null,
      source: '🎬 Bollywood'
    });
  }

  return results;
}

/**
 * Normalizes iTunes Movie Object
 */
function normalizeITunesMovie(item) {
  const highResImage = item.artworkUrl100
    ? item.artworkUrl100.replace('100x100bb', '600x600bb')
    : null;
  const releaseYear = item.releaseDate ? item.releaseDate.split('-')[0] : 'N/A';
  
  return {
    id: `itunes_${item.trackId}`,
    title: item.trackName || item.collectionName,
    subtitle: `${releaseYear} • ${item.country || 'Global'}`,
    image: highResImage,
    rating: item.contentAdvisoryRating ? item.contentAdvisoryRating : 'NR',
    type: 'movie',
    genres: item.primaryGenreName ? [item.primaryGenreName] : ['Movie'],
    description: item.longDescription || item.shortDescription || 'Global motion picture release.',
    originCountry: item.country || 'Global',
    releaseYear: releaseYear,
    previewUrl: item.previewUrl || null,
    link: item.trackViewUrl || null,
    source: 'iTunes'
  };
}

/**
 * Normalizes TVMaze Show Object
 */
function normalizeTVMazeShow(item) {
  const show = item.show;
  const releaseYear = show.premiered ? show.premiered.split('-')[0] : 'N/A';
  const country = show.network?.country?.name || show.webChannel?.country?.name || 'Global';

  return {
    id: `tvmaze_${show.id}`,
    title: show.name,
    subtitle: `${releaseYear} • ${country}`,
    image: show.image?.original || show.image?.medium || null,
    rating: show.rating?.average || null,
    type: 'movie',
    genres: show.genres || ['TV & Film'],
    description: show.summary ? show.summary.replace(/<[^>]*>/g, '') : 'No summary available.',
    originCountry: country,
    releaseYear: releaseYear,
    previewUrl: null,
    link: show.officialSite || show.url || null,
    source: 'TVMaze'
  };
}

/**
 * Normalizes Google Book Object
 */
function normalizeGoogleBook(item) {
  const info = item.volumeInfo || {};
  const imageLinks = info.imageLinks || {};
  const coverUrl = imageLinks.thumbnail
    ? imageLinks.thumbnail.replace('http://', 'https://').replace('&edge=curl', '')
    : (imageLinks.smallThumbnail ? imageLinks.smallThumbnail.replace('http://', 'https://') : null);

  const authors = info.authors ? info.authors.join(', ') : 'Unknown Author';
  const releaseYear = info.publishedDate ? info.publishedDate.split('-')[0] : 'N/A';

  return {
    id: `gbook_${item.id}`,
    title: info.title,
    subtitle: `${authors} (${releaseYear})`,
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
    source: 'Google Books'
  };
}

/**
 * Normalizes Open Library Book Object
 */
function normalizeOpenLibraryBook(item) {
  const workId = item.key ? item.key.replace('/works/', '') : String(item.cover_edition_key || Math.random());
  const coverUrl = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : null;
  const authors = item.author_name ? item.author_name.join(', ') : 'Unknown Author';
  const releaseYear = item.first_publish_year ? String(item.first_publish_year) : 'N/A';

  return {
    id: `openlib_${workId}`,
    title: item.title,
    subtitle: `${authors} (${releaseYear})`,
    authors: item.author_name || ['Unknown Author'],
    image: coverUrl,
    rating: item.ratings_average ? parseFloat(item.ratings_average.toFixed(1)) : null,
    type: 'book',
    genres: item.subject ? item.subject.slice(0, 3) : ['General'],
    description: item.first_sentence ? item.first_sentence[0] : 'Open Library public catalog record.',
    publishedDate: releaseYear,
    publisher: 'Open Library',
    pageCount: 'N/A',
    language: item.language ? item.language[0]?.toUpperCase() : 'Global',
    previewLink: `https://openlibrary.org${item.key}`,
    infoLink: `https://openlibrary.org${item.key}`,
    source: 'Open Library'
  };
}

/**
 * GET /api/movies/search?q=...&region=...
 * Worldwide Movie and TV Show multi-source search
 */
router.get('/movies/search', async (req, res) => {
  try {
    const { q, region } = req.query;
    if (!q || !q.trim()) return res.json([]);

    const query = q.trim();
    const isIndia = region && region.toLowerCase() === 'in';
    const isAll = !region || region === 'all';
    const countryCode = !isAll ? region.toLowerCase() : null;

    // Build iTunes fetch URLs — for 'all' we hit multiple storefronts in parallel
    const itunesUrls = [];
    if (isAll) {
      // Search across major storefronts for broad worldwide results
      ['us', 'gb', 'au'].forEach(cc => {
        itunesUrls.push(`${ITUNES_BASE}?media=movie&entity=movie&term=${encodeURIComponent(query)}&country=${cc}&limit=15`);
      });
    } else {
      itunesUrls.push(`${ITUNES_BASE}?media=movie&entity=movie&term=${encodeURIComponent(query)}&country=${countryCode}&limit=25`);
    }

    // TVMaze search (global, results filtered by country when region selected)
    const tvmazeUrl = `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`;

    const allFetchUrls = [...itunesUrls, tvmazeUrl];
    const allResults = await Promise.allSettled(allFetchUrls.map(url => fetchWithTimeout(url)));

    const results = [];
    const titleSeen = new Set();
    const tvmazeIdx = allFetchUrls.length - 1; // Last URL is TVMaze

    // For India/Bollywood: use Wikipedia as the primary source (iTunes has no Bollywood catalog)
    if (isIndia) {
      const bollywoodResults = await searchBollywoodViaWikipedia(query);
      for (const item of bollywoodResults) {
        const key = item.title.toLowerCase().trim();
        if (!titleSeen.has(key)) {
          titleSeen.add(key);
          results.push(item);
        }
      }
    }

    // Process iTunes results (all storefronts)
    for (let i = 0; i < tvmazeIdx; i++) {
      const res_ = allResults[i];
      if (res_.status === 'fulfilled' && res_.value?.results) {
        for (const item of res_.value.results) {
          if (!item.trackId) continue;
          const norm = normalizeITunesMovie(item);
          const key = norm.title.toLowerCase().trim();
          if (!titleSeen.has(key)) {
            titleSeen.add(key);
            results.push(norm);
          }
        }
      }
    }

        // Process TVMaze Shows — filter by country code when a specific region is selected
    const tvmazeRes = allResults[tvmazeIdx];
    if (tvmazeRes.status === 'fulfilled' && Array.isArray(tvmazeRes.value)) {
      for (const item of tvmazeRes.value) {
        if (!item.show) continue;
        // Country filter: when India selected, prefer shows from IN or with Hindi language
        if (!isAll && countryCode) {
          const showCountry = (
            item.show.network?.country?.code ||
            item.show.webChannel?.country?.code ||
            ''
          ).toLowerCase();
          const showLang = (item.show.language || '').toLowerCase();
          const isIndianShow = isIndia && (showCountry === 'in' || showLang === 'hindi' || showLang === 'hi');
          // For non-India specific regions, filter by country match; allow global channels (no country)
          if (!isIndianShow && showCountry && showCountry !== countryCode) continue;
        }
        const norm = normalizeTVMazeShow(item);
        const key = norm.title.toLowerCase().trim();
        if (!titleSeen.has(key)) {
          titleSeen.add(key);
          results.push(norm);
        }
      }
    }

    return res.json(results);
  } catch (error) {
    console.error('Movie search error:', error);
    return res.status(500).json({ error: 'Failed to fetch movies worldwide.' });
  }
});

/**
 * GET /api/movies/:id
 */
router.get('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (id.startsWith('tvmaze_')) {
      const realId = id.replace('tvmaze_', '');
      const showData = await fetchWithTimeout(`${TVMAZE_BASE}/shows/${realId}?embed=cast`);
      if (!showData) return res.status(404).json({ error: 'Movie/Show not found' });

      return res.json({
        id,
        title: showData.name,
        subtitle: showData.premiered ? showData.premiered.split('-')[0] : 'N/A',
        image: showData.image?.original || showData.image?.medium || null,
        rating: showData.rating?.average || null,
        type: 'movie',
        genres: showData.genres || [],
        description: showData.summary ? showData.summary.replace(/<[^>]*>/g, '') : 'No summary available.',
        premiered: showData.premiered || 'Unknown',
        status: showData.status || 'Released',
        runtime: showData.runtime ? `${showData.runtime} min` : 'N/A',
        network: showData.network?.name || showData.webChannel?.name || 'Worldwide Network',
        officialSite: showData.officialSite || null,
        cast: showData._embedded?.cast?.slice(0, 10).map(member => ({
          name: member.person.name,
          character: member.character.name,
          image: member.person.image?.medium || member.person.image?.original || null
        })) || []
      });
    }
