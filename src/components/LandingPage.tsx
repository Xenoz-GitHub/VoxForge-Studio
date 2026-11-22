import { useState } from "react";
import {
  ArrowRight,
  AudioLines,
  Cloud,
  Cpu,
  Layers,
  LayoutDashboard,
  Mic2,
  Play,
  SlidersHorizontal,
  Smartphone,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { VOICE_PROFILES, type VoiceName } from "../types/narration";
import { DeveloperSection } from "./DeveloperSection";

interface LandingPageProps {
  isAuthenticated: boolean;
  onGetStarted: () => void;
  onOpenStudio: () => void;
  onOpenDashboard: () => void;
}

const DEMO_WAVE_HEIGHTS = [
  24, 52, 38, 76, 60, 88, 44, 70, 32, 82, 56, 92, 48, 66, 36, 74, 50, 62, 30, 46,
];

export function LandingPage({
  isAuthenticated,
  onGetStarted,
  onOpenStudio,
  onOpenDashboard,
}: LandingPageProps) {
  const prefersReduced = useReducedMotion();
  const [previewVoice, setPreviewVoice] = useState<VoiceName>("Kore");
  const [previewPlaying, setPreviewPlaying] = useState(true);

  const selectedProfile =
    VOICE_PROFILES.find((v) => v.name === previewVoice) ?? VOICE_PROFILES[0];

  return (
    <div className="flex flex-col">
      {/* Tarsi-Inspired Minimalist Hero with Floating Interactive Device Mockup */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        {/* Subtle Architectural Grid Backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.35) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-32 right-0 w-[520px] h-[520px] rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-[1360px] mx-auto px-3 sm:px-6 pt-8 sm:pt-12 pb-12 sm:pb-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          {/* Left Hero Copy */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-4 sm:space-y-6"
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>VoxForge Studio</span>
              <span aria-hidden="true">·</span>
              <span className="hidden xs:inline">Gemini 3.8 Speech Engine</span>
              <span className="hidden xs:inline" aria-hidden="true">·</span>
              <span className="hidden xs:inline">Web &amp; Mobile Workspace</span>
              <span className="xs:hidden">AI Speech Engine</span>
            </div>

            <h1
              className="font-display font-bold tracking-tight text-slate-950 dark:text-white text-balance leading-[1.08]"
              style={{ fontSize: "clamp(1.75rem, 5.5vw, 3.85rem)" }}
            >
              Studio-Grade Text-to-Speech Built for Every Script
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Generate natural 24 kHz WAV voiceovers, podcasts, e-learning tracks, and dual-speaker dialogues in seconds. <span className="hidden sm:inline">Audition five expressive personas side by side or render 20-clip batches synced to your cloud dashboard.</span>
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              <motion.button
                type="button"
                onClick={isAuthenticated ? onOpenStudio : onGetStarted}
                whileHover={prefersReduced ? undefined : { y: -2 }}
                whileTap={prefersReduced ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="h-11 sm:h-12 px-5 sm:px-6 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-orange-600/25 active:scale-[0.98]"
              >
                <AudioLines className="w-4 h-4" />
                <span className="hidden xs:inline">
                  {isAuthenticated ? "Open Speech Studio" : "Sign In & Get Started"}
                </span>
                <span className="xs:hidden">
                  {isAuthenticated ? "Open Studio" : "Get Started"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <button
                type="button"
                onClick={onOpenDashboard}
                className="h-11 sm:h-12 px-4 sm:px-5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 active:bg-slate-300 dark:active:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium rounded-xl transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]"
              >
                <LayoutDashboard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="hidden xs:inline">
                  {isAuthenticated ? "Open Dashboard" : "Explore Dashboard"}
                </span>
                <span className="xs:hidden">Dashboard</span>
              </button>
            </div>
          </motion.div>

          {/* Right Hero: Tarsi-Style Floating Device Preview Mockup */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <motion.div
              animate={
                prefersReduced
                  ? undefined
                  : { y: [0, -8, 0] }
              }
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="bg-slate-900 dark:bg-slate-900/95 text-white border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-950/15 dark:shadow-black/50 space-y-5"
            >
              {/* Mockup Header */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-400">
                    Interactive Voice Preview
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {selectedProfile.name} · {selectedProfile.persona}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPlaying((p) => !p)}
                  aria-label={previewPlaying ? "Pause preview animation" : "Play preview animation"}
                  className="h-9 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{previewPlaying ? "Active" : "Paused"}</span>
                </button>
              </div>

              {/* Interactive Voice Switcher Pills (functional controls) */}
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Preview voice persona"
              >
                {VOICE_PROFILES.map((v) => {
                  const isActive = v.name === previewVoice;
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setPreviewVoice(v.name)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-white text-slate-950 font-semibold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>

              {/* Animated Waveform Console */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div
                  className="h-20 flex items-end justify-between gap-1.5"
                  aria-hidden="true"
                >
                  {DEMO_WAVE_HEIGHTS.map((pct, idx) => (
                    <motion.div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-orange-600 to-amber-400 rounded-xs origin-bottom"
                      style={{ height: `${pct}%` }}
                      animate={
                        prefersReduced || !previewPlaying
                          ? { scaleY: 0.45, opacity: 0.7 }
                          : {
                              scaleY: [0.3, 1, 0.45, 0.9, 0.3],
                              opacity: [0.65, 1, 0.75, 0.95, 0.65],
                            }
                      }
                      transition={{
                        duration: 1.5 + (idx % 5) * 0.25,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: idx * 0.06,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {selectedProfile.tone}
                </p>
              </div>

              {/* Quick Preview Footer */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="font-mono text-sm font-semibold text-white tabular-nums">
                    24 kHz
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Mono WAV</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="font-mono text-sm font-semibold text-white tabular-nums">
                    5 Voices
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Multi-Test</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="font-mono text-sm font-semibold text-white tabular-nums">
                    20 Clips
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Batch Queue</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Architectural Spec Strip (Claim-to-Proof Adjacency) */}
      <section className="bg-slate-100/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              value: "Single & Batch",
              label: "Up to 20 clips per parallel queue",
            },
            {
              value: "Dual-Speaker",
              label: "Directed dialogue with vocal cues",
            },
            {
              value: "24 kHz WAV",
              label: "Lossless studio download & scrubbing",
            },
            {
              value: "Cloud Sync",
              label: "Saved scripts across mobile & desktop",
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.value}
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.35,
                delay: idx * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="space-y-1"
            >
              <div className="font-display text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tarsi-Style Scroll-Triggered Feature Showcase Bento */}
      <section className="bg-slate-50 dark:bg-slate-950 py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 space-y-12">
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl space-y-2.5"
          >
            <div className="text-xs font-medium text-orange-600 dark:text-orange-400">
              Clean Workflow Separation
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white text-balance">
              Onboard in Seconds. Manage in Your Dashboard. Render in the Studio.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Every stage of voice production has its own dedicated space—whether you are setting up on a phone or directing multi-take batches on desktop.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Feature 01: Parallel Multi-Key Engine (Wide Card) */}
            <motion.article
              initial={prefersReduced ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              whileHover={prefersReduced ? undefined : { y: -3 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 max-w-lg">
                  <span className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                    01.
                  </span>
                  <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                    Parallel Batch &amp; Multi-Voice Audition
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Queue up to 20 independent script lines or test all five personas against one paragraph simultaneously, with automatic server-side failover.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200/70 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>

              {/* Animated Queue Mini Visualization */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { clip: "Clip 01", voice: "Kore", progress: "100%" },
                  { clip: "Clip 02", voice: "Puck", progress: "78%" },
                  { clip: "Clip 03", voice: "Zephyr", progress: "52%" },
                ].map((row, idx) => (
                  <div
                    key={row.clip}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {row.clip}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {row.voice}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={prefersReduced ? false : { scaleX: 0.25 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.7,
                          delay: idx * 0.12,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{ width: row.progress }}
                        className="h-full bg-orange-600 dark:bg-orange-500 origin-left rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.article>

            {/* Feature 02: Dual-Speaker Dialogue */}
            <motion.article
              initial={prefersReduced ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              whileHover={prefersReduced ? undefined : { y: -3 }}
              transition={{ duration: 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                    02.
                  </span>
                  <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                    Dual-Speaker Dialogue Direction
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Script natural two-person podcasts and interviews with separate voice personas and inline cues like{" "}
                    <code className="font-mono text-xs">&lt;breath&gt;</code> and{" "}
                    <code className="font-mono text-xs">|yeah|</code>.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-950 dark:text-white">
                    Alex (Puck):
                  </span>{" "}
                  Welcome back! &lt;breath&gt; Let&apos;s compare two voices live.
                </div>
                <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-500/10 border border-orange-200/70 dark:border-orange-500/20 text-slate-800 dark:text-slate-200">
                  <span className="font-semibold text-orange-700 dark:text-orange-400">
                    Sam (Zephyr):
                  </span>{" "}
                  |yeah| Switching styles takes one click.
                </div>
              </div>
            </motion.article>

            {/* Feature 03: Word Stress & Precision Waveform */}
            <motion.article
              initial={prefersReduced ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              whileHover={prefersReduced ? undefined : { y: -3 }}
              transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                    03.
                  </span>
                  <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                    Tap-to-Stress Word Control
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Tap any word in your script to highlight vocal emphasis, tune speed or loop playback, and download clean 24 kHz mono WAV audio.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                {["Clear", "studio", "speech", "in", "seconds."].map((w, i) => (
                  <span
                    key={w}
                    className={`px-2.5 py-1 text-xs rounded-md border ${
                      i === 1 || i === 4
                        ? "bg-orange-600 border-orange-600 text-white font-semibold"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {w}
                  </span>
                ))}
              </div>
            </motion.article>

            {/* Feature 04: Cloud Dashboard & Mobile Responsive */}
            <motion.article
              initial={prefersReduced ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              whileHover={prefersReduced ? undefined : { y: -3 }}
              transition={{ duration: 0.35, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 max-w-lg">
                  <span className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                    04.
                  </span>
                  <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                    Cloud Dashboard for Mobile &amp; Desktop
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Sign in with Google to track rendered duration, reload any past script and direction into the studio, and switch seamlessly between phone and desktop.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200/70 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Thumb-Zone Mobile Nav
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Bottom tab bar &amp; touch-ready cards
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <Layers className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Firestore History Sync
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Private per-user generation archive
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* About Developer Section */}
      <DeveloperSection />

      {/* Bottom Conversion Banner */}
      <section className="bg-slate-900 dark:bg-slate-900/80 border-t border-slate-800 text-white">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-12 sm:py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-balance">
              Ready to Produce Your Next Voice Track?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sign in with Google to personalize your default voice persona and sync scripts across web and mobile.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={onOpenDashboard}
              className="h-12 px-5 bg-white text-slate-950 hover:bg-slate-100 text-sm font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>Open Dashboard</span>
            </button>
            <button
              type="button"
              onClick={isAuthenticated ? onOpenStudio : onGetStarted}
              className="h-12 px-6 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Mic2 className="w-4 h-4" />
              <span>{isAuthenticated ? "Launch Studio" : "Sign In & Launch"}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
