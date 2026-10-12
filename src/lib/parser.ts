export interface Track {
  id: number; blockId: number; sectionId: number; time: string; genre: string;
  title: string; originalTitle: string; isBanger: boolean; isToDownload: boolean;
  isMyIdea: boolean; genreDeclared: boolean; start: number; end: number;
  exact: boolean; boundStart: number; boundEnd: number;
}
export interface Block { id: number; time: string; start: number; end: number; tracks: Track[] }
export interface Section {
  id: number; genre: string; start: number; end: number; exact: boolean;
  boundStart: number; boundEnd: number; tracks: Track[]; time?: string;
}
export interface Model { tracks: Track[]; blocks: Block[]; sections: Section[] }

export type NotesRecord =
  | { kind: 'time'; value: string }
  | { kind: 'genre'; value: string; peak: boolean }
  | { kind: 'peak' }
  | { kind: 'song'; title: string; originalTitle: string; isBanger: boolean; isToDownload: boolean; isMyIdea: boolean; peakOverride?: boolean };

export function noteRecords(raw: string): NotesRecord[] {
  const records: NotesRecord[] = [];
  for (const original of raw.split(/\r?\n/)) {
    const line = original.trim();
    if (!line) continue;
    if (/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(line)) { records.push({kind:'time',value:line}); continue; }
    const declaration = line.match(/^\(([^()]+)\)\s*(הפגזות)?$/);
    if (declaration) { records.push({kind:'genre',value:declaration[1].trim(),peak:!!declaration[2]}); continue; }
    if (line === 'הפגזות') { records.push({kind:'peak'}); continue; }
    const title = line.replace(/הפגזות/g, '').replace(/-{2,}/g, '').replace(/\/{3}/g, '').replace(/\s+/g, ' ').trim();
    if (title) records.push({kind:'song',title,originalTitle:title,isBanger:line.includes('הפגזות'),isToDownload:/-{2,}/.test(line),isMyIdea:line.includes('///')});
  }
  return records;
}
export function parseNotes(raw: string): Model { return deriveRecords(noteRecords(raw)); }

/** Source markers are evidence; inferred positions are only diagram coordinates. */
export function deriveRecords(records: readonly NotesRecord[], keepEmpty = false): Model {
  const tracks: Track[] = [], blocks: Block[] = [];
  const empty: { genre: string; before: number; block?: Block }[] = [];
  let genre = 'Unspecified', peak = false, pendingGenre = false;
  let block: Block | undefined;
  let declaration: { genre: string; before: number; block?: Block } | undefined;
  for (const record of records) {
    if (record.kind === 'time') {
      const [hour, minute] = record.value.split(':').map(Number);
      let start = hour * 60 + minute;
      while (block && start < block.start) start += 720;
      block = { id: blocks.length, time: record.value, start, end: start, tracks: [] };
      blocks.push(block); continue;
    }
    if (record.kind === 'genre') {
      if (declaration && declaration.before === tracks.length) empty.push(declaration);
      genre = record.value; peak = record.peak; pendingGenre = true;
      declaration = {genre,before:tracks.length,block}; continue;
    }
    if (record.kind === 'peak') { peak = true; continue; }
    if (!block) { block = {id:0,time:'Unscheduled',start:0,end:0,tracks:[]}; blocks.push(block); }
    const track: Track = {
      id:tracks.length+1,blockId:block.id,sectionId:0,time:block.time,genre,
      title:record.title,originalTitle:record.originalTitle,
      isBanger:record.peakOverride ?? (peak || record.isBanger),isToDownload:record.isToDownload,isMyIdea:record.isMyIdea,
      genreDeclared:pendingGenre,start:0,end:0,exact:false,boundStart:0,boundEnd:0,
    };
    pendingGenre=false; tracks.push(track); block.tracks.push(track);
  }
  if (declaration && declaration.before === tracks.length) empty.push(declaration);
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
  if (keepEmpty) {
    for (const marker of [...empty].reverse()) {
      const start = marker.block?.start ?? 0;
      const entry: Section = {id:0,genre:marker.genre,start,end:start,exact:!!marker.block && marker.block.time !== 'Unscheduled' && !marker.block.tracks.length,boundStart:start,boundEnd:marker.block?.end ?? start,tracks:[],time:marker.block?.time ?? 'Unscheduled'};
      const index = sections.findIndex(section => (section.tracks[0]?.id ?? Infinity) > marker.before);
      sections.splice(index < 0 ? sections.length : index,0,entry);
    }
    sections.forEach((section,id) => { section.id=id; section.tracks.forEach(track => track.sectionId=id); });
  }
  return { tracks, blocks, sections };
}
