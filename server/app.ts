import "dotenv/config";
import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ApiKeyPool, KeyPoolError, messageOf } from "./keyPool.ts";
import { createRateLimiter, securityHeaders } from "./security.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const DEFAULT_MODEL = "gemini-3.8-flash-tts";
const ALLOWED_MODELS = new Set([
  "gemini-3.8-flash-tts",
  "gemini-3.8-flash-lite-tts",
]);
const ALLOWED_VOICES = new Set(["Puck", "Charon", "Kore", "Fenrir", "Zephyr"]);

const MAX_TEXT_LENGTH = 4000;
const MAX_BATCH_ITEMS = 20;
const MAX_KEYS_PER_REQUEST = 25;
const MAX_HEADER_BYTES = 8 * 1024;
const KEY_HEADER = "x-gemini-keys";

/**
 * Optional server-side fallback keys. The app UI is the primary source of keys;
 * these exist so a deployer can still ship a working default pool.
 */
function serverFallbackKeys(): string[] {
  const collected: string[] = [];
  const add = (raw: string | undefined) => {
    if (!raw) return;
    for (const part of raw.split(/[\s,;]+/)) {
      const key = part.trim();
      if (key && key !== "MY_GEMINI_API_KEY") collected.push(key);
    }
  };
  add(process.env.GEMINI_API_KEY);
  add(process.env.GEMINI_API_KEYS);
  for (let i = 1; i <= 20; i += 1) {
    add(process.env[`GEMINI_API_KEY_${i}`]);
  }
  return collected;
}

const FALLBACK_KEYS = serverFallbackKeys();

class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/**
 * Reads user-supplied keys from the request header.
 * Returns null when the client did not send any, so callers can fall back.
 */
function requestKeys(req: Request): string[] | null {
  const header = req.get(KEY_HEADER);
  if (!header) return null;
  if (Buffer.byteLength(header, "utf8") > MAX_HEADER_BYTES) {
    throw new HttpError(431, "Too many API keys supplied in one request.");
  }
  const keys = Array.from(
    new Set(
      header
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    )
  );
  if (keys.length > MAX_KEYS_PER_REQUEST) {
    throw new HttpError(
      400,
      `A maximum of ${MAX_KEYS_PER_REQUEST} API keys can be used per request.`
    );
  }
  return keys.length > 0 ? keys : null;
}

function buildPool(req: Request): { pool: ApiKeyPool; source: "client" | "server" } {
  const clientKeys = requestKeys(req);
  if (clientKeys && clientKeys.length > 0) {
    return { pool: new ApiKeyPool(clientKeys), source: "client" };
  }
  if (FALLBACK_KEYS.length > 0) {
    return { pool: new ApiKeyPool(FALLBACK_KEYS), source: "server" };
  }
  throw new HttpError(
    400,
    "No Gemini API key available. Open the API Keys panel and add at least one key."
  );
}

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
  const cleanStyle = (baseStyle ?? "").trim();
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

interface SynthesisResult {
  audioBase64: string;
  mimeType: string;
  durationSeconds: number;
  byteLength: number;
  model: string;
  mode: "single" | "dialogue";
  voiceName: string;
  style: string;
  keySlot: number;
}

async function synthesizeSingleSpeech(
  pool: ApiKeyPool,
  params: { text: string; style: string; voiceName: string; model: string }
): Promise<SynthesisResult> {
  const { text, style, voiceName, model } = params;

  const { result: response, keySlot } = await pool.run((ai) =>
    ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text, speechMetadata: { style } }],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    })
  );

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new HttpError(
      502,
      "No audio data was returned by Gemini TTS. Adjust the script or voice direction and retry."
    );
  }

  const wavBuffer = Buffer.from(base64Audio, "base64");

  return {
    audioBase64: base64Audio,
    mimeType: "audio/wav",
    durationSeconds: parseWavDurationSeconds(wavBuffer),
    byteLength: wavBuffer.length,
    model,
    mode: "single",
    voiceName,
    style,
    keySlot,
  };
}

