<template>
  <div id="app-root">
    <header id="branding">
      <div class="brand-inner">
        <h1 id="site-title"><a :href="basePath">MovieRulz</a></h1>
        <p id="site-description">Discover the best in Indian cinema</p>
      </div>
    </header>

    <nav id="menu" v-if="categories.length">
      <ul id="primary-menu">
        <li>
          <a href="#" :class="{ active: !activeCategory }" @click.prevent="activeCategory = null; saveFilters(); resetAndFetch()">All</a>
        </li>
        <li v-for="cat in categories" :key="cat">
          <a href="#" :class="{ active: activeCategory === cat }" @click.prevent="activeCategory = cat; saveFilters(); resetAndFetch()">{{ cat }}</a>
        </li>
      </ul>
    </nav>

    <div class="filter-bar" v-if="filters.years.length || filters.languages.length">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          class="search-input"
          type="text"
          v-model="searchQuery"
          placeholder="Search movies..."
          @keyup.enter="resetAndFetch()"
          @change="resetAndFetch()"
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''; resetAndFetch()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <select v-model="filterYear" @change="resetAndFetch()">
        <option value="">All Years</option>
        <option v-for="y in filters.years" :key="y" :value="y">{{ y }}</option>
      </select>
      <select v-model="filterLanguage" @change="resetAndFetch()">
        <option value="">All Languages</option>
        <option v-for="l in filters.languages" :key="l" :value="l">{{ l }}</option>
      </select>
      <div class="chip-group" v-if="filters.qualities.length">
        <button
          v-for="q in filters.qualities" :key="q"
          class="chip"
          :class="{ active: filterQuality.includes(q) }"
          @click="toggleQuality(q)"
        >{{ q }}</button>
      </div>
      <select v-model="filterGenre" @change="resetAndFetch()">
        <option value="">All Genres</option>
        <option v-for="g in filters.genres" :key="g" :value="g">{{ g }}</option>
      </select>
      <select v-model="filterStatus" @change="resetAndFetch()">
        <option value="">All Status</option>
        <option value="none">Unmarked</option>
        <option value="watched">Watched</option>
        <option value="want_to_watch">Want to Watch</option>
        <option value="not_interested">Not Interested</option>
      </select>
      <select v-model="sortOrder" @change="resetAndFetch()">
        <option value="">Newest First</option>
        <option value="year_desc">Year: Newest</option>
        <option value="year_asc">Year: Oldest</option>
        <option value="title_asc">Title: A-Z</option>
        <option value="title_desc">Title: Z-A</option>
      </select>
    </div>

    <div id="content">
      <div v-if="loading && !movies.length" class="loading">
        <div class="spinner"></div>
        <p>Loading movies...</p>
      </div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <template v-else>
        <div class="content-header">
          <div class="section-title" v-if="!activeCategory">
            <h2>Featured Movies</h2>
          </div>
          <div class="movie-count">{{ movies.length }} movie{{ movies.length === 1 ? '' : 's' }}{{ total ? ' of ' + total : '' }}</div>
        </div>
        <div class="movie-grid">
          <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" />
        </div>
        <div v-if="!movies.length && !loading" class="no-movies">
          <div class="no-movies-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m22 14-5-5-8 8-3-3-4 4"/></svg>
          </div>
          <p>No movies found. Try adjusting your filters.</p>
        </div>
        <div v-if="hasMore" class="load-more-wrap">
          <button class="load-more" @click="loadMore" :disabled="loadingMore">
            <span v-if="loadingMore" class="spinner-ring"></span>
            <span v-else>Show More</span>
          </button>
        </div>
      </template>
    </div>

    <footer id="colophon">
      <div class="footer-inner">
        <p class="footer-brand">MovieRulz</p>
        <p class="footer-note">Indian Movie Database — curated from public sources.</p>
      </div>
    </footer>
  </div>
</template>

<script>
import MovieCard from './components/MovieCard.vue'
import { supabase } from './supabase.js'

const FILTER_KEY = 'movierulz-filters'

const DEFAULTS = {
  activeCategory: null,
  searchQuery: '',
  filterYear: '',
  filterLanguage: '',
  filterQuality: [],
  filterGenre: '',
  filterStatus: '',
  sortOrder: '',
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(FILTER_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULTS }
}

