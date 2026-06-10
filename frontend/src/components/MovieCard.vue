<template>
  <div class="movie-card" :class="statusClass">
    <div class="poster-wrap">
      <div class="poster-overlay">
        <a class="ext-link" :href="movie.movie_url" target="_blank" rel="noopener" title="Open on 5Movierulz">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
        <div class="badge" v-if="movie.quality">{{ movie.quality }}</div>
      </div>
      <img
        :src="movie.poster_url || 'https://via.placeholder.com/165x220?text=No+Poster'"
        :alt="movie.title"
        loading="lazy"
        @error="onImgError"
      />
    </div>
    <div class="card-body">
      <div class="status-bar">
        <button
          class="status-btn"
          :class="{ active: movie.status === 'watched', activeWatched: movie.status === 'watched' }"
          @click.stop="setStatus('watched')"
          title="Watched"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button
          class="status-btn"
          :class="{ active: movie.status === 'want_to_watch', activeWant: movie.status === 'want_to_watch' }"
          @click.stop="setStatus('want_to_watch')"
          title="Want to Watch"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <button
          class="status-btn"
          :class="{ active: movie.status === 'not_interested', activeNope: movie.status === 'not_interested' }"
          @click.stop="setStatus('not_interested')"
          title="Not Interested"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="movie-info">
        <h3 :title="movie.title">{{ displayTitle }}</h3>
        <div class="tags">
          <span class="tag year-tag" v-if="movie.year">{{ movie.year }}</span>
          <span class="tag lang-tag" v-if="movie.language">{{ movie.language }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase.js'

export default {
  name: 'MovieCard',
  props: {
    movie: { type: Object, required: true }
  },
  computed: {
    displayTitle() {
      return this.movie.title.replace(/ \(\d{4}\)/, '').replace(/ \[.*?\]/, '');
    },
    statusClass() {
      return this.movie.status ? 'status-' + this.movie.status : '';
    }
  },
  methods: {
    onImgError(e) {
      e.target.src = 'https://via.placeholder.com/165x220?text=No+Poster';
    },
    async setStatus(status) {
      const prev = this.movie.status;
      const newStatus = prev === status ? null : status;
      this.movie.status = newStatus;
      const { error } = await supabase.from('movies').update({ status: newStatus }).eq('id', this.movie.id);
      if (error) this.movie.status = prev;
    },
  }
}
</script>

<style scoped>
.movie-card {
  background: var(--bg-surface);
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  border: 1px solid var(--border);
  cursor: pointer;
}

.movie-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  border-color: var(--border-light);
}

.movie-card.status-watched {
  border-color: var(--success);
  box-shadow: 0 0 0 1px var(--success), 0 4px 20px rgba(34,197,94,0.1);
}

.movie-card.status-want_to_watch {
  border-color: var(--warning);
  box-shadow: 0 0 0 1px var(--warning), 0 4px 20px rgba(234,179,8,0.1);
}

.movie-card.status-not_interested {
  opacity: 0.55;
  border-color: var(--danger);
}

.poster-wrap {
  position: relative;
  aspect-ratio: 165 / 220;
  overflow: hidden;
  background: var(--bg-elevated);
}

.poster-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.movie-card:hover .poster-wrap img {
  transform: scale(1.05);
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px;
  z-index: 2;
  pointer-events: none;
}

.ext-link {
  pointer-events: all;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.ext-link svg { width: 14px; height: 14px; }

.ext-link:hover {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 0 16px var(--accent-glow);
}

.badge {
  background: var(--accent);
  color: #fff;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-body {
  padding: 0;
}

.status-bar {
  display: flex;
  margin: 8px 10px 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
}

.status-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 7px 4px;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.status-btn svg { width: 15px; height: 15px; }

.status-btn + .status-btn { border-left: 1px solid var(--border); }

.status-btn:hover { background: var(--bg-hover); color: var(--text-secondary); }

.status-btn.activeWatched { background: rgba(34,197,94,0.12); color: var(--success); }
.status-btn.activeWant { background: rgba(234,179,8,0.12); color: var(--warning); }
.status-btn.activeNope { background: rgba(239,68,68,0.12); color: var(--danger); }

.movie-info {
  padding: 10px 10px 12px;
}

.movie-info h3 {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 500;
}

.year-tag {
  background: var(--accent-dim);
  color: var(--accent);
}

.lang-tag {
  background: var(--bg-hover);
  color: var(--text-secondary);
}
</style>
