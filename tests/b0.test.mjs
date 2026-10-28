import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'
import { bestTimeStock } from '../src/steppers/bestTimeStock.ts'
import { maximumSubarray } from '../src/steppers/maximumSubarray.ts'
import { moveZeroes } from '../src/steppers/moveZeroes.ts'
import { mergeSortedArray } from '../src/steppers/mergeSortedArray.ts'
import { binarySearch } from '../src/steppers/binarySearch.ts'
import { validParentheses } from '../src/steppers/validParentheses.ts'
import { reverseLinkedList } from '../src/steppers/reverseLinkedList.ts'

const steppers = { 'best-time-stock': bestTimeStock, 'maximum-subarray': maximumSubarray, 'move-zeroes': moveZeroes, 'merge-sorted-array': mergeSortedArray, 'binary-search': binarySearch, 'valid-parentheses': validParentheses, 'reverse-linked-list': reverseLinkedList }
const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const fixtures = Object.fromEntries(Object.keys(steppers).map((id) => [id, load(`../data/stories/${id}.json`)]))
const catalog = load('../data/playlists/array-warmup.json')
const final = (steps) => steps.at(-1)
function run(id, input) {
  const original = structuredClone(input)
  const steps = steppers[id](input)
  assert.deepEqual(input, original, `${id} must not mutate caller input`)
  storySchema.parse({ ...fixtures[id], input, steps })
  return steps
}

test('B0 has all nine playable fixtures in priority order and truthful duration', () => {
  const b0 = catalog.playlists.find((playlist) => playlist.id === 'B0')
  assert.deepEqual(b0.tracks.map((track) => track.id), ['two-sum-hash', 'two-sum-brute', ...Object.keys(steppers)])
  let seconds = 0
  for (const track of b0.tracks) {
    const story = storySchema.parse(load(`../data/stories/${track.id}.json`))
    const duration = story.steps.at(-1).t
    assert.ok(duration >= 20 && duration <= 40)
    assert.equal(track.duration, `00:${duration}`)
    seconds += duration
    if (steppers[track.id]) assert.deepEqual(run(track.id, story.input), story.steps)
  }
  assert.equal(b0.duration, `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`)
  assert.ok(catalog.playlists.slice(1).every((playlist) => playlist.tracks.length === 0))
})

test('every new fixture can seek backwards, skip frames, complete and replay with exact snapshots', () => {
  for (const story of Object.values(fixtures)) {
    const engine = new PlayerEngine(story)
    for (let i = story.steps.length - 1; i >= 0; i--) {
      engine.seek(story.steps[i].t)
      assert.deepEqual(engine.getSnapshot().frame, story.steps[i])
      assert.equal(engine.getSnapshot().stepIndex, i)
    }
    engine.setRate(2)
    engine.play()
    engine.advance(100)
    assert.equal(engine.getSnapshot().playing, false)
    assert.deepEqual(engine.getSnapshot().frame, story.steps.at(-1))
    engine.play()
    assert.equal(engine.getSnapshot().time, 0)
    assert.deepEqual(engine.getSnapshot().frame, story.steps[0])
  }
})

test('stock respects buy-before-sell and returns zero for falling, equal and singleton inputs', () => {
  for (const [nums, expected] of [[[7, 1, 5, 3, 6, 4], 5], [[7, 6, 4, 3, 1], 0], [[2, 2], 0], [[9], 0], [[9, 1, 2], 1], [[0, 1], 1]]) {
    const last = final(run('best-time-stock', { nums }))
    assert.equal(last.result, expected)
    if (expected > 0) {
      const [buy, sell] = last.highlight
      assert.ok(buy < sell)
      assert.equal(nums[sell] - nums[buy], expected)
    }
  }
})

test('Kadane handles all negatives, zero and singleton without admitting the empty subarray', () => {
  for (const [nums, expected] of [[[-8, -3, -6, -2, -5], -2], [[-5], -5], [[0, 0], 0], [[1], 1], [[5, -9, 6, 2], 8]]) {
    const last = final(run('maximum-subarray', { nums }))
    assert.equal(last.result, expected)
    assert.equal(last.highlight.reduce((sum, index) => sum + nums[index], 0), expected)
    assert.ok(last.highlight.length > 0)
  }
})

test('move zeroes preserves nonzero order and complete snapshots through writes and fill', () => {
  for (const nums of [[], [0], [0, 0, 0], [1, -2, 3], [0, -1, 0, 2, -1, 0]]) {
    const steps = run('move-zeroes', { nums })
    const nonzero = nums.filter((value) => value !== 0)
    const expected = [...nonzero, ...Array(nums.length - nonzero.length).fill(0)]
    assert.deepEqual(final(steps).values, expected)
    assert.deepEqual(final(steps).result, expected)
    assert.deepEqual(steps[0].values, nums)
  }
})

test('backward merge handles empty sides, duplicates, negatives and unconsumed first prefix', () => {
  for (const [first, second] of [[[], []], [[], [1, 2]], [[1, 2], []], [[-3, 1, 1], [-2, 1]], [[4, 5], [1, 2]], [[1, 2], [3, 4]]]) {
    const input = { nums: [...first, ...Array(second.length).fill(0)], m: first.length, nums2: second }
    const steps = run('merge-sorted-array', input)
    const expected = [...first, ...second].sort((a, b) => a - b)
    assert.deepEqual(final(steps).result, expected)
    assert.deepEqual(final(steps).values, expected)
    assert.deepEqual(steps[0].values, input.nums)
    for (const frame of steps) assert.deepEqual(frame.secondary.values, second)
  }
})

