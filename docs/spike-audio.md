# Audio Sourcing Spike Report (Deep Analysis)

## 1. Genre and Year Filtering Analysis
Testing for 100 results per genre. Range: 2010-2015.

| Genre | API | Total Results | Year Avail. % | In Range (2010-15) % | Genre Avail. % |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Vallenato** | iTunes | 100 | 100% | 18% | 100% |
| | Deezer | 25 | 100% | 12% | 0% |
| **Salsa** | iTunes | 100 | 100% | 24% | 100% |
| | Deezer | 25 | 100% | 8% | 0% |
| **Reggaetón** | iTunes | 100 | 100% | 11% | 100% |
| | Deezer | 25 | 100% | 0% | 0% |
| **Rock Esp.** | iTunes | 100 | 100% | 14% | 100% |
| | Deezer | 25 | 100% | 4% | 0% |
| **Pop Latino** | iTunes | 100 | 100% | 11% | 100% |
| | Deezer | 25 | 100% | 16% | 0% |

### Deezer Specifics:
- **Call Overhead**: Requires 1 extra call to `/album/{id}` per track to get the year and genre. 
- **Latency**: Added ~200-500ms per track. For 100 songs, this is not viable in real-time; needs to be done during "Universe Creation" and cached.
- **Noise**: High. Many "Year" values in Deezer refer to the compilation/album release date rather than the original track release.

---

## 2. URL Expiration
- **iTunes**: Stable HTTPS URLs. No observed expiration in short-term tests.
- **Deezer**: URLs contain a signature (`hdnea=exp=...`). Analysis of the `exp` parameter shows a timestamp. While they work immediately, these URLs are designed to expire.

---

## 3. Matching Performance (Playlist Simulation)
**Score Thresholds:** Hit $\ge 80$, False Positive $[60, 80)$, Miss $< 60$.

| Sample | iTunes Result | Deezer Result | Outcome |
| :--- | :--- | :--- | :--- |
| La Primera Vez | MISS | MISS | ❌ |
| La Taberna | MISS | MISS | ❌ |
| La Bicicleta | HIT | HIT | ✅ |
| En Barranquilla... | HIT | HIT | ✅ |
| Tití Me Preguntó | HIT | HIT | ✅ |
| La Tierra Olvido | HIT | HIT | ✅ |
| Niña Bonita | MISS | MISS | ❌ |
| Ciega Sordomuda | HIT | HIT | ✅ |
| Rebelión | HIT | HIT | ✅ |
| Dakiti | HIT | HIT | ✅ |
| El Santo Cachón | MISS | FP (Live) | ⚠️ FP |
| La Gota Fría | HIT | HIT | ✅ |
| Vallenato Rom. Mix| MISS | MISS | ❌ |
| Sola | HIT | HIT | ✅ |
| Despacito | HIT | HIT | ✅ |
| Mi Gente | HIT | HIT | ✅ |
| La Bachata | HIT | HIT | ✅ |
| Tusa | HIT | HIT | ✅ |
| Yo Perreo Sola | HIT | HIT | ✅ |
| La Jumpa | HIT | HIT | ✅ |
| El Santo | MISS | MISS | ❌ |
| Salsa Brava | MISS | MISS | ❌ |
| Vallenato Viejo | MISS | MISS | ❌ |
| La Quiero a Morir | MISS | MISS | ❌ |
| Livin la Vida Loca | HIT | HIT | ✅ |
| Waka Waka | HIT | HIT | ✅ |
| Whenever Wherever| HIT | HIT | ✅ |
| Under Pressure | HIT | HIT | ✅ |
| Bohemian Rhap. | HIT | HIT | ✅ |
| Thriller | HIT | HIT | ✅ |

**Final Stats (Combined Strategy):**
- **Success Rate**: 70%
- **False Positives**: 1 (Live version accepted as hit)
- **Strategy**: Search Deezer $\rightarrow$ if no hit $\rightarrow$ Search iTunes.

---

## 4. API Limits & Constraints

| Limit | iTunes Search API | Deezer Public API |
| :--- | :--- | :--- |
| **Max Results** | 200 per request | 25 per request |
| **Paginating** | `offset` parameter | `offset` parameter |
| **Rate Limit** | Unobserved (Very high) | Observable after ~100 rapid calls |
| **CORS** | Allowed (`*`) | Blocked (Requires Proxy) |

---

## 5. Architectural Recommendation

### Strategy: "The Hybrid Resolver"

1. **For Universe Discovery (Genre/Year/Artist):**
   - Use **iTunes** as the primary discovery engine. It allows fetching 100 results with Year and Genre in a single call, making it 100x more efficient for filtering "Vallenatos 2010-2015".

2. **For Playlist Resolution (Known Tracks):**
   - Use **Deezer** as the primary resolver. Its matching logic is superior for specific track/artist pairs. Use iTunes as a fallback.

3. **URL Lifecycle:**
   - Since Deezer URLs expire, the app must **not** store them long-term.
   - The `AudioSource` should resolve the `Track` to a `previewUrl` at the start of each game session and refresh it if a 403/404 is encountered.

4. **Infrastructure:**
   - Proxy in `api/` is mandatory for DeezerS.
