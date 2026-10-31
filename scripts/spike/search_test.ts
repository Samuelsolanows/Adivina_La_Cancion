import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_CASES = [
  { genre: 'vallenato', text: 'vallenato romántico' },
  { genre: 'salsa', text: 'salsa brava' },
  { genre: 'rock', text: 'rock en español' },
  { artist: 'Silvestre Dangond', text: 'Silvestre Dangond' },
  { artist: 'Carlos Vives', text: 'Carlos Vives' },
  { artist: 'Shakira', text: 'Shakira' },
  { artist: 'Joe Arroyo', text: 'Joe Arroyo' },
  { artist: 'Bad Bunny', text: 'Bad Bunny' },
];

async function checkCORS(url: string, name: string) {
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: { 'Origin': 'http://localhost:3000' }
    });
    console.log(`[CORS ${name}] Status: ${response.status}, Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
  } catch (e) {
    console.log(`[CORS ${name}] Error: ${e}`);
  }
}

async function testiTunes(term: string) {
  console.log(`Testing iTunes: ${term}...`);
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10`;
  const res = await fetch(url);
  const data = await res.json();

  const results = data.results || [];
  console.log(`iTunes results: ${results.length}`);

  let previews = 0;
  for (const track of results) {
    if (track.previewUrl) {
      try {
        const head = await fetch(track.previewUrl, { method: 'HEAD' });
        if (head.ok) previews++;
      } catch {}
    }
  }
  console.log(`iTunes Functional Previews: ${previews}/${results.length}`);
  return results;
}

async function testDeezer(term: string) {
  console.log(`Testing Deezer: ${term}...`);
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(term)}`;
  const res = await fetch(url);
  const data = await res.json();

  const results = data.data || [];
  console.log(`Deezer results: ${results.length}`);

  let previews = 0;
  for (const track of results) {
    if (track.preview) {
      try {
        const head = await fetch(track.preview, { method: 'HEAD' });
        if (head.ok) previews++;
      } catch {}
    }
  }
  console.log(`Deezer Functional Previews: ${previews}/${results.length}`);
  return results;
}

async function run() {
  console.log('--- Starting Audio SPIKE ---');

  await checkCORS('https://itunes.apple.com/search?term=test', 'iTunes');
  await checkCORS('https://api.deezer.com/search?q=test', 'Deezer');

  const allResults: any[] = [];

  for (const case_ of TEST_CASES) {
    const term = case_.text;
    const itunes = await testiTunes(term);
    const deezer = await testDeezer(term);

    // Save some samples for listen.html
    allResults.push(...itunes.slice(0, 2).map(t => ({ ...t, source: 'itunes' })));
    allResults.push(...deezer.slice(0, 2).map(t => ({ ...t, source: 'deezer' })));
  }

  // Map to a common format for listen.html
  const samples = allResults.map(t => {
    if (t.source === 'itunes') {
      return {
        title: t.trackName,
        artist: t.artistName,
        album: t.collectionName,
        year: t.releaseDate ? new Date(t.releaseDate).getFullYear() : 'N/A',
        genre: t.primaryGenreName,
        url: t.previewUrl,
        cover: t.artworkUrl100,
        source: 'iTunes'
      };
    } else {
      return {
        title: t.title,
        artist: t.artist.name,
        album: t.album.title,
        year: 'N/A', // Deezer search doesn't give year
        genre: 'N/A', // Deezer search doesn't give genre
        url: t.preview,
        cover: t.album.cover_small,
        source: 'Deezer'
      };
    }
  });

  fs.writeFileSync(path.join(__dirname, 'listen_data.json'), JSON.stringify(samples, null, 2));
  fs.writeFileSync(path.join(__dirname, 'listen_data.js'), `window.LISTEN_DATA = ${JSON.stringify(samples, null, 2)};`);
  console.log('--- SPIKE Finished. listen_data.json and listen_data.js created ---');
}

run();
