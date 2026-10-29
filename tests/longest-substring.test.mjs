import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
import { longestSubstring } from '../src/steppers/longestSubstring.ts'
import { longestSubstringInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/longest-substring.json', import.meta.url), 'utf8'))
const last = (steps) => steps.at(-1)
const oracle = (chars) => {
  let best = 0
  for (let left = 0; left < chars.length; left++) {
    const seen = new Set()
    for (let right = left; right < chars.length && !seen.has(chars[right]); right++) {
      seen.add(chars[right])
      best = Math.max(best, right - left + 1)
    }
  }
  return best
}

function check(text) {
  const chars = Array.from(text)
  const steps = longestSubstring({ text })
  storySchema.parse({ ...fixture, input: { text }, steps })
  assert.equal(last(steps).result, oracle(chars))
  assert.equal(last(steps).t, 36)
  assert.deepEqual(steps[0].bounds, { left: 0, right: -1 })
  let previousLeft = 0, previousBest = 0
  for (const [right, step] of steps.slice(1, -1).entries()) {
    const { left, right: windowRight } = step.bounds
    const expectedLeft = Math.max(previousLeft, chars.lastIndexOf(chars[right], right - 1) + 1)
    // lastIndexOf with a negative start searches from the end, so the first character has no prior occurrence.
    assert.equal(left, right === 0 ? 0 : expectedLeft)
    assert.equal(windowRight, right)
    const window = chars.slice(left, right + 1)
    assert.equal(new Set(window).size, window.length)
    previousBest = Math.max(previousBest, window.length)
    assert.equal(step.result, previousBest)
    assert.deepEqual(step.pointers, [{ label: 'left', index: left }, { label: 'right', index: right }])
    previousLeft = left
  }
  const { left, right } = last(steps).bounds
  assert.equal(Math.max(0, right - left + 1), last(steps).result)
  return steps
}

test('LC3 fixture reproduces exactly, lasts 36s and returns 3', () => {
  storySchema.parse(fixture)
  assert.deepEqual(check(fixture.input.text), fixture.steps)
  assert.equal(last(fixture.steps).result, 3)
  assert.deepEqual(last(fixture.steps).bounds, { left: 0, right: 2 })
  for (const text of ['', 'a', 'bbbb', 'pwwkew', 'abba', 'dvdf', 'abcdef', '😀a😀b', 'a a', 'e\u0301e']) check(text)
})

test('LC3 agrees with an independent substring oracle for all short strings over a,b,c', () => {
  for (let length = 0; length <= 6; length++) for (let code = 0; code < 3 ** length; code++) {
    let value = code
    const text = Array.from({ length }, () => { const digit = value % 3; value = Math.floor(value / 3); return 'abc'[digit] }).join('')
    check(text)
  }
})

test('LC3 rejects invalid input and preserves frames during backward seek and replay', () => {
  for (const text of ['a'.repeat(13), '😀'.repeat(13), '\n', '\ud800', 123]) {
    assert.equal(longestSubstringInputSchema.safeParse({ text }).success, false)
    assert.throws(() => longestSubstring({ text }))
  }
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
  engine.play()
  engine.advance(100)
  assert.equal(engine.getSnapshot().playing, false)
  assert.equal(engine.getSnapshot().frame.result, 3)
  engine.play()
  assert.equal(engine.getSnapshot().time, 0)
  assert.deepEqual(engine.getSnapshot().frame, fixture.steps[0])
})

test('LC3 rerecording validates input and leaves catalog recordings unchanged', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/longest-substring-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { recordStory, stories } = await server.ssrLoadModule('/src/story/catalog.ts')
    const original = JSON.stringify(stories)
    for (const text of ['abba', '', '😀a😀b']) {
      const recording = recordStory(fixture.id, { text })
      assert.equal(last(recording.steps).result, oracle(Array.from(text)))
      assert.equal(recording.scene, 'array-2ptrs')
      const engine = new PlayerEngine(recording)
      assert.equal(engine.getSnapshot().time, 0)
      assert.equal(engine.getSnapshot().playing, false)
    }
    assert.throws(() => recordStory(fixture.id, { text: '\n' }))
    assert.equal(JSON.stringify(stories), original)
  } finally { await server.close() }
})
