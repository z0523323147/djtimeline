import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseNotes } from '../src/lib/parser.ts';
import { boundary, overviewRuns, peakRuns, timeBands } from '../src/lib/timeline.ts';
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