export default {
  name: 'App',
  components: { MovieCard },
  data() {
    const saved = loadSaved()
    return {
      movies: [],
      total: 0,
      page: 1,
      perPage: 100,
      loading: true,
      loadingMore: false,
      error: null,
      categories: [],
      filters: { years: [], qualities: [], languages: [], genres: [] },
      activeCategory: saved.activeCategory,
      searchQuery: saved.searchQuery || '',
      filterYear: saved.filterYear,
      filterLanguage: saved.filterLanguage,
      filterQuality: saved.filterQuality,
      filterGenre: saved.filterGenre,
      filterStatus: saved.filterStatus,
      sortOrder: saved.sortOrder,
    }
  },
  computed: {
    hasMore() {
      return this.total > this.movies.length;
    },
    basePath() {
      return import.meta.env.VITE_BASE || '/';
    }
  },
  mounted() {
    this.fetchCategories();
    this.fetchFilters();
    this.fetchMovies();
  },
  methods: {
    saveFilters() {
      try {
        localStorage.setItem(FILTER_KEY, JSON.stringify({
          activeCategory: this.activeCategory,
          searchQuery: this.searchQuery,
          filterYear: this.filterYear,
          filterLanguage: this.filterLanguage,
          filterQuality: this.filterQuality,
          filterGenre: this.filterGenre,
          filterStatus: this.filterStatus,
          sortOrder: this.sortOrder,
        }))
      } catch {}
    },
    resetAndFetch() {
      this.movies = [];
      this.total = 0;
      this.page = 1;
      this.saveFilters();
      this.fetchMovies();
    },
    async fetchMovies() {
      this.loading = true;
      this.error = null;
      try {
        const offset = (this.page - 1) * this.perPage;
        let query = supabase.from('movies').select('*', { count: 'exact' });

        if (this.searchQuery) query = query.ilike('title', `%${this.searchQuery}%`);
        if (this.activeCategory) query = query.eq('category', this.activeCategory);
        if (this.filterYear) query = query.eq('year', parseInt(this.filterYear));
        if (this.filterLanguage) query = query.eq('language', this.filterLanguage);
        if (this.filterGenre) query = query.ilike('genres', `%${this.filterGenre}%`);
        if (this.filterStatus === 'none') query = query.is('status', null);
        else if (this.filterStatus) query = query.eq('status', this.filterStatus);
        if (this.filterQuality.length) query = query.in('quality', this.filterQuality);

        switch (this.sortOrder) {
          case 'year_asc': query = query.order('year', { ascending: true }); break;
          case 'year_desc': query = query.order('year', { ascending: false }); break;
          case 'title_asc': query = query.order('title', { ascending: true }); break;
          case 'title_desc': query = query.order('title', { ascending: false }); break;
          default: query = query.order('created_at', { ascending: false });
        }
        query = query.order('id', { ascending: true });

        const { data, error, count } = await query.range(offset, offset + this.perPage - 1);
        if (error) throw error;
        this.movies = this.page === 1 ? (data || []) : [...this.movies, ...(data || [])];
        this.total = count || 0;
      } catch (err) {
        this.error = 'Failed to load movies.';
        this.movies = [];
      } finally {
        this.loading = false;
      }
    },
    async loadMore() {
      this.loadingMore = true;
      this.page++;
      await this.fetchMovies();
      this.loadingMore = false;
    },
    toggleQuality(q) {
      const idx = this.filterQuality.indexOf(q);
      if (idx === -1) this.filterQuality.push(q);
      else this.filterQuality.splice(idx, 1);
      this.saveFilters();
      this.resetAndFetch();
    },
    async fetchCategories() {
      try {
        const all = [];
        let from = 0;
        const step = 1000;
        while (true) {
          const { data, error } = await supabase
            .from('movies')
            .select('category')
            .not('category', 'is', null)
            .range(from, from + step - 1);
          if (error) throw error;
          if (!data.length) break;
          all.push(...data);
          if (data.length < step) break;
          from += step;
        }
        this.categories = [...new Set(all.map(r => r.category))].filter(Boolean).sort();
      } catch (_) {}
    },
    async fetchFilters() {
      try {
        const step = 1000;
        const fetchCol = async (col) => {
          const all = [];
          let from = 0;
          while (true) {
            const { data, error } = await supabase
              .from('movies')
              .select(col)
              .not(col, 'is', null)
              .range(from, from + step - 1);
            if (error) throw error;
            if (!data.length) break;
            all.push(...data);
            if (data.length < step) break;
            from += step;
          }
          return all;
        };

        const [yearRows, qualityRows, languageRows, genreRows] = await Promise.all([
          fetchCol('year'),
          fetchCol('quality'),
          fetchCol('language'),
          fetchCol('genres'),
        ]);

        this.filters.years = [...new Set(yearRows.map(r => r.year))].filter(Boolean).sort((a, b) => b - a);
        this.filters.qualities = [...new Set(qualityRows.map(r => r.quality))].filter(Boolean).sort();
        this.filters.languages = [...new Set(languageRows.map(r => r.language))].filter(Boolean).sort();

        const genreSet = new Set();
        genreRows.forEach(r => (r.genres || '').split(',').forEach(g => { const t = g.trim(); if (t) genreSet.add(t); }));
        this.filters.genres = [...genreSet].sort();
      } catch (_) {}
    },
  },
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg-primary: #07080a;
  --bg-surface: #111217;
  --bg-elevated: #181a22;
  --bg-hover: #1e2030;
  --accent: #e85d04;
  --accent-glow: rgba(232, 93, 4, 0.25);
  --accent-dim: rgba(232, 93, 4, 0.12);
  --text-primary: #f0f0f4;
  --text-secondary: #8b8fa3;
  --text-muted: #4f5368;
  --border: #1e2030;
  --border-light: #2a2d42;
  --success: #22c55e;
  --warning: #eab308;
  --danger: #ef4444;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app-root { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

#branding {
  padding: 40px 0 20px;
  text-align: center;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0;
}

