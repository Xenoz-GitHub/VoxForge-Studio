import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_MODEL = "gemini-3.8-flash-tts";
const ALLOWED_MODELS = new Set([
  "gemini-3.8-flash-tts",
  "gemini-3.8-flash-lite-tts",
]);
const ALLOWED_VOICES = new Set(["Puck", "Charon", "Kore", "Fenrir", "Zephyr"]);

interface SpeakerPayload {
  speaker: string;
  voiceName: string;
  style: string;
  text: string;
}

interface TtsRequestBody {
  mode?: "single" | "dialogue";
  model?: string;
  text?: string;
  style?: string;
  voiceName?: string;
  emphasizedWords?: string[];
  speakerOne?: SpeakerPayload;
  speakerTwo?: SpeakerPayload;
}

interface BatchItemInput {
  id: string;
  text: string;
  style?: string;
  voiceName?: string;
  emphasizedWords?: string[];
  model?: string;
}

interface BatchRequestBody {
  items?: BatchItemInput[];
  defaultStyle?: string;
  defaultVoiceName?: string;
  defaultModel?: string;
}

let roundRobinCursor = 0;

function splitKeyList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,;]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0 && k !== "MY_GEMINI_API_KEY");
}

function getApiKeyPool(): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  const addKeys = (candidates: string[]) => {
    for (const k of candidates) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  };

  addKeys(splitKeyList(process.env.GEMINI_API_KEY));
  addKeys(splitKeyList(process.env.GEMINI_API_KEYS));

  for (let i = 1; i <= 20; i++) {
    addKeys(splitKeyList(process.env[`GEMINI_API_KEY_${i}`]));
  }

  return keys;
}

function createClientForKey(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    apiVersion: "v1beta",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function isRetryableKeyError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("rate") ||
    msg.includes("403") ||
    msg.includes("PERMISSION_DENIED") ||
    msg.includes("API_KEY_INVALID")
  );
}

async function executeWithKeyPool<T>(
  operation: (ai: GoogleGenAI, keySlot: number) => Promise<T>
): Promise<{ result: T; keySlot: number }> {
  const pool = getApiKeyPool();
  if (pool.length === 0) {
    throw new Error("MISSING_API_KEY");
  }

  const startIndex = roundRobinCursor % pool.length;
  roundRobinCursor = (roundRobinCursor + 1) % 1_000_000;

  let lastError: unknown;
  const maxPasses = 2;
  for (let pass = 0; pass < maxPasses; pass++) {
    let sawRateLimit = false;
    for (let offset = 0; offset < pool.length; offset++) {
      const idx = (startIndex + offset) % pool.length;
      const key = pool[idx];
      const ai = createClientForKey(key);
      try {
        const result = await operation(ai, idx + 1);
        return { result, keySlot: idx + 1 };
      } catch (err) {
        lastError = err;
        const retryable = isRetryableKeyError(err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
          sawRateLimit = true;
        }
        if (offset < pool.length - 1 && retryable) {
          continue;
        }
        if (!retryable) {
          throw err;
        }
      }
    }
    if (pass === 0 && sawRateLimit) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      continue;
    }
    break;
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to execute request across API key pool.");
}

