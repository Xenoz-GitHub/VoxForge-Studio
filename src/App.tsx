import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  AlertCircle,
  LayoutDashboard,
  Loader2,
  Mic2,
  RotateCcw,
} from "lucide-react";
import { BatchQueueEditor } from "./components/BatchQueueEditor";
import { CloudHistoryPanel } from "./components/CloudHistoryPanel";
import { ConnectGateModal } from "./components/ConnectGateModal";
import { DashboardView } from "./components/DashboardView";
import { LandingPage } from "./components/LandingPage";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { Navbar, type AppView, type ThemeMode } from "./components/Navbar";
import {
  OnboardingModal,
  type OnboardingPrefs,
} from "./components/OnboardingModal";
import { TakesTable } from "./components/TakesTable";
import { TemplatesPanel } from "./components/TemplatesPanel";
import { WaveformPlayer } from "./components/WaveformPlayer";
import {
  auth,
  deleteCloudGeneration,
  ensureUserProfile,
  saveGenerationToCloud,
  signInWithGooglePopup,
  signOutUser,
  subscribeUserGenerations,
  updateCommunityConnected,
  type CloudGenerationDoc,
  type UserProfileDoc,
} from "./firebase";
import {
  STYLE_PRESETS,
  TTS_MODELS,
  TTS_TEMPLATES,
  VOCAL_CUES,
  VOICE_PROFILES,
  type BatchQueueItem,
  type NarrationMode,
  type NarrationTake,
  type TtsModelId,
  type TtsTemplate,
  type VoiceName,
} from "./types/narration";
import { createWavBlobUrl, extractWaveformPeaks } from "./utils/audio";

const DEFAULT_TEMPLATE = TTS_TEMPLATES[0];
const DEFAULT_DUAL_TEMPLATE = TTS_TEMPLATES[4];
const DEFAULT_BATCH_TEMPLATE = TTS_TEMPLATES[2];

function normalizeToken(word: string): string {
  return word.replace(/^[^a-zA-Z0-9-]+|[^a-zA-Z0-9-]+$/g, "");
}

function buildInitialBatchItems(): BatchQueueItem[] {
  const lines = DEFAULT_BATCH_TEMPLATE.batchLines ?? [
    "Step one: prepare your script lines.",
    "Step two: generate every audio clip concurrently.",
  ];
  return lines.map((line, idx) => ({
    id: `batch-init-${idx}`,
    text: line,
    voiceName: idx % 2 === 0 ? "Kore" : "Puck",
    style: "",
    status: "ready",
  }));
}

const THEME_STORAGE_KEY = "voxforge_theme";
const ONBOARDING_STORAGE_PREFIX = "voxforge_onboarding_";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {}
  return "light";
}

function getDefaultOnboardingPrefs(): OnboardingPrefs {
  return {
    completed: false,
    useCaseId: DEFAULT_TEMPLATE.id,
    preferredVoice: DEFAULT_TEMPLATE.voiceName,
    preferredModel: DEFAULT_TEMPLATE.model,
  };
}

