import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { twoSumSorted } from '../src/steppers/twoSumSorted.ts'
import { storySchema, twoSumSortedInputSchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const fixture = JSON.parse(readFileSync(new URL('../data/stories/two-sum-ii.json', import.meta.url), 'utf8'))
function oracle(nums, target) {
  const pairs = []
  for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) {
    if (nums[i] + nums[j] === target) pairs.push([i + 1, j + 1])
  }
  return pairs
}
function check(nums, target) {
  const original = [...nums]
  const steps = twoSumSorted({ nums, target })
  assert.deepEqual(nums, original)
  storySchema.parse({ ...fixture, input: { nums, target }, steps })
  const pairs = oracle(nums, target)
  const result = steps.at(-1).result
  assert.ok(pairs.length ? pairs.some((pair) => pair[0] === result[0] && pair[1] === result[1]) : result.length === 0)
  assert.equal(steps[0].t, 0)
  assert.equal(steps.at(-1).t, 36)
  for (const [index, step] of steps.entries()) {
    if (index) assert.ok(step.t > steps[index - 1].t)
    const [left, right] = step.pointers.map((pointer) => pointer.index)
    assert.ok(left <= right)
    const stats = Object.fromEntries(step.stats.map(({ label, value }) => [label, value]))
    assert.equal(stats['当前和'], nums[left] + nums[right])
    assert.equal(stats['目标值'], target)
    assert.equal(stats['一基下标'], step.result.length ? `[${step.result.join(', ')}]` : '未找到')
    if (step.sfx === 'compare') {
      const [nextLeft, nextRight] = steps[index + 1].pointers.map((pointer) => pointer.index)
      if (nums[left] + nums[right] < target) assert.deepEqual([nextLeft, nextRight], [left + 1, right])
      else assert.deepEqual([nextLeft, nextRight], [left, right - 1])
    }
  }
  return steps
}

test('LC167 default recording and seeking preserve the one-based answer', () => {
  assert.deepEqual(check(fixture.input.nums, fixture.input.target), fixture.steps)
  assert.equal(fixture.scene, 'array-2ptrs')
  assert.deepEqual(fixture.steps.at(-1).result, [1, 2])
  assert.ok(fixture.steps.some((step) => step.sfx === 'compare'))
  assert.ok(fixture.steps.some((step) => step.sfx === 'match'))
  const engine = new PlayerEngine(fixture)
  for (const frame of [...fixture.steps].reverse()) {
    engine.seek(frame.t)
    assert.deepEqual(engine.getSnapshot().frame, frame)
  }
})

test('LC167 agrees with a pair oracle for sorted arrays, duplicates and absent answers', () => {
  for (let length = 2; length <= 6; length++) for (let code = 0; code < 4 ** length; code++) {
    let value = code
    const nums = Array.from({ length }, () => { const digit = value % 4 - 2; value = Math.floor(value / 4); return digit }).sort((a, b) => a - b)
    for (let target = -4; target <= 3; target++) check(nums, target)
  }
  for (const [nums, target] of [[[0, 0], 0], [[1, 1, 1], 2], [[-1_000_000, 1_000_000], 0], [Array(12).fill(3), 6], [[1, 2], 10]]) check(nums, target)
})

test('LC167 validates sorted input and one-based result snapshots', () => {
  for (const input of [{ nums: [2, 1], target: 3 }, { nums: [1], target: 1 }, { nums: Array(13).fill(1), target: 2 }, { nums: [1, 1.5], target: 2 }, { nums: [1, 2], target: NaN }, { nums: [1, 2], target: 3, extra: true }]) {
    assert.equal(twoSumSortedInputSchema.safeParse(input).success, false)
    assert.throws(() => twoSumSorted(input))
  }
  for (const result of [[0, 1], [1, 1], [1, 3], [2, 1], [1, 5], [1], [1, 2, 3], 1]) {
    const story = structuredClone(fixture)
    story.steps.at(-1).result = result
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('LC167 catalog, form and rerecording use the sorted track independently', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/two-sum-ii-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ recordStory, stories }, { SortedArrayParameters }, { findTrack }] = await Promise.all([
      server.ssrLoadModule('/src/story/catalog.ts'), server.ssrLoadModule('/src/pages/play.tsx'), server.ssrLoadModule('/src/lib/catalog.ts'),
    ])
    const before = JSON.stringify(stories)
    const recording = recordStory('two-sum-ii', { nums: [-3, 0, 0, 5], target: 0 })
    assert.deepEqual(recording.steps.at(-1).result, [2, 3])
    assert.throws(() => recordStory('two-sum-ii', { nums: [2, 1], target: 3 }))
    assert.equal(JSON.stringify(stories), before)
    const engine = new PlayerEngine(recording)
    assert.equal(engine.getSnapshot().time, 0)
    assert.equal(engine.getSnapshot().playing, false)
    assert.equal(findTrack('two-sum-ii').track.title, '167 两数之和 II')
    const page = renderToStaticMarkup(React.createElement(SortedArrayParameters, { input: fixture.input, onRecord: () => {} }))
    assert.match(page, /升序数组 nums/)
    assert.match(page, /目标值 target/)
    assert.match(page, /重录本曲/)
  } finally { await server.close() }
})
