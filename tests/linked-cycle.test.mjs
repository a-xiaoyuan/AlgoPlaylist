import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { linkedCycle } from '../src/steppers/linkedCycle.ts'
import { linkedCycleInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/linked-cycle.json', import.meta.url), 'utf8'))
function oracle(links) {
  const visited = new Set()
  let node = 0
  while (node !== null) {
    if (visited.has(node)) return true
    visited.add(node)
    node = links[node]
  }
  return false
}
function check(input) {
  const original = structuredClone(input)
  const links = input.nums.map((_, i) => i + 1 < input.nums.length ? i + 1 : input.pos === -1 ? null : input.pos)
  const frames = linkedCycle(input)
  assert.deepEqual(input, original)
  storySchema.parse({ ...fixture, input, steps: frames })
  assert.equal(frames.at(-1).result, oracle(links))
  assert.equal(frames.at(-1).t, 32)
  for (const [i, frame] of frames.entries()) {
    assert.deepEqual(frame.links, links)
    assert.equal(frame.head, 0)
    assert.ok(!i || frame.t > frames[i - 1].t)
    assert.ok(frame.pointers.some((p) => p.label === 'slow'))
    for (const pointer of frame.pointers) assert.ok(pointer.index >= 0 && pointer.index < links.length)
  }
  return frames
}

test('LC141 default fixture, snapshots and seeking', () => {
  assert.deepEqual(check(fixture.input), fixture.steps)
  assert.equal(fixture.steps.at(-1).result, true)
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'compare'))
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'match'))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
})

test('LC141 agrees with visited-node oracle for all lengths and tail links', () => {
  for (let length = 1; length <= 12; length++) {
    for (let pos = -1; pos < length; pos++) check({ nums: Array.from({ length }, (_, i) => i % 3 - 1), pos })
  }
  check({ nums: [1.5, -2.25], pos: -1 })
})

test('LC141 validates input and result snapshots', () => {
  for (const input of [{ nums: [], pos: -1 }, { nums: Array(13).fill(0), pos: 0 }, { nums: [1], pos: -2 }, { nums: [1], pos: 1 }, { nums: [1], pos: 0.5 }, { nums: [1], pos: 0, extra: true }, { nums: [Infinity], pos: -1 }]) {
    assert.equal(linkedCycleInputSchema.safeParse(input).success, false)
    assert.throws(() => linkedCycle(input))
  }
  for (const mutate of [(s) => { s.steps[0].links[0] = 4 }, (s) => { delete s.steps[0].links }, (s) => { s.steps.at(-1).result = 1 }, (s) => { delete s.steps.at(-1).result }]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC141 catalog, form, and cyclic scene support rerecording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/linked-cycle-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { LinkedCycleParameters }, { StoryScene }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    assert.deepEqual(stories[fixture.id], fixture)
    assert.equal(recordStory(fixture.id, { nums: [1], pos: -1 }).steps.at(-1).result, false)
    assert.equal(recordStory(fixture.id, { nums: [1], pos: 0 }).steps.at(-1).result, true)
    assert.throws(() => recordStory(fixture.id, { nums: [1], pos: 1 }))
    assert.equal(findTrack(fixture.id, 'B2').track.duration, '00:32')
    const form = renderToStaticMarkup(React.createElement(LinkedCycleParameters, { input: fixture.input, onRecord: () => {} }))
    assert.match(form, /链表节点 nums/)
    assert.match(form, /尾节点连接下标 pos/)
    const scene = renderToStaticMarkup(React.createElement(StoryScene, { story: fixture, frame: fixture.steps[0] }))
    assert.match(scene, /V320 H/)
    const self = recordStory(fixture.id, { nums: [1], pos: 0 })
    assert.match(renderToStaticMarkup(React.createElement(StoryScene, { story: self, frame: self.steps[0] })), /V320 H/)
  } finally { await server.close() }
})
