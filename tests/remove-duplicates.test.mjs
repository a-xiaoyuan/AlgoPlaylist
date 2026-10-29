import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { removeDuplicatesSorted } from '../src/steppers/removeDuplicates.ts'
import { removeDuplicatesSortedInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/remove-duplicates.json', import.meta.url), 'utf8'))
const oracle = (nums) => nums.filter((value, index) => index === 0 || value !== nums[index - 1])
function check(nums) {
  const original = [...nums]
  const unique = oracle(nums)
  const steps = removeDuplicatesSorted({ nums })
  assert.deepEqual(nums, original)
  storySchema.parse({ ...fixture, input: { nums }, steps })
  const last = steps.at(-1)
  assert.equal(last.result, unique.length)
  assert.deepEqual(last.values.slice(0, last.result), unique)
  for (const [index, frame] of steps.entries()) {
    assert.deepEqual(frame.values.slice(0, frame.result), unique.slice(0, frame.result))
    assert.equal(frame.values.length, nums.length)
    assert.ok(frame.pointers.every(({ index }) => index < nums.length))
    if (index) {
      assert.notEqual(frame.values, steps[index - 1].values)
      assert.ok(frame.t > steps[index - 1].t)
      assert.ok(frame.result >= steps[index - 1].result)
    }
  }
  return steps
}

test('LC26 fixture reproduces in-place prefix and returns k', () => {
  assert.deepEqual(check(fixture.input.nums), fixture.steps)
  assert.equal(fixture.steps.at(-1).t, 32)
  assert.equal(fixture.steps.at(-1).result, 2)
  assert.deepEqual(fixture.steps.at(-1).values.slice(0, 2), [1, 2])
  assert.ok(fixture.steps.some((step) => step.sfx === 'compare'))
  assert.ok(fixture.steps.some((step) => step.sfx === 'match'))
  for (const nums of [[1], [1, 1, 1], [-2, -1, 0, 1], [-1_000_000, -1_000_000, 1_000_000], Array(12).fill(2)]) check(nums)
})

test('LC26 agrees with an independent oracle on sorted arrays', () => {
  for (let length = 1; length <= 8; length++) {
    for (let code = 0; code < 3 ** length; code++) {
      let value = code
      const nums = Array.from({ length }, () => { const digit = value % 3 - 1; value = Math.floor(value / 3); return digit }).sort((a, b) => a - b)
      check(nums)
    }
  }
})

test('LC26 validates sorted inputs and complete snapshots', () => {
  for (const input of [{ nums: [] }, { nums: [2, 1] }, { nums: [1.5] }, { nums: [Infinity] }, { nums: [1_000_001] }, { nums: Array(13).fill(0) }, { nums: [1], target: 1 }]) {
    assert.equal(removeDuplicatesSortedInputSchema.safeParse(input).success, false)
    assert.throws(() => removeDuplicatesSorted(input))
  }
  for (const mutate of [
    (story) => { story.scene = 'Array1D' },
    (story) => { delete story.steps[0].values },
    (story) => { story.steps[0].result = 0 },
    (story) => { story.steps.at(-1).result = 1 },
    (story) => { story.steps.at(-1).values[1] = 1 },
  ]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC26 seeks snapshots, rerecords and exposes an array-only parameter form', async () => {
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
  const server = await createServer({ cacheDir: 'node_modules/.tmp/remove-duplicates-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { findTrack }, { ArrayParameters }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/lib/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'),
    ])
    const before = JSON.stringify(stories)
    assert.deepEqual(recordStory('remove-duplicates', { nums: [0, 0, 1, 1, 2] }).steps.at(-1).values.slice(0, 3), [0, 1, 2])
    assert.throws(() => recordStory('remove-duplicates', { nums: [2, 1] }))
    assert.equal(JSON.stringify(stories), before)
    assert.equal(findTrack('remove-duplicates').track.duration, '00:32')
    const page = renderToStaticMarkup(React.createElement(ArrayParameters, { problem: fixture.problem, input: fixture.input, onRecord: () => {} }))
    assert.match(page, /升序数组 nums/)
    assert.doesNotMatch(page, /name="target"/)
  } finally { await server.close() }
})
