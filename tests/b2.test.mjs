import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Route, Routes } from 'react-router-dom'
import { StaticRouter } from 'react-router-dom/server.js'
import { createServer } from 'vite'
import { reverseLinkedList } from '../src/steppers/reverseLinkedList.ts'
import { storySchema } from '../src/story/schema.ts'

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const fixture = load('../data/stories/reverse-linked-list.json')

test('B2 reuses the reverse-list fixture, renderer and recording path', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/b2-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ playlists, findTrack }, { stories, recordStory }, { Home }, { PlaylistPage }, { ArrayParameters }, { StoryScene }] = await Promise.all([
      server.ssrLoadModule('/src/lib/catalog.ts'),
      server.ssrLoadModule('/src/story/catalog.ts'),
      server.ssrLoadModule('/src/pages/home.tsx'),
      server.ssrLoadModule('/src/pages/playlist.tsx'),
      server.ssrLoadModule('/src/pages/play.tsx'),
      server.ssrLoadModule('/src/scenes/StoryScene.tsx'),
    ])
    const metadata = load('../data/playlists/linked-night.json')
    assert.deepEqual(playlists.map((playlist) => playlist.id), ['B0', 'B1', 'B2'])
    assert.equal(new Set(playlists.map((playlist) => playlist.id)).size, playlists.length)
    const b2 = playlists[2]
    assert.equal(b2.title, '链表夜跑')
    assert.deepEqual(metadata.tags, ['链表'])
    assert.deepEqual(metadata.trackIds, ['reverse-linked-list', 'merge-two-lists', 'linked-cycle', 'linked-cycle-ii'])
    assert.deepEqual(b2.tracks.map((track) => track.id), metadata.trackIds)
    assert.strictEqual(b2.tracks[0], playlists[0].tracks.find((track) => track.id === metadata.trackIds[0]))
    assert.equal(b2.duration, '2 分 10 秒')
    assert.equal(b2.tracks[0].duration, '00:30')
    assert.equal(findTrack('reverse-linked-list', 'B2').playlist.id, 'B2')
    assert.equal(findTrack('reverse-linked-list').playlist.id, 'B0')
    const home = renderToStaticMarkup(React.createElement(StaticRouter, {}, React.createElement(Home)))
    assert.match(home, /链表夜跑/)
    assert.doesNotMatch(home, /窗口练习 · 一段区间/)
    const renderRoute = (path, pattern, component) => renderToStaticMarkup(React.createElement(StaticRouter, { location: path },
      React.createElement(Routes, {}, React.createElement(Route, { path: pattern, element: React.createElement(component) }))))
    const album = renderRoute('/playlist/B2', '/playlist/:id', PlaylistPage)
    assert.match(album, /4 首曲目/)
    assert.match(album, /href="\/play\/reverse-linked-list\?playlist=B2"/)
    assert.match(album, /href="\/play\/merge-two-lists"/)
    assert.match(album, /href="\/play\/linked-cycle"/)
    assert.match(album, /href="\/play\/linked-cycle-ii"/)
    assert.equal(findTrack('linked-cycle-ii', 'B2').track.title, '142 环形链表 II')
    assert.equal(findTrack('linked-cycle', 'B2').track.title, '141 环形链表')
    assert.equal(findTrack('merge-two-lists', 'B2').track.title, '21 合并两个有序链表')
    const form = renderToStaticMarkup(React.createElement(ArrayParameters, { problem: fixture.problem, input: fixture.input, onRecord: () => {} }))
    assert.match(form, /链表节点 nums/)
    assert.match(form, /重录本曲/)

    const story = storySchema.parse(fixture)
    assert.deepEqual(stories[story.id], story)
    assert.equal(story.scene, 'LinkedList')
    assert.equal(story.steps.at(-1).t, 30)
    assert.deepEqual(reverseLinkedList(story.input), story.steps)
    const svg = renderToStaticMarkup(React.createElement(StoryScene, { story, frame: story.steps[0] }))
    assert.match(svg, /链表场景/)
    assert.match(svg, /箭头为 next/)
    for (const nums of [[], [7], [3, -1, 3, 0], Array.from({ length: 12 }, (_, i) => i)]) {
      const recording = recordStory(story.id, { nums })
      assert.equal(recording.scene, 'LinkedList')
      assert.deepEqual(recording.steps.at(-1).result, [...nums].reverse())
      assert.deepEqual(recording.steps, reverseLinkedList({ nums }))
    }
    assert.throws(() => recordStory(story.id, { nums: [1.5] }))
    assert.throws(() => recordStory(story.id, { nums: Array(13).fill(0) }))
  } finally {
    await server.close()
  }
})
