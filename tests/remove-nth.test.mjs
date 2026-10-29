import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { removeNthFromEnd } from '../src/steppers/removeNthFromEnd.ts'
import { removeNthInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/remove-nth.json', import.meta.url), 'utf8'))
function check(input) {
  const original = structuredClone(input)
  const frames = removeNthFromEnd(input)
  assert.deepEqual(input, original)
  storySchema.parse({ ...fixture, input, steps: frames })
  const index = input.nums.length - input.n
  const expected = [...input.nums.slice(0, index), ...input.nums.slice(index + 1)]
  assert.deepEqual(frames.at(-1).result, expected)
  assert.equal(frames.at(-1).t, 34)
  const initialLinks = input.nums.map((_, i) => i + 1 < input.nums.length ? i + 1 : null)
  const final = frames.at(-1)
  const expectedLinks = [...initialLinks]
  if (index > 0) expectedLinks[index - 1] = initialLinks[index]
  assert.deepEqual(final.links, expectedLinks)
  assert.equal(final.head, index === 0 ? initialLinks[0] : 0)
  for (const [i, frame] of frames.entries()) {
    assert.ok(!i || frame.t > frames[i - 1].t)
    if (frame.caption.includes('fast 先走')) assert.equal(frame.stats.find((s) => s.label === 'slow').value, 'dummy')
    if (i < frames.findIndex((f) => f.caption.includes('完成删除'))) {
      assert.deepEqual(frame.links, initialLinks)
      assert.equal(frame.head, 0)
    }
  }
  let node = final.head
  const values = []
  while (node !== null) {
    assert.ok(values.length < input.nums.length)
    values.push(input.nums[node])
    node = final.links[node]
  }
  assert.deepEqual(values, expected)
  return frames
}

test('LC19 fixture and seeking preserve snapshots', () => {
  assert.deepEqual(check(fixture.input), fixture.steps)
  assert.deepEqual(fixture.steps.at(-1).result, [1, 2, 3, 5])
  assert.ok(fixture.steps.some((f) => f.sfx === 'compare'))
  assert.ok(fixture.steps.some((f) => f.sfx === 'match'))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
})

test('LC19 agrees with array oracle for every length and position', () => {
  for (let length = 1; length <= 12; length++) {
    for (let n = 1; n <= length; n++) check({ nums: Array.from({ length }, (_, i) => i % 3 - 0.5), n })
  }
})

test('LC19 validates inputs and results', () => {
  for (const input of [{ nums: [], n: 1 }, { nums: Array(13).fill(0), n: 1 }, { nums: [Infinity], n: 1 }, { nums: [1], n: 0 }, { nums: [1], n: 2 }, { nums: [1], n: 0.5 }, { nums: [1], n: 1, extra: true }]) {
    assert.equal(removeNthInputSchema.safeParse(input).success, false)
    assert.throws(() => removeNthFromEnd(input))
  }
  for (const mutate of [(s) => { delete s.steps.at(-1).result }, (s) => { s.steps.at(-1).result = [1] }, (s) => { s.steps.at(-1).links[0] = 20 }]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC19 catalog, form and scene support rerecording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/remove-nth-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { RemoveNthParameters }, { StoryScene }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    assert.deepEqual(stories[fixture.id], fixture)
    const recording = recordStory(fixture.id, { nums: [2.5], n: 1 })
    assert.deepEqual(recording.steps.at(-1).result, [])
    assert.equal(recording.steps.at(-1).head, null)
    assert.throws(() => recordStory(fixture.id, { nums: [1], n: 2 }))
    assert.equal(findTrack(fixture.id, 'B2').track.duration, '00:34')
    const form = renderToStaticMarkup(React.createElement(RemoveNthParameters, { input: fixture.input, onRecord: () => {} }))
    assert.match(form, /链表节点 nums/)
    assert.match(form, /倒数位置 n/)
    const scene = renderToStaticMarkup(React.createElement(StoryScene, { story: recording, frame: recording.steps.at(-1) }))
    assert.match(scene, /head null/)
  } finally { await server.close() }
})
