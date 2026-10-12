import type { Model, Section } from './parser.ts';
export const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
export const isHip = (genre: string) => normalize(genre).replace(/[-\s]/g,'') === 'hiphop';
export const color = (genre: string) => isHip(genre) ? 'var(--hip)' : 'var(--cyan)';

/** Source boundaries, never estimated track positions, supply switch wording. */
export function hipChanges(model: Model) {
  return model.sections.flatMap((section, index) => {
    const before = index > 0 && isHip(model.sections[index - 1].genre);
    const after = isHip(section.genre);
    if (before === after) return [];
    return [{ section, entering: after, label: `${after ? 'In' : 'Out'} ${changeTime(section)}` }];
  });
}

export function position(time: number, start: number, end: number, width: number) {
  return end > start ? Math.max(0, Math.min(width, (time - start) / (end - start) * width)) : 0;
}

/** Interval partitioning uses the fewest lanes and returns labels in source order. */
export function annotationLanes(items: { anchor: number; width: number }[], width: number) {
  const ends: number[] = [];
  const labels = items.map((item, index) => {
    const size = Math.min(item.width, width);
    const left = Math.max(0, Math.min(width - size, item.anchor - size / 2));
    return { index, left, width: size, lane: 0 };
  });
  for (const label of [...labels].sort((a, b) => a.left - b.left)) {
    let lane = ends.findIndex(end => end + 8 <= label.left);
    if (lane < 0) lane = ends.length;
    ends[lane] = label.left + label.width;
    label.lane = lane;
  }
  return labels;
}

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
  if ((section.time ?? section.tracks[0]?.time) === 'Unscheduled') return 'Time not noted';
  if (section.exact) return clock(section.start);
  if (section.boundStart === section.boundEnd) return `After ${clock(section.boundStart)} · exact time not noted`;
  return `${clock(section.boundStart)}–${clock(section.boundEnd)} · exact time not noted`;
}
/** Short in-bar time label; ranges retain uncertainty rather than inventing minutes. */
export function changeTime(section: Section) {
  if ((section.time ?? section.tracks[0]?.time) === 'Unscheduled') return 'Time not noted';
  if (section.exact) return clock(section.start);
  if (section.boundStart === section.boundEnd) return `After ${clock(section.boundStart)}`;
  return `~${clock(section.boundStart)}–${clock(section.boundEnd)}`;
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

/** Zoomed rows use true diagram positions while reserving room for full labels. */
export function genreBands(model: Model, width: number) {
  const bands: { start: number; end: number; first: Section; last: Section }[] = [];
  let group: Section[] = [];
  const fits = (sections: Section[]) => {
    const start = sections[0].start, end = sections.at(-1)!.end;
    return sections.every(s => (s.end - s.start) / (end - start) * width >= Math.max(s.genre.length, changeTime(s).length) * 8 + 18);
  };
  const flush = () => {
    if (group.length) bands.push({ start: group[0].start, end: group.at(-1)!.end, first: group[0], last: group.at(-1)! });
  };
  for (const section of model.sections.filter(s => s.end > s.start)) {
    if (group.length && !fits([...group, section])) { flush(); group = []; }
    group.push(section);
  }
  flush();
  return bands;
}
