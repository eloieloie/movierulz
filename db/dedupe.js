const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ezcnelnuphfyipcsifnv.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y25lbG51cGhmeWlwY3NpZm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTkwMDAsImV4cCI6MjA5NjIzNTAwMH0.Q1fs1G99kJtoWcc9mUR4YdyHDo2LbEl0A1uGmyOGDEA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function dedupe() {
  const { data: all } = await supabase.from('movies').select('id, title, status').limit(10000);

  const groups = {};
  for (const m of all) {
    const key = m.title.toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }

  const dups = Object.values(groups).filter(g => g.length > 1);
  console.log(`Found ${dups.length} duplicate title groups\n`);

  let deleted = 0;
  let kept = 0;

  for (const group of dups) {
    const withStatus = group.filter(m => m.status);
    const withoutStatus = group.filter(m => !m.status);

    if (withStatus.length > 0) {
      // Keep the first one with status, delete the rest (both status and non-status duplicates)
      const [keep, ...toDelete] = group.filter(m => m !== withStatus[0]);
      for (const m of toDelete) {
        const { error } = await supabase.from('movies').delete().eq('id', m.id);
        if (!error) { deleted++; console.log(`  DEL id=${m.id} (status="${m.status || 'null'}") "${m.title}"`); }
      }
      kept++;
    } else {
      // None have status — keep first, delete rest
      const [, ...toDelete] = group;
      for (const m of toDelete) {
        const { error } = await supabase.from('movies').delete().eq('id', m.id);
        if (!error) { deleted++; console.log(`  DEL id=${m.id} (no status) "${m.title}"`); }
      }
      kept++;
    }
  }

  console.log(`\nDone. Kept ${kept} records, deleted ${deleted} duplicates.`);
}

dedupe().catch(err => { console.error(err); process.exit(1); });