function mapError(err: unknown): { status: number; message: string } {
  if (err instanceof HttpError) {
    return { status: err.status, message: err.message };
  }
  if (err instanceof KeyPoolError) {
    const status =
      err.code === "MISSING_API_KEY" ? 400 : err.code === "KEY_POOL_TIMEOUT" ? 503 : 502;
    return { status, message: err.message };
  }

  const message = messageOf(err) || "Failed to synthesize speech.";
  const lower = message.toLowerCase();

  if (lower.includes("api key not valid") || lower.includes("api_key_invalid")) {
    return {
      status: 401,
      message: "One or more Gemini API keys are invalid. Update them in the API Keys panel.",
    };
  }
  if (lower.includes("403") || lower.includes("permission_denied")) {
    return {
      status: 403,
      message: "Gemini denied this request. Check that your API key has TTS access enabled.",
    };
  }
  if (lower.includes("429") || lower.includes("resource_exhausted") || lower.includes("quota")) {
    return {
      status: 429,
      message: "Gemini rate limit reached across your keys. Wait a moment and try again.",
    };
  }
  if (lower.includes("404") || lower.includes("not_found")) {
    return {
      status: 404,
      message: "The requested Gemini TTS model is unavailable. Try another model.",
    };
  }
  if (lower.includes("empty_audio_response")) {
    return {
      status: 502,
      message: "Gemini returned no audio. Adjust the script or voice direction and retry.",
    };
  }

  return {
    status: 500,
    message: IS_PRODUCTION ? "Speech synthesis failed. Please try again." : message,
  };
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

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export interface CreateAppOptions {
  /** Serve the built SPA from dist/ and add the history fallback. */
  serveStatic?: boolean;
  /** Mount Vite middleware in development. */
  enableDevVite?: boolean;
}

export async function createApp(options: CreateAppOptions = {}): Promise<express.Express> {
  const serveStatic = options.serveStatic ?? IS_PRODUCTION;
  const enableDevVite = options.enableDevVite ?? !IS_PRODUCTION;

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", IS_PRODUCTION ? 1 : false);

  app.use(securityHeaders(IS_PRODUCTION));
  app.use(express.json({ limit: "4mb" }));

  const ttsLimiter = createRateLimiter({ windowMs: 60_000, max: 30, name: "tts" });
  const batchLimiter = createRateLimiter({ windowMs: 60_000, max: 10, name: "batch" });

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      model: DEFAULT_MODEL,
      keySource: FALLBACK_KEYS.length > 0 ? "server" : "client",
    });
  });

  app.post("/api/tts", ttsLimiter, async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as TtsRequestBody;
      const { pool } = buildPool(req);
      const mode = body.mode === "dialogue" ? "dialogue" : "single";
      const model = resolveModel(body.model);

      if (mode === "dialogue") {
        const s1 = body.speakerOne;
        const s2 = body.speakerTwo;

        const textOne = sanitizeText(s1?.text);
        const textTwo = sanitizeText(s2?.text);

        if (!textOne || !textTwo) {
          throw new HttpError(400, "Both speaker scripts are required for dialogue audio.");
        }

        const speakerOneName = sanitizeText(s1?.speaker) || "Speaker 1";
        const speakerTwoName = sanitizeText(s2?.speaker) || "Speaker 2";
        const voiceOne = ALLOWED_VOICES.has(s1?.voiceName ?? "") ? s1!.voiceName : "Puck";
        const voiceTwo = ALLOWED_VOICES.has(s2?.voiceName ?? "") ? s2!.voiceName : "Kore";

        const { result: response, keySlot } = await pool.run((ai) =>
          ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${speakerOneName}: ${textOne}`,
                    speechMetadata: {
                      speaker: speakerOneName,
                      style:
                        sanitizeText(s1?.style) || "Clear, expressive conversational host.",
                    },
                  },
                  {
                    text: `${speakerTwoName}: ${textTwo}`,
                    speechMetadata: {
                      speaker: speakerTwoName,
                      style: sanitizeText(s2?.style) || "Engaged, articulate co-host.",
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
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceOne } },
                    },
                    {
                      speaker: speakerTwoName,
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceTwo } },
                    },
                  ],
                },
              },
            },
          })
        );

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          throw new HttpError(502, "Gemini returned no audio for this dialogue.");
        }

        const wavBuffer = Buffer.from(base64Audio, "base64");

        res.json({
          audioBase64: base64Audio,
          mimeType: "audio/wav",
          durationSeconds: parseWavDurationSeconds(wavBuffer),
          byteLength: wavBuffer.length,
          model: DEFAULT_MODEL,
          mode: "dialogue",
          voiceName: `${voiceOne} + ${voiceTwo}`,
          style: `${speakerOneName}: ${sanitizeText(s1?.style)} / ${speakerTwoName}: ${sanitizeText(s2?.style)}`,
          keySlot,
        });
        return;
      }

      const text = sanitizeText(body.text);
      if (!text) {
        throw new HttpError(400, "Text input is required for synthesis.");
      }
      if (text.length > MAX_TEXT_LENGTH) {
        throw new HttpError(400, `Text input must be ${MAX_TEXT_LENGTH} characters or fewer.`);
      }

      const voiceName = ALLOWED_VOICES.has(body.voiceName ?? "") ? body.voiceName! : "Puck";
      const effectiveStyle = buildEffectiveStyle(body.style ?? "", body.emphasizedWords);

      const result = await synthesizeSingleSpeech(pool, {
        text,
        style: effectiveStyle,
        voiceName,
        model,
      });

      res.json(result);
    } catch (err) {
      console.error("TTS generation error:", err);
      const mapped = mapError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post("/api/tts/batch", batchLimiter, async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as BatchRequestBody;
      const items = Array.isArray(body.items) ? body.items : [];

      if (items.length === 0) {
        throw new HttpError(400, "Provide at least one item in the batch queue.");
      }
      if (items.length > MAX_BATCH_ITEMS) {
        throw new HttpError(400, `Batch queue is limited to ${MAX_BATCH_ITEMS} items per request.`);
      }

      const { pool } = buildPool(req);

      const defaultStyle = body.defaultStyle ?? "";
      const defaultVoice = ALLOWED_VOICES.has(body.defaultVoiceName ?? "")
        ? body.defaultVoiceName!
        : "Puck";
      const defaultModel = resolveModel(body.defaultModel);

      // One worker per key so distinct keys render in parallel without queueing.
      const concurrency = Math.max(1, Math.min(pool.size, items.length));

      const results = await runWithConcurrency(items, concurrency, async (item) => {
        const cleanText = sanitizeText(item.text);
        if (!cleanText) {
          return { id: item.id, ok: false as const, error: "Empty text item skipped." };
        }
        if (cleanText.length > MAX_TEXT_LENGTH) {
          return {
            id: item.id,
            ok: false as const,
            error: `Item exceeds ${MAX_TEXT_LENGTH} character limit.`,
          };
        }

        const voiceName = ALLOWED_VOICES.has(item.voiceName ?? "") ? item.voiceName! : defaultVoice;
        const model = resolveModel(item.model ?? defaultModel);
        const effectiveStyle = buildEffectiveStyle(
          sanitizeText(item.style) || defaultStyle,
          item.emphasizedWords
        );

        try {
          const generated = await synthesizeSingleSpeech(pool, {
            text: cleanText,
            style: effectiveStyle,
            voiceName,
            model,
          });
          return { id: item.id, ok: true as const, ...generated };
        } catch (err) {
          return { id: item.id, ok: false as const, error: mapError(err).message };
        }
      });

      res.json({ results, keyPoolSize: pool.size });
    } catch (err) {
      console.error("Batch TTS error:", err);
      const mapped = mapError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (enableDevVite && !serveStatic) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (serveStatic) {
    const distDir = path.resolve(PROJECT_ROOT, "dist");
    if (fs.existsSync(distDir)) {
      app.use(
        express.static(distDir, {
          index: false,
          setHeaders: (res, filePath) => {
            if (filePath.endsWith(".html")) {
              res.setHeader("Cache-Control", "no-cache");
            } else if (/\.[0-9a-f]{8}\./.test(filePath)) {
              res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            }
          },
        })
      );
      app.get("*", (_req, res) => {
        res.setHeader("Cache-Control", "no-cache");
        res.sendFile(path.join(distDir, "index.html"));
      });
    } else {
      console.warn("dist/ not found. Run `npm run build` before starting in production.");
    }
  }

  return app;
}