function loadOnboardingForUser(uid: string): OnboardingPrefs {
  const fallback = getDefaultOnboardingPrefs();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`${ONBOARDING_STORAGE_PREFIX}${uid}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<OnboardingPrefs>;
    return {
      completed: Boolean(parsed.completed),
      useCaseId: parsed.useCaseId || fallback.useCaseId,
      preferredVoice: parsed.preferredVoice || fallback.preferredVoice,
      preferredModel: parsed.preferredModel || fallback.preferredModel,
    };
  } catch {
    return fallback;
  }
}

function saveOnboardingForUser(uid: string, prefs: OnboardingPrefs): void {
  try {
    localStorage.setItem(
      `${ONBOARDING_STORAGE_PREFIX}${uid}`,
      JSON.stringify(prefs)
    );
  } catch {}
}

function viewFromHash(): AppView {
  if (typeof window === "undefined") return "landing";
  const hash = window.location.hash.replace("#", "").toLowerCase();
  if (hash === "dashboard") return "dashboard";
  if (hash === "studio") return "studio";
  return "landing";
}

export default function App() {
  // Multi-view & Theme state
  const [activeView, setActiveView] = useState<AppView>(viewFromHash);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [onboardingPrefs, setOnboardingPrefs] = useState<OnboardingPrefs>(
    getDefaultOnboardingPrefs
  );
  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(false);

  // Auth & Firestore profile state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfileDoc | null>(null);
  const [cloudRecords, setCloudRecords] = useState<CloudGenerationDoc[]>([]);
  const [gateOpen, setGateOpen] = useState<boolean>(false);
  const [gateSaving, setGateSaving] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const pendingGenerateRef = useRef<boolean>(false);
  const gateOpenRef = useRef<boolean>(false);

  useEffect(() => {
    gateOpenRef.current = gateOpen;
  }, [gateOpen]);

  // Sync theme to document root & localStorage
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  // Sync browser hash navigation
  useEffect(() => {
    const onHashChange = () => {
      setActiveView(viewFromHash());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigateTo = useCallback((view: AppView, anchorId?: string) => {
    setActiveView(view);
    const targetHash = view === "landing" && anchorId ? anchorId : view;
    if (window.location.hash !== `#${targetHash}`) {
      window.history.pushState(null, "", `#${targetHash}`);
    }
    if (anchorId) {
      setTimeout(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // Studio config state
  const [activeTemplateId, setActiveTemplateId] = useState<string>(DEFAULT_TEMPLATE.id);
  const [mode, setMode] = useState<NarrationMode>(DEFAULT_TEMPLATE.mode);
  const [modelId, setModelId] = useState<TtsModelId>(DEFAULT_TEMPLATE.model);
  const [configuredKeyCount, setConfiguredKeyCount] = useState<number>(1);

  // Single-speaker state
  const [scriptText, setScriptText] = useState<string>(DEFAULT_TEMPLATE.text);
  const [stylePrompt, setStylePrompt] = useState<string>(DEFAULT_TEMPLATE.style);
  const [voiceName, setVoiceName] = useState<VoiceName>(DEFAULT_TEMPLATE.voiceName);
  const [emphasizedWords, setEmphasizedWords] = useState<string[]>(
    DEFAULT_TEMPLATE.emphasizedWords
  );

  // Multi-voice audition in Single mode
  const [multiVoiceEnabled, setMultiVoiceEnabled] = useState<boolean>(false);
  const [auditionVoices, setAuditionVoices] = useState<VoiceName[]>(["Kore", "Puck"]);

  // Batch queue state
  const [batchItems, setBatchItems] = useState<BatchQueueItem[]>(buildInitialBatchItems);

  // Dual-speaker state
  const [speakerOneName, setSpeakerOneName] = useState<string>(
    DEFAULT_DUAL_TEMPLATE.speakerOne?.speaker ?? "Alex"
  );
  const [speakerOneVoice, setSpeakerOneVoice] = useState<VoiceName>(
    DEFAULT_DUAL_TEMPLATE.speakerOne?.voiceName ?? "Puck"
  );
  const [speakerOneStyle, setSpeakerOneStyle] = useState<string>(
    DEFAULT_DUAL_TEMPLATE.speakerOne?.style ?? ""
  );
  const [speakerOneText, setSpeakerOneText] = useState<string>(
    DEFAULT_DUAL_TEMPLATE.speakerOne?.text ?? ""
  );

  const [speakerTwoName, setSpeakerTwoName] = useState<string>(
    DEFAULT_DUAL_TEMPLATE.speakerTwo?.speaker ?? "Sam"
  );
  const [speakerTwoVoice, setSpeakerTwoVoice] = useState<VoiceName>(
    DEFAULT_DUAL_TEMPLATE.speakerTwo?.voiceName ?? "Zephyr"
  );
  const [speakerTwoStyle, setSpeakerTwoStyle] = useState<string>(
    DEFAULT_DUAL_TEMPLATE.speakerTwo?.style ?? ""
  );
  const [speakerTwoText, setSpeakerTwoText] = useState<string>(
    DEFAULT_DUAL_TEMPLATE.speakerTwo?.text ?? ""
  );

  // Generation & Takes state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [takes, setTakes] = useState<NarrationTake[]>([]);
  const [activeTakeId, setActiveTakeId] = useState<string | null>(null);

  const takeCounterRef = useRef<number>(1);
  const createdUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: { configuredKeyCount?: number }) => {
        if (typeof data.configuredKeyCount === "number" && data.configuredKeyCount > 0) {
          setConfiguredKeyCount(data.configuredKeyCount);
        }
      })
      .catch(() => {});

    return () => {
      for (const url of createdUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  // Auth listener & Firestore profile sync
  useEffect(() => {
    let unsubHistory: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);

      if (unsubHistory) {
        unsubHistory();
        unsubHistory = null;
      }

      if (!user) {
        setUserProfile(null);
        setCloudRecords([]);
        setOnboardingModalOpen(false);
        setOnboardingPrefs(getDefaultOnboardingPrefs());
        return;
      }

      const savedPrefs = loadOnboardingForUser(user.uid);
      setOnboardingPrefs(savedPrefs);
      if (!savedPrefs.completed && !gateOpenRef.current) {
        setOnboardingModalOpen(true);
      }

      try {
        const profile = await ensureUserProfile(user);
        setUserProfile(profile);
        setAuthError(null);

        unsubHistory = subscribeUserGenerations(
          user.uid,
          (records) => {
            setCloudRecords(records);
          },
          (err) => {
            console.error("Cloud history sync error:", err);
          }
        );
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : "Unable to load your profile."
        );
      }
    });

    return () => {
      unsubAuth();
      if (unsubHistory) unsubHistory();
    };
  }, []);

  const activeTake = useMemo(
    () => takes.find((t) => t.id === activeTakeId) ?? takes[0] ?? null,
    [takes, activeTakeId]
  );

  const scriptTokens = useMemo(() => {
    return scriptText
      .split(/\s+/)
      .map((raw) => ({
        raw,
        clean: normalizeToken(raw),
      }))
      .filter(
        (item) =>
          item.clean.length > 0 &&
          !item.raw.startsWith("<") &&
          !item.raw.startsWith("|")
      );
  }, [scriptText]);

  const handleToggleEmphasis = (word: string) => {
    const clean = normalizeToken(word);
    if (!clean) return;
    setEmphasizedWords((prev) => {
      const exists = prev.some((w) => w.toLowerCase() === clean.toLowerCase());
      if (exists) {
        return prev.filter((w) => w.toLowerCase() !== clean.toLowerCase());
      }
      return [...prev, clean];
    });
  };

  const handleToggleAuditionVoice = (name: VoiceName) => {
    setAuditionVoices((prev) => {
      if (prev.includes(name)) {
        return prev.length > 1 ? prev.filter((v) => v !== name) : prev;
      }
      return [...prev, name];
    });
  };

  const handleInsertCue = (token: string) => {
    if (mode === "single") {
      setScriptText((prev) => {
        const trimmed = prev.trimEnd();
        return trimmed ? `${trimmed} ${token}` : token;
      });
    } else if (mode === "dialogue") {
      setSpeakerTwoText((prev) => {
        const trimmed = prev.trimEnd();
        return trimmed ? `${trimmed} ${token}` : token;
      });
    }
  };

  const handleSelectTemplate = (template: TtsTemplate) => {
    setActiveTemplateId(template.id);
    setMode(template.mode);
    setModelId(template.model);
    setErrorMessage(null);

    if (template.mode === "single") {
      setScriptText(template.text);
      setStylePrompt(template.style);
      setVoiceName(template.voiceName);
      setEmphasizedWords(template.emphasizedWords);
    } else if (template.mode === "batch") {
      setStylePrompt(template.style);
      setVoiceName(template.voiceName);
      const lines = template.batchLines ?? [template.text];
      setBatchItems(
        lines.map((line, idx) => ({
          id: `batch-tpl-${Date.now()}-${idx}`,
          text: line,
          voiceName: idx % 2 === 0 ? template.voiceName : "Puck",
          style: "",
          status: "ready",
        }))
      );
    } else if (template.speakerOne && template.speakerTwo) {
      setSpeakerOneName(template.speakerOne.speaker);
      setSpeakerOneVoice(template.speakerOne.voiceName);
      setSpeakerOneStyle(template.speakerOne.style);
      setSpeakerOneText(template.speakerOne.text);
      setSpeakerTwoName(template.speakerTwo.speaker);
      setSpeakerTwoVoice(template.speakerTwo.voiceName);
      setSpeakerTwoStyle(template.speakerTwo.style);
      setSpeakerTwoText(template.speakerTwo.text);
    }
  };

  const handleResetDefault = () => {
    setMultiVoiceEnabled(false);
    handleSelectTemplate(DEFAULT_TEMPLATE);
  };

  const handleCompleteOnboarding = (
    prefs: OnboardingPrefs,
    destination: "dashboard" | "studio"
  ) => {
    const finalized: OnboardingPrefs = { ...prefs, completed: true };
    setOnboardingPrefs(finalized);
    if (authUser) {
      saveOnboardingForUser(authUser.uid, finalized);
    }
    const matchedTemplate =
      TTS_TEMPLATES.find((t) => t.id === finalized.useCaseId) ?? DEFAULT_TEMPLATE;
    handleSelectTemplate(matchedTemplate);
    setModelId(finalized.preferredModel);
    if (matchedTemplate.mode === "single") {
      setVoiceName(finalized.preferredVoice);
    }
    setOnboardingModalOpen(false);
    navigateTo(destination);
  };

  const handleSkipOnboarding = (prefs: OnboardingPrefs) => {
    const finalized: OnboardingPrefs = { ...prefs, completed: true };
    setOnboardingPrefs(finalized);
    if (authUser) {
      saveOnboardingForUser(authUser.uid, finalized);
    }
    setOnboardingModalOpen(false);
  };

  const createTakeFromResponse = useCallback(
    async (params: {
      audioBase64: string;
      mimeType?: string;
      durationSeconds?: number;
      byteLength?: number;
      mode: "single" | "dialogue";
      model: string;
      text: string;
      style: string;
      voiceName: string;
      emphasizedWords: string[];
      keySlot?: number;
      ownerUid?: string;
    }): Promise<NarrationTake> => {
      const { blobUrl, arrayBuffer } = createWavBlobUrl(
        params.audioBase64,
        params.mimeType || "audio/wav"
      );
      createdUrlsRef.current.push(blobUrl);

      const decoded = await extractWaveformPeaks(arrayBuffer, 72);
      const durationSeconds =
        decoded.durationSeconds > 0
          ? decoded.durationSeconds
          : params.durationSeconds ?? 0;

      const byteLength = params.byteLength ?? arrayBuffer.byteLength;

      if (params.ownerUid) {
        saveGenerationToCloud({
          ownerId: params.ownerUid,
          mode: params.mode,
          model: params.model,
          text: params.text,
          style: params.style,
          voiceName: params.voiceName,
          emphasizedWords: params.emphasizedWords,
          durationSeconds,
          byteLength,
        }).catch((err) => {
          console.error("Failed to save generation metadata:", err);
        });
      }

      const takeNumber = takeCounterRef.current++;
      return {
        id: `take-${Date.now()}-${takeNumber}-${Math.random().toString(36).slice(2, 6)}`,
        takeNumber,
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mode: params.mode,
        model: params.model,
        text: params.text,
        style: params.style,
        voiceName: params.voiceName,
        emphasizedWords: params.emphasizedWords,
        audioUrl: blobUrl,
        durationSeconds,
        byteLength,
        waveformPeaks: decoded.peaks,
        keySlot: params.keySlot,
      };
    },
    []
  );

  const executeGeneration = useCallback(
    async (ownerUid?: string) => {
      setErrorMessage(null);

      if (mode === "batch") {
        const validItems = batchItems.filter((item) => item.text.trim().length > 0);
        if (validItems.length === 0) {
          setErrorMessage("Add at least one non-empty clip in the batch queue.");
          return;
        }

        setIsGenerating(true);
        setBatchItems((prev) =>
          prev.map((item) =>
            item.text.trim()
              ? { ...item, status: "generating", error: undefined }
              : item
          )
        );

        try {
          const res = await fetch("/api/tts/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              defaultStyle: stylePrompt.trim(),
              defaultVoiceName: voiceName,
              defaultModel: modelId,
              items: validItems.map((item) => ({
                id: item.id,
                text: item.text.trim(),
                voiceName: item.voiceName,
                style: item.style.trim(),
                model: modelId,
              })),
            }),
          });

          const data = (await res.json()) as {
            results?: Array<{
              id: string;
              ok: boolean;
              audioBase64?: string;
              mimeType?: string;
              durationSeconds?: number;
              byteLength?: number;
              model?: string;
              voiceName?: string;
              style?: string;
              keySlot?: number;
              error?: string;
            }>;
            configuredKeyCount?: number;
            error?: string;
          };

          if (!res.ok || !data.results) {
            throw new Error(data.error || "Batch audio generation failed.");
          }

          if (typeof data.configuredKeyCount === "number") {
            setConfiguredKeyCount(data.configuredKeyCount);
          }

          const newTakes: NarrationTake[] = [];
          const takeByItemId = new Map<string, string>();
          const errorByItemId = new Map<string, string>();

          for (const r of data.results) {
            const sourceItem = validItems.find((it) => it.id === r.id);
            if (r.ok && r.audioBase64 && sourceItem) {
              const take = await createTakeFromResponse({
                audioBase64: r.audioBase64,
                mimeType: r.mimeType,
                durationSeconds: r.durationSeconds,
                byteLength: r.byteLength,
                mode: "single",
                model: r.model || modelId,
                text: sourceItem.text.trim(),
                style: r.style || stylePrompt.trim(),
                voiceName: r.voiceName || sourceItem.voiceName,
                emphasizedWords: [],
                keySlot: r.keySlot,
                ownerUid,
              });
              newTakes.push(take);
              takeByItemId.set(r.id, take.id);
            } else {
              errorByItemId.set(r.id, r.error || "Failed to generate clip.");
            }
          }

          setBatchItems((prev) =>
            prev.map((item) => {
              const tid = takeByItemId.get(item.id);
              if (tid) {
                return { ...item, status: "done", takeId: tid, error: undefined };
              }
              const err = errorByItemId.get(item.id);
              if (err) {
                return { ...item, status: "error", error: err };
              }
              return item;
            })
          );

          if (newTakes.length > 0) {
            setTakes((prev) => [...newTakes.slice().reverse(), ...prev]);
            setActiveTakeId(newTakes[0].id);
          }

          if (errorByItemId.size > 0 && newTakes.length === 0) {
            setErrorMessage(
              Array.from(errorByItemId.values())[0] || "All batch items failed."
            );
          }
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : "Batch audio generation failed.";
          setErrorMessage(msg);
          setBatchItems((prev) =>
            prev.map((item) =>
              item.status === "generating"
                ? { ...item, status: "error", error: msg }
                : item
            )
          );
        } finally {
          setIsGenerating(false);
        }
        return;
      }

      if (mode === "single" && multiVoiceEnabled) {
        if (!scriptText.trim()) {
          setErrorMessage("Enter text before generating audio.");
          return;
        }

        setIsGenerating(true);
        try {
          const res = await fetch("/api/tts/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              defaultStyle: stylePrompt.trim(),
              defaultModel: modelId,
              items: auditionVoices.map((v) => ({
                id: `audition-${v}`,
                text: scriptText.trim(),
                voiceName: v,
                style: stylePrompt.trim(),
                emphasizedWords,
                model: modelId,
              })),
            }),
          });

          const data = (await res.json()) as {
            results?: Array<{
              id: string;
              ok: boolean;
              audioBase64?: string;
              mimeType?: string;
              durationSeconds?: number;
              byteLength?: number;
              model?: string;
              voiceName?: string;
              style?: string;
              keySlot?: number;
              error?: string;
            }>;
            error?: string;
          };

          if (!res.ok || !data.results) {
            throw new Error(data.error || "Multi-voice generation failed.");
          }

          const generatedTakes: NarrationTake[] = [];
          for (const r of data.results) {
            if (r.ok && r.audioBase64) {
              const take = await createTakeFromResponse({
                audioBase64: r.audioBase64,
                mimeType: r.mimeType,
                durationSeconds: r.durationSeconds,
                byteLength: r.byteLength,
                mode: "single",
                model: r.model || modelId,
                text: scriptText.trim(),
                style: r.style || stylePrompt.trim(),
                voiceName: r.voiceName || "Kore",
                emphasizedWords: [...emphasizedWords],
                keySlot: r.keySlot,
                ownerUid,
              });
              generatedTakes.push(take);
            }
          }

          if (generatedTakes.length === 0) {
            const firstError = data.results.find((r) => r.error)?.error;
            throw new Error(firstError || "No audio could be generated.");
          }

          setTakes((prev) => [...generatedTakes.slice().reverse(), ...prev]);
          setActiveTakeId(generatedTakes[0].id);
        } catch (err: unknown) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Failed to generate multi-voice takes."
          );
        } finally {
          setIsGenerating(false);
        }
        return;
      }

      if (mode === "single" && !scriptText.trim()) {
        setErrorMessage("Enter text to synthesize before generating audio.");
        return;
      }
      if (
        mode === "dialogue" &&
        (!speakerOneText.trim() || !speakerTwoText.trim())
      ) {
        setErrorMessage("Enter lines for both speakers before generating audio.");
        return;
      }

      setIsGenerating(true);
      try {
        const payload =
          mode === "single"
            ? {
                mode: "single",
                model: modelId,
                text: scriptText.trim(),
                style: stylePrompt.trim(),
                voiceName,
                emphasizedWords,
              }
            : {
                mode: "dialogue",
                model: "gemini-3.8-flash-tts",
                speakerOne: {
                  speaker: speakerOneName.trim() || "Speaker 1",
                  voiceName: speakerOneVoice,
                  style: speakerOneStyle.trim(),
                  text: speakerOneText.trim(),
                },
                speakerTwo: {
                  speaker: speakerTwoName.trim() || "Speaker 2",
                  voiceName: speakerTwoVoice,
                  style: speakerTwoStyle.trim(),
                  text: speakerTwoText.trim(),
                },
              };

        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await res.json()) as {
          audioBase64?: string;
          mimeType?: string;
          durationSeconds?: number;
          byteLength?: number;
          model?: string;
          voiceName?: string;
          style?: string;
          keySlot?: number;
          error?: string;
        };

        if (!res.ok || !data.audioBase64) {
          throw new Error(data.error || "Unable to synthesize speech.");
        }

        const newTake = await createTakeFromResponse({
          audioBase64: data.audioBase64,
          mimeType: data.mimeType,
          durationSeconds: data.durationSeconds,
          byteLength: data.byteLength,
          mode: mode === "dialogue" ? "dialogue" : "single",
          model: data.model || modelId,
          text:
            mode === "single"
              ? scriptText.trim()
              : `${speakerOneName}: ${speakerOneText.trim()} / ${speakerTwoName}: ${speakerTwoText.trim()}`,
          style: data.style || stylePrompt.trim(),
          voiceName: data.voiceName || voiceName,
          emphasizedWords: mode === "single" ? [...emphasizedWords] : [],
          keySlot: data.keySlot,
          ownerUid,
        });

        setTakes((prev) => [newTake, ...prev]);
        setActiveTakeId(newTake.id);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to synthesize speech."
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [
      mode,
      modelId,
      batchItems,
      multiVoiceEnabled,
      auditionVoices,
      scriptText,
      stylePrompt,
      voiceName,
      emphasizedWords,
      speakerOneName,
      speakerOneVoice,
      speakerOneStyle,
      speakerOneText,
      speakerTwoName,
      speakerTwoVoice,
      speakerTwoStyle,
      speakerTwoText,
      createTakeFromResponse,
    ]
  );

  // Enforces authentication + developer community connect gate before synthesizing
  const handleGenerateRequest = useCallback(() => {
    if (!authUser || !userProfile?.communityConnected) {
      pendingGenerateRef.current = true;
      setAuthError(null);
      setGateOpen(true);
      return;
    }
    executeGeneration(authUser.uid);
  }, [authUser, userProfile?.communityConnected, executeGeneration]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const signedInUser = await signInWithGooglePopup();
      const prefs = loadOnboardingForUser(signedInUser.uid);
      setOnboardingPrefs(prefs);
      if (!prefs.completed && !gateOpenRef.current) {
        setOnboardingModalOpen(true);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Google sign-in was cancelled or failed."
      );
    }
  };

  const handleConfirmCommunityAndProceed = async () => {
    if (!authUser) return;
    setGateSaving(true);
    setAuthError(null);
    try {
      if (!userProfile?.communityConnected) {
        await updateCommunityConnected(authUser.uid, true);
        setUserProfile((prev) =>
          prev ? { ...prev, communityConnected: true } : prev
        );
      }
      setGateOpen(false);
      if (pendingGenerateRef.current) {
        pendingGenerateRef.current = false;
        await executeGeneration(authUser.uid);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Could not save your verification."
      );
    } finally {
      setGateSaving(false);
    }
  };

  const handleLoadIntoEditor = (take: NarrationTake) => {
    if (take.mode === "single") {
      setMode("single");
      setMultiVoiceEnabled(false);
      setScriptText(take.text);
      setStylePrompt(take.style);
      if (VOICE_PROFILES.some((v) => v.name === take.voiceName)) {
        setVoiceName(take.voiceName as VoiceName);
      }
      if (
        take.model === "gemini-3.8-flash-tts" ||
        take.model === "gemini-3.8-flash-lite-tts"
      ) {
        setModelId(take.model);
      }
      setEmphasizedWords(take.emphasizedWords);
    }
    setActiveTakeId(take.id);
    navigateTo("studio");
  };

  const handleReloadCloudRecord = (record: CloudGenerationDoc) => {
    if (record.mode === "single") {
      setMode("single");
      setMultiVoiceEnabled(false);
      setScriptText(record.text);
      setStylePrompt(record.style);
      if (VOICE_PROFILES.some((v) => v.name === record.voiceName)) {
        setVoiceName(record.voiceName as VoiceName);
      }
      setModelId(record.model);
      setEmphasizedWords(record.emphasizedWords);
    }
    navigateTo("studio");
  };

  const handleDeleteTake = (takeId: string) => {
    setTakes((prev) => {
      const target = prev.find((t) => t.id === takeId);
      if (target) {
        URL.revokeObjectURL(target.audioUrl);
      }
      const next = prev.filter((t) => t.id !== takeId);
      if (activeTakeId === takeId) {
        setActiveTakeId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleDeleteCloudRecord = async (recordId: string) => {
    try {
      await deleteCloudGeneration(recordId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete cloud record."
      );
    }
  };

  const previewText =
    mode === "single"
      ? scriptText.trim() || DEFAULT_TEMPLATE.text
      : mode === "batch"
      ? batchItems.find((i) => i.text.trim())?.text.trim() ||
        "Batch queue ready for parallel generation"
      : `${speakerOneName}: ${speakerOneText.trim()}`;

  const previewVoiceSummary =
    mode === "single"
      ? multiVoiceEnabled
        ? `Multi-Voice Audition (${auditionVoices.length} voices)`
        : `${voiceName} · ${modelId}`
      : mode === "batch"
      ? `Batch Queue (${batchItems.filter((i) => i.text.trim()).length} clips)`
      : `${speakerOneVoice} + ${speakerTwoVoice}`;

  const primaryActionLabel = isGenerating
    ? mode === "batch" || multiVoiceEnabled
      ? "Generating Batch..."
      : "Synthesizing..."
    : mode === "batch"
    ? `Generate Queue (${batchItems.filter((i) => i.text.trim()).length})`
    : mode === "single" && multiVoiceEnabled
    ? `Generate ${auditionVoices.length} Voice Takes`
    : "Generate Audio";

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 md:pb-0 transition-colors duration-200">
      {/* Strict 3-Zone Top Navigation with Dark/Light Toggle */}
      <Navbar
        activeView={activeView}
        onNavigate={navigateTo}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        authReady={authReady}
        authUser={authUser}
        onSignIn={handleGoogleSignIn}
        onSignOut={() => signOutUser()}
      />

      {activeView === "landing" && (
        <LandingPage
          isAuthenticated={Boolean(authUser)}
          onGetStarted={handleGoogleSignIn}
          onOpenStudio={() => navigateTo("studio")}
          onOpenDashboard={() => navigateTo("dashboard")}
        />
      )}

      {activeView === "dashboard" && (
        <DashboardView
          isAuthenticated={Boolean(authUser)}
          userDisplayName={authUser?.displayName || authUser?.email || undefined}
          preferredVoice={onboardingPrefs.preferredVoice}
          configuredKeyCount={configuredKeyCount}
          takes={takes}
          cloudRecords={cloudRecords}
          onSignIn={handleGoogleSignIn}
          onLaunchMode={(targetMode) => {
            setMode(targetMode);
            navigateTo("studio");
          }}
          onSelectTemplateAndOpenStudio={(tpl) => {
            handleSelectTemplate(tpl);
            navigateTo("studio");
          }}
          onReloadCloudRecord={handleReloadCloudRecord}
          onDeleteCloudRecord={handleDeleteCloudRecord}
          onOpenTakeInStudio={(take) => {
            setActiveTakeId(take.id);
            navigateTo("studio");
          }}
          onRunOnboarding={() => {
            if (authUser) {
              setOnboardingModalOpen(true);
            }
          }}
        />
      )}

      {activeView === "studio" && (
        <main
          id="studio"
          className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10"
        >
          <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                <span>Interactive Speech Studio</span>
                <span aria-hidden="true">·</span>
                <span>Single, Batch &amp; Dual-Speaker</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white text-balance">
                Create &amp; Audition Voice Tracks
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => navigateTo("dashboard")}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Workspace</span>
              </button>
            </div>
          </section>

          {/* Primary 2-Column Studio Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Script & Voice Configuration Console */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-6 transition-colors">
              <div className="space-y-5">
                {/* Mode Switch */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Speech Workspace
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Generate single clips, parallel voice auditions, or multi-line batches
                    </p>
                  </div>

                  <div
                    className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg"
                    role="tablist"
                    aria-label="Synthesis mode"
                  >
                    {(
                      [
                        { id: "single", label: "Single Speech" },
                        { id: "batch", label: "Batch Queue" },
                        { id: "dialogue", label: "Dual-Speaker" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={mode === tab.id}
                        onClick={() => setMode(tab.id)}
                        className={`px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors truncate cursor-pointer ${
                          mode === tab.id
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selector (Single & Batch) */}
                {mode !== "dialogue" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {TTS_MODELS.map((m) => {
                      const isSelected = modelId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setModelId(m.id)}
                          aria-pressed={isSelected}
                          className={`text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                            isSelected
                              ? "border-slate-900 dark:border-orange-500 bg-slate-900 dark:bg-orange-600 text-white"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="text-xs font-semibold">{m.label}</div>
                          <div
                            className={`text-xs mt-0.5 truncate ${
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
                )}

                {mode === "single" ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor="narration-script"
                          className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                          Text to Convert
                        </label>
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                          {scriptText.length} / 4000 chars
                        </span>
                      </div>
                      <textarea
                        id="narration-script"
                        rows={3}
                        value={scriptText}
                        onChange={(e) => setScriptText(e.target.value)}
                        placeholder="Enter any text, article paragraph, dialogue, or narration..."
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 px-4 py-3 text-base font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors resize-y"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Word Emphasis Targets
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Click words to toggle vocal stress
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
                        {scriptTokens.length === 0 ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Type text above to select emphasis targets.
                          </span>
                        ) : (
                          scriptTokens.map((item, idx) => {
                            const isEmphasized = emphasizedWords.some(
                              (w) => w.toLowerCase() === item.clean.toLowerCase()
                            );
                            return (
                              <button
                                key={`${item.clean}-${idx}`}
                                type="button"
                                onClick={() => handleToggleEmphasis(item.clean)}
                                aria-pressed={isEmphasized}
                                className={`px-2 py-1 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                                  isEmphasized
                                    ? "bg-orange-600 border-orange-600 text-white font-semibold"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                {item.raw}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Optional vocal cues:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {VOCAL_CUES.slice(0, 3).map((cue) => (
                          <button
                            key={cue.token}
                            type="button"
                            onClick={() => handleInsertCue(cue.token)}
                            title={cue.label}
                            className="px-2.5 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                          >
                            + {cue.token}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor="voice-direction"
                          className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                          Delivery Style &amp; Pacing
                        </label>
                        <div className="flex flex-wrap items-center gap-1">
                          {STYLE_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setStylePrompt(preset.prompt)}
                              className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        id="voice-direction"
                        rows={2}
                        value={stylePrompt}
                        onChange={(e) => setStylePrompt(e.target.value)}
                        placeholder="Describe tone, accent, speed, or speaking persona..."
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors resize-y"
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {multiVoiceEnabled
                            ? `Audition Voices (${auditionVoices.length} selected)`
                            : `Voice Persona (${voiceName})`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setMultiVoiceEnabled((prev) => !prev)}
                          aria-pressed={multiVoiceEnabled}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                            multiVoiceEnabled
                              ? "bg-orange-600 border-orange-600 text-white"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {multiVoiceEnabled
                            ? "Multi-Voice Audition: On"
                            : "Audition Multiple Voices"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {VOICE_PROFILES.map((profile) => {
                          const isSelected = multiVoiceEnabled
                            ? auditionVoices.includes(profile.name)
                            : voiceName === profile.name;
                          return (
                            <button
                              key={profile.name}
                              type="button"
                              onClick={() =>
                                multiVoiceEnabled
                                  ? handleToggleAuditionVoice(profile.name)
                                  : setVoiceName(profile.name)
                              }
                              aria-pressed={isSelected}
                              className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                                isSelected
                                  ? "border-orange-600 bg-orange-50/60 dark:bg-orange-500/10"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {profile.name}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {profile.persona}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                                {profile.tone}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : mode === "batch" ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <label
                          htmlFor="batch-default-style"
                          className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                          Default Delivery Style for Queue
                        </label>
                        <div className="flex flex-wrap items-center gap-1">
                          {STYLE_PRESETS.slice(0, 3).map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setStylePrompt(preset.prompt)}
                              className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        id="batch-default-style"
                        type="text"
                        value={stylePrompt}
                        onChange={(e) => setStylePrompt(e.target.value)}
                        placeholder="Default speaking style applied to clips without an override..."
                        className="w-full h-9 px-3 text-xs bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <BatchQueueEditor
                      items={batchItems}
                      defaultVoice={voiceName}
                      defaultStyle={stylePrompt}
                      onChangeItems={setBatchItems}
                      onPlayTakeById={(tid) => setActiveTakeId(tid)}
                    />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="s1-name"
                            className="text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0"
                          >
                            Speaker 1
                          </label>
                          <input
                            id="s1-name"
                            type="text"
                            value={speakerOneName}
                            onChange={(e) => setSpeakerOneName(e.target.value)}
                            className="h-8 px-2.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md w-full sm:w-28 min-w-0"
                          />
                        </div>
                        <select
                          aria-label="Speaker 1 voice"
                          value={speakerOneVoice}
                          onChange={(e) =>
                            setSpeakerOneVoice(e.target.value as VoiceName)
                          }
                          className="h-8 px-2.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md w-full sm:w-auto min-w-0 max-w-full"
                        >
                          {VOICE_PROFILES.map((v) => (
                            <option key={v.name} value={v.name}>
                              {v.name} ({v.persona})
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={speakerOneStyle}
                        onChange={(e) => setSpeakerOneStyle(e.target.value)}
                        placeholder="Voice direction for Speaker 1..."
                        aria-label="Speaker 1 voice direction"
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md"
                      />
                      <textarea
                        rows={2}
                        value={speakerOneText}
                        onChange={(e) => setSpeakerOneText(e.target.value)}
                        placeholder="Speaker 1 line..."
                        aria-label="Speaker 1 line"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md resize-y"
                      />
                    </div>

                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="s2-name"
                            className="text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0"
                          >
                            Speaker 2
                          </label>
                          <input
                            id="s2-name"
                            type="text"
                            value={speakerTwoName}
                            onChange={(e) => setSpeakerTwoName(e.target.value)}
                            className="h-8 px-2.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md w-full sm:w-28 min-w-0"
                          />
                        </div>
                        <select
                          aria-label="Speaker 2 voice"
                          value={speakerTwoVoice}
                          onChange={(e) =>
                            setSpeakerTwoVoice(e.target.value as VoiceName)
                          }
                          className="h-8 px-2.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md w-full sm:w-auto min-w-0 max-w-full"
                        >
                          {VOICE_PROFILES.map((v) => (
                            <option key={v.name} value={v.name}>
                              {v.name} ({v.persona})
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={speakerTwoStyle}
                        onChange={(e) => setSpeakerTwoStyle(e.target.value)}
                        placeholder="Voice direction for Speaker 2..."
                        aria-label="Speaker 2 voice direction"
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md"
                      />
                      <textarea
                        rows={2}
                        value={speakerTwoText}
                        onChange={(e) => setSpeakerTwoText(e.target.value)}
                        placeholder="Speaker 2 line..."
                        aria-label="Speaker 2 line"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md resize-y"
                      />
                      <div className="flex flex-wrap items-center gap-1.5">
                        {VOCAL_CUES.map((cue) => (
                          <button
                            key={cue.token}
                            type="button"
                            onClick={() => handleInsertCue(cue.token)}
                            className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded transition-colors cursor-pointer"
                          >
                            + {cue.token}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {!authUser
                      ? "Sign in and connect to unlock generation"
                      : !userProfile?.communityConnected
                      ? "Complete community check on generate"
                      : mode === "batch"
                      ? `Distributes clips across ${configuredKeyCount} server key(s)`
                      : mode === "single" && multiVoiceEnabled
                      ? `Auditioning ${auditionVoices.join(", ")} in parallel`
                      : mode === "single"
                      ? `Emphasis: ${
                          emphasizedWords.length > 0
                            ? emphasizedWords.join(", ")
                            : "None"
                        }`
                      : "Dual-speaker dialogue synthesis"}
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={handleGenerateRequest}
                    className="h-11 w-full sm:w-auto px-6 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{primaryActionLabel}</span>
                      </>
                    ) : (
                      <>
                        <Mic2 className="w-4 h-4" />
                        <span>{primaryActionLabel}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Templates Panel + Hardware Playback Deck */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-6">
              <TemplatesPanel
                activeTemplateId={activeTemplateId}
                onSelectTemplate={handleSelectTemplate}
                scriptPreview={previewText}
                activeStyle={stylePrompt}
                activeVoiceSummary={previewVoiceSummary}
              />

              <WaveformPlayer
                take={activeTake}
                isGenerating={isGenerating}
                onQuickGenerate={handleGenerateRequest}
              />
            </div>
          </section>

          {/* Session Audio Takes Archive */}
          <TakesTable
            takes={takes}
            activeTakeId={activeTake?.id ?? null}
            onSelectTake={(take) => setActiveTakeId(take.id)}
            onLoadIntoEditor={handleLoadIntoEditor}
            onDeleteTake={handleDeleteTake}
            onQuickGenerate={handleGenerateRequest}
          />

          {/* Cloud-Synced Firestore History */}
          <CloudHistoryPanel
            isAuthenticated={Boolean(authUser)}
            records={cloudRecords}
            onSignIn={handleGoogleSignIn}
            onReloadRecord={handleReloadCloudRecord}
            onDeleteRecord={handleDeleteCloudRecord}
          />
        </main>
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors mt-auto">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>
            VoxForge Studio · Built by John Lloyd Suarez (+63 952 633 0651)
          </span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigateTo("landing")}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => navigateTo("dashboard")}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigateTo("studio")}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Studio
            </button>
            <button
              type="button"
              onClick={() => navigateTo("landing", "developer")}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Developer
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Thumb-Zone Navigation */}
      <MobileBottomNav activeView={activeView} onNavigate={navigateTo} />

      {/* Post-Authentication Onboarding Modal (shown only when signed in) */}
      <OnboardingModal
        isOpen={Boolean(authUser) && onboardingModalOpen}
        initialPrefs={onboardingPrefs}
        userDisplayName={authUser?.displayName || authUser?.email || undefined}
        onComplete={handleCompleteOnboarding}
        onSkip={handleSkipOnboarding}
      />

      {/* Pre-Generation Sign-In & Community Connect Gate */}
      <ConnectGateModal
        isOpen={gateOpen}
        isAuthenticated={Boolean(authUser)}
        userDisplayName={authUser?.displayName || authUser?.email || undefined}
        communityConnected={Boolean(userProfile?.communityConnected)}
        isSaving={gateSaving}
        authError={authError}
        onClose={() => {
          pendingGenerateRef.current = false;
          setGateOpen(false);
        }}
        onSignIn={handleGoogleSignIn}
        onConfirmCommunityAndProceed={handleConfirmCommunityAndProceed}
      />
    </div>
  );
}
