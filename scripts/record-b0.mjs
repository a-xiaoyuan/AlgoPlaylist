// Offline, deterministic recording. Existing two-sum fixtures are never rewritten.
import { readFileSync, writeFileSync } from 'node:fs'
import { storySchema } from '../src/story/schema.ts'
import { bestTimeStock } from '../src/steppers/bestTimeStock.ts'
import { maximumSubarray } from '../src/steppers/maximumSubarray.ts'
import { moveZeroes } from '../src/steppers/moveZeroes.ts'
import { mergeSortedArray } from '../src/steppers/mergeSortedArray.ts'
import { binarySearch } from '../src/steppers/binarySearch.ts'
import { validParentheses } from '../src/steppers/validParentheses.ts'
import { reverseLinkedList } from '../src/steppers/reverseLinkedList.ts'

const recordings = [
  ['best-time-stock', 'best-time-to-buy-and-sell-stock', 'one-pass', 'Array1D', { nums: [7, 1, 5, 3, 6, 4] }, bestTimeStock,
    '121 买卖股票最佳时机', '记住先前最低价，一趟扫描更新最大利润。', '时间 O(n) · 空间 O(1)', '一趟扫描'],
  ['maximum-subarray', 'maximum-subarray', 'kadane', 'Array1D', { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, maximumSubarray,
    '53 最大子数组和', '延续当前区间，还是从当前元素重新开始？', '时间 O(n) · 空间 O(1)', 'Kadane'],
  ['move-zeroes', 'move-zeroes', 'two-pointers', 'Array1D', { nums: [0, 1, 0, 3, 12] }, moveZeroes,
    '283 移动零', 'read 扫描，write 收集非零数，最后补零。', '时间 O(n) · 空间 O(1)', '双指针'],
  ['merge-sorted-array', 'merge-sorted-array', 'backward', 'Array1D', { nums: [1, 2, 3, 0, 0, 0], m: 3, nums2: [2, 5, 6] }, mergeSortedArray,
    '88 合并两个有序数组', '比较两段末尾，从后往前写入预留空间。', '时间 O(m+n) · 空间 O(1)', '从后往前'],
  ['binary-search', 'binary-search', 'closed-interval', 'BinarySearch', { nums: [-1, 0, 3, 5, 9, 12], target: 9 }, binarySearch,
    '704 二分查找', '维护闭区间，每次排除一半候选元素。', '时间 O(log n) · 空间 O(1)', '闭区间二分'],
  ['valid-parentheses', 'valid-parentheses', 'stack', 'Stack', { text: '([]){}' }, validParentheses,
    '20 有效的括号', '左括号入栈，右括号与栈顶配对。', '时间 O(n) · 空间 O(n)', '栈'],
  ['reverse-linked-list', 'reverse-linked-list', 'iterative', 'LinkedList', { nums: [1, 2, 3, 4] }, reverseLinkedList,
    '206 反转链表', '保存 next，反转连线，再移动 prev 与 curr。', '时间 O(n) · 空间 O(1)', '迭代反转'],
]
const playlistURL = new URL('../data/playlists/array-warmup.json', import.meta.url)
const catalog = JSON.parse(readFileSync(playlistURL, 'utf8'))
const tracks = []
for (const [id, problem, remix, scene, input, stepper, title, subtitle, complexity, label] of recordings) {
  const story = storySchema.parse({ id, problem, remix, scene, input, steps: stepper(input) })
  writeFileSync(new URL(`../data/stories/${id}.json`, import.meta.url), JSON.stringify(story, null, 2) + '\n')
  tracks.push({ id, title, subtitle, duration: `00:${story.steps.at(-1).t}`, complexity, remix: label })
}
const b0 = catalog.playlists.find((playlist) => playlist.id === 'B0')
b0.tracks = [...b0.tracks.filter((track) => track.id.startsWith('two-sum-')), ...tracks]
b0.description = '从两数之和出发，依次练习一趟扫描、Kadane、双指针、合并、二分、栈与链表。'
const seconds = b0.tracks.reduce((sum, track) => sum + track.duration.split(':').reduce((m, s) => m * 60 + Number(s), 0), 0)
b0.duration = `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`
writeFileSync(playlistURL, JSON.stringify(catalog, null, 2) + '\n')
console.log(`已录制 ${recordings.length} 首，B0 共 ${b0.tracks.length} 首 / ${b0.duration}。`)
