import fs from 'fs';
import path from 'path';

const PLAYLIST_SAMPLES = [
  { title: "La Primera Vez", artist: "Carlos Vives", duration: 210000 },
  { title: "La Taberna", artist: "Silvestre Dangond", duration: 240000 },
  { title: "La Bicicleta", artist: "Shakira", duration: 180000 },
  { title: "En Barranquilla Me Quedo", artist: "Joe Arroyo", duration: 300000 },
  { title: "Tití Me Preguntó", artist: "Bad Bunny", duration: 220000 },
  { title: "La Tierra del Olvido", artist: "Carlos Vives", duration: 280000 },
  { title: "Niña Bonita", artist: "Silvestre Dangond", duration: 200000 },
  { title: "Ciega Sordomuda", artist: "Shakira", duration: 230000 },
  { title: "Rebelión", artist: "Joe Arroyo", duration: 400000 },
  { title: "Dakiti", artist: "Bad Bunny", duration: 190000 },
  { title: "El Santo Cachón", artist: "Los Embajadores", duration: 260000 },
  { title: "La Gota Fría", artist: "Carlos Vives", duration: 210000 },
  { title: "Vallenato Romántico Mix", artist: "Various", duration: 300000 },
  { title: "Sola", artist: "Anuel AA", duration: 180000 },
  { title: "Despacito", artist: "Luis Fonsi", duration: 220000 },
  { title: "Mi Gente", artist: "J Balvin", duration: 210000 },
  { title: "La Bachata", artist: "Manuel Turizo", duration: 170000 },
  { title: "Tusa", artist: "Karol G", duration:200000 },
  { title: "Yo Perreo Sola", artist: "Bad Bunny", duration: 180000 },
  { title: "La Jumpa", artist: "Arcángel", duration: 160000 },
  { title: "El Santo", artist: "Various", duration: 240000 },
  { title: "Salsa Brava", artist: "Various", duration: 250000 },
  { title: "Vallenato Viejo", artist: "Various", duration: 280000 },
  { title: "La Quiero a Morir", artist: "Ricky Martin", duration: 220000 },
  { title: "Livin' la Vida Loca", artist: "Ricky Martin", duration: 210000 },
  { title: "Waka Waka", artist: "Shakira", duration: 200000 },
  { title: "Whenever, Wherever", artist: "Shakira", duration: 210000 },
  { title: "Under Pressure", artist: "Queen", duration: 240000 },
  { title: "Bohemian Rhapsody", artist: "Queen", duration: 350000 },
  { title: "Thriller", artist: "Michael Jackson", duration: 300000 },
];

function normalizeText(text: string | undefined | null) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // Remove accents
    .replace(/\(([^)]+)\)/g, '') // Remove (Remastered) etc
    .replace(/feat\..*$/i, '')
    .replace(/version.*$/i, '')
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

async function searchiTunes(title: string, artist: string) {
  const term = `${title} ${artist}`;
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function searchDeezer(title: string, artist: string) {
  const term = `${title} ${artist}`;
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(term)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data || [];
}

function scoreMatch(target: any, sample: any, type: 'itunes' | 'deezer') {
  const tTitle = normalizeText(type === 'itunes' ? sample.trackName : sample.title);
  const tArtist = normalizeText(type === 'itunes' ? sample.artistName : sample.artist?.name);
  const sTitle = normalizeText(target.title);
  const sArtist = normalizeText(target.artist);

  let score = 0;
  if (tTitle.includes(sTitle) || sTitle.includes(tTitle)) score += 50;
  if (tArtist.includes(sArtist) || sArtist.includes(tArtist)) score += 30;

  // Duration check if available
  const sampleDuration = type === 'itunes' ? sample.trackLength * 1000 : sample.duration * 1000;
  if (target.duration && sampleDuration) {
    const diff = Math.abs(target.duration - sampleDuration);
    if (diff < 5000) score += 20;
    else if (diff < 15000) score += 10;
  }

  return score;
}

async function runMatching() {
  console.log('--- Starting Matching SPIKE ---');
  let itunesHits = 0;
  let deezerHits = 0;
  const total = PLAYLIST_SAMPLES.length;

  for (const sample of PLAYLIST_SAMPLES) {
    const itunesResults = await searchiTunes(sample.title, sample.artist);
    const deezerResults = await searchDeezer(sample.title, sample.artist);

    const bestiTunes = itunesResults.reduce((prev: any, curr: any) => {
        const sPrev = scoreMatch(sample, prev, 'itunes');
        const sCurr = scoreMatch(sample, curr, 'itunes');
        return sCurr > sPrev ? curr : prev;
    }, itunesResults[0]);

    const bestDeezer = deezerResults.reduce((prev: any, curr: any) => {
        const sPrev = scoreMatch(sample, prev, 'deezer');
        const sCurr = scoreMatch(sample, curr, 'deezer');
        return sCurr > sPrev ? curr : prev;
    }, deezerResults[0]);

    if (bestiTunes && scoreMatch(sample, bestiTunes, 'itunes') >= 60) itunesHits++;
    if (bestDeezer && scoreMatch(sample, bestDeezer, 'deezer') >= 60) deezerHits++;
  }

  console.log(`iTunes Match Rate: ${((itunesHits/total)*100).toFixed(2)}%`);
  console.log(`Deezer Match Rate: ${((deezerHits/total)*100).toFixed(2)}%`);
}

runMatching();
