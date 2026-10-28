import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
import { containerWithMostWater } from '../src/steppers/containerWithMostWater.ts'
import { containerInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/container-with-most-water.json', import.meta.url), 'utf8'))
const last = (steps) => steps.at(-1)
const oracle = (nums) => {
  let best = 0
  for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) {
    best = Math.max(best, (j - i) * Math.min(nums[i], nums[j]))
  }
  return best
}

function check(nums) {
  const original = [...nums]
  const steps = containerWithMostWater({ nums })
  assert.deepEqual(nums, original, 'caller input stays unchanged')
  storySchema.parse({ ...fixture, input: { nums }, steps })
  assert.equal(last(steps).result, oracle(nums))
  const [l, r] = last(steps).highlight
  assert.ok(l < r)
  assert.equal((r - l) * Math.min(nums[l], nums[r]), last(steps).result)
  const comparisons = steps.slice(1, -1)
  let previousBest = 0
  for (let i = 0; i < comparisons.length; i++) {
    const step = comparisons[i], { left, right } = step.bounds
    const stats = Object.fromEntries(step.stats.map(({ label, value }) => [label, value]))
    const area = (right - left) * Math.min(nums[left], nums[right])
    assert.equal(stats['当前面积'], area)
    assert.equal(stats['最大面积'], Math.max(previousBest, area))
    previousBest = stats['最大面积']
    if (comparisons[i + 1]) {
      assert.deepEqual(comparisons[i + 1].bounds, nums[left] <= nums[right]
        ? { left: left + 1, right } : { left, right: right - 1 })
    }
  }
  return steps
}

test('LC11 fixture reproduces exactly, lasts 36s and returns the classic area 49', () => {
  storySchema.parse(fixture)
  assert.equal(fixture.scene, 'array-2ptrs')
  assert.deepEqual(check(fixture.input.nums), fixture.steps)
  assert.equal(last(fixture.steps).t, 36)
  assert.equal(last(fixture.steps).result, 49)
  assert.deepEqual(last(fixture.steps).highlight, [1, 8])
  for (const nums of [[0, 0], [1, 1], [5, 5, 5, 5], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1], [5, 0, 0, 5], [9, 1, 2, 9], Array(12).fill(1_000_000)]) check(nums)
})

test('LC11 agrees with an independent pair oracle for all short arrays over 0,1,2', () => {
  for (let length = 2; length <= 5; length++) for (let code = 0; code < 3 ** length; code++) {
    let value = code
    const nums = Array.from({ length }, () => { const digit = value % 3; value = Math.floor(value / 3); return digit })
    check(nums)
  }
})

test('LC11 rejects invalid heights and preserves exact frames during backward seek and replay', () => {
  for (const nums of [[], [1], [-1, 2], [1.5, 2], [1, NaN], [1, Infinity], ['1', 2], [1, 1_000_001], Array(13).fill(1)]) {
    assert.equal(containerInputSchema.safeParse({ nums }).success, false)
    assert.throws(() => containerWithMostWater({ nums }))
  }
  assert.equal(storySchema.safeParse({ ...fixture, scene: 'Array1D' }).success, false)
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
  engine.play()
  engine.advance(100)
  assert.equal(engine.getSnapshot().playing, false)
  assert.equal(engine.getSnapshot().frame.result, 49)
  engine.play()
  assert.equal(engine.getSnapshot().time, 0)
  assert.deepEqual(engine.getSnapshot().frame, fixture.steps[0])
})

test('LC11 rerecording validates input and leaves the catalog and B0 recordings unchanged', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/container-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { recordStory, stories } = await server.ssrLoadModule('/src/story/catalog.ts')
    const original = JSON.stringify(stories)
    const recording = recordStory(fixture.id, { nums: [3, 1, 3] })
    assert.equal(last(recording.steps).result, 6)
    assert.equal(recording.scene, 'array-2ptrs')
    const engine = new PlayerEngine(recording)
    assert.equal(engine.getSnapshot().time, 0)
    assert.equal(engine.getSnapshot().playing, false)
    for (const nums of [[1], [1, -1], [1, 0.5]]) assert.throws(() => recordStory(fixture.id, { nums }))
    assert.equal(last(recordStory('two-sum-hash', { nums: [3, 3], target: 6 }).steps).highlight.length, 2)
    assert.equal(last(recordStory('two-sum-brute', { nums: [3, 3], target: 6 }).steps).highlight.length, 2)
    assert.throws(() => recordStory('best-time-stock', { nums: [1, 2] }))
    assert.equal(JSON.stringify(stories), original)
  } finally { await server.close() }
})
