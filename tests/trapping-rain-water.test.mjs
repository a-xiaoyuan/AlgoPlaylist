import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
import { trappingRainWater } from '../src/steppers/trappingRainWater.ts'
import { storySchema, trappingRainWaterInputSchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/trapping-rain-water.json', import.meta.url), 'utf8'))
const last = (steps) => steps.at(-1)
const oracle = (nums) => nums.reduce((sum, height, i) =>
  sum + Math.min(Math.max(...nums.slice(0, i + 1)), Math.max(...nums.slice(i))) - height, 0)

function check(nums) {
  const original = [...nums]
  const steps = trappingRainWater({ nums })
  assert.deepEqual(nums, original)
  storySchema.parse({ ...fixture, input: { nums }, steps })
  assert.equal(last(steps).result, oracle(nums))
  let left = 0, right = nums.length - 1, leftMax = 0, rightMax = 0, total = 0
  for (const step of steps.slice(1, -1)) {
    assert.deepEqual(step.bounds, { left, right })
    leftMax = Math.max(leftMax, nums[left])
    rightMax = Math.max(rightMax, nums[right])
    const useLeft = leftMax <= rightMax
    const index = useLeft ? left++ : right--
    const added = (useLeft ? leftMax : rightMax) - nums[index]
    total += added
    assert.deepEqual(Object.fromEntries(step.stats.map(({ label, value }) => [label, value])), {
      '左侧最高': leftMax, '右侧最高': rightMax, '本格雨水': added, '累计雨水': total,
    })
    assert.equal(step.sfx, added > 0 ? 'match' : 'compare')
  }
  assert.equal(left, right + 1)
  return steps
}

test('LC42 fixture reproduces exactly and returns 6 in 38 seconds', () => {
  storySchema.parse(fixture)
  assert.equal(fixture.scene, 'array-2ptrs')
  assert.deepEqual(check(fixture.input.nums), fixture.steps)
  assert.equal(last(fixture.steps).t, 38)
  assert.equal(last(fixture.steps).result, 6)
  for (const nums of [[0, 0], [5, 5], [5, 0, 5], [4, 2, 0, 3, 2, 5], [1, 2, 3, 4], [4, 3, 2, 1], Array(12).fill(1_000_000)]) check(nums)
})

test('LC42 agrees with an independent per-position oracle on short arrays', () => {
  for (let length = 2; length <= 6; length++) for (let code = 0; code < 3 ** length; code++) {
    let value = code
    const nums = Array.from({ length }, () => { const digit = value % 3; value = Math.floor(value / 3); return digit })
    check(nums)
  }
})

test('LC42 rejects invalid heights and supports backward seek and replay', () => {
  for (const nums of [[], [1], [-1, 2], [1.5, 2], [1, NaN], [1, Infinity], ['1', 2], [1, 1_000_001], Array(13).fill(1)]) {
    assert.equal(trappingRainWaterInputSchema.safeParse({ nums }).success, false)
    assert.throws(() => trappingRainWater({ nums }))
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
  assert.equal(engine.getSnapshot().frame.result, 6)
  engine.play()
  assert.equal(engine.getSnapshot().time, 0)
  assert.deepEqual(engine.getSnapshot().frame, fixture.steps[0])
})

test('LC42 rerecording validates input and leaves catalog recordings unchanged', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/rain-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { recordStory, stories } = await server.ssrLoadModule('/src/story/catalog.ts')
    const original = JSON.stringify(stories)
    const recording = recordStory(fixture.id, { nums: [4, 2, 0, 3, 2, 5] })
    assert.equal(last(recording.steps).result, 9)
    assert.equal(recording.scene, 'array-2ptrs')
    assert.equal(new PlayerEngine(recording).getSnapshot().time, 0)
    for (const nums of [[1], [1, -1], [1, 0.5]]) assert.throws(() => recordStory(fixture.id, { nums }))
    assert.equal(JSON.stringify(stories), original)
  } finally { await server.close() }
})
