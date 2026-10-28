import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Routes, Route } from 'react-router-dom'
import { StaticRouter } from 'react-router-dom/server.js'
import { createServer } from 'vite'
import { storySchema } from '../src/story/schema.ts'
import { PlayerEngine } from '../src/player/PlayerEngine.ts'

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
// Reuse B0 in memory to exercise the shared renderer without recording a B1 story.
const source = load('../data/stories/two-sum-hash.json')
const sceneStory = () => ({ ...structuredClone(source), scene: 'array-2ptrs' })

test('two-pointer schema accepts optional/empty windows and rejects invalid scene state', () => {
  assert.ok(storySchema.safeParse(sceneStory()).success)
  for (const bounds of [{ left: 0, right: 3 }, { left: 1, right: 1 }, { left: 2, right: 1 }, { left: 4, right: 3 }, { left: 0, right: -1 }]) {
    const story = sceneStory()
    story.steps[0].bounds = bounds
    storySchema.parse(story)
  }
  for (const mutate of [
    (s) => { s.steps[0].bounds = { left: -1, right: 2 } },
    (s) => { s.steps[0].bounds = { left: 0, right: 4 } },
    (s) => { s.steps[0].bounds = { left: 5, right: 3 } },
    (s) => { s.steps[0].bounds = { left: 0.5, right: 2 } },
    (s) => { s.steps[0].pointers = [{ label: 'right', index: 4 }] },
    (s) => { s.steps[0].stack = [] },
    (s) => { s.scene = 'Array1D'; s.steps[0].bounds = { left: 0, right: 2 } },
  ]) {
    const story = sceneStory()
    mutate(story)
    assert.equal(storySchema.safeParse(story).success, false)
  }
})

test('B1 links LC11, LC15, LC42, LC3, LC76, LC167, empty playlists remain safe and StoryScene selects the two-pointer SVG', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.tmp/b1-test-vite', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const [{ playlists, findTrack }, { Home }, { PlaylistPage }, { StoryScene }] = await Promise.all([
      server.ssrLoadModule('/src/lib/catalog.ts'),
      server.ssrLoadModule('/src/pages/home.tsx'),
      server.ssrLoadModule('/src/pages/playlist.tsx'),
      server.ssrLoadModule('/src/scenes/StoryScene.tsx'),
    ])
    const metadata = load('../data/playlists/pointer-night.json')
    const b1 = playlists.filter((playlist) => playlist.id === 'B1')
    assert.equal(b1.length, 1)
    assert.equal(b1[0].title, '指针夜跑')
    assert.deepEqual(metadata.trackIds, ['container-with-most-water', 'three-sum', 'trapping-rain-water', 'longest-substring', 'min-window', 'two-sum-ii'])
    assert.deepEqual(b1[0].tracks.map((track) => track.id), metadata.trackIds)
    assert.equal(findTrack(metadata.trackIds[0]).playlist.id, 'B1')
    assert.equal(findTrack(undefined), undefined)
    const home = renderToStaticMarkup(React.createElement(StaticRouter, {}, React.createElement(Home)))
    assert.match(home, /href="\/playlist\/B1"/)
    assert.match(home, /指针夜跑/)
    const album = renderToStaticMarkup(React.createElement(StaticRouter, { location: '/playlist/B1' },
      React.createElement(Routes, {}, React.createElement(Route, { path: '/playlist/:id', element: React.createElement(PlaylistPage) }))))
    assert.match(album, /指针夜跑/)
    assert.match(album, /6 首曲目/)
    assert.equal(b1[0].duration, '3 分 46 秒')
    assert.match(album, /href="\/play\/container-with-most-water"/)
    assert.match(album, /href="\/play\/three-sum"/)
    assert.match(album, /href="\/play\/trapping-rain-water"/)
    assert.match(album, /href="\/play\/longest-substring"/)
    assert.match(album, /href="\/play\/min-window"/)
    assert.match(album, /href="\/play\/two-sum-ii"/)
    assert.match(album, /进入播放页/)
    const emptyAlbum = renderToStaticMarkup(React.createElement(StaticRouter, { location: '/playlist/B2' },
      React.createElement(Routes, {}, React.createElement(Route, { path: '/playlist/:id', element: React.createElement(PlaylistPage) }))))
    assert.match(emptyAlbum, /0 首曲目/)
    assert.match(emptyAlbum, /暂无曲目/)
    assert.doesNotMatch(emptyAlbum, /进入播放页|href="\/play\//)

    const story = sceneStory()
    story.steps[0].pointers = [{ label: 'left', index: 1 }, { label: 'right', index: 1 }]
    story.steps[0].highlight = [1]
    story.steps[0].bounds = { left: 1, right: 2 }
    const engine = new PlayerEngine(storySchema.parse(story))
    engine.seek(story.steps.at(-1).t)
    engine.seek(0)
    const render = (frame) => renderToStaticMarkup(React.createElement(StoryScene, { story, frame }))
    const svg = render(engine.getSnapshot().frame)
    assert.match(svg, /<svg/)
    assert.match(svg, />left<.*>right</)
    assert.match(svg, /闭区间.*1.*2/)
    assert.match(svg, /fill="var\(--accent\)"/)
    assert.doesNotMatch(svg, /区间外已排除/)
    assert.doesNotMatch(render({ ...story.steps[0], bounds: undefined }), /闭区间/)
    assert.match(render({ ...story.steps[0], bounds: { left: 2, right: 1 } }), /空区间/)
    assert.match(renderToStaticMarkup(React.createElement(StoryScene, {
      story: { ...story, input: { ...story.input, nums: [] } },
      frame: { ...story.steps[0], pointers: [], highlight: [], bounds: undefined },
    })), /空数组/)
  } finally {
    await server.close()
  }
})
