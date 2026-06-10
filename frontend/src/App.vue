<template>
  <div id="app-root">
    <header id="branding">
      <h1 id="site-title"><a :href="basePath">MovieRulz</a></h1>
      <p id="site-description">Latest Indian Movies — Telugu, Tamil, Malayalam &amp; Hindi</p>
    </header>

    <nav id="menu" v-if="categories.length">
      <ul id="primary-menu">
        <li>
          <a href="#" :class="{ active: !activeCategory }" @click.prevent="activeCategory = null; resetAndFetch()">All</a>
        </li>
        <li v-for="cat in categories" :key="cat">
          <a href="#" :class="{ active: activeCategory === cat }" @click.prevent="activeCategory = cat; resetAndFetch()">{{ cat }}</a>
        </li>
      </ul>
    </nav>

    <div class="filter-bar" v-if="filters.years.length || filters.languages.length">
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
        <option value="year_desc">Year: Newest First</option>
        <option value="year_asc">Year: Oldest First</option>
        <option value="title_asc">Title: A-Z</option>
        <option value="title_desc">Title: Z-A</option>
      </select>
    </div>

    <div id="content">
      <div v-if="loading && !movies.length" class="loading">Loading movies...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <template v-else>
        <div class="section-title" v-if="!activeCategory">
          <h2>Featured Movies Free</h2>
        </div>
        <div class="movie-count">Showing {{ movies.length }} movie{{ movies.length === 1 ? '' : 's' }}{{ total ? ' of ' + total : '' }}</div>
        <div class="movie-grid">
          <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" />
          <div v-if="!movies.length && !loading" class="no-movies">No movies found.</div>
        </div>
        <div v-if="hasMore" class="load-more-wrap">
          <button class="load-more" @click="loadMore" :disabled="loadingMore">
            {{ loadingMore ? 'Loading...' : 'Show More' }}
          </button>
        </div>
      </template>
    </div>

    <footer id="colophon">
      <p><strong>MovieRulz</strong> — Indian Movie Database</p>
      <p class="footer-note">MovieRulz provides informational content only — director details, cast lists, synopses for Indian films.</p>
    </footer>
  </div>
</template>

<script>
import MovieCard from './components/MovieCard.vue'
import { supabase } from './supabase.js'

export default {
  name: 'App',
  components: { MovieCard },
  data() {
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
      activeCategory: null,
      filterYear: '',
      filterLanguage: '',
      filterQuality: [],
      filterGenre: '',
      filterStatus: '',
      sortOrder: '',
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
    resetAndFetch() {
      this.movies = [];
      this.total = 0;
      this.page = 1;
      this.fetchMovies();
    },
    async fetchMovies() {
      this.loading = true;
      this.error = null;
      try {
        const offset = (this.page - 1) * this.perPage;
        let query = supabase.from('movies').select('*', { count: 'exact' });

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
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #141519;
  color: #ccc;
  min-height: 100vh;
}
#app-root { max-width: 1100px; margin: 0 auto; padding: 0 15px; }
#branding {
  text-align: center;
  padding: 30px 0 10px;
}
#site-title a {
  color: #e0e0e0;
  text-decoration: none;
  font-size: 28px;
  font-weight: 700;
}
#site-description {
  color: #888;
  font-size: 13px;
  margin-top: 4px;
}
#menu {
  margin: 20px 0;
  border-bottom: 1px solid #2a2d35;
}
#primary-menu {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
#primary-menu li a {
  display: block;
  padding: 8px 14px;
  color: #989eae;
  text-decoration: none;
  font-size: 13px;
  border-radius: 4px 4px 0 0;
  transition: background 0.2s;
}
#primary-menu li a:hover { background: #1a1c22; }
#primary-menu li a.active {
  background: #1a1c22;
  color: #d24d04;
  border-bottom: 2px solid #d24d04;
}
.filter-bar {
  display: flex;
  gap: 10px;
  margin: 10px 0 20px;
  flex-wrap: wrap;
  align-items: center;
}
.filter-bar select {
  background: #1a1c22;
  color: #ccc;
  border: 1px solid #2a2d35;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
.filter-bar select:focus { outline: none; border-color: #d24d04; }
.chip-group { display: flex; gap: 4px; flex-wrap: wrap; }
.chip {
  background: #1a1c22;
  color: #888;
  border: 1px solid #2a2d35;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: #555; color: #ccc; }
.chip.active { background: #d24d04; color: #fff; border-color: #d24d04; }
.section-title h2 {
  font-size: 18px;
  color: #e0e0e0;
  padding-bottom: 10px;
  border-bottom: 1px solid #2a2d35;
  margin-bottom: 15px;
}
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  gap: 15px;
}
.loading, .error, .no-movies {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}
.error { color: #e74c3c; }
.no-movies code { background: #1a1c22; padding: 2px 6px; border-radius: 3px; }
.movie-count {
  text-align: left;
  color: #666;
  font-size: 12px;
  padding: 0 0 10px;
}
.load-more-wrap {
  text-align: center;
  padding: 20px 0;
}
.load-more {
  background: #1a1c22;
  color: #ccc;
  border: 1px solid #2a2d35;
  padding: 10px 30px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.load-more:hover { background: #2a2d35; border-color: #555; }
.load-more:disabled { opacity: 0.5; cursor: default; }
#colophon {
  text-align: center;
  padding: 30px 0;
  margin-top: 30px;
  border-top: 1px solid #2a2d35;
  color: #666;
  font-size: 13px;
}
.footer-note { font-size: 11px; margin-top: 8px; }
</style>
