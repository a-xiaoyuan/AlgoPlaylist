import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
import { threeSum } from '../src/steppers/threeSum.ts'
import { storySchema, threeSumInputSchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/three-sum.json', import.meta.url), 'utf8'))
const canonical = (triplets) => [...triplets].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
function oracle(nums) {
  const found = new Map()
  for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) for (let k = j + 1; k < nums.length; k++) {
    if (nums[i] + nums[j] + nums[k] === 0) {
      const tuple = [nums[i], nums[j], nums[k]].sort((a, b) => a - b)
      found.set(tuple.join(','), tuple)
    }
  }
  return canonical([...found.values()])
}
function check(nums) {
  const original = structuredClone(nums)
  const steps = threeSum({ nums })
  assert.deepEqual(nums, original)
  storySchema.parse({ ...fixture, input: { nums }, steps })
  assert.deepEqual(canonical(steps.at(-1).result), oracle(nums))
  const sorted = [...nums].sort((a, b) => a - b)
  for (let index = 0; index < steps.length; index++) {
    const frame = steps[index]
    assert.deepEqual(frame.values, sorted)
    if (frame.pointers.length === 3) {
      const [i, left, right] = frame.pointers.map((pointer) => pointer.index)
      assert.ok(i < left && left < right)
      const stats = Object.fromEntries(frame.stats.map(({ label, value }) => [label, value]))
      assert.equal(stats['当前和'], sorted[i] + sorted[left] + sorted[right])
    }
    if (index > 0) {
      assert.notEqual(frame.values, steps[index - 1].values)
      assert.notEqual(frame.result, steps[index - 1].result)
      assert.ok(frame.result.length >= steps[index - 1].result.length)
      for (let j = 0; j < steps[index - 1].result.length; j++) {
        assert.deepEqual(frame.result[j], steps[index - 1].result[j])
        assert.notEqual(frame.result[j], steps[index - 1].result[j])
      }
    }
  }
  return steps
}

test('LC15 fixture reproduces exactly with sorted snapshots, i/left/right and two unique results in 40s', () => {
  assert.deepEqual(check(fixture.input.nums), fixture.steps)
  assert.equal(fixture.scene, 'array-2ptrs')
  assert.equal(fixture.steps.at(-1).t, 40)
  assert.deepEqual(fixture.steps.at(-1).result, [[-1, -1, 2], [-1, 0, 1]])
  assert.ok(fixture.steps.some((step) => /固定值.*相同/.test(step.caption)))
  for (const nums of [[0, 0, 0], [0, 0, 0, 0], [1, 2, 3], [-3, -2, -1], [-2, 0, 0, 2, 2], [-2, -2, 0, 0, 2, 2], [-1_000_000, 0, 1_000_000], Array(12).fill(0)]) check(nums)
})

test('LC15 matches an independent triple oracle for 1080 short arrays and 64 longer deterministic cases', () => {
  for (let length = 3; length <= 6; length++) for (let code = 0; code < 3 ** length; code++) {
    let value = code
    check(Array.from({ length }, () => { const digit = value % 3 - 1; value = Math.floor(value / 3); return digit }))
  }
  for (let seed = 0; seed < 64; seed++) {
    check(Array.from({ length: 3 + seed % 10 }, (_, index) => (seed * (index + 7) + index * index) % 17 - 8))
  }
})

test('LC15 input/result validation rejects malformed, unsorted, repeated or unavailable elements', () => {
  for (const nums of [[], [0], [0, 0], [1.5, 0, -1], ['0', 0, 0], [NaN, 0, 0], [Infinity, 0, 0], [-1_000_001, 0, 1], Array(13).fill(0)]) {
    assert.equal(threeSumInputSchema.safeParse({ nums }).success, false)
    assert.throws(() => threeSum({ nums }))
  }
  for (const mutate of [
    (story) => { story.scene = 'Array1D' },
    (story) => { delete story.steps[0].values },
    (story) => { story.steps[0].values.reverse() },
    (story) => { delete story.steps[0].result },
    (story) => { story.steps[0].result = [[-1, 0]] },
    (story) => { story.steps[0].result = [[0, 0, 0]] },
    (story) => { story.steps[0].result = [[0, 1, 2]] },
    (story) => { story.steps[0].result = [[-1, 1, 0]] },
    (story) => { story.steps[0].result = [[-1, 0, 1], [-1, 0, 1]] },
  ]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC15 snapshots support backward seek, completion and replay without losing accumulated results', () => {
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
  engine.play()
  engine.setRate(2)
  engine.advance(100)
  assert.equal(engine.getSnapshot().playing, false)
  assert.deepEqual(engine.getSnapshot().frame.result, [[-1, -1, 2], [-1, 0, 1]])
  engine.play()
  assert.equal(engine.getSnapshot().time, 0)
  assert.deepEqual(engine.getSnapshot().frame.result, [])
})

test('LC15 rerecording is isolated from LC11 and B0 and starts paused at zero', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/three-sum-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { recordStory, stories } = await server.ssrLoadModule('/src/story/catalog.ts')
    const before = JSON.stringify(stories)
    const recording = recordStory('three-sum', { nums: [0, 0, 0, 0] })
    assert.deepEqual(recording.steps.at(-1).result, [[0, 0, 0]])
    assert.equal(recordStory('container-with-most-water', { nums: [3, 1, 3] }).steps.at(-1).result, 6)
    for (const nums of [[0, 0], [0, 0.5, 1]]) assert.throws(() => recordStory('three-sum', { nums }))
    const engine = new PlayerEngine(recording)
    assert.equal(engine.getSnapshot().time, 0)
    assert.equal(engine.getSnapshot().playing, false)
    assert.equal(JSON.stringify(stories), before)
  } finally { await server.close() }
})
