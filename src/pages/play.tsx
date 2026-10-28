import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { findTrack } from '@/lib/catalog'
import type { Playlist, Track } from '@/lib/catalog'
import { NotFound } from '@/pages/not-found'
import { recordStory, stories } from '@/story/catalog'
import { containerInputSchema, threeSumInputSchema, twoSumInputSchema } from '@/story/schema'
import type { ContainerInput, Story, ThreeSumInput, TwoSumInput } from '@/story/schema'
import { usePlayer } from '@/player/usePlayer'
import { useSound } from '@/player/useSound'
import { StoryScene } from '@/scenes/StoryScene'

function clock(seconds: number) {
  const whole = Math.floor(seconds)
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

export function PlayPage() {
  const { trackId } = useParams()
  const entry = findTrack(trackId)
  if (!entry || !stories[entry.track.id]) return <NotFound message="没有找到这首曲目。" />
  return <PlayerSession key={entry.playlist.id} {...entry} />
}

function PlayerSession({ playlist, track }: { playlist: Playlist, track: Track }) {
  const [recordings, setRecordings] = useState<Record<string, Story>>(stories)
  const story = recordings[track.id]
  const navigate = useNavigate()
  const remixes = playlist.tracks.filter((item) => recordings[item.id].problem === story.problem)

  function rerecord(input: TwoSumInput | ContainerInput | ThreeSumInput) {
    // Only remixes of the current problem share the new recording input.
    const next = Object.fromEntries(remixes.map((item) => [item.id, recordStory(item.id, input)]))
    setRecordings((previous) => ({ ...previous, ...next }))
  }

  return <div className="player-page">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link to={`/playlist/${playlist.id}`} className="inline-flex items-center gap-2 text-sm text-text-2 hover:text-text">
        <Icon name="back" />{playlist.title}
      </Link>
      <p className="muted">本地分镜 · 默认静音</p>
    </div>
    <div className="player-layout">
      <Playback story={story} title={track.title} playlist={playlist} />

      <Card className="queue-panel p-4">
        <section aria-labelledby="queue-title">
          <div className="panel-heading">
            <h2 id="queue-title">播放队列</h2>
            <span className="muted">{playlist.tracks.length} 首</span>
          </div>
          <ol className="queue-list">
            {playlist.tracks.map((item, index) => <li key={item.id}>
              <NavLink className="queue-link" to={`/play/${item.id}`}>
                <span className="text-sm">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="muted mt-1">{clock(recordings[item.id].steps.at(-1)!.t)} · {item.remix}</p>
                </div>
              </NavLink>
            </li>)}
          </ol>
        </section>
      </Card>

      <Card className="info-panel p-5">
        <aside aria-labelledby="info-title" className="space-y-6">
          <section className="space-y-3">
            <h2 id="info-title">曲目信息</h2>
            <h3>{track.title}</h3>
            <p className="muted">{track.subtitle}</p>
            <p className="complexity-badge">{track.complexity}</p>
            <p className="muted">时长 {clock(story.steps.at(-1)!.t)} · {story.steps.length} 帧</p>
            <p className="muted break-words">当前录制：{inputDescription(story)}</p>
          </section>
          <Separator />
          <section className="space-y-3" aria-labelledby="remix-title">
            <h2 id="remix-title">{remixes.length > 1 ? 'Remix' : '解法'}</h2>
            {remixes.length > 1 ? <label>解法版本
              <select value={track.id} onChange={(event) => navigate(`/play/${event.target.value}`)} aria-describedby="remix-note">
                {remixes.map((item) => <option key={item.id} value={item.id}>{item.remix}</option>)}
              </select>
            </label> : <p className="muted">{track.remix}</p>}
            <p id="remix-note" className="muted">切换曲目后归零并暂停；同一歌单内保留已重录的参数。</p>
          </section>
          <Separator />
          {story.problem === 'two-sum' ? <TwoSumParameters input={story.input} onRecord={rerecord} />
            : story.problem === 'container-with-most-water' || story.problem === 'three-sum' ? <ArrayParameters key={story.id} problem={story.problem} input={story.input} onRecord={rerecord} /> : <section className="space-y-3">
            <h2>示例分镜</h2>
            <p className="muted">本曲使用内置示例。播放或拖动进度，观察每一步的完整状态；用队列或上一曲、下一曲切换。</p>
          </section>}
        </aside>
      </Card>
    </div>
  </div>
}

function inputDescription(story: Story) {
  if (story.problem === 'valid-parentheses') return `text = ${JSON.stringify(story.input.text)}`
  const input = story.input
  return `nums = [${input.nums.join(', ')}]${'target' in input ? `，target = ${input.target}` : ''}${'nums2' in input ? `，m = ${input.m}，nums2 = [${input.nums2.join(', ')}]` : ''}`
}

function TwoSumParameters({ input, onRecord }: { input: TwoSumInput, onRecord: (input: TwoSumInput) => void }) {
  const [nums, setNums] = useState(JSON.stringify(input.nums))
  const [target, setTarget] = useState(String(input.target))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    let parsedNums: unknown
    try { parsedNums = JSON.parse(nums) } catch {
      setError('数组格式不正确，请输入 JSON 数组，例如 [3, 2, 4, 7]。')
      setNotice('')
      return
    }
    const result = twoSumInputSchema.safeParse({ nums: parsedNums, target: target.trim() ? Number(target) : NaN })
    if (!result.success) {
      setError('请输入 2–12 个整数（每个在 ±1000000 内），target 为 ±2000000 内的整数。')
      setNotice('')
      return
    }
    onRecord(result.data)
    setError('')
    setNotice('已重录两个 Remix，播放位置已归零。')
  }
  return <form aria-labelledby="params-title" onSubmit={submit} noValidate>
    <h2 id="params-title" className="mb-3">修改参数</h2>
    <fieldset className="space-y-4" aria-describedby="params-note params-error">
      <legend className="sr-only">两数之和参数</legend>
      <label>数组 nums<input name="nums" value={nums} onChange={(event) => setNums(event.target.value)} aria-invalid={!!error} spellCheck={false} /></label>
      <label>目标值 target<input name="target" type="number" step="1" value={target} onChange={(event) => setTarget(event.target.value)} aria-invalid={!!error} /></label>
      <Button type="submit" className="w-full">重录两个 Remix</Button>
    </fieldset>
    <p id="params-note" className="muted mt-3">2–12 个整数；重录后两种解法使用同一输入。长数组可横向滚动，时长随步骤增加。</p>
    <p id="params-error" role="alert" className="form-error">{error}</p>
    <p role="status" className="muted mt-3">{notice}</p>
  </form>
}

