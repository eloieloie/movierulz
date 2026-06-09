const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'db', 'index.js');
const db = require(dbPath);

const BASE_URL = 'https://www.5movierulz.discount';

function parseTitleInfo(title) {
  const yearMatch = title.match(/\((\d{4})\)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  const qualMatch = title.match(/\)\s*(\w+)\s*\[/);
  const quality = qualMatch ? qualMatch[1] : null;
  const langMatch = title.match(/\[(.+?)\]/);
  const language = langMatch ? langMatch[1] : null;
  return { year, quality, language };
}

function extractMovies($, section, category) {
  const movies = [];
  $(section).find('li').each((i, el) => {
    const $el = $(el);
    const $a = $el.find('.cont_display a');
    const $img = $el.find('.cont_display a img');
    const $titleEl = $el.find('p b');

    const title = $a.attr('title') || $titleEl.text().trim();
    const movieUrl = $a.attr('href');
    const posterUrl = $img.attr('src');

    if (!title || !movieUrl) return;

    const info = parseTitleInfo(title);
    const fullUrl = movieUrl.startsWith('http') ? movieUrl : BASE_URL + movieUrl;
    const fullPoster = posterUrl && posterUrl.startsWith('http') ? posterUrl : (posterUrl ? BASE_URL + posterUrl : null);

    movies.push({
      title,
      year: info.year,
      quality: info.quality,
      language: info.language,
      category,
      poster_url: fullPoster,
      movie_url: fullUrl,
    });
  });
  return movies;
}

async function scrapeHomepage() {
  console.log('Fetching homepage...');
  const { data } = await axios.get(BASE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 15000,
  });
  const $ = cheerio.load(data);
  let all = [];
  all = all.concat(extractMovies($, '.featured:not(.lastest)', 'Featured'));
  all = all.concat(extractMovies($, '.featured.lastest', 'Latest'));
  console.log(`  Featured: ${all.length} movies`);
  return all;
}

async function scrapeListingPage(pageNum) {
  const url = `${BASE_URL}/movies/page/${pageNum}`;
  console.log(`Fetching page ${pageNum}...`);
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    });
    const $ = cheerio.load(data);
    const movies = [];
    $('.featured li').each((i, el) => {
      const $el = $(el);
      const $a = $el.find('.cont_display a');
      const $img = $el.find('.cont_display a img');
      const $titleEl = $el.find('p b');
      const title = $a.attr('title') || $titleEl.text().trim();
      const movieUrl = $a.attr('href');
      const posterUrl = $img.attr('src');
      if (!title || !movieUrl) return;
      const info = parseTitleInfo(title);
      movies.push({
        title,
        year: info.year,
        quality: info.quality,
        language: info.language,
        category: 'Movies',
        poster_url: posterUrl && (posterUrl.startsWith('http') ? posterUrl : BASE_URL + posterUrl),
        movie_url: movieUrl.startsWith('http') ? movieUrl : BASE_URL + movieUrl,
      });
    });
    return movies;
  } catch (err) {
    console.log(`  Page ${pageNum}: ${err.message}`);
    return [];
  }
}

async function scrape(maxListingPages = 3) {
  console.log('=== MovieRulz Scraper ===\n');
  await db.open();

  let allMovies = [];
  allMovies = allMovies.concat(await scrapeHomepage());

  for (let i = 1; i <= maxListingPages; i++) {
    const pageMovies = await scrapeListingPage(i);
    if (pageMovies.length === 0) break;
    allMovies = allMovies.concat(pageMovies);
  }

  console.log(`\nTotal scraped: ${allMovies.length} movies`);

  let inserted = 0;
  for (const movie of allMovies) {
    try {
      db.upsertMovie(movie);
      inserted++;
    } catch (err) {
      console.error(`  Error: "${movie.title}": ${err.message}`);
    }
  }
  console.log(`Saved: ${inserted} movies`);

  db.close();
  console.log('\nDone!');
}

const pages = parseInt(process.argv[2]) || 3;
scrape(pages).catch(err => {
  console.error('Scraper failed:', err.message);
  db.close();
  process.exit(1);
});
