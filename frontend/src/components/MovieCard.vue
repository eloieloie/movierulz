<template>
  <div class="movie-card" :class="statusClass">
    <div class="poster-wrap">
      <img
        :src="movie.poster_url || 'https://via.placeholder.com/165x220?text=No+Poster'"
        :alt="movie.title"
        loading="lazy"
        @error="onImgError"
      />
      <div class="poster-gradient"></div>
      <div class="poster-top">
        <span class="badge" v-if="movie.quality">{{ movie.quality }}</span>
      </div>
      <a
        class="ext-link"
        :href="movie.movie_url"
        target="_blank"
        rel="noopener"
        title="Open on 5Movierulz"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
    <div class="card-body">
      <div class="card-main">
        <h3 :title="movie.title">{{ displayTitle }}</h3>
        <div class="tags">
          <span class="tag year-tag" v-if="movie.year">{{ movie.year }}</span>
          <span class="tag lang-tag" v-if="movie.language">{{ movie.language }}</span>
        </div>
      </div>
      <div class="status-bar">
        <button
          class="status-btn"
          :class="{ active: movie.status === 'watched' }"
          @click.stop="setStatus('watched')"
          title="Watched"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button
          class="status-btn"
          :class="{ active: movie.status === 'want_to_watch' }"
          @click.stop="setStatus('want_to_watch')"
          title="Want to Watch"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <button
          class="status-btn"
          :class="{ active: movie.status === 'not_interested' }"
          @click.stop="setStatus('not_interested')"
          title="Not Interested"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
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
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
  border: 1px solid var(--border);
  cursor: default;
}

.movie-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  border-color: rgba(232,93,4,0.3);
}

.movie-card.status-watched {
  border-color: var(--success);
  box-shadow: 0 0 0 1px var(--success), 0 8px 30px rgba(34,197,94,0.08);
}

.movie-card.status-want_to_watch {
  border-color: var(--warning);
  box-shadow: 0 0 0 1px var(--warning), 0 8px 30px rgba(234,179,8,0.08);
}

.movie-card.status-not_interested {
  opacity: 0.5;
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
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.movie-card:hover .poster-wrap img {
  transform: scale(1.08);
}

.poster-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(7,8,10,0.9) 0%, rgba(7,8,10,0) 100%);
  pointer-events: none;
  z-index: 1;
}

.poster-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-start;
  padding: 8px;
  z-index: 2;
  pointer-events: none;
}

.badge {
  background: linear-gradient(135deg, var(--accent) 0%, #f48c06 100%);
  color: #fff;
  padding: 3px 10px;
  font-size: 9px;
  font-weight: 700;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  box-shadow: 0 2px 10px rgba(232,93,4,0.4);
}

.ext-link {
  position: absolute;
  bottom: 14px;
  right: 10px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  border-radius: 50%;
  transition: all 0.25s ease;
  opacity: 0;
  transform: translateY(4px);
}

.movie-card:hover .ext-link {
  opacity: 1;
  transform: translateY(0);
}

.ext-link svg { width: 14px; height: 14px; }

.ext-link:hover {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 0 20px var(--accent-glow);
  transform: scale(1.1);
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.card-main {
  padding: 12px 12px 0;
}

.card-main h3 {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.35;
  letter-spacing: 0.01em;
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
  padding: 2px 8px;
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

.status-bar {
  display: flex;
  gap: 2px;
  padding: 8px 12px 10px;
  margin-top: 8px;
  border-top: 1px solid var(--border);
}

.status-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 6px 4px;
  cursor: pointer;
  background: var(--bg-elevated);
  color: var(--text-muted);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.status-btn svg { width: 14px; height: 14px; }

.status-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.status-btn.active {
  background: var(--accent-dim);
}

.status-btn.active svg {
  filter: drop-shadow(0 0 4px currentColor);
}

.status-btn.active[title="Watched"] {
  background: rgba(34,197,94,0.12);
  color: var(--success);
}

.status-btn.active[title="Want to Watch"] {
  background: rgba(234,179,8,0.12);
  color: var(--warning);
}

.status-btn.active[title="Not Interested"] {
  background: rgba(239,68,68,0.12);
  color: var(--danger);
}
</style>