function ArrayParameters({ problem, input, onRecord }: { problem: 'container-with-most-water' | 'three-sum', input: ContainerInput | ThreeSumInput, onRecord: (input: ContainerInput | ThreeSumInput) => void }) {
  const isThreeSum = problem === 'three-sum'
  const [nums, setNums] = useState(JSON.stringify(input.nums))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    let parsedNums: unknown
    try { parsedNums = JSON.parse(nums) } catch {
      setError(`数组格式不正确，请输入 JSON 数组，例如 ${isThreeSum ? '[-1, 0, 1, 2, -1, -4]' : '[1, 8, 6, 2, 5, 4, 8, 3, 7]'}。`)
      setNotice('')
      return
    }
    const result = (isThreeSum ? threeSumInputSchema : containerInputSchema).safeParse({ nums: parsedNums })
    if (!result.success) {
      setError(isThreeSum ? '请输入 3–12 个整数，每个在 ±1000000 内。' : '请输入 2–12 个非负整数，每个高度在 0–1000000 内。')
      setNotice('')
      return
    }
    onRecord(result.data)
    setError('')
    setNotice('已重录本曲，播放位置已归零并暂停。')
  }
  return <form aria-labelledby="params-title" onSubmit={submit} noValidate>
    <h2 id="params-title" className="mb-3">修改参数</h2>
    <fieldset className="space-y-4" aria-describedby="params-note params-error">
      <legend className="sr-only">{isThreeSum ? '三数之和参数' : '盛最多水的容器参数'}</legend>
      <label>{isThreeSum ? '数组 nums' : '高度数组 nums'}<input name="nums" value={nums} onChange={(event) => setNums(event.target.value)} aria-invalid={!!error} spellCheck={false} /></label>
      <Button type="submit" className="w-full">重录本曲</Button>
    </fieldset>
    <p id="params-note" className="muted mt-3">{isThreeSum ? '3–12 个整数；默认录制 40 秒，步骤较多时延长。' : '2–12 个非负整数；本曲录制为 36 秒。'}非法输入不会替换现有录制；离开歌单或刷新后恢复默认。</p>
    <p id="params-error" role="alert" className="form-error">{error}</p>
    <p role="status" className="muted mt-3">{notice}</p>
  </form>
}