.brand-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

#site-title a {
  font-family: 'Poppins', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
  background: linear-gradient(135deg, #fff 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

#site-description {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 400;
}

#menu {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

#primary-menu {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

#primary-menu li a {
  display: block;
  padding: 8px 18px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  border-radius: 20px;
  transition: all 0.2s ease;
}

#primary-menu li a:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

#primary-menu li a.active {
  color: #fff;
  background: var(--accent);
  box-shadow: 0 0 20px var(--accent-glow);
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
  padding: 14px 18px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 180px;
  max-width: 280px;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 8px 32px 8px 38px;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.search-input::placeholder { color: var(--text-muted); }

.search-clear {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: color 0.15s;
}

.search-clear svg { width: 16px; height: 16px; }

.search-clear:hover { color: var(--text-primary); }

.filter-bar select {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  padding: 8px 30px 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234f5368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color 0.2s ease;
}

.filter-bar select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.chip-group { display: flex; gap: 4px; flex-wrap: wrap; }

.chip {
  background: var(--bg-primary);
  color: var(--text-muted);
  border: 1px solid var(--border);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.chip.active {
  background: var(--accent-dim);
  color: var(--accent);
  border-color: var(--accent);
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.movie-count {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 400;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 20px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
  color: var(--text-muted);
  font-size: 14px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.spinner-ring {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.error, .no-movies {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
}

.error { color: var(--danger); }

.no-movies-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  opacity: 0.4;
}

.no-movies-icon svg { width: 48px; height: 48px; }

.load-more-wrap {
  text-align: center;
  padding: 32px 0 48px;
}

.load-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  padding: 12px 36px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 150px;
}

.load-more:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  box-shadow: 0 0 24px var(--accent-glow);
}

.load-more:disabled {
  opacity: 0.6;
  cursor: default;
}

#colophon {
  padding: 32px 0;
  border-top: 1px solid var(--border);
  margin-top: 40px;
}

.footer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.footer-brand {
  font-family: 'Poppins', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.footer-note {
  color: var(--text-muted);
  font-size: 12px;
}

@media (max-width: 768px) {
  #app-root { padding: 0 12px; }
  #site-title a { font-size: 24px; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .search-wrap { max-width: none; }
  .filter-bar select { width: 100%; }
  .movie-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  .content-header { flex-direction: column; gap: 8px; align-items: flex-start; }
}
</style>
