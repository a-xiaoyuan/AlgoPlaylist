import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { swapPairs } from '../src/steppers/swapPairs.ts'
import { swapPairsInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/swap-pairs.json', import.meta.url), 'utf8'))
function check(nums) {
  const input = { nums: [...nums] }
  const frames = swapPairs(input)
  assert.deepEqual(input.nums, nums)
  storySchema.parse({ ...fixture, input, steps: frames })
  const order = []
  for (let i = 0; i < nums.length; i += 2) {
    if (i + 1 < nums.length) order.push(i + 1)
    order.push(i)
  }
  const expected = order.map((i) => nums[i])
  const final = frames.at(-1)
  assert.equal(final.t, 34)
  assert.deepEqual(final.result, expected)
  assert.equal(final.head, order[0] ?? null)
  const links = Array(nums.length).fill(null)
  order.forEach((node, index) => { links[node] = order[index + 1] ?? null })
  assert.deepEqual(final.links, links)
  assert.ok(frames.every((frame, i) => i === 0 ? frame.t === 0 : frame.t > frames[i - 1].t))
  // Each pair has one snapshot for each of the three pointer assignments.
  for (let pair = 0; pair < Math.floor(nums.length / 2); pair++) {
    const base = 1 + pair * 5
    const [found, firstNext, secondNext, connected] = frames.slice(base, base + 4)
    const first = 2 * pair, second = first + 1
    assert.deepEqual(firstNext.links, found.links.map((v, i) => i === first ? found.links[second] : v))
    assert.deepEqual(secondNext.links, firstNext.links.map((v, i) => i === second ? first : v))
    assert.deepEqual(connected.links, secondNext.links.map((v, i) => i === first - 2 ? second : v))
    assert.equal(connected.head, pair === 0 ? second : secondNext.head)
  }
  return frames
}

test('LC24 fixture, snapshots and seeking', () => {
  assert.deepEqual(check(fixture.input.nums), fixture.steps)
  assert.deepEqual(fixture.steps.at(-1).result, [2, 1, 4, 3])
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'compare'))
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'match'))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
})

test('LC24 agrees with an independent index oracle for every length', () => {
  for (let length = 0; length <= 12; length++) {
    check(Array.from({ length }, (_, i) => i % 3 - 0.5))
    check(Array.from({ length }, () => 7))
  }
})

test('LC24 validates input and final topology', () => {
  for (const input of [{ nums: Array(13).fill(0) }, { nums: [Infinity] }, { nums: [NaN] }, { nums: [1], extra: true }]) {
    assert.equal(swapPairsInputSchema.safeParse(input).success, false)
    assert.throws(() => swapPairs(input))
  }
  for (const mutate of [(s) => { delete s.steps.at(-1).result }, (s) => { s.steps.at(-1).result = [1, 2, 3, 4] }, (s) => { s.steps.at(-1).links[0] = null }, (s) => { s.steps.at(-1).head = 0 }]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC24 catalog, form and scene support rerecording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/swap-pairs-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { ArrayParameters }, { StoryScene }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    assert.deepEqual(stories[fixture.id], fixture)
    for (const nums of [[], [2.5], [1, 2, 3]]) {
      const story = recordStory(fixture.id, { nums })
      assert.deepEqual(story.steps, swapPairs({ nums }))
      assert.match(renderToStaticMarkup(React.createElement(StoryScene, { story, frame: story.steps.at(-1) })), /链表场景/)
    }
    assert.throws(() => recordStory(fixture.id, { nums: Array(13).fill(0) }))
    assert.equal(findTrack(fixture.id, 'B2').track.duration, '00:34')
    const form = renderToStaticMarkup(React.createElement(ArrayParameters, { problem: fixture.problem, input: fixture.input, onRecord: () => {} }))
    assert.match(form, /链表节点 nums/)
    assert.match(form, /0–12 个有限数字/)
  } finally { await server.close() }
})
