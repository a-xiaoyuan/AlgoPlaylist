import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { frameAtProgress, replaceProblemRecordings } from '../src/player/remix.ts'
import { storySchema } from '../src/story/schema.ts'

const hash = storySchema.parse(JSON.parse(readFileSync(new URL('../data/stories/two-sum-hash.json', import.meta.url), 'utf8')))
const brute = storySchema.parse(JSON.parse(readFileSync(new URL('../data/stories/two-sum-brute.json', import.meta.url), 'utf8')))

test('frameAtProgress clamps and maps ratio onto partner timeline', () => {
  const start = frameAtProgress(brute, -1)
  assert.equal(start.time, 0)
  assert.equal(start.stepIndex, 0)
  assert.equal(start.frame, brute.steps[0])

  const end = frameAtProgress(brute, 2)
  assert.equal(end.time, brute.steps.at(-1).t)
  assert.equal(end.stepIndex, brute.steps.length - 1)

  const mid = frameAtProgress(hash, 0.5)
  assert.ok(mid.time > 0 && mid.time < hash.steps.at(-1).t)
  assert.equal(mid.frame, hash.steps[mid.stepIndex])
  assert.ok(mid.frame.t <= mid.time)
  if (mid.stepIndex + 1 < hash.steps.length) assert.ok(hash.steps[mid.stepIndex + 1].t > mid.time)
})

test('replaceProblemRecordings only rewrites same-problem remixes', () => {
  const recordings = { 'two-sum-hash': hash, 'two-sum-brute': brute, other: { ...hash, id: 'other', problem: 'binary-search' } }
  const next = replaceProblemRecordings(recordings, 'two-sum-hash', { nums: [1, 2, 3], target: 5 }, (id, input) => ({
    ...recordings[id],
    input,
    id: `${id}-rerecorded`,
  }))
  assert.equal(next['two-sum-hash'].id, 'two-sum-hash-rerecorded')
  assert.equal(next['two-sum-brute'].id, 'two-sum-brute-rerecorded')
  assert.equal(next.other.id, 'other')
  assert.deepEqual(next['two-sum-hash'].input, { nums: [1, 2, 3], target: 5 })
})
