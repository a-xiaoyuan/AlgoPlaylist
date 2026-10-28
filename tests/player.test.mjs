import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'
import { storySchema } from '../src/story/schema.ts'
import { twoSumHash } from '../src/steppers/twoSumHash.ts'
import { twoSumBrute } from '../src/steppers/twoSumBrute.ts'

const fixtures = Object.fromEntries(['hash', 'brute'].map((remix) => [remix,
  JSON.parse(readFileSync(new URL(`../data/stories/two-sum-${remix}.json`, import.meta.url), 'utf8'))]))

test('fixtures validate, last 20–40s and reproduce exactly from steppers', () => {
  for (const [remix, stepper] of [['hash', twoSumHash], ['brute', twoSumBrute]]) {
    const story = storySchema.parse(fixtures[remix])
    assert.deepEqual(stepper(story.input), story.steps)
    assert.ok(story.steps.at(-1).t >= 20 && story.steps.at(-1).t <= 40)
  }
})

test('engine pause, play, boundary seek, rate, completion and replay', () => {
  const engine = new PlayerEngine(fixtures.hash)
  let notifications = 0
  const unsubscribe = engine.subscribe(() => notifications++)
  engine.advance(5)
  assert.equal(engine.getSnapshot().time, 0)
  engine.play()
  engine.advance(4)
  assert.equal(engine.getSnapshot().time, 4)
  engine.pause()
  engine.advance(5)
  assert.equal(engine.getSnapshot().time, 4)
  engine.setRate(2)
  engine.play()
  engine.advance(2)
  assert.equal(engine.getSnapshot().time, 8)
  const step = fixtures.hash.steps[3]
  engine.seek(step.t)
  assert.deepEqual(engine.getSnapshot().frame, step)
  assert.equal(engine.getSnapshot().stepIndex, 3)
  engine.seek(step.t - 0.001)
  assert.equal(engine.getSnapshot().stepIndex, 2)
  engine.seek(-4)
  assert.equal(engine.getSnapshot().stepIndex, 0)
  engine.advance(100)
  assert.equal(engine.getSnapshot().time, engine.getSnapshot().duration)
  assert.equal(engine.getSnapshot().playing, false)
  assert.equal(engine.getSnapshot().stepIndex, fixtures.hash.steps.length - 1)
  engine.play()
  assert.equal(engine.getSnapshot().time, 0)
  assert.equal(engine.getSnapshot().playing, true)
  const snapshot = engine.getSnapshot()
  engine.seek(NaN)
  assert.equal(engine.getSnapshot(), snapshot)
  assert.throws(() => engine.setRate(0), RangeError)
  assert.throws(() => engine.setRate(Infinity), RangeError)
  assert.ok(notifications > 0)
  unsubscribe()
  const count = notifications
  engine.pause()
  assert.equal(notifications, count)
})

test('schema rejects invalid timelines, missing fields, invalid index, unknown scene and bad input', () => {
  for (const mutate of [
    (s) => { s.steps[0].t = 1 },
    (s) => { s.steps[1].t = 0 },
    (s) => { s.steps[0].highlight = [s.input.nums.length] },
    (s) => { s.steps[0].pointers = [{ label: 'i', index: -1 }] },
    (s) => { s.steps[0].marks = [{ label: 'bad', index: 99 }] },
    (s) => { delete s.steps[0].sfx },
    (s) => { s.scene = 'Tree' },
    (s) => { s.input.nums = [1] },
    (s) => { s.input.target = 1.5 },
    (s) => { s.steps[0].caption = '' },
  ]) {
    const story = structuredClone(fixtures.hash)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('both algorithms return correct distinct indices or no solution for duplicates, zero, negatives and no-solution cases', () => {
  const cases = [
    { nums: [3, 3], target: 6 },
    { nums: [0, 0], target: 0 },
    { nums: [-3, 1, 4, -2], target: -5 },
    { nums: [1, 2, 3], target: 6 },
    { nums: [3, 2, 4, 7], target: 6 },
    { nums: [1, 2, 3], target: 99 },
    { nums: Array.from({ length: 12 }, (_, i) => i), target: 999 },
  ]
  for (const stepper of [twoSumHash, twoSumBrute]) for (const input of cases) {
    const steps = stepper(input)
    storySchema.parse({ ...fixtures.hash, input, steps })
    const expected = input.nums.some((n, i) => input.nums.slice(i + 1).some((m) => n + m === input.target))
    const indices = steps.at(-1).highlight
    if (expected) {
      assert.equal(indices.length, 2)
      assert.notEqual(indices[0], indices[1])
      assert.equal(input.nums[indices[0]] + input.nums[indices[1]], input.target)
    } else {
      assert.deepEqual(indices, [])
      assert.match(steps.at(-1).caption, /没有/)
    }
  }
})
