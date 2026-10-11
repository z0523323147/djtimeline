import type { Model, Section } from './parser.ts';
export const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
export const isHip = (genre: string) => normalize(genre) === 'hip hop';
export const color = (genre: string) => isHip(genre) ? 'var(--hip)' : 'var(--cyan)';

/** Continuous overview colors; detailed genre sections keep their own hit targets. */
export function overviewRuns(model: Model) {
  const runs: { start: number; end: number; genre: string }[] = [];
  for (const section of model.sections) {
    if (section.end <= section.start) continue;
    const last = runs.at(-1);
    if (last && last.end === section.start && isHip(last.genre) === isHip(section.genre)) last.end = section.end;
    else runs.push({ start: section.start, end: section.end, genre: section.genre });
  }
  return runs;
}

export function peakRuns(model: Model) {
  const runs: { start: number; end: number }[] = [];
  for (const track of model.tracks) {
    if (!track.isBanger || track.end <= track.start) continue;
    const last = runs.at(-1);
    if (last && last.end === track.start) last.end = track.end;
    else runs.push({ start: track.start, end: track.end });
  }
  return runs;
}
export function clock(minutes: number) {
  const whole = Math.floor(minutes);
  return `${Math.floor(whole / 60) % 12 || 12}:${String(whole % 60).padStart(2, '0')}`;
}
export function boundary(section: Section) {
  if (section.tracks[0]?.time === 'Unscheduled') return 'Time not noted';
  if (section.exact) return clock(section.start);
  if (section.boundStart === section.boundEnd) return `After ${clock(section.boundStart)} · exact time not noted`;
  return `${clock(section.boundStart)}–${clock(section.boundEnd)} · exact time not noted`;
}
export function sectionRange(section: Section, model: Model) {
  const next = model.sections[section.id + 1];
  return next ? `From ${boundary(section)} · until ${boundary(next)}` : `From ${boundary(section)} · end time unspecified`;
}
export function timeBands(model: Model) {
  const start = model.blocks[0]?.start ?? 0, end = model.blocks.at(-1)?.start ?? start;
  if (end <= start) return [];
  return Array.from({ length: 3 }, (_, i) => ({
    start: Math.round(start + (end - start) * i / 3),
    end: Math.round(start + (end - start) * (i + 1) / 3),
  })).filter(b => b.end > b.start);
}