test('binary search hits either boundary and rejects empty/absent targets without invalid pointers', () => {
  for (const nums of [[], [2], [-5, 0, 3, 9], [1, 1, 1]]) for (const target of [-8, -5, 0, 1, 2, 3, 9, 12]) {
    const steps = run('binary-search', { nums, target })
    const result = final(steps).result
    if (nums.includes(target)) assert.equal(nums[result], target)
    else {
      assert.equal(result, -1)
      assert.ok(final(steps).bounds.left > final(steps).bounds.right)
    }
    for (let i = 1; i < steps.length; i++) {
      assert.ok(steps[i].bounds.left >= steps[i - 1].bounds.left)
      assert.ok(steps[i].bounds.right <= steps[i - 1].bounds.right)
    }
  }
})

test('stack accepts nesting and adjacent pairs; detects crossing, unexpected close and leftover opens', () => {
  for (const [text, expected] of [['', true], ['([]){}', true], ['{[()]}', true], ['()[]{}', true], ['([)]', false], [']', false], ['((', false], ['(()', false], ['())', false]]) {
    const steps = run('valid-parentheses', { text })
    assert.equal(final(steps).result, expected)
    assert.deepEqual(steps[0].stack, [])
    if (expected) assert.deepEqual(final(steps).stack, [])
  }
})

test('linked-list snapshots preserve saved suffix and final head traverses each node once, including duplicate values', () => {
  for (const nums of [[], [7], [1, 2, 3, 4], [2, 2, 2], [-1, 0]]) {
    const steps = run('reverse-linked-list', { nums })
    assert.deepEqual(steps[0].links, nums.map((_, index) => index + 1 < nums.length ? index + 1 : null))
    for (const step of steps) {
      const roots = [step.head, ...step.pointers.map((p) => p.index)]
      const reachable = new Set()
      for (const root of roots) {
        const path = new Set()
        for (let node = root; node !== null; node = step.links[node]) {
          assert.ok(!path.has(node), 'no cycle in any snapshot')
          path.add(node)
          reachable.add(node)
        }
      }
      assert.equal(reachable.size, nums.length, 'no lost nodes while reversing')
    }
    const last = final(steps)
    const seen = new Set(), output = []
    for (let node = last.head; node !== null; node = last.links[node]) {
      assert.ok(!seen.has(node))
      seen.add(node)
      output.push(nums[node])
    }
    assert.equal(seen.size, nums.length)
    assert.deepEqual(output, [...nums].reverse())
    assert.deepEqual(last.result, output)
  }
})

test('stock and Kadane agree with exhaustive subarray/pair oracles for small deterministic arrays', () => {
  for (let seed = 0; seed < 64; seed++) {
    const nums = Array.from({ length: 1 + seed % 6 }, (_, index) => ((seed * (index + 3) + index * index) % 11) - 5)
    const prices = nums.map((value) => value + 5)
    let profit = 0, best = -Infinity
    for (let i = 0; i < nums.length; i++) {
      let sum = 0
      for (let j = i; j < nums.length; j++) {
        sum += nums[j]
        best = Math.max(best, sum)
        profit = Math.max(profit, prices[j] - prices[i])
      }
    }
    assert.equal(final(run('best-time-stock', { nums: prices })).result, profit)
    assert.equal(final(run('maximum-subarray', { nums })).result, best)
  }
})

test('schema rejects invalid inputs, incompatible scenes and incomplete/out-of-range snapshots', () => {
  for (const [id, input] of [['best-time-stock', { nums: [] }], ['best-time-stock', { nums: [-1] }], ['maximum-subarray', { nums: [] }], ['binary-search', { nums: [2, 1], target: 1 }], ['merge-sorted-array', { nums: [1, 0], m: 2, nums2: [2] }], ['merge-sorted-array', { nums: [2, 1, 0], m: 2, nums2: [1] }], ['valid-parentheses', { text: '(a)' }], ['move-zeroes', { nums: [1.5] }]]) assert.throws(() => steppers[id](input))
  for (const [id, mutate] of [
    ['move-zeroes', (s) => { delete s.steps[0].values }],
    ['merge-sorted-array', (s) => { s.steps[0].secondary.pointers = [{ label: 'j', index: 99 }] }],
    ['binary-search', (s) => { s.steps[0].bounds.right = 99 }],
    ['binary-search', (s) => { s.scene = 'Array1D' }],
    ['valid-parentheses', (s) => { s.steps[0].stack = [{ value: '(', index: 99 }] }],
    ['valid-parentheses', (s) => { delete s.steps[0].stack }],
    ['reverse-linked-list', (s) => { s.steps[0].links = [99] }],
    ['reverse-linked-list', (s) => { s.steps[0].head = 99 }],
    ['reverse-linked-list', (s) => { delete s.steps[0].links }],
  ]) {
    const story = structuredClone(fixtures[id])
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})