function parseWavDurationSeconds(wavBuffer: Buffer): number {
  if (wavBuffer.length < 44) return 0;
  if (
    wavBuffer.toString("ascii", 0, 4) !== "RIFF" ||
    wavBuffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    return 0;
  }

  let byteRate = 48000;
  let dataSize = 0;
  let offset = 12;

  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.toString("ascii", offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);

    if (chunkId === "fmt " && offset + 8 + 12 <= wavBuffer.length) {
      const readByteRate = wavBuffer.readUInt32LE(offset + 16);
      if (readByteRate > 0) byteRate = readByteRate;
    } else if (chunkId === "data") {
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  if (dataSize > 0 && byteRate > 0) {
    return Number((dataSize / byteRate).toFixed(2));
  }
  return 0;
}

function buildEffectiveStyle(baseStyle: string, emphasizedWords?: string[]): string {
  const cleanStyle = baseStyle.trim();
  const words = (emphasizedWords ?? []).map((w) => w.trim()).filter(Boolean);

  if (words.length === 0) {
    return cleanStyle || "Clear, natural, expressive speech.";
  }

  const missingWords = words.filter(
    (word) => !cleanStyle.toLowerCase().includes(word.toLowerCase())
  );

  if (missingWords.length === 0) {
    return cleanStyle;
  }

  const quotedList = missingWords.map((w) => `"${w}"`).join(", ");
  return `${cleanStyle}${cleanStyle.endsWith(".") ? "" : "."} Place strong vocal emphasis on ${quotedList}.`;
}

function resolveModel(requestedModel?: string): string {
  if (requestedModel && ALLOWED_MODELS.has(requestedModel)) {
    return requestedModel;
  }
  return DEFAULT_MODEL;
}

async function synthesizeSingleSpeech(params: {
  text: string;
  style: string;
  voiceName: string;
  model: string;
}) {
  const { text, style, voiceName, model } = params;
  const { result: response, keySlot } = await executeWithKeyPool((ai) =>
    ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text,
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    })
  );

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("EMPTY_AUDIO_RESPONSE");
  }

  const wavBuffer = Buffer.from(base64Audio, "base64");
  const durationSeconds = parseWavDurationSeconds(wavBuffer);

  return {
    audioBase64: base64Audio,
    mimeType: "audio/wav",
    durationSeconds,
    byteLength: wavBuffer.length,
    model,
    mode: "single" as const,
    voiceName,
    style,
    keySlot,
  };
}

