'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Script from 'next/script'
import { ArrowRight, Check, ChevronDown, ExternalLink, Headphones, Pause, Play, RotateCcw, Volume2, VolumeX, Wind, X } from 'lucide-react'

const sounds = [
  { id: 'soft', name: 'Clock click', detail: 'clean stopwatch click', tone: 1500 },
  { id: 'wood', name: 'Wood block', detail: 'dry and organic', tone: 220 },
  { id: 'drop', name: 'Water drop', detail: 'clear and light', tone: 680 },
] as const

const modes = [
  { id: 'block', label: 'Time block', hint: 'Set a period' },
  { id: 'cycle', label: '90-minute cycle', hint: 'Focus + break' },
  { id: 'goal', label: 'Single goal', hint: 'One thing at a time' },
] as const

const durations = [15, 20, 25, 30, 40, 60] as const
type Mode = (typeof modes)[number]['id']

function formatTime(total: number) {
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

export default function Page() {
  const [mode, setMode] = useState<Mode>('block')
  const [duration, setDuration] = useState(30 * 60)
  const [remaining, setRemaining] = useState(30 * 60)
  const [running, setRunning] = useState(false)
  const [resting, setResting] = useState(false)
  const [garden, setGarden] = useState<string[]>([])
  const [soundId, setSoundId] = useState<(typeof sounds)[number]['id']>('soft')
  const [volume, setVolume] = useState(42)
  const [soundOn, setSoundOn] = useState(true)
  const [spotifyOpen, setSpotifyOpen] = useState(false)
  const [goal, setGoal] = useState('')
  const [tasks, setTasks] = useState(['', ''])
  const audioRef = useRef<AudioContext | null>(null)
  const selectedSound = useMemo(() => sounds.find((sound) => sound.id === soundId) ?? sounds[0], [soundId])
  const progress = duration ? ((duration - remaining) / duration) * 100 : 0

  const playClick = useCallback(() => {
    if (!soundOn || volume === 0 || typeof window === 'undefined') return
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = audioRef.current ?? new AudioContextClass()
    audioRef.current = context
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = selectedSound.id === 'wood' ? 'triangle' : selectedSound.id === 'drop' ? 'sine' : 'square'
    oscillator.frequency.value = selectedSound.tone
    gain.gain.setValueAtTime(Math.min(volume / 1000, 0.08), context.currentTime)
    const decay = selectedSound.id === 'drop' ? 0.22 : selectedSound.id === 'soft' ? 0.035 : 0.08
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + decay)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + Math.max(decay, 0.06))
  }, [selectedSound, soundOn, volume])

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) { setRunning(false); setResting(true); return 0 }
        playClick()
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [playClick, running])

  function chooseDuration(minutes: number) {
    setResting(false)
    setRunning(false)
    setDuration(minutes * 60)
    setRemaining(minutes * 60)
  }

  function selectMode(nextMode: Mode) {
    setMode(nextMode)
    setRunning(false)
    if (nextMode === 'cycle') chooseDuration(60)
    else if (nextMode === 'block') chooseDuration(30)
    else chooseDuration(30)
  }

  function reset() { setResting(false); setRunning(false); setRemaining(duration) }

  function startNextSession() { setResting(false); setRemaining(duration); setRunning(true) }

  function addPebble() { setGarden((items) => [...items.slice(-11), ['·', '○', '⌁', '✦'][Math.floor(Math.random() * 4)]]) }

  return (
    <main className="min-h-screen px-5 py-6 text-foreground md:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-10">
        <header className="flex items-start justify-between">
          <div className="flex items-center gap-3"><div className="logo-mark" aria-hidden="true"><span /><span /><span /></div><div><p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">deepworkrhythm / 01</p><h1 className="font-serif text-2xl tracking-tight">Focus.</h1></div></div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"><span className="status-dot" /> calm environment <Wind data-icon="inline-start" /></div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.8fr)]">
          <div className="sketch-panel hero-panel flex min-h-[520px] flex-col justify-between p-6 md:p-10">
            <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">current session</p><h2 className="mt-3 max-w-xl font-serif text-4xl leading-[1.05] md:text-6xl">Make room for<br /><em>one thing.</em></h2></div><span className="scribble-label">no distractions</span></div>
            <div className="flex flex-col items-center gap-7 py-7">{resting ? <div className="rest-garden" role="application" aria-label="Zen Garden rest game" onClick={addPebble}><div className="garden-sand">{garden.map((mark, index) => <span key={index} style={{ transform: `rotate(${index * 29}deg) translateY(${(index % 3) * 20 - 20}px)` }}>{mark}</span>)}<p>click to shape your pause</p></div><span className="eyebrow">rest mode · no score, no rush</span></div> : <div className="timer-ring" style={{ '--progress': `${progress}%` } as React.CSSProperties}><div className="timer-inner"><span className="font-mono text-6xl tracking-[-0.08em] md:text-8xl">{formatTime(remaining)}</span><span className="eyebrow mt-2">{running ? 'in progress' : 'ready to begin'}</span></div></div>}<div className="flex items-center gap-3">{resting ? <><button className="icon-button" onClick={reset} aria-label="End rest"><X /></button><button className="primary-action" onClick={startNextSession}><Play data-icon="inline-start" />Start next focus</button></> : <><button className="icon-button" onClick={reset} aria-label="Reset session"><RotateCcw /></button><button className="primary-action" onClick={() => setRunning(!running)}>{running ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}{running ? 'Pause' : 'Start'}</button><button className="icon-button" onClick={() => setRemaining((value) => Math.min(duration, value + 60))} aria-label="Add one minute"><ArrowRight /></button></>}</div></div>
            <div className="flex items-end justify-between border-t border-border/70 pt-5"><div><p className="eyebrow">progress</p><div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div><p className="font-mono text-xs text-muted-foreground">{Math.round(progress)}% complete</p></div>
          </div>

          <aside className="flex flex-col gap-6"><div><p className="eyebrow">session length</p><div className="mt-4 grid grid-cols-3 gap-2">{durations.map((minutes) => <button key={minutes} className={`mode-option justify-center ${duration === minutes * 60 ? 'is-selected' : ''}`} onClick={() => chooseDuration(minutes)}><span className="font-mono text-sm">{minutes}<span className="ml-1 text-[10px] text-muted-foreground">MIN</span></span></button>)}</div></div><div className="sketch-panel p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="panel-icon"><Headphones /></span><div><p className="eyebrow">presence sound</p><p className="mt-1 text-sm">One click per second</p></div></div><button className="ghost-button" onClick={() => setSoundOn(!soundOn)} aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}>{soundOn ? <Volume2 /> : <VolumeX />}</button></div><div className="mt-5 flex flex-col gap-2">{sounds.map((sound) => <button key={sound.id} className={`sound-option ${soundId === sound.id ? 'is-selected' : ''}`} onClick={() => setSoundId(sound.id)}><span>{sound.name}</span><span className="text-xs text-muted-foreground">{sound.detail}</span></button>)}</div><div className="mt-5 flex items-center gap-3"><VolumeX className="text-muted-foreground" /><input aria-label="Sound volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /><Volume2 className="text-muted-foreground" /><button className="test-button" onClick={playClick}>test</button></div></div></aside>
        </section>

        <section className="grid gap-8 border-t border-border/70 pt-7 lg:grid-cols-[1fr_1.4fr]"><div><p className="eyebrow">{mode === 'goal' ? 'your single goal' : 'write before you begin'}</p><div className="mt-3 flex flex-col gap-3">{mode === 'goal' ? <input className="sketch-input text-lg" placeholder="What deserves your attention?" value={goal} onChange={(event) => setGoal(event.target.value)} /> : <p className="max-w-md font-serif text-2xl leading-tight text-muted-foreground">“Attention is the rarest and purest form of generosity.”</p>}{mode === 'goal' && tasks.map((task, index) => <div key={index} className="flex items-center gap-2"><button className="task-check" aria-label={`Complete subtask ${index + 1}`}><Check /></button><input className="sketch-input flex-1 text-sm" placeholder={`Subtask ${index + 1}`} value={task} onChange={(event) => setTasks(tasks.map((value, i) => i === index ? event.target.value : value))} /></div>)}</div></div><div className="spotify-card"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">soundtrack</p><h3 className="mt-1 font-serif text-2xl">Your focus playlist</h3></div><button className="ghost-button" onClick={() => setSpotifyOpen(!spotifyOpen)} aria-expanded={spotifyOpen} aria-label={spotifyOpen ? 'Close playlist' : 'Open playlist'}>{spotifyOpen ? <X /> : <ChevronDown />}</button></div>{spotifyOpen && <iframe className="mt-5 w-full" style={{ borderRadius: 12 }} src="https://open.spotify.com/embed/playlist/2CEufyqJgDa8sD0MhN505g?utm_source=generator&si=11288cd285ef4620" height="352" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" tabIndex={-1} onLoad={(event) => event.currentTarget.blur()} title="Focus playlist on Spotify" />}{!spotifyOpen && <button className="spotify-open mt-5" onClick={() => setSpotifyOpen(true)}><Play data-icon="inline-start" /> play playlist <ExternalLink data-icon="inline-end" /></button>}</div></section>
        {process.env.NODE_ENV === 'production' && <section className="ad-zone" aria-label="Advertisement">
          <span className="eyebrow">support independent focus tools</span>
          <Script id="hilltopads-zone" strategy="afterInteractive">
            {`(function(wjsu){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = wjsu || {};
s.src = "//unfoldedtrade.com/bQX.VvsYdnGYlQ0nY/WUcx/AeLmF9cumZjU/lSkfPaTrc/z/N/zVcvzJMpjdEPtONUzxMy3GNgzuMuy/NIQE";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})`}
          </Script>
        </section>}
        <footer className="flex flex-col justify-between gap-3 border-t border-border/70 pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:flex-row"><span>made for work that matters</span><div className="flex flex-col gap-1 md:items-end"><span>no notifications · no rush</span><a className="footer-link" href="https://github.com/devAndreNicolas" target="_blank" rel="noreferrer">developed by devAndreNicolas · contact on GitHub</a></div></footer>
      </div>
    </main>
  )
}
