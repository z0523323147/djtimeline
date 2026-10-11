export interface Track {
  id: number; blockId: number; sectionId: number; time: string; genre: string;
  title: string; originalTitle: string; isBanger: boolean; isToDownload: boolean;
  isMyIdea: boolean; genreDeclared: boolean; start: number; end: number;
  exact: boolean; boundStart: number; boundEnd: number;
}
export interface Block { id: number; time: string; start: number; end: number; tracks: Track[] }
export interface Section {
  id: number; genre: string; start: number; end: number; exact: boolean;
  boundStart: number; boundEnd: number; tracks: Track[];
}
export interface Model { tracks: Track[]; blocks: Block[]; sections: Section[] }

/** Source markers are evidence; inferred positions are only diagram coordinates. */
export function parseNotes(raw: string): Model {
  const tracks: Track[] = [], blocks: Block[] = [];
  let genre = 'Unspecified', peak = false, pendingGenre = false;
  let block: Block | undefined;
  for (const original of raw.split(/\r?\n/)) {
    const line = original.trim();
    if (!line) continue;
    if (/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(line)) {
      const [hour, minute] = line.split(':').map(Number);
      let start = hour * 60 + minute;
      while (block && start < block.start) start += 720;
      block = { id: blocks.length, time: line, start, end: start, tracks: [] };
      blocks.push(block);
      continue;
    }
    const declaration = line.match(/^\(([^()]+)\)\s*(הפגזות)?$/);
    if (declaration) {
      genre = declaration[1].trim(); peak = !!declaration[2]; pendingGenre = true;
      continue;
    }
    if (line === 'הפגזות') { peak = true; continue; }
    const title = line.replace(/הפגזות/g, '').replace(/-{2,}/g, '').replace(/\/{3}/g, '').replace(/\s+/g, ' ').trim();
    if (!title) continue;
    if (!block) {
      block = { id: 0, time: 'Unscheduled', start: 0, end: 0, tracks: [] };
      blocks.push(block);
    }
    const track: Track = {
      id: tracks.length + 1, blockId: block.id, sectionId: 0, time: block.time, genre,
      title, originalTitle: title, isBanger: peak || line.includes('הפגזות'),
      isToDownload: /-{2,}/.test(line), isMyIdea: line.includes('///'), genreDeclared: pendingGenre,
      start: 0, end: 0, exact: false, boundStart: 0, boundEnd: 0,
    };
    pendingGenre = false; tracks.push(track); block.tracks.push(track);
  }
  blocks.forEach((b, i) => {
    b.end = blocks[i + 1]?.start ?? b.start;
    b.tracks.forEach((t, j) => {
      t.start = b.start + (b.end - b.start) * j / b.tracks.length;
      t.end = b.start + (b.end - b.start) * (j + 1) / b.tracks.length;
      t.exact = j === 0 && b.time !== 'Unscheduled';
      t.boundStart = b.start; t.boundEnd = b.end;
    });
  });
  const sections: Section[] = [];
  for (const track of tracks) {
    let section = sections.at(-1);
    if (!section || section.genre !== track.genre) {
      section = { id: sections.length, genre: track.genre, start: track.start, end: track.end,
        exact: track.exact, boundStart: track.boundStart, boundEnd: track.boundEnd, tracks: [] };
      sections.push(section);
    }
    section.tracks.push(track); section.end = track.end; track.sectionId = section.id;
  }
  return { tracks, blocks, sections };
}
