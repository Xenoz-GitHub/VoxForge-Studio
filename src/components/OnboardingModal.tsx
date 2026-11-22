import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Film,
  Layers,
  MessageSquare,
  Mic2,
  Radio,
  Sparkles,
  X,
  Zap,
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
    description: "Studio-quality narration for tutorials and videos",
    Icon: Sparkles,
    gradient: "from-violet-500 to-purple-600",
    bgGradient: "from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10",
  },
  {
    id: "dual-podcast",
    title: "Podcasts & Dialogues",
    description: "Natural conversations between two speakers",
    Icon: MessageSquare,
    gradient: "from-blue-500 to-cyan-600",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10",
  },
  {
    id: "news-broadcast",
    title: "News & Broadcasts",
    description: "Professional announcements and reporting",
    Icon: Radio,
    gradient: "from-red-500 to-orange-600",
    bgGradient: "from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10",
  },
  {
    id: "batch-multitake",
    title: "Batch Processing",
    description: "Render multiple clips simultaneously",
    Icon: Layers,
    gradient: "from-emerald-500 to-teal-600",
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10",
  },
  {
    id: "cartoon-windmill",
    title: "Audiobooks & Stories",
    description: "Expressive character voices with emotion",
    Icon: BookOpen,
    gradient: "from-amber-500 to-orange-600",
    bgGradient: "from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10",
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 -right-32 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full sm:max-w-3xl max-h-[92dvh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Gradient Top Border */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-emerald-500 to-blue-500"></div>

        {/* Mobile Sheet Handle */}
        <div className="sm:hidden pt-3 pb-2 flex justify-center shrink-0">
          <span className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Enhanced Header */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 shrink-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 tracking-wide uppercase">
                Step {step} of 2
              </div>
            </div>
            <h2
              id="onboarding-modal-title"
              className="font-display text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
            >
              {step === 1
                ? userDisplayName
                  ? `Welcome, ${userDisplayName}! What will you create?`
                  : "What will you create first?"
                : "Choose your voice & engine"}
            </h2>
            {step === 1 && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Select your primary use case to get personalized recommendations
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSkip(currentPrefs)}
            aria-label="Close onboarding"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modern Progress Indicator */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            {[1, 2].map((num) => (
              <div key={num} className="flex-1">
                <div className="relative">
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: step >= num ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full ${
                        num === 1
                          ? "bg-gradient-to-r from-orange-500 to-orange-600"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs font-medium ${
                        step >= num
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {num}. {num === 1 ? "Use Case" : "Voice & Engine"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="modal-step-1"
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {USE_CASES.map((item, index) => {
                  const Icon = item.Icon;
                  const isSelected = useCaseId === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      type="button"
                      onClick={() => setUseCaseId(item.id)}
                      aria-pressed={isSelected}
                      className={`group relative text-left p-5 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                        isSelected
                          ? "border-orange-500 shadow-lg shadow-orange-500/20 scale-[1.02]"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                      }`}
                    >
                      {/* Background Gradient */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                          isSelected ? "!opacity-100" : ""
                        }`}
                      />

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.gradient} shadow-lg transform transition-transform group-hover:scale-110 ${
                              isSelected ? "scale-110" : ""
                            }`}
                          >
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Glow Effect on Hover */}
                      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-orange-500 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity blur" />
                    </motion.button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="modal-step-2"
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {/* AI Model Selection */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    AI Model
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TTS_MODELS.map((m) => {
                      const isSelected = preferredModel === m.id;
                      return (
                        <motion.button
                          key={m.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setPreferredModel(m.id)}
                          className={`relative text-left p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                            isSelected
                              ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
                              : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700"
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 transition-opacity ${
                            isSelected ? "opacity-100" : ""
                          }`} />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                {m.label}
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              {m.summary}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Voice Selection */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Mic2 className="w-4 h-4 text-orange-500" />
                    Voice Persona
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {VOICE_PROFILES.map((v, index) => {
                      const isSelected = preferredVoice === v.name;
                      return (
                        <motion.button
                          key={v.name}
                          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setPreferredVoice(v.name)}
                          className={`relative text-left p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                            isSelected
                              ? "border-orange-500 shadow-lg shadow-orange-500/20"
                              : "border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700"
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 opacity-0 transition-opacity ${
                            isSelected ? "opacity-100" : ""
                          }`} />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">
                                  {v.name}
                                </div>
                                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                                  {v.persona}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                              {v.tone}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Footer */}
        <div className="px-6 sm:px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => onSkip(currentPrefs)}
              className="h-12 px-4 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer active:scale-95"
            >
              Skip for now
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 px-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-500/30 active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onComplete(currentPrefs, "dashboard")}
                  className="h-12 px-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold transition-all cursor-pointer active:scale-95"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => onComplete(currentPrefs, "studio")}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-500/30 active:scale-95"
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
