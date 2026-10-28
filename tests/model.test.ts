import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseNotes } from '../src/lib/parser.ts';
import { boundary, genreBands, overviewRuns, peakRuns, timeBands } from '../src/lib/timeline.ts';
import { emptyFilters, googleSearch, matches } from '../src/lib/search.ts';
import { correctionsKey, loadCorrections, saveCorrections } from '../src/lib/storage.ts';

test('bundled set retains the accepted baseline', () => {
  const m = parseNotes(readFileSync('src/data/example-notes.txt', 'utf8'));
  assert.deepEqual([m.tracks.length, m.blocks.length, m.sections.length], [126, 25, 26]);
  assert.deepEqual(['isToDownload', 'isBanger', 'isMyIdea'].map(key => m.tracks.filter(t => t[key as keyof typeof t]).length), [42, 25, 2]);
  assert.equal(m.sections.at(-1)?.tracks[0].title, 'Me pregunto');
  assert.equal(boundary(m.sections.at(-1)!), '4:00');
});

test('overview colors and peaks stay continuous while detailed genres remain selectable', () => {
  const m = parseNotes('1:00\n(House) הפגזות\nA\n1:10\n(Edm) הפגזות\nB\n1:20\n(Hip hop)\nC\n1:30\n(House)\nD\n1:40\nEnd');
  assert.equal(m.sections.length, 4);
  assert.deepEqual(overviewRuns(m).map(r => [r.start, r.end]), [[60, 80], [80, 90], [90, 100]]);
  assert.deepEqual(peakRuns(m), [{ start: 60, end: 80 }]);
  assert.deepEqual(m.sections[1].tracks.map(t => t.title), ['B']);
});

test('genre zoom keeps true coordinates and makes room for labels', () => {
  const m = parseNotes(readFileSync('src/data/example-notes.txt', 'utf8'));
  const rows = genreBands(m, 194);
  const sections = m.sections.filter(s => s.end > s.start);
  assert.equal(rows[0].start, sections[0].start);
  assert.equal(rows.at(-1)!.end, sections.at(-1)!.end);
  for (const row of rows) {
    const visible = sections.filter(s => s.start >= row.start && s.end <= row.end);
    for (const s of visible) assert.ok((s.end - s.start) / (row.end - row.start) * 194 >= Math.min(194, s.genre.length * 8 + 18));
  }
  assert.equal(m.sections.at(-1)!.end, m.sections.at(-1)!.start);
});
test('inheritance, embedded parentheses, markers and peak reset', () => {
  const m = parseNotes('12:30\n(House)\nA (remix) --\nהפגזות\nB ///\n1:01\nC\n(Hip hop)\nD הפגזות\nE\n---\n///');
  assert.deepEqual(m.tracks.map(t => t.title), ['A (remix)', 'B', 'C', 'D', 'E']);
  assert.deepEqual(m.tracks.map(t => t.isBanger), [false, true, true, true, false]);
  assert.equal(m.tracks[0].isToDownload, true);
  assert.equal(m.tracks[1].isMyIdea, true);
  assert.equal(m.blocks[1].start, 781);
  assert.equal(boundary(m.sections[1]), 'After 1:01 · exact time not noted');
});
test('uncertain transitions retain source interval, sparse notes remain honest', () => {
  const m = parseNotes('2:07\n(Edm)\nA\n(Hip hop)\nB\n2:15\n(House)\nC');
  assert.equal(boundary(m.sections[1]), '2:07–2:15 · exact time not noted');
  assert.equal(boundary(parseNotes('(Hip hop)\n3:17\nA').sections[0]), '3:17');
  assert.equal(boundary(parseNotes('A').sections[0]), 'Time not noted');
  assert.deepEqual(timeBands(parseNotes('4:00\nA')), []);
  assert.equal(parseNotes('4:00\n(House)\nA\n4:00\n(Hip hop)\nB').sections.length, 2);
  assert.equal(parseNotes(' \n---\n///').tracks.length, 0);
});
test('filters combine and corrected names drive encoded Google search', () => {
  const track = parseNotes('(House) הפגזות\nCafé & שלום --- ///').tracks[0];
  assert.ok(matches(track, { ...emptyFilters(), query: 'CAFE', genre: 'House', isBanger: true, isToDownload: true, isMyIdea: true }));
  assert.ok(!matches(track, { ...emptyFilters(), genre: 'Hip hop' }));
  assert.equal(new URL(googleSearch(track.title)).searchParams.get('q'), track.title + ' download');
});
test('corrections preserve legacy keys and reject malformed stored shapes', () => {
  const values = new Map<string, string>();
  const storage: Storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); },
    get length() { return values.size; }, clear: () => values.clear(), key: index => [...values.keys()][index] ?? null, removeItem: key => { values.delete(key); } };
  const raw = '1:00\nA', m = parseNotes(raw);
  m.tracks[0].title = 'שם חדש'; saveCorrections(storage, raw, m);
  const reloaded = parseNotes(raw); loadCorrections(storage, raw, reloaded);
  assert.equal(reloaded.tracks[0].title, 'שם חדש');
  const other = parseNotes('1:00\nB'); loadCorrections(storage, '1:00\nB', other);
  assert.equal(other.tracks[0].title, 'B');
  values.set(correctionsKey(raw), 'null');
  assert.throws(() => loadCorrections(storage, raw, m), /Invalid corrections/);
});

// Protect source evidence separately from approximate diagram placement.
test('filter counts include overlapping flags, repeated genres and empty plans', async () => {
  const { trackCounts, matches, emptyFilters } = await import('../src/lib/search.ts');
  const tracks = parseNotes('1:00\n(House)\nA --- הפגזות\nB ///\n(Hip hop)\nC --\n(House)\nD').tracks;
  const counts = trackCounts(tracks);
  assert.equal(counts.total, 4);
  assert.equal(counts.peaks, 1);
  assert.equal(counts.downloads, 2);
  assert.equal(counts.ideas, 1);
  assert.deepEqual([...counts.genres], [['House', 3], ['Hip hop', 1]]);
  assert.equal(tracks.filter(t => matches(t, {...emptyFilters(), isToDownload:true}))[1].id, 3);
  assert.equal(trackCounts([]).total, 0);
});

test('hip-hop changes retain all recorded pairs and uncertain entries', async () => {
  const { hipChanges, position, annotationLanes } = await import('../src/lib/timeline.ts');
  const m = parseNotes(readFileSync('src/data/example-notes.txt', 'utf8'));
  const changes = hipChanges(m);
  assert.deepEqual(changes.map(c => c.label), ['In 01:50','Out 01:57','In ~02:07–02:15','Out 02:15','In 02:24','Out 02:30','In ~02:40–02:50','Out 03:00','In 03:17','Out 03:31','In 04:00']);
  assert.equal(changes.filter(c => c.entering).length, 6);
  assert.equal(changes.at(-1)!.section.start, changes.at(-1)!.section.end);
  assert.equal(position(855, 750, 960, 1000), 500);
  assert.equal(position(960, 750, 960, 1000), 1000);
  const packed = annotationLanes([{anchor:0,width:80},{anchor:20,width:90},{anchor:160,width:50},{anchor:195,width:70}],200);
  for (const a of packed) {
    assert.ok(a.left >= 0 && a.left + a.width <= 200);
    for (const b of packed.filter(b => b !== a && b.lane === a.lane)) assert.ok(a.left + a.width <= b.left || b.left + b.width <= a.left);
  }
});
