export type VoiceName = "Puck" | "Fenrir" | "Charon" | "Kore" | "Zephyr";

export type TtsModelId = "gemini-3.8-flash-tts" | "gemini-3.8-flash-lite-tts";

export type NarrationMode = "single" | "batch" | "dialogue";

export interface VoiceProfile {
  name: VoiceName;
  persona: string;
  tone: string;
}

export interface StylePreset {
  id: string;
  label: string;
  prompt: string;
}

export interface TtsTemplate {
  id: string;
  label: string;
  category: string;
  mode: NarrationMode;
  model: TtsModelId;
  voiceName: VoiceName;
  text: string;
  style: string;
  emphasizedWords: string[];
  imageUrl?: string;
  batchLines?: string[];
  speakerOne?: {
    speaker: string;
    voiceName: VoiceName;
    style: string;
    text: string;
  };
  speakerTwo?: {
    speaker: string;
    voiceName: VoiceName;
    style: string;
    text: string;
  };
}

export interface BatchQueueItem {
  id: string;
  text: string;
  voiceName: VoiceName;
  style: string;
  status: "ready" | "generating" | "done" | "error";
  error?: string;
  takeId?: string;
}

export interface NarrationTake {
  id: string;
  takeNumber: number;
  createdAt: string;
  mode: "single" | "dialogue";
  model: string;
  text: string;
  style: string;
  voiceName: string;
  emphasizedWords: string[];
  audioUrl: string;
  durationSeconds: number;
  byteLength: number;
  waveformPeaks: number[];
  keySlot?: number;
}

export const TTS_MODELS: Array<{
  id: TtsModelId;
  label: string;
  summary: string;
}> = [
  {
    id: "gemini-3.8-flash-tts",
    label: "Gemini 3.8 Flash TTS",
    summary: "Voice design, expressive cues & multi-speaker",
  },
  {
    id: "gemini-3.8-flash-lite-tts",
    label: "Gemini 3.8 Flash Lite TTS",
    summary: "Fast, high-throughput general speech & reading",
  },
];

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    name: "Kore",
    persona: "Balanced & Clear",
    tone: "Articulate, neutral studio voice for general narration",
  },
  {
    name: "Puck",
    persona: "Bright & Energetic",
    tone: "Expressive, upbeat delivery for stories & explainers",
  },
  {
    name: "Charon",
    persona: "Deep & Grounded",
    tone: "Authoritative, steady tone for documentaries & news",
  },
  {
    name: "Fenrir",
    persona: "Bold & Dynamic",
    tone: "Punchy, high-impact presence for trailers & promos",
  },
  {
    name: "Zephyr",
    persona: "Warm & Agile",
    tone: "Friendly, natural cadence for podcasts & tutorials",
  },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "clear-neutral",
    label: "Clear & Neutral",
    prompt: "Clear, natural, well-paced studio voice with neutral pronunciation and crisp articulation.",
  },
  {
    id: "warm-conversational",
    label: "Warm Conversational",
    prompt: "Friendly, warm, approachable conversational tone, natural pacing as if speaking to one listener.",
  },
  {
    id: "broadcast-anchor",
    label: "Broadcast Anchor",
    prompt: "Clear, authoritative news broadcast anchor, confident cadence, steady and articulate.",
  },
  {
    id: "calm-documentary",
    label: "Calm Documentary",
    prompt: "Measured, reflective, cinematic documentary narration with unhurried pauses.",
  },
  {
    id: "energetic-story",
    label: "Fast & Energetic",
    prompt: "Fast, energetic storyteller voice, dynamic inflection and crisp emphasis on key phrases.",
  },
];

export const VOCAL_CUES = [
  { token: "<breath>", label: "Natural breath" },
  { token: "<gasp>", label: "Quick gasp" },
  { token: "<laugh>", label: "Short laugh" },
  { token: "|yeah|", label: "Backchannel yeah" },
  { token: "|mhm|", label: "Backchannel mhm" },
];

export const TTS_TEMPLATES: TtsTemplate[] = [
  {
    id: "general-explainer",
    label: "Product Explainer",
    category: "General Voiceover",
    mode: "single",
    model: "gemini-3.8-flash-tts",
    voiceName: "Kore",
    text: "Welcome to your audio workspace. Type or paste any script, pick a voice persona, and generate studio-ready speech in seconds.",
    style:
      "Clear, natural, friendly product explainer voice with neutral pronunciation and crisp pacing.",
    emphasizedWords: ["audio", "workspace", "seconds"],
  },
  {
    id: "news-broadcast",
    label: "News Broadcast",
    category: "Journalism & Briefing",
    mode: "single",
    model: "gemini-3.8-flash-tts",
    voiceName: "Charon",
    text: "Good evening. Coastal engineers have completed testing on a new modular tidal turbine designed to power remote island microgrids.",
    style:
      "Clear, authoritative news broadcast anchor, steady cadence, professional studio clarity.",
    emphasizedWords: ["tidal", "turbine", "microgrids"],
  },
  {
    id: "batch-multitake",
    label: "Multi-Line Batch",
    category: "Batch Generation",
    mode: "batch",
    model: "gemini-3.8-flash-tts",
    voiceName: "Kore",
    text: "Step one: prepare your script lines.\nStep two: assign voices across your queue.\nStep three: render every clip in parallel.",
    style:
      "Clear, helpful instructional narration, steady and articulate.",
    emphasizedWords: [],
    batchLines: [
      "Step one: prepare your script lines in the batch editor.",
      "Step two: assign voices or keep a unified studio tone across the queue.",
      "Step three: generate every audio clip concurrently and export as WAV.",
    ],
  },
  {
    id: "cartoon-windmill",
    label: "Cartoon Story",
    category: "Storytelling",
    mode: "single",
    model: "gemini-3.8-flash-tts",
    voiceName: "Puck",
    text: "A teenage inventor builds a five-metre windmill from bicycle scraps.",
    style:
      'Fast, energetic cartoon-story narration. Confident young male storyteller voice, neutral English accent. Dramatic opening with strong emphasis on "teenage inventor" and "windmill". Speak clearly and quickly.',
    emphasizedWords: ["teenage", "inventor", "windmill"],
    imageUrl: "/src/assets/images/windmill_cartoon_story_1795301566876.jpg",
  },
  {
    id: "dual-podcast",
    label: "Podcast Dialogue",
    category: "Dual-Speaker",
    mode: "dialogue",
    model: "gemini-3.8-flash-tts",
    voiceName: "Puck",
    text: "Dual-speaker conversation sample",
    style: "Natural two-host podcast discussion with conversational timing.",
    emphasizedWords: [],
    speakerOne: {
      speaker: "Alex",
      voiceName: "Puck",
      style: "Enthusiastic, bright podcast host, conversational pacing.",
      text: "Welcome back! <breath> Today we are testing multi-take voice generation across different speaking styles.",
    },
    speakerTwo: {
      speaker: "Sam",
      voiceName: "Zephyr",
      style: "Curious, articulate co-host, warm and natural.",
      text: "|yeah| And the best part is being able to audition multiple voices side by side without retyping the script.",
    },
  },
];
