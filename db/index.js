const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'movies.db');
let db = null;
let SQL = null;

async function init() {
  if (!SQL) SQL = await initSqlJs();
}

async function open() {
  await init();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        year INTEGER,
        quality TEXT,
        language TEXT,
        category TEXT,
        poster_url TEXT,
        movie_url TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category)');
    db.run('CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year)');
    save();
  }
  return db;
}

function save() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function all(query, params = []) {
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(query, params = []) {
  const rows = all(query, params);
  return rows[0] || null;
}

function getAllMovies(category) {
  let query = 'SELECT * FROM movies';
  const params = [];
  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }
  query += ' ORDER BY created_at DESC';
  return all(query, params);
}

function getMovie(id) {
  return get('SELECT * FROM movies WHERE id = ?', [id]);
}

function upsertMovie(movie) {
  const existing = get('SELECT id FROM movies WHERE movie_url = ?', [movie.movie_url]);
  if (existing) {
    db.run(
      `UPDATE movies SET title=?, year=?, quality=?, language=?, category=?, poster_url=?
       WHERE movie_url=?`,
      [movie.title, movie.year, movie.quality, movie.language, movie.category, movie.poster_url, movie.movie_url]
    );
  } else {
    db.run(
      `INSERT INTO movies (title, year, quality, language, category, poster_url, movie_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [movie.title, movie.year, movie.quality, movie.language, movie.category, movie.poster_url, movie.movie_url]
    );
  }
  save();
}

function getCategories() {
  const rows = all('SELECT DISTINCT category FROM movies WHERE category IS NOT NULL ORDER BY category');
  return rows.map(r => r.category);
}

function clearMovies() {
  db.run('DELETE FROM movies');
  save();
}

function close() {
  if (db) { save(); db.close(); db = null; }
}

module.exports = { open, getAllMovies, getMovie, upsertMovie, clearMovies, close, getCategories };
