import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { minWindow } from '../src/steppers/minWindow.ts'
import { minWindowInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/min-window.json', import.meta.url), 'utf8'))
const last = (steps) => steps.at(-1)
const covers = (window, target) => {
  const remaining = [...window]
  return target.every((char) => {
    const index = remaining.indexOf(char)
    if (index < 0) return false
    remaining.splice(index, 1)
    return true
  })
}
const oracle = (s, t) => {
  const chars = Array.from(s), target = Array.from(t)
  if (!target.length) return ''
  let best = ''
  for (let left = 0; left < chars.length; left++) {
    for (let right = left; right < chars.length; right++) {
      const window = chars.slice(left, right + 1)
      if (covers(window, target) && (!best || window.length < Array.from(best).length)) best = window.join('')
    }
  }
  return best
}
function check(s, t) {
  const steps = minWindow({ s, t }), chars = Array.from(s)
  storySchema.parse({ ...fixture, input: { s, t }, steps })
  assert.equal(last(steps).result, oracle(s, t))
  assert.equal(last(steps).t, 40)
  assert.deepEqual(steps[0].bounds, { left: 0, right: -1 })
  for (const step of steps) {
    const { left, right } = step.bounds
    assert.deepEqual(step.highlight, Array.from({ length: Math.max(0, right - left + 1) }, (_, i) => left + i))
    if (step.result) assert.ok(covers(Array.from(step.result), Array.from(t)))
  }
  const { left, right } = last(steps).bounds
  assert.equal(chars.slice(left, right + 1).join(''), last(steps).result)
  return steps
}

test('LC76 fixture reproduces and handles duplicates, empty strings and Unicode', () => {
  storySchema.parse(fixture)
  assert.deepEqual(check(fixture.input.s, fixture.input.t), fixture.steps)
  assert.equal(last(fixture.steps).result, 'BANC')
  for (const [s, t] of [['', ''], ['', 'a'], ['a', ''], ['a', 'aa'], ['aaab', 'aab'], ['bbaa', 'aba'], ['ab', 'b'], ['😀a😀b', '😀b'], ['a a', ' a'], ['e\u0301e', '\u0301e']]) check(s, t)
})

test('LC76 agrees with independent brute-force oracle on short strings', () => {
  const words = (max) => {
    let level = [''], all = [...level]
    for (let length = 1; length <= max; length++) {
      level = level.flatMap((prefix) => ['a', 'b', 'c'].map((char) => prefix + char))
      all.push(...level)
    }
    return all
  }
  for (const s of words(4)) for (const t of words(3)) check(s, t)
})

test('LC76 validates both inputs and preserves frames during seeking and replay', () => {
  for (const value of ['a'.repeat(13), '😀'.repeat(13), '\n', '\ud800', 123]) {
    for (const input of [{ s: value, t: 'a' }, { s: 'a', t: value }]) {
      assert.equal(minWindowInputSchema.safeParse(input).success, false)
      assert.throws(() => minWindow(input))
    }
  }
  assert.equal(minWindowInputSchema.safeParse({ s: 'a', t: 'a', extra: 1 }).success, false)
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
  engine.play()
  engine.advance(100)
  assert.equal(engine.getSnapshot().frame.result, 'BANC')
  engine.play()
  assert.equal(engine.getSnapshot().time, 0)
})

test('LC76 rerecording and character rendering are wired to the catalog', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/min-window-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ recordStory, stories }, { StoryScene }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'),
    ])
    const original = JSON.stringify(stories)
    for (const [s, t] of [['aaab', 'aab'], ['', 'a'], ['😀a😀b', '😀b']]) {
      const recording = recordStory('min-window', { s, t })
      assert.equal(last(recording.steps).result, oracle(s, t))
      assert.equal(recording.scene, 'array-2ptrs')
    }
    assert.throws(() => recordStory('min-window', { s: '\n', t: 'a' }))
    assert.equal(JSON.stringify(stories), original)
    const html = renderToStaticMarkup(React.createElement(StoryScene, { story: stories['min-window'], frame: last(fixture.steps) }))
    assert.match(html, /<svg/)
    assert.match(html, />B</)
  } finally { await server.close() }
})
