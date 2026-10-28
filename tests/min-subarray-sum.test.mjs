import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { minSubarraySum } from '../src/steppers/minSubarraySum.ts'
import { minSubarraySumInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/min-subarray-sum.json', import.meta.url), 'utf8'))
const oracle = ({ nums, target }) => {
  let best = Infinity
  for (let left = 0; left < nums.length; left++) {
    let sum = 0n
    for (let right = left; right < nums.length; right++) {
      sum += BigInt(nums[right])
      if (sum >= BigInt(target)) best = Math.min(best, right - left + 1)
    }
  }
  return Number.isFinite(best) ? best : 0
}
function check(input) {
  const steps = minSubarraySum(input)
  storySchema.parse({ ...fixture, input, steps })
  assert.equal(steps.at(-1).result, oracle(input))
  assert.equal(steps.at(-1).t, 34)
  assert.deepEqual(steps[0].bounds, { left: 0, right: -1 })
  for (const step of steps) {
    const { left, right } = step.bounds
    assert.deepEqual(step.highlight, Array.from({ length: Math.max(0, right - left + 1) }, (_, i) => left + i))
    const sum = input.nums.slice(left, right + 1).reduce((total, n) => total + BigInt(n), 0n)
    assert.equal(BigInt(step.stats.find((item) => item.label === '窗口和').value), sum)
  }
  const final = steps.at(-1), { left, right } = final.bounds
  assert.equal(Math.max(0, right - left + 1), final.result)
  if (final.result) assert.ok(input.nums.slice(left, right + 1).reduce((sum, n) => sum + BigInt(n), 0n) >= BigInt(input.target))
  return steps
}

test('LC209 fixture, snapshots and boundary cases', () => {
  storySchema.parse(fixture)
  assert.deepEqual(check(fixture.input), fixture.steps)
  assert.equal(fixture.steps.at(-1).result, 2)
  assert.deepEqual(fixture.input.nums.slice(fixture.steps.at(-1).bounds.left, fixture.steps.at(-1).bounds.right + 1), [4, 3])
  for (const input of [
    { target: 5, nums: [5] }, { target: 10, nums: [1, 2, 3] },
    { target: 4, nums: [1, 4, 4] }, { target: 6, nums: [2, 2, 2] },
    { target: Number.MAX_SAFE_INTEGER, nums: [Number.MAX_SAFE_INTEGER - 1, 2, 1] },
    { target: Number.MAX_SAFE_INTEGER, nums: [Number.MAX_SAFE_INTEGER - 2, Number.MAX_SAFE_INTEGER - 1] },
  ]) check(input)
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
})

test('LC209 agrees with an independent brute-force oracle', () => {
  let arrays = [[]]
  for (let length = 1; length <= 5; length++) {
    arrays = arrays.flatMap((prefix) => [1, 2, 3].map((n) => [...prefix, n]))
    for (const nums of arrays) for (let target = 1; target <= 16; target++) check({ nums, target })
  }
})

test('LC209 rejects invalid input and malformed window snapshots', () => {
  for (const input of [
    { target: 0, nums: [1] }, { target: -1, nums: [1] }, { target: 1.5, nums: [1] },
    { target: 1, nums: [] }, { target: 1, nums: Array(13).fill(1) },
    { target: 1, nums: [0] }, { target: 1, nums: [-1] }, { target: 1, nums: [1.5] },
    { target: Number.MAX_SAFE_INTEGER + 1, nums: [1] }, { target: 1, nums: [Number.MAX_SAFE_INTEGER + 1] },
    { target: 1, nums: [1], extra: true },
  ]) {
    assert.equal(minSubarraySumInputSchema.safeParse(input).success, false)
    assert.throws(() => minSubarraySum(input))
  }
  for (const changes of [{ bounds: undefined }, { bounds: { left: 3, right: 1 } }, { result: -1 }, { result: 1.5 }]) {
    const story = structuredClone(fixture)
    Object.assign(story.steps[0], changes)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC209 is available in the catalog, form and array scene', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/min-subarray-sum-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ recordStory, stories }, { findTrack }, { MinSubarraySumParameters }, { StoryScene }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/lib/catalog.ts'),
      server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'),
    ])
    const original = JSON.stringify(stories)
    const recording = recordStory('min-subarray-sum', { target: 11, nums: [1, 2, 3, 4, 5] })
    assert.equal(recording.steps.at(-1).result, 3)
    assert.throws(() => recordStory('min-subarray-sum', { target: 1, nums: [0] }))
    assert.equal(JSON.stringify(stories), original)
    assert.equal(findTrack('min-subarray-sum').track.title, '209 长度最小的子数组')
    const form = renderToStaticMarkup(React.createElement(MinSubarraySumParameters, { input: fixture.input, onRecord: () => {} }))
    assert.match(form, /name="nums"/)
    assert.match(form, /name="target"/)
    const scene = renderToStaticMarkup(React.createElement(StoryScene, { story: recording, frame: recording.steps.at(-1) }))
    assert.match(scene, /<svg/)
  } finally { await server.close() }
})
