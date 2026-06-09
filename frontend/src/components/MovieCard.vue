<template>
  <div class="movie-card">
    <div class="poster-wrap">
      <img
        :src="movie.poster_url || 'https://via.placeholder.com/165x220?text=No+Poster'"
        :alt="movie.title"
        loading="lazy"
        @error="onImgError"
      />
      <div class="badge" v-if="movie.quality">{{ movie.quality }}</div>
    </div>
    <div class="movie-info">
      <h3>{{ displayTitle }}</h3>
      <span class="lang-tag" v-if="movie.language">{{ movie.language }}</span>
      <span class="year-tag" v-if="movie.year">{{ movie.year }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MovieCard',
  props: {
    movie: { type: Object, required: true }
  },
  computed: {
    displayTitle() {
      return this.movie.title.replace(/ \(\d{4}\)/, '').replace(/ \[.*?\]/, '');
    }
  },
  methods: {
    onImgError(e) {
      e.target.src = 'https://via.placeholder.com/165x220?text=No+Poster';
    }
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
