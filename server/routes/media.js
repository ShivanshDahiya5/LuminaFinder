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
