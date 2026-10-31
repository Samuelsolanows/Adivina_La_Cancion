import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  { title: "Tusa", artist: "Karol G", duration: 200000 },
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

function normalize(text: any) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(([^)]+)\)/g, '').replace(/feat\..*$/i, '').replace(/version.*$/i, '').replace(/[^\w\s]/g, ' ').trim().replace(/\s+/g, ' ');
}

async function searchiTunes(title: string, artist: string) {
  const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(title + ' ' + artist)}&entity=song&limit=5`);
  const data = await res.json();
  return data.results || [];
}

async function searchDeezer(title: string, artist: string) {
  const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(title + ' ' + artist)}`);
  const data = await res.json();
  return data.data || [];
}

function score(target: any, sample: any, type: 'itunes' | 'deezer') {
  const tTitle = normalize(type === 'itunes' ? sample.trackName : sample.title);
  const tArtist = normalize(type === 'itunes' ? sample.artistName : sample.artist?.name);
  const sTitle = normalize(target.title);
  const sArtist = normalize(target.artist);

  let score = 0;
  if (tTitle === sTitle) score += 60; else if (tTitle.includes(sTitle) || sTitle.includes(tTitle)) score += 30;
  if (tArtist === sArtist) score += 30; else if (tArtist.includes(sArtist) || sArtist.includes(tArtist)) score += 15;

  const sampleDur = type === 'itunes' ? sample.trackLength * 1000 : sample.duration * 1000;
  if (target.duration && sampleDur) {
    const diff = Math.abs(target.duration - sampleDur);
    if (diff < 5000) score += 20; else if (diff < 15000) score += 10;
  }
  return score;
}

async function runMatching(improved = false) {
  const results = [];
  let hits = 0;
  let falsePositives = 0;

  for (const sample of PLAYLIST_SAMPLES) {
    let bestTrack = null;
    let bestScore = 0;
    let source = '';

    // Improved Strategy: Deezer then iTunes
    const deezerTracks = await searchDeezer(sample.title, sample.artist);
    const itunesTracks = await searchiTunes(sample.title, sample.artist);
    
    const all = [
      ...deezerTracks.map(t => ({...t, _src: 'deezer'})),
      ...itunesTracks.map(t => ({...t, _src: 'itunes'}))
    ];

    for (const t of all) {
      const s = score(sample, t, t._src);
      if (s > bestScore) {
        bestScore = s;
        bestTrack = t;
        source = t._src;
      }
    }

    const isHit = bestScore >= 80;
    const isFalsePositive = bestScore >= 60 && bestScore < 80;
    if (isHit) hits++;
    if (isFalsePositive) falsePositives++;

    results.push({
      sample: `${sample.title} - ${sample.artist}`,
      result: isHit ? 'HIT' : (isFalsePositive ? 'FP' : 'MISS'),
      score: bestScore,
      found: bestTrack ? `${source}: ${bestTrack.title || bestTrack.trackName}` : 'None'
    });
  }

  return { results, rate: (hits / PLAYLIST_SAMPLES.length) * 100, fp: falsePositives };
}

async function main() {
  const basic = await runMatching(false);
  const improved = await runMatching(true);

  fs.writeFileSync(path.join(__dirname, 'matching_deep.json'), JSON.stringify({ basic, improved }, null, 2));
}

main();
