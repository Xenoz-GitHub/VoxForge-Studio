import {
  ArrowUpRight,
  Clock,
  Cloud,
  Layers,
  Mic2,
  Play,
  Sliders,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { CloudGenerationDoc } from "../firebase";
import {
  TTS_TEMPLATES,
  type NarrationMode,
  type NarrationTake,
  type TtsTemplate,
  type VoiceName,
} from "../types/narration";
import { formatBytes, formatTimecode } from "../utils/audio";

interface DashboardViewProps {
  isAuthenticated: boolean;
  userDisplayName?: string;
  preferredVoice: VoiceName;
  configuredKeyCount: number;
  onManageApiKeys: () => void;
  takes: NarrationTake[];
  cloudRecords: CloudGenerationDoc[];
  onSignIn: () => void;
  onLaunchMode: (mode: NarrationMode) => void;
  onSelectTemplateAndOpenStudio: (template: TtsTemplate) => void;
  onReloadCloudRecord: (record: CloudGenerationDoc) => void;
  onDeleteCloudRecord: (recordId: string) => void;
  onOpenTakeInStudio: (take: NarrationTake) => void;
  onRunOnboarding: () => void;
}

export function DashboardView({
  isAuthenticated,
  userDisplayName,
  preferredVoice,
  configuredKeyCount,
  onManageApiKeys,
  takes,
  cloudRecords,
  onSignIn,
  onLaunchMode,
  onSelectTemplateAndOpenStudio,
  onReloadCloudRecord,
  onDeleteCloudRecord,
  onOpenTakeInStudio,
  onRunOnboarding,
}: DashboardViewProps) {
  const prefersReduced = useReducedMotion();

  const totalRenderedSeconds =
    cloudRecords.reduce((acc, r) => acc + (r.durationSeconds || 0), 0) +
    takes.reduce((acc, t) => acc + (t.durationSeconds || 0), 0);

  const metrics: Array<{
    label: string;
    value: string;
    sub: string;
    Icon: typeof Cloud;
    onClick?: () => void;
  }> = [
    {
      label: "Cloud Saved Clips",
      value: isAuthenticated ? String(cloudRecords.length) : "Sign in",
      sub: isAuthenticated
        ? "Synced across devices"
        : "Connect Google to sync",
      Icon: Cloud,
    },
    {
      label: "Session Audio Takes",
      value: String(takes.length),
      sub: "Ready in waveform player",
      Icon: Mic2,
    },
    {
      label: "Total Audio Rendered",
      value: formatTimecode(totalRenderedSeconds),
      sub: "Combined clip runtime",
      Icon: Clock,
    },
    {
      label: "API Key Pool",
      value: configuredKeyCount > 0 ? String(configuredKeyCount) : "None",
      sub:
        configuredKeyCount > 0
          ? `${configuredKeyCount} key${configuredKeyCount === 1 ? "" : "s"} ready for parallel render`
          : "Add keys to enable generation",
      Icon: Sliders,
      onClick: onManageApiKeys,
    },
  ];

  return (
    <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Workspace Welcome Banner */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-orange-600 dark:text-orange-400">
            Workspace Dashboard
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white text-balance">
            {isAuthenticated
              ? `Welcome back, ${userDisplayName || "Creator"}`
              : "Voice Production Overview"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Launch a synthesis workflow, jump into a template, or reload your saved cloud scripts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isAuthenticated && (
            <button
              type="button"
              onClick={onRunOnboarding}
              className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              Workspace Defaults
            </button>
          )}
          <button
            type="button"
            onClick={onManageApiKeys}
            className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            Manage API Keys
          </button>
          <button
            type="button"
            onClick={() => onLaunchMode("single")}
            className="h-10 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Open Speech Studio</span>
          </button>
        </div>
      </section>

      {/* Real Tabular Metrics Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.Icon;
          const Card = m.onClick ? motion.button : motion.div;
          return (
            <Card
              key={m.label}
              type={m.onClick ? "button" : undefined}
              onClick={m.onClick}
              initial={prefersReduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3 text-left ${
                m.onClick
                  ? "cursor-pointer hover:border-orange-400 dark:hover:border-orange-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {m.label}
                </span>
                <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
              </div>
              <div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tabular-nums truncate">
                  {m.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {m.sub}
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {/* Quick Start Actions + Templates Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Quick Launch Modes */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              Start a New Synthesis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose how you want to generate audio in the studio
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                mode: "single" as const,
                title: "Single Speech & Voice Audition",
                desc: "Synthesize scripts with word emphasis or test 5 voices at once.",
                Icon: Mic2,
              },
              {
                mode: "batch" as const,
                title: "Parallel Batch Queue",
                desc: "Split multi-line text and generate up to 20 clips concurrently.",
                Icon: Layers,
              },
              {
                mode: "dialogue" as const,
                title: "Dual-Speaker Dialogue",
                desc: "Direct two distinct voices with conversational cues.",
                Icon: Users,
              },
            ].map((action) => {
              const Icon = action.Icon;
              return (
                <button
                  key={action.mode}
                  type="button"
                  onClick={() => onLaunchMode(action.mode)}
                  className="w-full min-h-[56px] text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-orange-500/60 hover:bg-orange-50/40 dark:hover:bg-orange-500/10 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-950 dark:text-white truncate">
                        {action.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {action.desc}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Ready-to-Use Templates */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Quick-Start Voice Templates
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tap any preset to open it pre-configured in the studio
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TTS_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplateAndOpenStudio(tpl)}
                className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-orange-500/60 hover:bg-orange-50/40 dark:hover:bg-orange-500/10 transition-colors flex flex-col justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                    {tpl.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {tpl.voiceName}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-950 dark:text-white">
                  {tpl.label}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {tpl.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Current Session Takes Quick Strip (if any) */}
      {takes.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Current Session Takes ({takes.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audio clips rendered during this browser session
              </p>
            </div>
            <button
              type="button"
              onClick={() => onLaunchMode("single")}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Open in Studio
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {takes.slice(0, 4).map((take) => (
              <div
                key={take.id}
                className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-950 dark:text-white truncate">
                    #{String(take.takeNumber).padStart(2, "0")} · {take.text}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {take.voiceName} · {formatTimecode(take.durationSeconds)} ·{" "}
                    {formatBytes(take.byteLength)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenTakeInStudio(take)}
                  className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cloud Firestore Archive (Mobile Cards + Desktop Table) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Cloud Saved History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Synced to Cloud Firestore for your verified Google account
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              {cloudRecords.length} {cloudRecords.length === 1 ? "record" : "records"}
            </span>
          )}
        </div>

        {!isAuthenticated ? (
          <div className="px-6 py-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-950 dark:text-white">
              Sign in with Google to view your synced cloud history
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Every single speech, batch clip, and dialogue prompt you render is saved privately to your account.
            </p>
            <button
              type="button"
              onClick={onSignIn}
              className="h-10 px-4 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          </div>
        ) : cloudRecords.length === 0 ? (
          <div className="px-6 py-10 text-center space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No saved cloud generations yet. Render your first audio clip in the studio.
            </p>
            <button
              type="button"
              onClick={() => onLaunchMode("single")}
              className="h-9 px-4 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              Go to Studio
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {cloudRecords.map((rec) => (
                <div key={rec.id} className="p-4 space-y-2.5">
                  <p className="text-sm font-medium text-slate-950 dark:text-white line-clamp-2">
                    {rec.text}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {rec.voiceName} ·{" "}
                      {rec.mode === "dialogue" ? "Dual-Speaker" : "Single"}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatTimecode(rec.durationSeconds)} ·{" "}
                      {formatBytes(rec.byteLength)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onReloadCloudRecord(rec)}
                      className="flex-1 h-10 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Open in Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCloudRecord(rec.id)}
                      aria-label="Delete saved record"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pl-6 pr-3">Saved Script &amp; Direction</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Voice &amp; Model</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Duration</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Size</th>
                    <th className="py-2.5 pl-3 pr-6 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {cloudRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pl-6 pr-3 max-w-md">
                        <p className="text-sm font-medium text-slate-950 dark:text-white truncate">
                          {rec.text}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {rec.mode === "dialogue" ? "Dual-Speaker" : "Single"} ·{" "}
                          {rec.style || "Default delivery"}
                        </p>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {rec.voiceName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {rec.model === "gemini-3.8-flash-lite-tts"
                            ? "Flash Lite TTS"
                            : "Flash TTS"}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                        {formatTimecode(rec.durationSeconds)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                        {formatBytes(rec.byteLength)}
                      </td>
                      <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onReloadCloudRecord(rec)}
                            className="h-8 px-2.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Open in Studio</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCloudRecord(rec.id)}
                            aria-label="Delete saved record"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
