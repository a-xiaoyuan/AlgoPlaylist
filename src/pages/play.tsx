import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@/components/icon'
import { Cover } from '@/components/cover'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { findTrack } from '@/lib/catalog'
import type { Playlist, Track } from '@/lib/catalog'
import { NotFound } from '@/pages/not-found'
import { recordStory, stories } from '@/story/catalog'
import { sortColorsInputSchema, removeDuplicatesSortedInputSchema, containerInputSchema, longestSubstringInputSchema, minWindowInputSchema, minSubarraySumInputSchema, threeSumInputSchema, trappingRainWaterInputSchema, twoSumInputSchema, twoSumSortedInputSchema } from '@/story/schema'
import type { ContainerInput, LongestSubstringInput, MinWindowInput, MinSubarraySumInput, Story, ThreeSumInput, TwoSumInput, TwoSumSortedInput } from '@/story/schema'
import { usePlayer } from '@/player/usePlayer'
import { useSound } from '@/player/useSound'
import { frameAtProgress, replaceProblemRecordings } from '@/player/remix'
import type { StoryStep } from '@/story/schema'
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
  const [compareProblem, setCompareProblem] = useState<string | null>(null)
  const remixes = playlist.tracks.filter((item) => recordings[item.id].problem === story.problem)

  function rerecord(input: TwoSumInput | ContainerInput | ThreeSumInput | LongestSubstringInput | MinWindowInput | MinSubarraySumInput) {
    // Only remixes of the current problem share the new recording input.
    setRecordings((previous) => replaceProblemRecordings(previous, track.id, input, recordStory))
  }

  const comparing = compareProblem === story.problem && remixes.length >= 2
  const partnerTrack = remixes.find((item) => item.id !== track.id)
  const partner = comparing && partnerTrack ? recordings[partnerTrack.id] : undefined

  return <div className="player-page">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link to={`/playlist/${playlist.id}`} className="inline-flex items-center gap-2 text-sm text-text-2 hover:text-text">
        <Icon name="back" />{playlist.title}
      </Link>
      <p className="muted">本地分镜 · 默认静音</p>
    </div>
    <div className="player-layout">
      <Playback story={story} title={track.title} playlist={playlist} partner={partner} partnerTrack={partnerTrack} remixLabel={track.remix} />

      <Card className="info-panel p-5">
        <aside aria-labelledby="info-title" className="space-y-6">
          <section className="space-y-3">
            <div className="track-artwork"><Cover id={playlist.id} /></div>
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
            <div className="remix-list" role="group" aria-label="选择 Remix">
              {remixes.map((item) => <button key={item.id} className="remix-choice" aria-pressed={item.id === track.id} onClick={() => navigate(`/play/${item.id}`)}>
                <span>{item.remix}</span><small>{item.complexity}</small>
                {item.id === track.id && <span className="remix-current">当前</span>}
              </button>)}
            </div>
            {remixes.length >= 2 && <Button aria-pressed={comparing} onClick={() => setCompareProblem(comparing ? null : story.problem)}>{comparing ? '退出对比' : '对比两种解法'}</Button>}
            {comparing && story.problem === 'two-sum' && <section className="remix-insight" aria-label="为什么换解法">
              <h3>为什么换解法？</h3>
              <p className="muted">暴力逐对尝试，额外空间少；哈希用一张表记住已见数字，以空间换取更少的查找。</p>
              {remixes.map((item) => <div key={item.id}><strong>{item.id === track.id ? 'A' : 'B'} · {item.remix}</strong><p>{item.complexity}</p><small>{item.subtitle}</small></div>)}
            </section>}
            <p id="remix-note" className="muted">切换曲目后归零并暂停；同一歌单内保留已重录的参数。</p>
          </section>
          <Separator />
          {story.problem === 'two-sum' ? <TwoSumParameters input={story.input} onRecord={rerecord} />
            : story.problem === 'two-sum-ii' ? <SortedArrayParameters key={story.id} input={story.input} onRecord={rerecord} />
            : story.problem === 'longest-substring-without-repeating-characters' ? <StringParameters key={story.id} input={story.input} onRecord={rerecord} />
            : story.problem === 'minimum-window-substring' ? <MinWindowParameters key={story.id} input={story.input} onRecord={rerecord} />
            : story.problem === 'minimum-size-subarray-sum' ? <MinSubarraySumParameters key={story.id} input={story.input} onRecord={rerecord} />
            : story.problem === 'sort-colors' || story.problem === 'container-with-most-water' || story.problem === 'trapping-rain-water' || story.problem === 'three-sum' || story.problem === 'remove-duplicates-sorted' ? <ArrayParameters key={story.id} problem={story.problem} input={story.input} onRecord={rerecord} /> : <section className="space-y-3">
            <h2>示例分镜</h2>
            <p className="muted">本曲使用内置示例。播放或拖动进度，观察每一步的完整状态；用队列或上一曲、下一曲切换。</p>
          </section>}
        </aside>
      </Card>

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
    </div>
  </div>
}

