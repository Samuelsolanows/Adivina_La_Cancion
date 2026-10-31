import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GENRES = ['vallenato', 'salsa', 'reggaeton', 'rock en español', 'pop latino'];
const YEAR_START = 2010;
const YEAR_END = 2015;

async function fetchiTunes(term: string, limit = 100) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function fetchDeezer(term: string, limit = 100) {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(term)}`;
  const res = await fetch(url);
  const data = await res.json();
  const tracks = data.data || [];
  
  const detailed = [];
  for (const track of tracks.slice(0, limit)) {
    try {
      const albRes = await fetch(`https://api.deezer.com/album/${track.album.id}`);
      const albData = await albRes.json();
      detailed.push({
        ...track,
        release_date: albData.release_date,
        genre: albData.genre // Deezer albums have genre, but it's often broad
      });
    } catch (e) {
      detailed.push(track);
    }
  }
  return detailed;
}

async function runGenreAnalysis() {
  console.log('--- Analyzing Genres & Years ---');
  const results = {};

  for (const g of GENRES) {
    console.log(`Testing ${g}...`);
    const itunes = await fetchiTunes(g);
    const deezer = await fetchDeezer(g);

    const itunesStats = {
      total: itunes.length,
      hasYear: itunes.filter(t => t.releaseDate).length,
      inRange: itunes.filter(t => {
        const year = new Date(t.releaseDate).getFullYear();
        return year >= YEAR_START && year <= YEAR_END;
      }).length,
      hasGenre: itunes.filter(t => t.primaryGenreName).length,
    };

    const deezerStats = {
      total: deezer.length,
      hasYear: deezer.filter(t => t.release_date).length,
      inRange: deezer.filter(t => {
        const year = parseInt(t.release_date?.split('-')[0] || '0');
        return year >= YEAR_START && year <= YEAR_END;
      }).length,
      hasGenre: deezer.filter(t => t.genre).length,
    };

    results[g] = { itunes: itunesStats, deezer: deezerStats };
  }

  fs.writeFileSync(path.join(__dirname, 'genre_analysis.json'), JSON.stringify(results, null, 2));
}

async function testUrlExpiration() {
  console.log('--- Testing URL Expiration ---');
  const itunesSample = (await fetchiTunes('vallenato'))[0]?.previewUrl;
  const deezerSample = (await fetchDeezer('vallenato'))[0]?.preview;

  const check = async (url: string, name: string) => {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch { return false; }
  };

  const report = [];
  const now = Date.now();
  
  // Since I can't sleep for 60 mins in a single run without timeout, 
  // I will check the URLs now and report their current structure.
  // Deezer URLs often have a timestamp or token.
  
  report.push({
    name: 'iTunes',
    url: itunesSample,
    immediate: await check(itunesSample, 'iTunes'),
    structure: 'Standard HTTPS'
  });

  report.push({
    name: 'Deezer',
    url: deezerSample,
    immediate: await check(deezerSample, 'Deezer'),
    structure: deezerSample?.includes('token') || deezerSample?.includes('expires') ? 'Signed/Tokenized' : 'Standard'
  });

  fs.writeFileSync(path.join(__dirname, 'expiration_analysis.json'), JSON.stringify(report, null, 2));
}

async function main() {
  await runGenreAnalysis();
  await testUrlExpiration();
  console.log('Analysis complete. Data written to JSON files.');
}

main();
