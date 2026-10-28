import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { getIntersectionNode } from '../src/steppers/getIntersectionNode.ts'
import { intersectTwoListsInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/intersect-lists.json', import.meta.url), 'utf8'))
function walk(head, links) {
  const nodes = []
  while (head !== null) {
    assert.ok(head >= 0 && head < links.length && !nodes.includes(head))
    nodes.push(head)
    head = links[head]
  }
  return nodes
}
function check(input) {
  const before = structuredClone(input)
  const frames = getIntersectionNode(input)
  assert.deepEqual(input, before)
  storySchema.parse({ ...fixture, input, steps: frames })
  const { listA, listB, skipA, skipB } = input
  const nums = [...listA.slice(0, skipA), ...listB.slice(0, skipB), ...listA.slice(skipA)]
  const first = frames[0]
  const a = walk(first.headA, first.links), b = walk(first.headB, first.links)
  assert.deepEqual(a.map(i => nums[i]), listA)
  assert.deepEqual(b.map(i => nums[i]), listB)
  assert.deepEqual(a.slice(skipA), b.slice(skipB))
  assert.equal(new Set([...a, ...b]).size, nums.length)
  const expected = listA.length > skipA ? skipA + skipB : null
  assert.equal(frames.at(-1).result, expected)
  assert.equal(frames.at(-1).t, 36)
  for (const [i, frame] of frames.entries()) {
    if (i) assert.ok(frame.t > frames[i - 1].t)
    assert.deepEqual(frame.links, first.links)
    assert.equal(frame.headA, first.headA)
    assert.equal(frame.headB, first.headB)
    if (i > 0 && i < frames.length - 1) {
      const prev = frames[i - 1]
      for (const [label, otherHead] of [['pA', first.headB], ['pB', first.headA]]) {
        const prior = prev.pointers.find(p => p.label === label)?.index ?? null
        const now = frame.pointers.find(p => p.label === label)?.index ?? null
        assert.equal(now, prior === null ? otherHead : first.links[prior])
      }
    }
  }
  return frames
}

test('LC160 default fixture records identity-based traversal and can seek', () => {
  assert.deepEqual(check(fixture.input), fixture.steps)
  assert.deepEqual(fixture.steps[0].links, [1, 5, 3, 4, 5, 6, 7, null])
  assert.equal(fixture.steps.at(-1).result, 5)
  assert.ok(fixture.steps.some(frame => frame.caption.includes('切换到 headB')))
  assert.ok(fixture.steps.some(frame => frame.caption.includes('切换到 headA')))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
})

test('LC160 covers all small prefix and shared lengths, including empty lists and repeated values', () => {
  for (let a = 0; a <= 5; a++) for (let b = 0; b <= 5; b++) for (let shared = 0; shared <= 5; shared++) {
    if (a + b + shared > 12) continue
    const suffix = Array.from({ length: shared }, (_, i) => i % 2)
    check({ listA: [...Array(a).fill(1), ...suffix], listB: [...Array(b).fill(1), ...suffix], skipA: a, skipB: b })
  }
  check({ listA: Array(12).fill(7), listB: Array(12).fill(7), skipA: 0, skipB: 0 })
})

test('LC160 rejects invalid inputs and snapshots', () => {
  for (const input of [
    { listA: [1], listB: [2], skipA: 0, skipB: 0 },
    { listA: [1], listB: [], skipA: 0, skipB: 0 },
    { listA: [], listB: [], skipA: -1, skipB: 0 },
    { listA: [], listB: [], skipA: 1, skipB: 0 },
    { listA: [1], listB: [1], skipA: 0.5, skipB: 0 },
    { listA: Array(7).fill(1), listB: Array(6).fill(1), skipA: 7, skipB: 6 },
    { listA: [1.5], listB: [], skipA: 1, skipB: 0 },
    { listA: [], listB: [], skipA: 0, skipB: 0, extra: true },
  ]) {
    assert.equal(intersectTwoListsInputSchema.safeParse(input).success, false)
    assert.throws(() => getIntersectionNode(input))
  }
  for (const mutate of [s => { s.steps[0].links[1] = 2 }, s => { s.steps[0].headB = 8 }, s => { delete s.steps[0].headA }, s => { s.steps.at(-1).result = null }, s => { delete s.steps.at(-1).result }]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC160 catalog, scene, and parameter form use the same recording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/intersect-lists-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { IntersectListsParameters }, { StoryScene }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    assert.deepEqual(stories[fixture.id], fixture)
    assert.equal(recordStory(fixture.id, { listA: [1], listB: [1], skipA: 1, skipB: 1 }).steps.at(-1).result, null)
    assert.throws(() => recordStory(fixture.id, { listA: [1], listB: [2], skipA: 0, skipB: 0 }))
    assert.equal(findTrack(fixture.id, 'B2').track.title, '160 相交链表')
    const form = renderToStaticMarkup(React.createElement(IntersectListsParameters, { input: fixture.input, onRecord: () => {} }))
    for (const label of ['listA', 'listB', 'skipA', 'skipB']) assert.match(form, new RegExp(label))
    const scene = renderToStaticMarkup(React.createElement(StoryScene, { story: fixture, frame: fixture.steps[0] }))
    assert.match(scene, /链表节点 \[4, 1, 5, 6, 1, 8, 4, 5\]/)
    assert.match(scene, /headA #0 · headB #2/)
  } finally { await server.close() }
})
