'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react'

const sounds = [
  { id: 'soft', name: 'Soft tick', detail: 'suave e discreto', tone: 420 },
  { id: 'wood', name: 'Wood block', detail: 'seco e orgânico', tone: 220 },
  { id: 'drop', name: 'Water drop', detail: 'claro e leve', tone: 680 },
] as const

const modes = [
  { id: 'block', label: 'Bloco de tempo', hint: 'Defina um período' },
  { id: 'cycle', label: 'Ciclo de 90 min', hint: 'Foco + pausa' },
  { id: 'goal', label: 'Meta única', hint: 'Uma coisa por vez' },
] as const

type Mode = (typeof modes)[number]['id']

function formatTime(total: number) {
  const minutes = Math.floor(total / 60).toString().padStart(2, '0')
  const seconds = (total % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function Page() {
  const [mode, setMode] = useState<Mode>('block')
  const [duration, setDuration] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
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
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (selectedSound.id === 'drop' ? 0.22 : 0.08))
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.25)
  }, [selectedSound, soundOn, volume])

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          setRunning(false)
          return 0
        }
        playClick()
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [playClick, running])

  function selectMode(nextMode: Mode) {
    setMode(nextMode)
    setRunning(false)
    if (nextMode === 'cycle') { setDuration(90 * 60); setRemaining(90 * 60) }
    else if (nextMode === 'block') { setDuration(25 * 60); setRemaining(25 * 60) }
    else { setDuration(15 * 60); setRemaining(15 * 60) }
  }

  function reset() { setRunning(false); setRemaining(duration) }

  return (
    <main className="min-h-screen px-5 py-6 text-foreground md:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-10">
        <header className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="logo-mark" aria-hidden="true"><span /><span /><span /></div>
            <div><p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">deep work / 01</p><h1 className="font-serif text-2xl tracking-tight">Foco.</h1></div>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"><span className="status-dot" /> ambiente calmo <Wind data-icon="inline-start" /></div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.8fr)]">
          <div className="sketch-panel hero-panel flex min-h-[520px] flex-col justify-between p-6 md:p-10">
            <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">sessão atual</p><h2 className="mt-3 max-w-xl font-serif text-4xl leading-[1.05] md:text-6xl">Faça espaço para<br /><em>uma coisa.</em></h2></div><span className="scribble-label">sem distrações</span></div>
            <div className="flex flex-col items-center gap-7 py-7"><div className="timer-ring" style={{ '--progress': `${progress}%` } as React.CSSProperties}><div className="timer-inner"><span className="font-mono text-6xl tracking-[-0.08em] md:text-8xl">{formatTime(remaining)}</span><span className="eyebrow mt-2">{running ? 'em andamento' : remaining === 0 ? 'concluído' : 'pronto para começar'}</span></div></div><div className="flex items-center gap-3"><button className="icon-button" onClick={reset} aria-label="Reiniciar sessão"><RotateCcw /></button><button className="primary-action" onClick={() => setRunning(!running)}>{running ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}{running ? 'Pausar' : 'Começar'}</button><button className="icon-button" onClick={() => setRemaining((value) => Math.min(duration, value + 60))} aria-label="Adicionar um minuto"><ArrowRight /></button></div></div>
            <div className="flex items-end justify-between border-t border-border/70 pt-5"><div><p className="eyebrow">progresso</p><div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div><p className="font-mono text-xs text-muted-foreground">{Math.round(progress)}% completo</p></div>
          </div>

          <aside className="flex flex-col gap-6"><div><p className="eyebrow">escolha seu ritmo</p><div className="mt-4 flex flex-col gap-2">{modes.map((item) => <button key={item.id} className={`mode-option ${mode === item.id ? 'is-selected' : ''}`} onClick={() => selectMode(item.id)}><span className="flex items-center gap-3"><span className="mode-dot" />{item.label}</span><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{item.hint}</span></button>)}</div></div><div className="sketch-panel p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="panel-icon"><Headphones /></span><div><p className="eyebrow">som de presença</p><p className="mt-1 text-sm">Um clique por segundo</p></div></div><button className="ghost-button" onClick={() => setSoundOn(!soundOn)} aria-label={soundOn ? 'Desligar som' : 'Ligar som'}>{soundOn ? <Volume2 /> : <VolumeX />}</button></div><div className="mt-5 flex flex-col gap-2">{sounds.map((sound) => <button key={sound.id} className={`sound-option ${soundId === sound.id ? 'is-selected' : ''}`} onClick={() => setSoundId(sound.id)}><span>{sound.name}</span><span className="text-xs text-muted-foreground">{sound.detail}</span></button>)}</div><div className="mt-5 flex items-center gap-3"><VolumeX className="text-muted-foreground" /><input aria-label="Volume do som" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /><Volume2 className="text-muted-foreground" /><button className="test-button" onClick={playClick}>testar</button></div></div></aside>
        </section>

        <section className="grid gap-8 border-t border-border/70 pt-7 lg:grid-cols-[1fr_1.4fr]"><div><p className="eyebrow">{mode === 'goal' ? 'sua única meta' : 'anote antes de começar'}</p><div className="mt-3 flex flex-col gap-3">{mode === 'goal' ? <input className="sketch-input text-lg" placeholder="O que merece sua atenção?" value={goal} onChange={(event) => setGoal(event.target.value)} /> : <p className="max-w-md font-serif text-2xl leading-tight text-muted-foreground">“A atenção é a forma mais rara e pura de generosidade.”</p>}{mode === 'goal' && tasks.map((task, index) => <div key={index} className="flex items-center gap-2"><button className="task-check" aria-label={`Concluir subtarefa ${index + 1}`}><Check /></button><input className="sketch-input flex-1 text-sm" placeholder={`Subtarefa ${index + 1}`} value={task} onChange={(event) => setTasks(tasks.map((value, i) => i === index ? event.target.value : value))} /></div>)}</div></div><div className="spotify-card"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">trilha sonora</p><h3 className="mt-1 font-serif text-2xl">Sua playlist de foco</h3></div><button className="ghost-button" onClick={() => setSpotifyOpen(!spotifyOpen)} aria-expanded={spotifyOpen}>{spotifyOpen ? <X /> : <ChevronDown />}</button></div>{spotifyOpen && <iframe className="mt-5 w-full" style={{ borderRadius: 12 }} src="https://open.spotify.com/embed/playlist/2CEufyqJgDa8sD0MhN505g?utm_source=generator&si=11288cd285ef4620" height="352" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Playlist de foco no Spotify" />}{!spotifyOpen && <button className="spotify-open mt-5" onClick={() => setSpotifyOpen(true)}><Play data-icon="inline-start" /> tocar playlist <ExternalLink data-icon="inline-end" /></button>}</div></section>
        <footer className="flex flex-col justify-between gap-3 border-t border-border/70 pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:flex-row"><span>feito para o trabalho que importa</span><span>sem notificações · sem pressa</span></footer>
      </div>
    </main>
  )
}
