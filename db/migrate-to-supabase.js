const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');

const DB_PATH = path.join(__dirname, 'movies.db');

async function migrate() {
  console.log('Migrating SQLite data to Supabase...\n');

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  const stmt = db.prepare('SELECT * FROM movies ORDER BY id');
  let count = 0;

  while (stmt.step()) {
    const row = stmt.getAsObject();
    const { data, error } = await supabase
      .from('movies')
      .upsert({
        title: row.title,
        year: row.year,
        quality: row.quality,
        language: row.language,
        category: row.category,
        poster_url: row.poster_url,
        movie_url: row.movie_url,
        genres: row.genres,
        synopsis: row.synopsis,
        status: row.status,
        created_at: row.created_at,
      }, { onConflict: 'movie_url' })
      .select();

    if (error) {
      console.error(`  Error importing "${row.title}": ${error.message}`);
    } else {
      count++;
    }

    if (count % 500 === 0) console.log(`  Imported: ${count}`);
  }

  stmt.free();
  db.close();

  console.log(`\nDone! Migrated ${count} movies to Supabase.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
