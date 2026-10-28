import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { mergeTwoLists } from '../src/steppers/mergeTwoLists.ts'
import { mergeTwoListsInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/merge-two-lists.json', import.meta.url), 'utf8'))
function walk(head, links) {
  const seen = new Set()
  let node = head
  while (node !== null) {
    assert.ok(Number.isInteger(node) && node >= 0 && node < links.length)
    assert.ok(!seen.has(node), 'chain must not cycle')
    seen.add(node)
    node = links[node]
  }
  return [...seen]
}
function check(list1, list2) {
  const input = { list1, list2 }
  const before = structuredClone(input)
  const nums = [...list1, ...list2]
  const frames = mergeTwoLists(input)
  assert.deepEqual(input, before)
  storySchema.parse({ ...fixture, input, steps: frames })
  assert.deepEqual(frames[0].links, nums.map((_, i) => i + 1 === list1.length || i + 1 === nums.length ? null : i + 1))
  assert.equal(frames[0].head, null)
  const last = frames.at(-1)
  const order = walk(last.head, last.links)
  assert.equal(order.length, nums.length)
  assert.deepEqual(order.map((index) => nums[index]), [...nums].sort((a, b) => a - b))
  assert.deepEqual(last.result, order.map((index) => nums[index]))
  assert.equal(last.t, 34)
  for (const [i, frame] of frames.entries()) {
    if (i) assert.ok(frame.t > frames[i - 1].t)
    assert.equal(frame.links.length, nums.length)
    for (let n = 0; n < nums.length; n++) walk(n, frame.links)
    for (const pointer of frame.pointers) assert.ok(pointer.index < nums.length)
  }
  return frames
}

test('LC21 default recording and seeking preserve full snapshots', () => {
  assert.deepEqual(check(fixture.input.list1, fixture.input.list2), fixture.steps)
  assert.deepEqual(fixture.steps.at(-1).result, [1, 1, 2, 3, 4, 4])
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'compare'))
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'match'))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
})

test('LC21 matches sorted-value and node-identity oracles', () => {
  const arrays = [[]]
  for (let len = 1; len <= 4; len++) for (let code = 0; code < 3 ** len; code++) {
    let n = code
    const values = Array.from({ length: len }, () => { const v = n % 3 - 1; n = Math.floor(n / 3); return v }).sort((a, b) => a - b)
    arrays.push(values)
  }
  for (const list1 of arrays) for (const list2 of arrays) if (list1.length + list2.length) check(list1, list2)
  for (const [a, b] of [[[], [1]], [[1], []], [Array(12).fill(2), []], [[-1000000, 1000000], [-1000000, 1000000]], [[1, 1, 1], [1, 1]]]) check(a, b)
})

test('LC21 rejects invalid inputs and invalid linked-list snapshots', () => {
  for (const input of [{ list1: [], list2: [] }, { list1: [2, 1], list2: [] }, { list1: [], list2: [2, 1] }, { list1: Array(7).fill(0), list2: Array(6).fill(0) }, { list1: [0.5], list2: [] }, { list1: [1000001], list2: [] }, { list1: [1], list2: [], extra: true }]) {
    assert.equal(mergeTwoListsInputSchema.safeParse(input).success, false)
    assert.throws(() => mergeTwoLists(input))
  }
  for (const mutate of [(s) => { s.steps[0].links[0] = 6 }, (s) => { s.steps[0].head = 6 }, (s) => { s.steps[0].pointers[0].index = 6 }, (s) => { delete s.steps[0].links }]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC21 catalog, scene and dual-array form use the same recording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/merge-two-lists-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { MergeTwoListsParameters }, { StoryScene }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    assert.deepEqual(stories[fixture.id], fixture)
    const recording = recordStory(fixture.id, { list1: [], list2: [-1, 2] })
    assert.deepEqual(recording.steps.at(-1).result, [-1, 2])
    assert.throws(() => recordStory(fixture.id, { list1: [], list2: [] }))
    assert.equal(findTrack(fixture.id, 'B2').track.duration, '00:34')
    const form = renderToStaticMarkup(React.createElement(MergeTwoListsParameters, { input: fixture.input, onRecord: () => {} }))
    assert.match(form, /升序链表 list1/)
    assert.match(form, /升序链表 list2/)
    const scene = renderToStaticMarkup(React.createElement(StoryScene, { story: fixture, frame: fixture.steps[0] }))
    assert.match(scene, /链表节点 \[1, 2, 4, 1, 3, 4\]/)
  } finally { await server.close() }
})
