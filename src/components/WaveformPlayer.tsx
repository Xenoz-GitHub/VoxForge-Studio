import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Download,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Volume2,
  VolumeX,
  AudioLines,
} from "lucide-react";
import type { NarrationTake } from "../types/narration";
import { downloadAudioFile, formatBytes, formatTimecode } from "../utils/audio";

interface WaveformPlayerProps {
  take: NarrationTake | null;
  isGenerating: boolean;
  onQuickGenerate: () => void;
}

const SPEED_OPTIONS = [0.85, 1.0, 1.15, 1.25] as const;

export function WaveformPlayer({
  take,
  isGenerating,
  onQuickGenerate,
}: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(0.95);
  const [isMuted, setIsMuted] = useState(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(take?.durationSeconds ?? 0);

    if (take?.audioUrl) {
      audio.src = take.audioUrl;
      audio.playbackRate = playbackRate;
      audio.loop = isLooping;
      audio.volume = isMuted ? 0 : volume;
      audio.load();
    }
  }, [take?.id, take?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      const audio = audioRef.current;
      if (audio) {
        setCurrentTime(audio.currentTime);
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !take) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  const handleRestart = async () => {
    const audio = audioRef.current;
    if (!audio || !take) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handleScrub = (e: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !take) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const effectiveDuration =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : take.durationSeconds;
    if (effectiveDuration > 0) {
      const nextTime = ratio * effectiveDuration;
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverRatio(ratio);
  };

  const effectiveDuration = duration || take?.durationSeconds || 0;
  const progressRatio =
    effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-5 flex flex-col justify-between gap-5">
      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onEnded={() => {
          if (!isLooping) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
            <span>Master Playback Deck</span>
            <span aria-hidden="true">·</span>
            <span>24 kHz Mono WAV</span>
            {take && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatBytes(take.byteLength)}</span>
              </>
            )}
          </div>
          <h3 className="text-base font-semibold text-white mt-1 truncate">
            {take
              ? `Take ${String(take.takeNumber).padStart(2, "0")} — ${take.voiceName}`
              : "Ready to Synthesize"}
          </h3>
        </div>

        <div className="self-start font-mono text-sm sm:text-base font-medium tabular-nums text-orange-400 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
          {formatTimecode(currentTime)} / {formatTimecode(effectiveDuration)}
        </div>
      </div>

      {/* Waveform stage */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
        {isGenerating ? (
          <div
            className="h-24 flex items-center justify-between gap-1"
            aria-label="Synthesizing narration audio"
          >
            {Array.from({ length: 56 }).map((_, idx) => {
              const heightPct = 22 + ((idx * 17) % 62);
              return (
                <div
                  key={idx}
                  style={{ height: `${heightPct}%` }}
                  className="flex-1 bg-slate-700/70 rounded-xs animate-pulse"
                />
              );
            })}
          </div>
        ) : take ? (
          <div
            role="slider"
            tabIndex={0}
            aria-label="Audio playback scrubber"
            aria-valuemin={0}
            aria-valuemax={Math.round(effectiveDuration * 10) / 10}
            aria-valuenow={Math.round(currentTime * 10) / 10}
            onClick={handleScrub}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverRatio(null)}
            onKeyDown={(e) => {
              const audio = audioRef.current;
              if (!audio || effectiveDuration <= 0) return;
              if (e.key === "ArrowRight") {
                audio.currentTime = Math.min(effectiveDuration, audio.currentTime + 0.5);
                setCurrentTime(audio.currentTime);
              } else if (e.key === "ArrowLeft") {
                audio.currentTime = Math.max(0, audio.currentTime - 0.5);
                setCurrentTime(audio.currentTime);
              } else if (e.key === " ") {
                e.preventDefault();
                togglePlay();
              }
            }}
            className="relative h-24 flex items-center gap-[3px] cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
          >
            {take.waveformPeaks.map((peak, idx) => {
              const barRatio = idx / take.waveformPeaks.length;
              const isPlayed = barRatio <= progressRatio;
              const isHovered = hoverRatio !== null && barRatio <= hoverRatio;
              return (
                <div
                  key={idx}
                  style={{ height: `${Math.max(12, Math.round(peak * 100))}%` }}
                  className={`flex-1 rounded-xs transition-colors duration-75 ${
                    isPlayed
                      ? "bg-orange-500"
                      : isHovered
                      ? "bg-slate-400"
                      : "bg-slate-700"
                  }`}
                />
              );
            })}
          </div>
        ) : (
          <div className="h-24 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3 text-slate-400">
              <AudioLines className="w-6 h-6 text-orange-400 shrink-0" />
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Press <strong className="text-white font-semibold">Generate Narration</strong> to
                render the opening take with Gemini 3.8 Flash TTS.
              </p>
            </div>
            <button
              type="button"
              onClick={onQuickGenerate}
              className="px-4 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Generate Opening Take
            </button>
          </div>
        )}
      </div>

      {/* Transport & Audio Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!take || isGenerating}
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause narration" : "Play narration"}
            className="h-11 px-5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!take || isGenerating}
            onClick={handleRestart}
            aria-label="Restart playback from beginning"
            className="h-11 w-11 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-800 disabled:opacity-40 text-slate-200 transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!take || isGenerating}
            onClick={() => setIsLooping((prev) => !prev)}
            aria-label="Toggle loop playback"
            aria-pressed={isLooping}
            className={`h-11 w-11 flex items-center justify-center rounded-lg border transition-colors shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isLooping
                ? "border-orange-500 bg-orange-500/15 text-orange-400"
                : "border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-slate-300"
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Speed selector */}
          <div
            className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-lg"
            role="group"
            aria-label="Playback speed"
          >
            {SPEED_OPTIONS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setPlaybackRate(rate)}
                className={`px-2 py-1 text-xs font-mono tabular-nums rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  playbackRate === rate
                    ? "bg-slate-700 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-2.5 h-10 rounded-lg">
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setIsMuted(false);
                setVolume(Number(e.target.value));
              }}
              aria-label="Master volume"
              className="w-16 accent-orange-500 cursor-pointer"
            />
          </div>

          {/* Download WAV */}
          <button
            type="button"
            disabled={!take || isGenerating}
            onClick={() => {
              if (!take) return;
              downloadAudioFile(
                take.audioUrl,
                `voxforge-take-${String(take.takeNumber).padStart(2, "0")}-${take.voiceName.toLowerCase()}.wav`
              );
            }}
            className="h-11 px-4 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-slate-100 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
