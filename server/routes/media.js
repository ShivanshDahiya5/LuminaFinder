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
