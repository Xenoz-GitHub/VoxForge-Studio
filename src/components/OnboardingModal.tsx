import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Film,
  Layers,
  Mic2,
  Radio,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  TTS_MODELS,
  TTS_TEMPLATES,
  VOICE_PROFILES,
  type TtsModelId,
  type VoiceName,
} from "../types/narration";

export interface OnboardingPrefs {
  completed: boolean;
  useCaseId: string;
  preferredVoice: VoiceName;
  preferredModel: TtsModelId;
}

interface OnboardingModalProps {
  isOpen: boolean;
  initialPrefs: OnboardingPrefs;
  userDisplayName?: string;
  onComplete: (prefs: OnboardingPrefs, destination: "dashboard" | "studio") => void;
  onSkip: (prefs: OnboardingPrefs) => void;
}

const USE_CASES = [
  {
    id: "general-explainer",
    title: "Voiceovers & Explainers",
    description: "Clear studio narration for tutorials, videos, and demos.",
    Icon: Sparkles,
  },
  {
    id: "dual-podcast",
    title: "Podcasts & Dialogues",
    description: "Natural two-speaker conversations with vocal cues.",
    Icon: Mic2,
  },
  {
    id: "news-broadcast",
    title: "News & Documentaries",
    description: "Authoritative cadence for announcements and reporting.",
    Icon: Radio,
  },
  {
    id: "batch-multitake",
    title: "Batch Audio Rendering",
    description: "Split multi-line scripts and render up to 20 WAV clips.",
    Icon: Layers,
  },
  {
    id: "cartoon-windmill",
    title: "Audiobooks & Storytelling",
    description: "Expressive pacing with word stress and character voices.",
    Icon: Film,
  },
];

export function OnboardingModal({
  isOpen,
  initialPrefs,
  userDisplayName,
  onComplete,
  onSkip,
}: OnboardingModalProps) {
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState<1 | 2>(1);
  const [useCaseId, setUseCaseId] = useState<string>(
    initialPrefs.useCaseId || TTS_TEMPLATES[0].id
  );
  const [preferredVoice, setPreferredVoice] = useState<VoiceName>(
    initialPrefs.preferredVoice || "Kore"
  );
  const [preferredModel, setPreferredModel] = useState<TtsModelId>(
    initialPrefs.preferredModel || "gemini-3.8-flash-tts"
  );

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUseCaseId(initialPrefs.useCaseId || TTS_TEMPLATES[0].id);
      setPreferredVoice(initialPrefs.preferredVoice || "Kore");
      setPreferredModel(initialPrefs.preferredModel || "gemini-3.8-flash-tts");
    }
  }, [isOpen, initialPrefs]);

  if (!isOpen) return null;

  const currentPrefs: OnboardingPrefs = {
    completed: true,
    useCaseId,
    preferredVoice,
    preferredModel,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full sm:max-w-2xl max-h-[90dvh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Mobile Sheet Grab Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="text-xs font-medium text-orange-600 dark:text-orange-400">
              Welcome{userDisplayName ? `, ${userDisplayName}` : ""} · Step {step} of 2
            </div>
            <h2
              id="onboarding-modal-title"
              className="font-display text-lg sm:text-xl font-bold text-slate-950 dark:text-white mt-0.5"
            >
              {step === 1
                ? "What will you create first?"
                : "Pick your default voice & engine"}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onSkip(currentPrefs)}
            aria-label="Close onboarding"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean 2-Segment Progress Bar (zero text truncation on mobile) */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-left space-y-1.5 cursor-pointer"
            >
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  step >= 1
                    ? "bg-orange-600 dark:bg-orange-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
              <div
                className={`text-xs font-medium ${
                  step === 1
                    ? "text-slate-950 dark:text-white font-semibold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                1. Use Case
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-left space-y-1.5 cursor-pointer"
            >
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  step === 2
                    ? "bg-orange-600 dark:bg-orange-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
              <div
                className={`text-xs font-medium ${
                  step === 2
                    ? "text-slate-950 dark:text-white font-semibold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                2. Voice &amp; Engine
              </div>
            </button>
          </div>
        </div>

        {/* Scrollable Body (scrollbar hidden cleanly via CSS) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="modal-step-1"
                initial={prefersReduced ? false : { opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReduced ? undefined : { opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {USE_CASES.map((item) => {
                  const Icon = item.Icon;
                  const isSelected = useCaseId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUseCaseId(item.id)}
                      aria-pressed={isSelected}
                      className={`text-left p-3.5 sm:p-4 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "border-orange-600 bg-orange-50/70 dark:bg-orange-500/10"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-orange-600 text-white"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-950 dark:text-white">
                          {item.title}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="modal-step-2"
                initial={prefersReduced ? false : { opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReduced ? undefined : { opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TTS_MODELS.map((m) => {
                    const isSelected = preferredModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPreferredModel(m.id)}
                        className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          isSelected
                            ? "border-slate-900 dark:border-orange-500 bg-slate-900 dark:bg-orange-600 text-white"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="text-sm font-semibold">{m.label}</div>
                        <div
                          className={`text-xs mt-0.5 ${
                            isSelected
                              ? "text-slate-200"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {m.summary}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {VOICE_PROFILES.map((v) => {
                    const isSelected = preferredVoice === v.name;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setPreferredVoice(v.name)}
                        className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          isSelected
                            ? "border-orange-600 bg-orange-50/70 dark:bg-orange-500/10"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-950 dark:text-white">
                            {v.name}
                          </span>
                          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                            {v.persona}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {v.tone}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => onSkip(currentPrefs)}
              className="h-11 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onComplete(currentPrefs, "dashboard")}
                  className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => onComplete(currentPrefs, "studio")}
                  className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Mic2 className="w-4 h-4" />
                  <span>Open Studio</span>
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
