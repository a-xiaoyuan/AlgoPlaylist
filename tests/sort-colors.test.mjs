import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { sortColors } from '../src/steppers/sortColors.ts'
import { sortColorsInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/sort-colors.json', import.meta.url), 'utf8'))
const oracle = (nums) => [0, 1, 2].flatMap((color) => nums.filter((value) => value === color))
function check(nums) {
  const original = [...nums]
  const expected = oracle(nums)
  const steps = sortColors({ nums })
  assert.deepEqual(nums, original)
  storySchema.parse({ ...fixture, input: { nums }, steps })
  assert.deepEqual(steps.at(-1).values, expected)
  assert.deepEqual(steps.at(-1).result, expected)
  for (const [i, frame] of steps.entries()) {
    assert.deepEqual(oracle(frame.values), expected)
    const { lo, mid, hi } = Object.fromEntries(frame.stats.map(({ label, value }) => [label, value]))
    assert.ok(0 <= lo && lo <= mid && mid <= hi + 1 && hi < nums.length)
    assert.ok(frame.values.slice(0, lo).every((v) => v === 0))
    assert.ok(frame.values.slice(lo, mid).every((v) => v === 1))
    assert.ok(frame.values.slice(hi + 1).every((v) => v === 2))
    assert.deepEqual(frame.bounds, { left: mid, right: hi })
    assert.ok(frame.pointers.every(({ index }) => index >= 0 && index < nums.length))
    if (i) {
      assert.ok(frame.t > steps[i - 1].t)
      assert.notEqual(frame.values, steps[i - 1].values)
    }
  }
  return steps
}

test('LC75 default story and Dutch flag boundaries', () => {
  assert.deepEqual(check(fixture.input.nums), fixture.steps)
  assert.equal(fixture.steps.at(-1).t, 34)
  assert.deepEqual(fixture.steps.at(-1).result, [0, 0, 1, 1, 2, 2])
  assert.ok(fixture.steps.some((step) => step.sfx === 'compare'))
  assert.ok(fixture.steps.some((step) => step.sfx === 'match'))
  for (const nums of [[0], [1], [2], Array(12).fill(2), [2, 2, 0, 0, 1, 1]]) check(nums)
})

test('LC75 agrees with a counting oracle for all short arrays', () => {
  for (let length = 1; length <= 7; length++) {
    for (let code = 0; code < 3 ** length; code++) {
      let value = code
      check(Array.from({ length }, () => { const digit = value % 3; value = Math.floor(value / 3); return digit }))
    }
  }
})

test('LC75 rejects invalid inputs and invalid snapshots', () => {
  for (const input of [{ nums: [] }, { nums: Array(13).fill(0) }, { nums: [-1] }, { nums: [3] }, { nums: [1.5] }, { nums: ['1'] }, { nums: [0], extra: 1 }]) {
    assert.equal(sortColorsInputSchema.safeParse(input).success, false)
    assert.throws(() => sortColors(input))
  }
  for (const mutate of [
    (s) => { s.remix = 'hash' },
    (s) => { s.scene = 'Array1D' },
    (s) => { delete s.steps[0].values },
    (s) => { s.steps[0].values[0] = 1 },
    (s) => { s.steps.at(-1).values.reverse() },
    (s) => { s.steps.at(-1).result = [0] },
  ]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC75 seeks, rerecords and exposes its array parameter form', async () => {
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
  const server = await createServer({ cacheDir: 'node_modules/.tmp/sort-colors-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { findTrack }, { ArrayParameters }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/lib/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'),
    ])
    const before = JSON.stringify(stories)
    assert.deepEqual(recordStory('sort-colors', { nums: [2, 0, 1] }).steps.at(-1).result, [0, 1, 2])
    assert.throws(() => recordStory('sort-colors', { nums: [3] }))
    assert.equal(JSON.stringify(stories), before)
    assert.equal(findTrack('sort-colors').track.duration, '00:34')
    const page = renderToStaticMarkup(React.createElement(ArrayParameters, { problem: fixture.problem, input: fixture.input, onRecord: () => {} }))
    assert.match(page, /颜色数组 nums/)
    assert.match(page, /只能为 0、1 或 2/)
    assert.doesNotMatch(page, /name="target"/)
  } finally { await server.close() }
})
