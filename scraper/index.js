const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'db', 'index.js');
const db = require(dbPath);

const BASE_URL = 'https://www.5movierulz.discount';
const CONCURRENCY = 3;

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
    movies.push({
      title,
      year: info.year,
      quality: info.quality,
      language: info.language,
      category,
      poster_url: posterUrl && (posterUrl.startsWith('http') ? posterUrl : BASE_URL + posterUrl),
      movie_url: movieUrl.startsWith('http') ? movieUrl : BASE_URL + movieUrl,
    });
  });
  return movies;
}

async function scrapeCategoryPage(url, category) {
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    });
    const $ = cheerio.load(data);
    return extractMovies($, '.featured', category);
  } catch (err) {
    return [];
  }
}

async function scrapeCategory(categoryUrl, categoryName, maxPages) {
  const movies = [];
  for (let i = 1; i <= maxPages; i++) {
    const pageUrl = i === 1 ? categoryUrl : `${categoryUrl.replace(/\/?$/, '')}/page/${i}`;
    console.log(`  Page ${i}...`);
    const pageMovies = await scrapeCategoryPage(pageUrl, categoryName);
    if (pageMovies.length === 0) break;
    movies.push(...pageMovies);
  }
  return movies;
}

async function scrapeMovieDetail(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    });
    const $ = cheerio.load(data);
    const genres = [];
    $('.movie-info-block p').each((i, p) => {
      const label = $(p).find('strong').text().replace(':', '').trim();
      if (label === 'Genres') {
        $(p).find('a').each((j, a) => genres.push($(a).text().trim()));
      }
    });
    const synopsis = $('.synopsis-section p').text().trim();
    return { genres: genres.length ? genres.join(', ') : null, synopsis: synopsis || null };
  } catch (err) {
    return { genres: null, synopsis: null };
  }
}

async function scrapeDetails(movies) {
  console.log(`\nFetching details for ${movies.length} movies (concurrency: ${CONCURRENCY})...`);
  let done = 0;
  for (let i = 0; i < movies.length; i += CONCURRENCY) {
    const batch = movies.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(m => scrapeMovieDetail(m.movie_url)));
    for (let j = 0; j < batch.length; j++) {
      const detail = results[j];
      if (detail.genres || detail.synopsis) {
        db.updateMovieDetail(batch[j].movie_url, detail.genres, detail.synopsis);
      }
    }
    done += batch.length;
    console.log(`  Details: ${done}/${movies.length}`);
  }
}

async function scrape() {
  console.log('=== MovieRulz Scraper ===\n');
  await db.open();

  const args = process.argv.slice(2);
  const categoryArg = args.find(a => a.startsWith('--category='));
  const yearsArg = args.find(a => a.startsWith('--years='));
  const pagesArg = args.find(a => /^\d+$/.test(a));
  const maxPages = pagesArg ? parseInt(pagesArg) : 20;

  let allMovies = [];

  if (categoryArg) {
    const url = categoryArg.split('=')[1];
    const name = new URL(url).pathname.split('/').pop() || 'Category';
    console.log(`Scraping category: ${name}`);
    allMovies = await scrapeCategory(url, name, maxPages);
  } else {
    let years;
    if (yearsArg) {
      const range = yearsArg.split('=')[1];
      const parts = range.split('-');
      const start = parseInt(parts[0]);
      const end = parts.length > 1 ? parseInt(parts[1]) : start;
      years = [];
      for (let y = start; y >= end; y--) years.push(y);
    } else {
      years = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];
    }
    console.log(`Scraping Telugu movies for years: ${years.join(', ')}`);
    for (const year of years) {
      const url = `https://www.5movierulz.discount/category/telugu-movies-${year}`;
      const name = `Telugu ${year}`;
      console.log(`\n--- ${name} ---`);
      const yearMovies = await scrapeCategory(url, name, maxPages);
      console.log(`  Found: ${yearMovies.length} movies`);
      allMovies.push(...yearMovies);
    }
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
  console.log(`Saved to DB: ${inserted} movies`);

  await scrapeDetails(allMovies);

  db.close();
  console.log('\nDone!');
}

scrape().catch(err => {
  console.error('Scraper failed:', err.message);
  if (db) db.close();
  process.exit(1);
});
