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
