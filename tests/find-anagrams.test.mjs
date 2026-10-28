import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { findAnagrams } from '../src/steppers/findAnagrams.ts'
import { findAnagramsInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/find-anagrams.json', import.meta.url), 'utf8'))
const last = (steps) => steps.at(-1)
const oracle = (s, p) => {
  const chars = Array.from(s), pattern = Array.from(p)
  if (!pattern.length) return []
  const signature = (values) => [...values].sort().join('\0')
  const result = []
  for (let i = 0; i + pattern.length <= chars.length; i++) {
    if (signature(chars.slice(i, i + pattern.length)) === signature(pattern)) result.push(i)
  }
  return result
}
function check(s, p) {
  const steps = findAnagrams({ s, p }), chars = Array.from(s), size = Array.from(p).length
  storySchema.parse({ ...fixture, input: { s, p }, steps })
  const expected = oracle(s, p)
  assert.deepEqual(last(steps).result, expected)
  assert.equal(last(steps).t, 34)
  assert.deepEqual(steps[0].bounds, { left: 0, right: -1 })
  for (const step of steps) {
    const { left, right } = step.bounds
    assert.ok(right - left + 1 <= size)
    assert.deepEqual(step.highlight, Array.from({ length: Math.max(0, right - left + 1) }, (_, i) => left + i))
    assert.deepEqual(step.result, expected.filter((index) => index + size - 1 <= right))
    assert.equal(step.stats.find((stat) => stat.label === '结果下标').value, `[${step.result.join(', ')}]`)
    for (const pointer of step.pointers) assert.ok(pointer.index < chars.length)
  }
  return steps
}

test('LC438 default reproduces snapshots, overlapping hits, edge cases and Unicode', () => {
  storySchema.parse(fixture)
  assert.deepEqual(check(fixture.input.s, fixture.input.p), fixture.steps)
  assert.deepEqual(last(fixture.steps).result, [0, 1, 2])
  for (const [s, p] of [['', ''], ['', 'a'], ['abc', ''], ['a', 'aa'], ['aaaa', 'aa'], ['cbaebabacd', 'abc'], ['😀a😀b', '😀a'], ['a a', ' a'], ['e\u0301e', '\u0301e']]) check(s, p)
  assert.ok(fixture.steps.some((step) => step.sfx === 'compare'))
  assert.equal(fixture.steps.filter((step) => step.sfx === 'match').length, 3)
})

test('LC438 agrees with a brute-force oracle for short strings', () => {
  const words = (max) => {
    let level = [''], all = [...level]
    for (let i = 0; i < max; i++) { level = level.flatMap((prefix) => ['a', 'b', 'c'].map((char) => prefix + char)); all.push(...level) }
    return all
  }
  for (const s of words(4)) for (const p of words(3)) check(s, p)
})

test('LC438 validates inputs and preserves independent snapshots during seeking', () => {
  for (const value of ['a'.repeat(13), '😀'.repeat(13), '\n', '\ud800', 123]) {
    for (const input of [{ s: value, p: 'a' }, { s: 'a', p: value }]) {
      assert.equal(findAnagramsInputSchema.safeParse(input).success, false)
      assert.throws(() => findAnagrams(input))
    }
  }
  assert.ok(findAnagramsInputSchema.safeParse({ s: '😀'.repeat(12), p: '' }).success)
  assert.equal(findAnagramsInputSchema.safeParse({ s: 'a', p: 'a', extra: 1 }).success, false)
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) { engine.seek(frame.t); assert.deepEqual(engine.getSnapshot().frame, frame) }
  engine.play(); engine.advance(100)
  assert.deepEqual(engine.getSnapshot().frame.result, [0, 1, 2])
  engine.play(); assert.equal(engine.getSnapshot().time, 0)
})

test('LC438 catalog, form and character scene support rerecording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/find-anagrams-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ recordStory, stories }, { findTrack }, { FindAnagramsParameters }, { StoryScene }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/lib/catalog.ts'),
      server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'),
    ])
    const original = JSON.stringify(stories)
    for (const [s, p] of [['aaaa', 'aa'], ['', 'a'], ['😀a😀b', '😀b']]) {
      const recording = recordStory('find-anagrams', { s, p })
      assert.deepEqual(last(recording.steps).result, oracle(s, p))
      assert.equal(recording.scene, 'array-2ptrs')
    }
    assert.throws(() => recordStory('find-anagrams', { s: '\n', p: 'a' }))
    assert.equal(JSON.stringify(stories), original)
    assert.equal(findTrack('find-anagrams').track.title, '438 找到字符串中所有字母异位词')
    const form = renderToStaticMarkup(React.createElement(FindAnagramsParameters, { input: fixture.input, onRecord() {} }))
    assert.match(form, /name="s"/); assert.match(form, /name="p"/)
    const html = renderToStaticMarkup(React.createElement(StoryScene, { story: stories['find-anagrams'], frame: last(fixture.steps) }))
    assert.match(html, /<svg/); assert.match(html, /\[0, 1, 2\]/)
  } finally { await server.close() }
})
