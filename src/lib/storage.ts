import type { Model } from './parser';
export const importedKey = 'party-map-imported-notes';
export function correctionsKey(raw: string) {
  let hash = 2166136261;
  for (const char of raw) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `party-map-v2-${hash >>> 0}`;
}
export function loadCorrections(storage: Storage, raw: string, model: Model) {
  const saved: unknown = JSON.parse(storage.getItem(correctionsKey(raw)) || '{}');
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid corrections');
  for (const track of model.tracks) {
    const title = (saved as Record<string, unknown>)[track.id];
    if (typeof title === 'string' && title.trim() && title.length <= 500) track.title = title.trim();
  }
}
export function saveCorrections(storage: Storage, raw: string, model: Model) {
  storage.setItem(correctionsKey(raw), JSON.stringify(Object.fromEntries(
    model.tracks.filter(t => t.title !== t.originalTitle).map(t => [t.id, t.title]),
  )));
}
