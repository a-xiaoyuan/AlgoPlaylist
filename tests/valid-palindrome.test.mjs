import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { validPalindrome } from '../src/steppers/validPalindrome.ts'
import { validPalindromeInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/valid-palindrome.json', import.meta.url), 'utf8'))
const oracle = (text) => {
  const filtered = text.replace(/[^a-z0-9]/gi, '').toLowerCase()
  return filtered === [...filtered].reverse().join('')
}
function check(text) {
  const steps = validPalindrome({ text })
  storySchema.parse({ ...fixture, input: { text }, steps })
  assert.equal(steps.at(-1).result, oracle(text), JSON.stringify(text))
  assert.equal(steps[0].t, 0)
  assert.equal(steps.at(-1).t, 32)
  for (const [i, step] of steps.entries()) {
    if (i) assert.ok(step.t > steps[i - 1].t)
    for (const { index } of step.pointers) assert.ok(index >= 0 && index < Array.from(text).length)
    if (step.sfx === 'match') {
      const [left, right] = step.pointers.map((p) => p.index)
      const chars = Array.from(text)
      assert.equal(chars[left].toLowerCase(), chars[right].toLowerCase())
      assert.equal(steps[i - 1].sfx, 'compare')
    }
  }
  return steps
}

test('LC125 default story, comparisons, and seeking', () => {
  assert.deepEqual(check(fixture.input.text), fixture.steps)
  assert.equal(fixture.steps.at(-1).result, true)
  assert.ok(fixture.steps.some((step) => step.sfx === 'compare'))
  assert.ok(fixture.steps.some((step) => step.sfx === 'match'))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
  for (const text of ['', ' ', 'aba', 'race a car', '0P', 'A0a', '😀a😀', 'éaÉ', 'Ka', '１２a２１', 'a'.repeat(12)]) check(text)
})

test('LC125 agrees with an independent filter-and-reverse oracle', () => {
  const alphabet = ['a', 'B', '0', '!', '😀']
  for (let length = 0; length <= 5; length++) for (let code = 0; code < alphabet.length ** length; code++) {
    let value = code
    const text = Array.from({ length }, () => { const char = alphabet[value % alphabet.length]; value = Math.floor(value / alphabet.length); return char }).join('')
    check(text)
  }
})

test('LC125 validates input and final result', () => {
  for (const input of [{ text: 'a'.repeat(13) }, { text: '😀'.repeat(13) }, { text: '\n' }, { text: '\ud800' }, { text: 42 }, { text: 'a', extra: true }]) {
    assert.equal(validPalindromeInputSchema.safeParse(input).success, false)
    assert.throws(() => validPalindrome(input))
  }
  assert.ok(validPalindromeInputSchema.safeParse({ text: '😀'.repeat(12) }).success)
  for (const result of [undefined, 1, 'true', []]) {
    const story = structuredClone(fixture)
    story.steps.at(-1).result = result
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC125 catalog, form, and rerecording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/valid-palindrome-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ recordStory, stories }, { StringParameters }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    const before = JSON.stringify(stories)
    const recording = recordStory('valid-palindrome', { text: 'race a car' })
    assert.equal(recording.steps.at(-1).result, false)
    assert.throws(() => recordStory('valid-palindrome', { text: 'a'.repeat(13) }))
    assert.equal(JSON.stringify(stories), before)
    assert.equal(findTrack('valid-palindrome').track.title, '125 验证回文串')
    const page = renderToStaticMarkup(React.createElement(StringParameters, { problem: 'valid-palindrome', input: fixture.input, onRecord: () => {} }))
    assert.match(page, /字符串 text/)
    assert.match(page, /race a car/)
    assert.match(page, /重录本曲/)
  } finally { await server.close() }
})
