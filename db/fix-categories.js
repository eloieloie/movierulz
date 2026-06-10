const supabase = require('./supabase');

(async () => {
  const { data, error } = await supabase.from('movies').select('id, year, category');
  if (error) { console.error(error); return; }

  let fixed = 0;
  for (const movie of data) {
    if (movie.year && movie.category !== `Telugu ${movie.year}`) {
      const { error: e } = await supabase.from('movies').update({ category: `Telugu ${movie.year}` }).eq('id', movie.id);
      if (!e) fixed++;
    }
  }
  console.log(`Fixed ${fixed} movies`);
})();
