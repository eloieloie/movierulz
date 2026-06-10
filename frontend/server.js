import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.join(__dirname, 'dist');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ezcnelnuphfyipcsifnv.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y25lbG51cGhmeWlwY3NpZm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTkwMDAsImV4cCI6MjA5NjIzNTAwMH0.Q1fs1G99kJtoWcc9mUR4YdyHDo2LbEl0A1uGmyOGDEA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function fetchAll(column) {
  const all = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select(column)
      .not(column, 'is', null)
      .range(from, from + step - 1);
    if (error) throw error;
    if (!data.length) break;
    all.push(...data);
    if (data.length < step) break;
    from += step;
  }
  return all;
}

app.get('/api/movies', async (req, res) => {
  try {
    const { category, year, quality, language, genre, status, sort, page, perPage } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limit = Math.min(500, parseInt(perPage) || 100);
    const offset = (pageNum - 1) * limit;

    let query = supabase.from('movies').select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (year) query = query.eq('year', parseInt(year));
    if (language) query = query.eq('language', language);
    if (genre) query = query.ilike('genres', `%${genre}%`);
    if (status === 'none') query = query.is('status', null);
    else if (status) query = query.eq('status', status);

    if (quality) {
      const quals = quality.split(',');
      query = query.in('quality', quals);
    }

    switch (sort) {
      case 'year_asc': query = query.order('year', { ascending: true }); break;
      case 'year_desc': query = query.order('year', { ascending: false }); break;
      case 'title_asc': query = query.order('title', { ascending: true }); break;
      case 'title_desc': query = query.order('title', { ascending: false }); break;
      default: query = query.order('created_at', { ascending: false });
    }
    query = query.order('id', { ascending: true });

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;
    res.json({ data: data || [], total: count, page: pageNum, perPage: limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/movies/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['watched', 'want_to_watch', 'not_interested', null];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { error } = await supabase.from('movies').update({ status }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/movies/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('movies').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Movie not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const all = await fetchAll('category');
    const cats = [...new Set(all.map(r => r.category))].filter(Boolean).sort();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/filters', async (req, res) => {
  try {
    const [yearRows, qualityRows, languageRows, genreRows] = await Promise.all([
      fetchAll('year'),
      fetchAll('quality'),
      fetchAll('language'),
      fetchAll('genres'),
    ]);

    const years = [...new Set(yearRows.map(r => r.year))].filter(Boolean).sort((a, b) => b - a);
    const qualities = [...new Set(qualityRows.map(r => r.quality))].filter(Boolean).sort();
    const languages = [...new Set(languageRows.map(r => r.language))].filter(Boolean).sort();

    const genreSet = new Set();
    genreRows.forEach(r => (r.genres || '').split(',').forEach(g => { const t = g.trim(); if (t) genreSet.add(t); }));
    const genres = [...genreSet].sort();

    res.json({ years, qualities, languages, genres });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
