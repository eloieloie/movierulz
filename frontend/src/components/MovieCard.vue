<template>
  <div class="movie-card" :class="statusClass">
    <div class="poster-wrap">
      <img
        :src="movie.poster_url || 'https://via.placeholder.com/165x220?text=No+Poster'"
        :alt="movie.title"
        loading="lazy"
        @error="onImgError"
      />
      <a class="ext-link" :href="movie.movie_url" target="_blank" rel="noopener" title="Open on 5Movierulz">&#8599;</a>
      <div class="badge" v-if="movie.quality">{{ movie.quality }}</div>
    </div>
    <div class="status-bar">
      <button
        class="status-btn watched"
        :class="{ active: movie.status === 'watched' }"
        @click.stop="setStatus('watched')"
        title="Watched"
      >&#10003;</button>
      <button
        class="status-btn want"
        :class="{ active: movie.status === 'want_to_watch' }"
        @click.stop="setStatus('want_to_watch')"
        title="Want to Watch"
      >&#9733;</button>
      <button
        class="status-btn nope"
        :class="{ active: movie.status === 'not_interested' }"
        @click.stop="setStatus('not_interested')"
        title="Not Interested"
      >&#10007;</button>
    </div>
    <div class="movie-info">
      <h3>{{ displayTitle }}</h3>
      <span class="lang-tag" v-if="movie.language">{{ movie.language }}</span>
      <span class="year-tag" v-if="movie.year">{{ movie.year }}</span>
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
  background: #1a1c22;
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.movie-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.movie-card.status-watched { outline: 2px solid #27ae60; }
.movie-card.status-want_to_watch { outline: 2px solid #f39c12; }
.movie-card.status-not_interested { opacity: 0.5; }
.poster-wrap {
  position: relative;
  aspect-ratio: 165 / 220;
  overflow: hidden;
  background: #111;
}
.poster-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ext-link {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.6);
  color: #ccc;
  text-decoration: none;
  font-size: 16px;
  border-radius: 4px;
  transition: background 0.15s;
}
.ext-link:hover { background: #d24d04; color: #fff; }
.badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #d24d04;
  color: #fff;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 3px;
  text-transform: uppercase;
}
.status-bar {
  display: flex;
  margin: 8px 8px 0;
  border-radius: 6px;
  overflow: hidden;
  background: #15171d;
}
.status-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: none;
  padding: 8px 4px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: transparent;
  color: #555;
  transition: all 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-btn + .status-btn { border-left: 1px solid #22252e; }
.status-btn:hover { background: #1e212a; color: #999; }
.status-btn.watched.active { background: #1b6b38; color: #6fcf7f; }
.status-btn.want.active { background: #8a630d; color: #f7dc6f; }
.status-btn.nope.active { background: #922b21; color: #f1948a; }
.movie-info {
  padding: 10px;
}
.movie-info h3 {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lang-tag, .year-tag {
  display: inline-block;
  font-size: 11px;
  padding: 1px 6px;
  margin-right: 4px;
  border-radius: 3px;
  background: #2a2d35;
  color: #989eae;
}
</style>