function inputDescription(story: Story) {
  if ('s' in story.input) return `s = ${JSON.stringify(story.input.s)}，t = ${JSON.stringify(story.input.t)}`
  if ('text' in story.input) return `text = ${JSON.stringify(story.input.text)}`
  const input = story.input
  return `nums = [${input.nums.join(', ')}]${'target' in input ? `，target = ${input.target}` : ''}${'nums2' in input ? `，m = ${input.m}，nums2 = [${input.nums2.join(', ')}]` : ''}`
}

export function MinSubarraySumParameters({ input, onRecord }: { input: MinSubarraySumInput, onRecord: (input: MinSubarraySumInput) => void }) {
  const [nums, setNums] = useState(JSON.stringify(input.nums))
  const [target, setTarget] = useState(String(input.target))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    let parsedNums: unknown
    try { parsedNums = JSON.parse(nums) } catch {
      setError('数组格式不正确，请输入 JSON 数组，例如 [2, 3, 1, 2, 4, 3]。')
      setNotice('')
      return
    }
    const result = minSubarraySumInputSchema.safeParse({ nums: parsedNums, target: target.trim() ? Number(target) : NaN })
    if (!result.success) {
      setError('请输入 1–12 个正整数，target 也必须是正整数，数值须在安全整数范围内。')
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
      <legend className="sr-only">长度最小的子数组参数</legend>
      <label>数组 nums<input name="nums" value={nums} onChange={(event) => setNums(event.target.value)} aria-invalid={!!error} spellCheck={false} /></label>
      <label>目标值 target<input name="target" type="number" min="1" step="1" value={target} onChange={(event) => setTarget(event.target.value)} aria-invalid={!!error} /></label>
      <Button type="submit" className="w-full">重录本曲</Button>
    </fieldset>
    <p id="params-note" className="muted mt-3">输入 1–12 个正整数和正整数目标值，数值须在安全整数范围内。本曲 34 秒；非法输入保留现有录制，离开歌单或刷新恢复默认。</p>
    <p id="params-error" role="alert" className="form-error">{error}</p>
    <p role="status" className="muted mt-3">{notice}</p>
  </form>
}

function MinWindowParameters({ input, onRecord }: { input: MinWindowInput, onRecord: (input: MinWindowInput) => void }) {
  const [s, setS] = useState(input.s)
  const [t, setT] = useState(input.t)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const result = minWindowInputSchema.safeParse({ s, t })
    if (!result.success) {
      setError('s 和 t 各支持最多 12 个 Unicode 码点；允许空串，不支持控制字符或不完整的 Unicode 字符。')
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
      <legend className="sr-only">最小覆盖子串参数</legend>
      <label>字符串 s<input name="s" value={s} onChange={(event) => setS(event.target.value)} aria-invalid={!!error} spellCheck={false} /></label>
      <label>目标字符串 t<input name="t" value={t} onChange={(event) => setT(event.target.value)} aria-invalid={!!error} spellCheck={false} /></label>
      <Button type="submit" className="w-full">重录本曲</Button>
    </fieldset>
    <p id="params-note" className="muted mt-3">直接输入文本，无需 JSON 引号。s 和 t 各最多 12 个 Unicode 码点；空格显示为 ␠，组合字符按多个码点计数。本曲 40 秒；非法输入保留现有录制，离开歌单或刷新恢复默认。</p>
    <p id="params-error" role="alert" className="form-error">{error}</p>
    <p role="status" className="muted mt-3">{notice}</p>
  </form>
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

export function SortedArrayParameters({ input, onRecord }: { input: TwoSumSortedInput, onRecord: (input: TwoSumSortedInput) => void }) {
  const [nums, setNums] = useState(JSON.stringify(input.nums))
  const [target, setTarget] = useState(String(input.target))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    let parsedNums: unknown
    try { parsedNums = JSON.parse(nums) } catch {
      setError('数组格式不正确，请输入 JSON 数组，例如 [2, 7, 11, 15]。')
      setNotice('')
      return
    }
    const result = twoSumSortedInputSchema.safeParse({ nums: parsedNums, target: target.trim() ? Number(target) : NaN })
    if (!result.success) {
      setError('请输入 2–12 个升序整数（每个在 ±1000000 内），target 为 ±2000000 内的整数。')
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
      <legend className="sr-only">两数之和 II 参数</legend>
      <label>升序数组 nums<input name="nums" value={nums} onChange={(event) => setNums(event.target.value)} aria-invalid={!!error} spellCheck={false} /></label>
      <label>目标值 target<input name="target" type="number" step="1" value={target} onChange={(event) => setTarget(event.target.value)} aria-invalid={!!error} /></label>
      <Button type="submit" className="w-full">重录本曲</Button>
    </fieldset>
    <p id="params-note" className="muted mt-3">2–12 个升序整数，允许重复；无解时返回空数组。本曲 36 秒；非法输入保留现有录制，离开歌单或刷新恢复默认。</p>
    <p id="params-error" role="alert" className="form-error">{error}</p>
    <p role="status" className="muted mt-3">{notice}</p>
  </form>
}

export function ArrayParameters({ problem, input, onRecord }: { problem: 'container-with-most-water' | 'trapping-rain-water' | 'three-sum' | 'remove-duplicates-sorted' | 'sort-colors', input: ContainerInput | ThreeSumInput, onRecord: (input: ContainerInput | ThreeSumInput) => void }) {
  const isColors = problem === 'sort-colors'
  const isDedup = problem === 'remove-duplicates-sorted'
  const isThreeSum = problem === 'three-sum'
  const isRain = problem === 'trapping-rain-water'
  const [nums, setNums] = useState(JSON.stringify(input.nums))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    let parsedNums: unknown
    try { parsedNums = JSON.parse(nums) } catch {
      setError(`数组格式不正确，请输入 JSON 数组，例如 ${isColors ? '[2, 0, 2, 1, 1, 0]' : isDedup ? '[1, 1, 2]' : isThreeSum ? '[-1, 0, 1, 2, -1, -4]' : isRain ? '[0, 1, 0, 2]' : '[1, 8, 6, 2, 5, 4, 8, 3, 7]'}。`)
      setNotice('')
      return
    }
    const result = (isColors ? sortColorsInputSchema : isDedup ? removeDuplicatesSortedInputSchema : isThreeSum ? threeSumInputSchema : isRain ? trappingRainWaterInputSchema : containerInputSchema).safeParse({ nums: parsedNums })
    if (!result.success) {
      setError(isColors ? '请输入 1–12 个整数，每个只能是 0、1 或 2。' : isDedup ? '请输入 1–12 个升序整数，每个在 ±1000000 内。' : isThreeSum ? '请输入 3–12 个整数，每个在 ±1000000 内。' : '请输入 2–12 个非负整数，每个高度在 0–1000000 内。')
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
      <legend className="sr-only">{isColors ? '颜色分类参数' : isDedup ? '删除重复项参数' : isThreeSum ? '三数之和参数' : isRain ? '接雨水参数' : '盛最多水的容器参数'}</legend>
      <label>{isColors ? '颜色数组 nums' : isDedup ? '升序数组 nums' : isThreeSum ? '数组 nums' : '高度数组 nums'}<input name="nums" value={nums} onChange={(event) => setNums(event.target.value)} aria-invalid={!!error} spellCheck={false} /></label>
      <Button type="submit" className="w-full">重录本曲</Button>
    </fieldset>
    <p id="params-note" className="muted mt-3">{isColors ? '1–12 个整数，只能为 0、1 或 2；本曲录制为 34 秒。' : isDedup ? '1–12 个升序整数；本曲录制为 32 秒。' : isThreeSum ? '3–12 个整数；默认录制 40 秒，步骤较多时延长。' : `2–12 个非负整数；本曲录制为 ${isRain ? 38 : 36} 秒。`}非法输入不会替换现有录制；离开歌单或刷新后恢复默认。</p>
    <p id="params-error" role="alert" className="form-error">{error}</p>
    <p role="status" className="muted mt-3">{notice}</p>
  </form>
}

function StringParameters({ input, onRecord }: { input: LongestSubstringInput, onRecord: (input: LongestSubstringInput) => void }) {
  const [text, setText] = useState(input.text)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const result = longestSubstringInputSchema.safeParse({ text })
    if (!result.success) {
      setError('请输入最多 12 个 Unicode 码点；允许空串，不支持控制字符或不完整的 Unicode 字符。')
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
      <legend className="sr-only">最长无重复子串参数</legend>
      <label>字符串 text<input name="text" value={text} onChange={(event) => setText(event.target.value)} aria-invalid={!!error} spellCheck={false} /></label>
      <Button type="submit" className="w-full">重录本曲</Button>
    </fieldset>
    <p id="params-note" className="muted mt-3">直接输入文本，无需 JSON 引号。最多 12 个 Unicode 码点，空格显示为 ␠；组合字符按多个码点计数。本曲 36 秒；非法输入保留现有录制，离开歌单或刷新恢复默认。</p>
    <p id="params-error" role="alert" className="form-error">{error}</p>
    <p role="status" className="muted mt-3">{notice}</p>
  </form>
}

function Playback({ story, title, playlist, partner, partnerTrack, remixLabel }: { story: Story, title: string, playlist: Playlist, partner?: Story, partnerTrack?: Track, remixLabel: string }) {
  const { engine, time, duration, playing, rate, frame, stepIndex } = usePlayer(story)
  const other = partner ? frameAtProgress(partner, duration > 0 ? time / duration : 0) : undefined
  const sound = useSound(frame, playing, other?.frame)
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
      {partner && <p className="compare-note">同一输入 · 比例同步：A 为主时间轴，B 按各自总时长的相同比例推进；步骤并非一一对应。</p>}
      <motion.div key={`${story.id}-${partner?.id ?? 'solo'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade} className={partner ? 'compare-stages' : ''}>
        <Stage story={story} frame={frame} stepIndex={stepIndex} time={time} label={partner ? `A · ${remixLabel}` : undefined} enabled={sound.enabled} fade={fade} />
        {partner && other && <Stage story={partner} frame={other.frame} stepIndex={other.stepIndex} time={other.time} label={`B · ${partnerTrack?.remix}`} enabled={sound.enabled} fade={fade} />}
      </motion.div>
      <div className="player-dock" role="group" aria-label="播放控制">
        <div className="dock-track"><Cover id={playlist.id} compact /><div><strong>{title}</strong><p>{playlist.title.split(' · ')[0]} · 本地分镜</p></div></div>
        <div className="dock-controls">
        <div className="transport">
          <Button disabled={trackIndex === 0} onClick={() => navigate(`/play/${playlist.tracks[trackIndex - 1].id}`)} aria-label="上一曲"><Icon name="previous" /></Button>
          <Button variant="primary" onClick={() => playing ? engine.pause() : engine.play()} aria-label={playing ? '暂停' : time >= duration ? '重播' : '播放'}><Icon name={playing ? 'pause' : 'play'} /><span className="sr-only">{playing ? '暂停' : time >= duration ? '重播' : '播放'}</span></Button>
          <Button className="reset-button" onClick={() => engine.seek(0)} aria-label="回到开头">归零</Button>
          <Button disabled={trackIndex === playlist.tracks.length - 1} onClick={() => navigate(`/play/${playlist.tracks[trackIndex + 1].id}`)} aria-label="下一曲"><Icon name="next" /></Button>
        </div>
        <div className="progress-row">
          <span>{clock(time)}</span>
          <input type="range" min="0" max={duration} step="0.01" value={time} onChange={(event) => engine.seek(Number(event.target.value))} aria-label="播放进度" aria-valuetext={`${clock(time)} / ${clock(duration)}`} />
          <span>{clock(duration)}</span>
        </div>
        </div>
        <div className="playback-options">
          <label className="rate-control">倍速
            <select value={rate} onChange={(event) => engine.setRate(Number(event.target.value))}>
              {[0.5, 1, 1.5, 2].map((value) => <option key={value} value={value}>{value}×</option>)}
            </select>
          </label>
          <label className="sound-control"><input type="checkbox" checked={sound.enabled} onChange={(event) => { void sound.toggle(event.target.checked) }} />音效{sound.enabled ? '开' : '关'}</label>
        </div>
        {sound.error && <p role="status" className="dock-error">{sound.error}</p>}
      </div>
    </section>
  </Card>
}

function Stage({ story, frame, stepIndex, time, label, enabled, fade }: { story: Story, frame: StoryStep, stepIndex: number, time: number, label?: string, enabled: boolean, fade: { duration: number, ease: [number, number, number, number] } }) {
  return <section className="remix-stage" aria-label={label ?? '算法舞台'}>
    {label && <div className="stage-heading"><h2>{label}</h2><span>{clock(time)} / {clock(story.steps.at(-1)!.t)} · {stepIndex + 1} / {story.steps.length} 帧</span></div>}
    <div className="stage-visual">
      <StoryScene story={story} frame={frame} />
      {enabled && frame.sfx !== 'none' && <motion.div key={`${story.id}-${stepIndex}`} aria-hidden="true" className={`sfx-pulse sfx-${frame.sfx}`} initial={{ opacity: 0.65 }} animate={{ opacity: 0 }} transition={fade}><span>{frame.sfx === 'match' ? '命中' : '比较'}</span></motion.div>}
    </div>
    <div className="caption-slot"><motion.p key={`${story.id}-${stepIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade} className="muted">{frame.caption}</motion.p></div>
  </section>
}
