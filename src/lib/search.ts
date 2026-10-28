import type { Track } from './parser.ts';
import { normalize } from './timeline.ts';
export interface Filters { query: string; genre: string; isBanger: boolean; isToDownload: boolean; isMyIdea: boolean }
export const emptyFilters = (): Filters => ({ query: '', genre: '', isBanger: false, isToDownload: false, isMyIdea: false });
export const filterActive = (f: Filters) => !!(f.query.trim() || f.genre || f.isBanger || f.isToDownload || f.isMyIdea);
export function matches(t: Track, f: Filters) {
  return (!f.query.trim() || normalize(t.title).includes(normalize(f.query))) &&
    (!f.genre || t.genre === f.genre) && (!f.isBanger || t.isBanger) &&
    (!f.isToDownload || t.isToDownload) && (!f.isMyIdea || t.isMyIdea);
}
export const googleSearch = (title: string) => 'https://www.google.com/search?q=' + encodeURIComponent(title + ' download');

/** Counts describe the whole plan, so they stay useful when another filter is active. */
export function trackCounts(tracks: readonly Track[]) {
  const genres = new Map<string, number>();
  let peaks = 0, downloads = 0, ideas = 0;
  for (const track of tracks) {
    genres.set(track.genre, (genres.get(track.genre) ?? 0) + 1);
    if (track.isBanger) peaks++;
    if (track.isToDownload) downloads++;
    if (track.isMyIdea) ideas++;
  }
  return { total: tracks.length, peaks, downloads, ideas, genres };
}
