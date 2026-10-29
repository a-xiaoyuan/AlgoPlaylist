import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { palindromeList } from '../src/steppers/palindromeList.ts'
import { palindromeListInputSchema, storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/palindrome-list.json', import.meta.url), 'utf8'))
const oracle = (nums) => nums.every((value, i) => value === nums[nums.length - 1 - i])

function check(nums) {
  const input = { nums: [...nums] }
  const frames = palindromeList(input)
  assert.deepEqual(input.nums, nums)
  storySchema.parse({ ...fixture, input, steps: frames })
  assert.equal(frames.at(-1).result, oracle(nums))
  assert.equal(frames.at(-1).t, 36)
  assert.ok(frames.every((frame, i) => i === 0 ? frame.t === 0 : frame.t > frames[i - 1].t))
  const split = Math.ceil(nums.length / 2)
  const links = nums.map((_, i) => i + 1 < nums.length ? i + 1 : null)
  for (let i = split; i < nums.length; i++) links[i] = i === split ? null : i - 1
  assert.deepEqual(frames.at(-1).links, links)
  const changed = frames.slice(1).filter((frame, i) => frame.links.some((link, j) => link !== frames[i].links[j]))
  assert.equal(frames.filter((frame) => frame.caption.includes('原地反转连线')).length, Math.floor(nums.length / 2))
  assert.equal(changed.length, nums.length === 2 || nums.length === 3 ? 0 : Math.floor(nums.length / 2))
  for (const frame of changed) assert.match(frame.caption, /原地反转连线/)
  return frames
}

test('LC234 default recording shows all phases and supports seeking', () => {
  assert.deepEqual(check(fixture.input.nums), fixture.steps)
  assert.equal(fixture.steps.at(-1).result, true)
  for (const phase of ['第一阶段', '第二阶段', '第三阶段']) assert.ok(fixture.steps.some((frame) => frame.caption.includes(phase)))
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'compare'))
  assert.ok(fixture.steps.some((frame) => frame.sfx === 'match'))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) { engine.seek(frame.t); assert.deepEqual(engine.getSnapshot().frame, frame) }
})

test('LC234 agrees with independent palindrome oracle for all lengths', () => {
  for (let length = 1; length <= 12; length++) {
    check(Array.from({ length }, (_, i) => Math.min(i, length - 1 - i) - 0.5))
    check(Array.from({ length }, (_, i) => i % 3))
    check(Array(length).fill(4))
  }
  assert.equal(check([1, 2]).at(-1).result, false)
  assert.equal(check([1, 2, 1]).at(-1).result, true)
})

test('LC234 validates inputs and boolean result', () => {
  for (const input of [{ nums: [] }, { nums: Array(13).fill(0) }, { nums: [Infinity] }, { nums: [NaN] }, { nums: [1], extra: true }]) {
    assert.equal(palindromeListInputSchema.safeParse(input).success, false)
    assert.throws(() => palindromeList(input))
  }
  for (const result of [undefined, 1, 'true']) {
    const story = structuredClone(fixture)
    story.steps.at(-1).result = result
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC234 catalog, form and scene support rerecording', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/palindrome-list-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ stories, recordStory }, { ArrayParameters }, { StoryScene }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/scenes/StoryScene.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    assert.deepEqual(stories[fixture.id], fixture)
    for (const nums of [[1], [1, 2], [1, 2, 1], [0.5, 0.5]]) {
      const story = recordStory(fixture.id, { nums })
      assert.deepEqual(story.steps, palindromeList({ nums }))
      assert.match(renderToStaticMarkup(React.createElement(StoryScene, { story, frame: story.steps.at(-1) })), /链表场景/)
    }
    assert.throws(() => recordStory(fixture.id, { nums: [] }))
    assert.equal(findTrack(fixture.id, 'B2').track.title, '234 回文链表')
    assert.equal(findTrack(fixture.id, 'B2').track.duration, '00:36')
    const form = renderToStaticMarkup(React.createElement(ArrayParameters, { problem: fixture.problem, input: fixture.input, onRecord: () => {} }))
    assert.match(form, /链表节点 nums/)
    assert.match(form, /1–12 个有限数字/)
  } finally { await server.close() }
})
