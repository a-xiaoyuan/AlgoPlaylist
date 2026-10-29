import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { linkedCycleII } from '../src/steppers/linkedCycleII.ts'
import { linkedCycleIIInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/linked-cycle-ii.json', import.meta.url), 'utf8'))
function oracle(links) {
  const visited = new Set()
  let node = 0
  while (node !== null) {
    if (visited.has(node)) return node
    visited.add(node)
    node = links[node]
  }
  return null
}
function check(input) {
  const original = structuredClone(input)
  const links = input.nums.map((_, i) => i + 1 < input.nums.length ? i + 1 : input.pos === -1 ? null : input.pos)
  const frames = linkedCycleII(input)
  assert.deepEqual(input, original)
  storySchema.parse({ ...fixture, input, steps: frames })
  assert.equal(frames.at(-1).result, oracle(links))
  assert.equal(frames.at(-1).t, 34)
  for (const [i, frame] of frames.entries()) {
    assert.deepEqual(frame.links, links)
    assert.equal(frame.head, 0)
    assert.ok(!i || frame.t > frames[i - 1].t)
    for (const pointer of frame.pointers) assert.ok(pointer.index >= 0 && pointer.index < links.length)
  }
  if (input.pos !== -1) {
    const reset = frames.findIndex((frame) => frame.caption.includes('第二阶段'))
    assert.ok(reset > 0)
    assert.equal(frames[reset].pointers.find((p) => p.label === 'slow').index, 0)
    assert.equal(frames[reset].pointers.find((p) => p.label === 'fast').index, frames[reset - 1].pointers.find((p) => p.label === 'fast').index)
    assert.deepEqual(frames.at(-1).highlight, [input.pos])
  } else assert.ok(frames.every((frame) => !frame.caption.includes('第二阶段')))
  return frames
}

test('LC142 fixture records both phases and supports seeking', () => {
  assert.deepEqual(check(fixture.input), fixture.steps)
  assert.equal(fixture.steps.at(-1).result, 1)
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'compare'))
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'match'))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
})

test('LC142 agrees with visited-node oracle for all lengths and tail links', () => {
  for (let length = 1; length <= 12; length++) {
    for (let pos = -1; pos < length; pos++) check({ nums: Array.from({ length }, (_, i) => i % 3 - 1), pos })
  }
})

test('LC142 validates integer inputs and entrance results', () => {
  for (const input of [{ nums: [], pos: -1 }, { nums: Array(13).fill(0), pos: 0 }, { nums: [1.5], pos: -1 }, { nums: [Infinity], pos: -1 }, { nums: [1], pos: -2 }, { nums: [1], pos: 1 }, { nums: [1], pos: 0.5 }, { nums: [1], pos: 0, extra: true }]) {
    assert.equal(linkedCycleIIInputSchema.safeParse(input).success, false)
    assert.throws(() => linkedCycleII(input))
  }
  for (const mutate of [(s) => { s.steps[0].links[0] = 4 }, (s) => { delete s.steps[0].links }, (s) => { s.steps.at(-1).result = true }, (s) => { s.steps.at(-1).result = -1 }, (s) => { s.steps.at(-1).result = 4 }, (s) => { s.steps.at(-1).result = 0.5 }, (s) => { delete s.steps.at(-1).result }]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC142 catalog, shared form and scene support rerecording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/linked-cycle-ii-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { LinkedCycleParameters }, { StoryScene }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    assert.deepEqual(stories[fixture.id], fixture)
    assert.equal(recordStory(fixture.id, { nums: [1], pos: -1 }).steps.at(-1).result, null)
    assert.equal(recordStory(fixture.id, { nums: [1], pos: 0 }).steps.at(-1).result, 0)
    assert.throws(() => recordStory(fixture.id, { nums: [1.5], pos: 0 }))
    assert.equal(findTrack(fixture.id, 'B2').track.duration, '00:34')
    const form = renderToStaticMarkup(React.createElement(LinkedCycleParameters, { entrance: true, input: fixture.input, onRecord: () => {} }))
    assert.match(form, /链表节点 nums/)
    assert.match(form, /尾节点连接下标 pos/)
    assert.match(form, /34 秒/)
    const scene = renderToStaticMarkup(React.createElement(StoryScene, { story: fixture, frame: fixture.steps.at(-1) }))
    assert.match(scene, /环的入口/)
    assert.match(scene, /V320 H/)
  } finally { await server.close() }
})