function mapErrorStatus(err: unknown): { status: number; message: string } {
  const message = err instanceof Error ? err.message : "Failed to synthesize speech.";
  if (message === "MISSING_API_KEY") {
    return {
      status: 500,
      message:
        "GEMINI_API_KEY is not configured in the server environment. Add one or more keys in Settings > Secrets.",
    };
  }
  if (message === "EMPTY_AUDIO_RESPONSE") {
    return {
      status: 502,
      message:
        "No audio data was returned by Gemini TTS. Please adjust the script or voice direction and try again.",
    };
  }
  if (message.includes("403") || message.includes("PERMISSION_DENIED")) {
    return {
      status: 403,
      message:
        "Permission denied by Gemini API. Check your GEMINI_API_KEY configuration in Settings > Secrets.",
    };
  }
  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message:
        "Gemini API rate limit reached across configured keys. Please wait a moment and try again.",
    };
  }
  if (message.includes("404") || message.includes("NOT_FOUND")) {
    return {
      status: 404,
      message: "Requested Gemini TTS model could not be reached. Please try again.",
    };
  }
  return { status: 500, message };
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await worker(items[current], current);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.get("/api/health", (_req, res) => {
    const poolSize = getApiKeyPool().length;
    res.json({
      ok: true,
      model: DEFAULT_MODEL,
      configuredKeyCount: poolSize,
    });
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const body = (req.body ?? {}) as TtsRequestBody;
      const mode = body.mode === "dialogue" ? "dialogue" : "single";
      const model = resolveModel(body.model);

      if (mode === "dialogue") {
        const s1 = body.speakerOne;
        const s2 = body.speakerTwo;

        if (!s1?.text?.trim() || !s2?.text?.trim()) {
          res.status(400).json({
            error: "Both speaker scripts are required for dual-speaker audio.",
          });
          return;
        }

        const speakerOneName = (s1.speaker || "Speaker 1").trim();
        const speakerTwoName = (s2.speaker || "Speaker 2").trim();
        const voiceOne = ALLOWED_VOICES.has(s1.voiceName) ? s1.voiceName : "Puck";
        const voiceTwo = ALLOWED_VOICES.has(s2.voiceName) ? s2.voiceName : "Kore";

        const { result: response, keySlot } = await executeWithKeyPool((ai) =>
          ai.models.generateContent({
            model: "gemini-3.8-flash-tts",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${speakerOneName}: ${s1.text.trim()}`,
                    speechMetadata: {
                      speaker: speakerOneName,
                      style: s1.style?.trim() || "Clear, expressive conversational host.",
                    },
                  },
                  {
                    text: `${speakerTwoName}: ${s2.text.trim()}`,
                    speechMetadata: {
                      speaker: speakerTwoName,
                      style: s2.style?.trim() || "Engaged, articulate co-host.",
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                    {
                      speaker: speakerOneName,
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceOne },
                      },
                    },
                    {
                      speaker: speakerTwoName,
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceTwo },
                      },
                    },
                  ],
                },
              },
            },
          })
        );

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          throw new Error("EMPTY_AUDIO_RESPONSE");
        }

        const wavBuffer = Buffer.from(base64Audio, "base64");
        const durationSeconds = parseWavDurationSeconds(wavBuffer);

        res.json({
          audioBase64: base64Audio,
          mimeType: "audio/wav",
          durationSeconds,
          byteLength: wavBuffer.length,
          model: "gemini-3.8-flash-tts",
          mode: "dialogue",
          voiceName: `${voiceOne} + ${voiceTwo}`,
          style: `${speakerOneName}: ${s1.style?.trim() || ""} / ${speakerTwoName}: ${s2.style?.trim() || ""}`,
          keySlot,
        });
        return;
      }

      const text = body.text?.trim();
      if (!text) {
        res.status(400).json({ error: "Text input is required for synthesis." });
        return;
      }
      if (text.length > 4000) {
        res.status(400).json({ error: "Text input must be 4,000 characters or fewer." });
        return;
      }

      const voiceName =
        body.voiceName && ALLOWED_VOICES.has(body.voiceName) ? body.voiceName : "Puck";
      const effectiveStyle = buildEffectiveStyle(body.style ?? "", body.emphasizedWords);

      const result = await synthesizeSingleSpeech({
        text,
        style: effectiveStyle,
        voiceName,
        model,
      });

      res.json(result);
    } catch (err: unknown) {
      console.error("TTS generation error:", err);
      const mapped = mapErrorStatus(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post("/api/tts/batch", async (req, res) => {
    try {
      const body = (req.body ?? {}) as BatchRequestBody;
      const items = Array.isArray(body.items) ? body.items : [];

      if (items.length === 0) {
        res.status(400).json({ error: "Provide at least one item in the batch queue." });
        return;
      }
      if (items.length > 20) {
        res.status(400).json({ error: "Batch queue is limited to 20 items per request." });
        return;
      }

      const poolSize = getApiKeyPool().length;
      if (poolSize === 0) {
        res.status(500).json({
          error:
            "GEMINI_API_KEY is not configured in the server environment. Add one or more keys in Settings > Secrets.",
        });
        return;
      }

      const defaultStyle = body.defaultStyle ?? "";
      const defaultVoice =
        body.defaultVoiceName && ALLOWED_VOICES.has(body.defaultVoiceName)
          ? body.defaultVoiceName
          : "Puck";
      const defaultModel = resolveModel(body.defaultModel);

      const concurrency = Math.max(1, Math.min(poolSize, 5));

      const results = await runWithConcurrency(items, concurrency, async (item) => {
        const cleanText = (item.text ?? "").trim();
        if (!cleanText) {
          return {
            id: item.id,
            ok: false,
            error: "Empty text item skipped.",
          };
        }
        if (cleanText.length > 4000) {
          return {
            id: item.id,
            ok: false,
            error: "Item exceeds 4,000 character limit.",
          };
        }

        const voiceName =
          item.voiceName && ALLOWED_VOICES.has(item.voiceName)
            ? item.voiceName
            : defaultVoice;
        const model = resolveModel(item.model ?? defaultModel);
        const effectiveStyle = buildEffectiveStyle(
          item.style?.trim() ? item.style : defaultStyle,
          item.emphasizedWords
        );

        try {
          const generated = await synthesizeSingleSpeech({
            text: cleanText,
            style: effectiveStyle,
            voiceName,
            model,
          });
          return {
            id: item.id,
            ok: true,
            ...generated,
          };
        } catch (err) {
          const mapped = mapErrorStatus(err);
          return {
            id: item.id,
            ok: false,
            error: mapped.message,
          };
        }
      });

      res.json({
        results,
        configuredKeyCount: poolSize,
      });
    } catch (err: unknown) {
      console.error("Batch TTS error:", err);
      const mapped = mapErrorStatus(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distDir, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    const poolSize = getApiKeyPool().length;
    console.log(
      `VoxForge Studio listening on http://0.0.0.0:${PORT} (${poolSize} Gemini API key${poolSize === 1 ? "" : "s"} in pool)`
    );
  });
}

startServer();
