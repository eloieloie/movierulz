import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '..', 'db', 'movies.db');
const DIST_PATH = path.join(__dirname, 'dist');

const app = express();
const PORT = process.env.PORT || 3000;

async function getDb() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database not found. Run "npm run scrape" first.');
    return null;
  }
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  const result = db.exec("PRAGMA table_info(movies)");
  const cols = result[0] ? result[0].values.map(v => v[1]) : [];
  if (!cols.includes('status')) {
    db.run("ALTER TABLE movies ADD COLUMN status TEXT");
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
  return db;
}

function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

app.get('/api/movies', async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'Database not found' });
  try {
    const { category, year, quality, language, genre, status, sort } = req.query;
    let sql = 'SELECT * FROM movies WHERE 1=1';
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (year) { sql += ' AND year = ?'; params.push(parseInt(year)); }
    if (quality) { sql += ' AND quality = ?'; params.push(quality); }
    if (language) { sql += ' AND language = ?'; params.push(language); }
    if (genre) { sql += ' AND genres LIKE ?'; params.push(`%${genre}%`); }
    if (status === 'none') { sql += ' AND status IS NULL'; }
    else if (status) { sql += ' AND status = ?'; params.push(status); }
    switch (sort) {
      case 'year_asc': sql += ' ORDER BY year ASC'; break;
      case 'year_desc': sql += ' ORDER BY year DESC'; break;
      case 'title_asc': sql += ' ORDER BY title ASC'; break;
      case 'title_desc': sql += ' ORDER BY title DESC'; break;
      default: sql += ' ORDER BY created_at DESC';
    }
    const movies = queryAll(db, sql, params);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

app.use(express.json());

app.patch('/api/movies/:id/status', async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'Database not found' });
  try {
    const { status } = req.body;
    const valid = ['watched', 'want_to_watch', 'not_interested', null];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    db.run('UPDATE movies SET status=? WHERE id=?', [status, req.params.id]);
    const buffer = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(buffer));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

app.get('/api/movies/:id', async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'Database not found' });
  try {
    const rows = queryAll(db, 'SELECT * FROM movies WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Movie not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

app.get('/api/categories', async (req, res) => {
  const db = await getDb();
  if (!db) return res.json([]);
  try {
    const rows = queryAll(db, 'SELECT DISTINCT category FROM movies WHERE category IS NOT NULL ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

app.get('/api/filters', async (req, res) => {
  const db = await getDb();
  if (!db) return     res.json({ years: [], qualities: [], languages: [], genres: [] });
  try {
    const years = queryAll(db, 'SELECT DISTINCT year FROM movies WHERE year IS NOT NULL ORDER BY year DESC');
    const qualities = queryAll(db, 'SELECT DISTINCT quality FROM movies WHERE quality IS NOT NULL ORDER BY quality');
    const languages = queryAll(db, 'SELECT DISTINCT language FROM movies WHERE language IS NOT NULL ORDER BY language');
    const genreRows = queryAll(db, "SELECT DISTINCT genres FROM movies WHERE genres IS NOT NULL AND genres != ''");
    const genreSet = new Set();
    genreRows.forEach(r => (r.genres || '').split(',').forEach(g => { const t = g.trim(); if (t) genreSet.add(t); }));
    const genres = [...genreSet].sort();
    res.json({
      years: years.map(y => y.year),
      qualities: qualities.map(q => q.quality),
      languages: languages.map(l => l.language),
      genres,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (!fs.existsSync(DIST_PATH)) {
    console.log('Frontend not built. Run "npm run build" then "node server.js" for production,');
    console.log('or use "npm run dev" for development with hot reload.');
  }
});
