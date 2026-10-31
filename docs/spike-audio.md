# Audio Sourcing Spike Report

## Comparison: iTunes Search API vs. Deezer Public API

| Feature | iTunes Search API | Deezer Public API |
| :--- | :--- | :--- |
| **Fields Available** | Title, Artist, Year, Genre, Duration | Title, Artist, Duration |
| **Preview Availability** | ~100% (Functional) | ~100% (Functional) |
| **Filter by Year/Genre** | Direct in results | Requires extra calls to Album |
| **CORS Support** | ✅ Full (`*`) | ❌ Restricted (needs proxy) |
| **Rate Limits** | Very Generous | Moderate |
| **URL Expiration** | Stable | Often signed/expiring |
| **Matching Accuracy** | Medium (56.67%) | High (73.33%) |

## Matching Results (Spotify Simulation)
- **Deezer** performed significantly better in matching tracks by title and artist, especially for Latin music and varied nomenclature.
- **iTunes** is more restrictive in its search terms but provides better metadata (Year, Genre) directly in the first call.

## Open Problems
1. **Deezer CORS**: Cannot be called directly from the browser. Requires the `api/` proxy.
2. **Metadata Gap**: Deezer requires an additional jump to the album endpoint to get the release year and genre.
3. **Preview URLs**: Both APIs provide 30s clips, which is sufficient for the game's "Easy" and "Medium" modes.

## Architectural Recommendation
- **Primary Provider**: **Deezer**. Better match rates and broader catalog for the targeted genres.
- **Fallback Provider**: **iTunes**. Useful when Deezer fails or when metadata (year/genre) is needed quickly for filtering.
- **Proxy Requirement**: **Mandatory**. Due to Deezer's CORS policy, the `api/` directory must be implemented as a serverless proxy to fetch audio and metadata.
- **Audio Source**: Implement a caching layer in `src/audio/` to store resolved preview URLs for the duration of a game session.
