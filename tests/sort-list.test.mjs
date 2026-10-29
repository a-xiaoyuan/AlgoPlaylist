import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { sortList } from '../src/steppers/sortList.ts'
import { sortListInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/sort-list.json', import.meta.url), 'utf8'))

function check(nums) {
  const input = { nums: [...nums] }
  const frames = sortList(input)
  assert.deepEqual(input.nums, nums)
  storySchema.parse({ ...fixture, input, steps: frames })
  const order = nums.map((_, i) => i).sort((a, b) => nums[a] - nums[b] || a - b)
  const final = frames.at(-1)
  assert.equal(final.t, 40)
  assert.deepEqual(final.result, order.map((i) => nums[i]))
  assert.equal(final.head, order[0] ?? null)
  const links = Array(nums.length).fill(null)
  order.forEach((node, i) => { links[node] = order[i + 1] ?? null })
  assert.deepEqual(final.links, links)
  assert.ok(frames.every((frame, i) => i === 0 ? frame.t === 0 : frame.t > frames[i - 1].t))
  return frames
}

test('LC148 fixture shows splits and merges and supports seeking', () => {
  assert.deepEqual(check(fixture.input.nums), fixture.steps)
  assert.deepEqual(fixture.steps.at(-1).result, [1, 2, 3, 4])
  assert.ok(fixture.steps.some((frame) => /断开/.test(frame.caption)))
  assert.ok(fixture.steps.some((frame) => /比较/.test(frame.caption)))
  assert.ok(fixture.steps.some((frame) => /接到合并/.test(frame.caption)))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
})

test('LC148 sorts empty, singleton, duplicate and varied lists stably', () => {
  check([])
  check([7])
  for (let length = 0; length <= 12; length++) {
    check(Array.from({ length }, (_, i) => ((i * 7 + length) % 5) - 2.5))
    check(Array.from({ length }, (_, i) => length - i))
    check(Array(length).fill(3))
  }
})

test('LC148 rejects invalid input and incorrect final results or links', () => {
  for (const input of [{ nums: Array(13).fill(0) }, { nums: [Infinity] }, { nums: [NaN] }, { nums: [1], extra: true }]) {
    assert.equal(sortListInputSchema.safeParse(input).success, false)
    assert.throws(() => sortList(input))
  }
  for (const mutate of [
    (s) => { delete s.steps.at(-1).result },
    (s) => { s.steps.at(-1).result = [4, 3, 2, 1] },
    (s) => { s.steps.at(-1).links[2] = null },
    (s) => { s.steps.at(-1).links[0] = 2 },
    (s) => { s.steps.at(-1).head = 0 },
  ]) {
    const story = structuredClone(fixture)
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC148 catalog, form and scene support rerecording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/sort-list-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { ArrayParameters }, { StoryScene }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    assert.deepEqual(stories[fixture.id], fixture)
    for (const nums of [[], [2.5], [3, 1, 3, -1]]) {
      const story = recordStory(fixture.id, { nums })
      assert.deepEqual(story.steps, sortList({ nums }))
      assert.match(renderToStaticMarkup(React.createElement(StoryScene, { story, frame: story.steps.at(-1) })), /链表场景/)
    }
    assert.throws(() => recordStory(fixture.id, { nums: Array(13).fill(0) }))
    assert.equal(findTrack(fixture.id, 'B2').track.duration, '00:40')
    const form = renderToStaticMarkup(React.createElement(ArrayParameters, { problem: fixture.problem, input: fixture.input, onRecord: () => {} }))
    assert.match(form, /链表节点 nums/)
    assert.match(form, /0–12 个有限数字/)
  } finally { await server.close() }
})