function Playback({ story, title, playlist }: { story: Story, title: string, playlist: Playlist }) {
  const { engine, time, duration, playing, rate, frame, stepIndex } = usePlayer(story)
  const sound = useSound(frame, playing)
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const fade = useMemo(() => {
    const tokens = getComputedStyle(document.documentElement)
    const ease = tokens.getPropertyValue('--ease').match(/[\d.]+/g)!.map(Number) as [number, number, number, number]
    return { duration: reducedMotion ? 0 : parseFloat(tokens.getPropertyValue('--dur')) / 1000, ease }
  }, [reducedMotion])
  const trackIndex = playlist.tracks.findIndex((track) => track.id === story.id)
  return <Card className="playback-panel p-5">
    <section aria-labelledby="stage-title">
      <div className="panel-heading flex-wrap">
        <h1 id="stage-title" className="text-xl">{title}</h1>
        <span className="muted">第 {stepIndex + 1} / {story.steps.length} 帧</span>
      </div>
      <motion.div key={story.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade}>
        <StoryScene story={story} frame={frame} />
      </motion.div>
      <div className="caption-slot">
        <motion.p key={`${story.id}-${stepIndex}-${frame.caption}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade} className="muted" aria-live="off">{frame.caption}</motion.p>
      </div>
      <Separator />
      <div aria-label="播放控制">
        <div className="transport">
          <Button disabled={trackIndex === 0} onClick={() => navigate(`/play/${playlist.tracks[trackIndex - 1].id}`)} aria-label="上一曲"><Icon name="previous" /></Button>
          <Button variant="primary" onClick={() => playing ? engine.pause() : engine.play()} aria-label={playing ? '暂停' : time >= duration ? '重播' : '播放'}><Icon name={playing ? 'pause' : 'play'} />{playing ? '暂停' : time >= duration ? '重播' : '播放'}</Button>
          <Button onClick={() => engine.seek(0)} aria-label="回到开头">归零</Button>
          <Button disabled={trackIndex === playlist.tracks.length - 1} onClick={() => navigate(`/play/${playlist.tracks[trackIndex + 1].id}`)} aria-label="下一曲"><Icon name="next" /></Button>
        </div>
        <div className="progress-row">
          <span>{clock(time)}</span>
          <input type="range" min="0" max={duration} step="0.01" value={time} onChange={(event) => engine.seek(Number(event.target.value))} aria-label="播放进度" aria-valuetext={`${clock(time)} / ${clock(duration)}`} />
          <span>{clock(duration)}</span>
        </div>
        <div className="playback-options">
          <label className="rate-control">倍速
            <select value={rate} onChange={(event) => engine.setRate(Number(event.target.value))}>
              {[0.5, 1, 1.5, 2].map((value) => <option key={value} value={value}>{value}×</option>)}
            </select>
          </label>
          <label className="sound-control"><input type="checkbox" checked={sound.enabled} onChange={(event) => { void sound.toggle(event.target.checked) }} />极简音效{sound.enabled ? '开' : '关'}</label>
        </div>
        {sound.error && <p role="status" className="muted mt-3">{sound.error}</p>}
      </div>
    </section>
  </Card>
}
