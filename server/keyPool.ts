import { GoogleGenAI } from "@google/genai";

export type FailureKind = "rate_limited" | "auth_error" | "retryable" | "fatal";

export class KeyPoolError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "KeyPoolError";
    this.code = code;
  }
}

const MAX_BACKOFF_MS = 15_000;
const AUTH_COOLDOWN_MS = 60_000;

interface Slot {
  index: number;
  key: string;
  busy: boolean;
  cooldownUntil: number;
  consecutiveFailures: number;
  lastUsedAt: number;
  successCount: number;
  failureCount: number;
}

export interface KeyPoolSnapshot {
  size: number;
  available: number;
  cooling: number;
  successes: number;
  failures: number;
}

export interface RunResult<T> {
  result: T;
  keySlot: number;
  attempts: number;
}

export interface RunOptions {
  timeoutMs?: number;
}

const RETRYABLE_PATTERNS = [
  "429",
  "RESOURCE_EXHAUSTED",
  "quota",
  "rate limit",
  "503",
  "UNAVAILABLE",
  "500",
  "INTERNAL",
  "deadline",
  "timeout",
  "ECONNRESET",
  "ETIMEDOUT",
  "fetch failed",
];

const AUTH_PATTERNS = [
  "403",
  "PERMISSION_DENIED",
  "API_KEY_INVALID",
  "API key not valid",
  "UNAUTHENTICATED",
  "401",
];

export function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function classifyFailure(err: unknown): FailureKind {
  const msg = messageOf(err).toLowerCase();
  if (/429|resource_exhausted|quota|rate limit/.test(msg)) return "rate_limited";
  if (AUTH_PATTERNS.some((p) => msg.includes(p.toLowerCase()))) return "auth_error";
  if (RETRYABLE_PATTERNS.some((p) => msg.includes(p.toLowerCase()))) return "retryable";
  return "fatal";
}

function parseRetryAfterMs(err: unknown): number | null {
  const msg = messageOf(err);
  const direct = /retry[-_ ]?after[^0-9]{0,12}(\d{1,3})/i.exec(msg);
  if (direct) return Math.min(Number(direct[1]) * 1000, MAX_BACKOFF_MS);
  return null;
}

function createClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    apiVersion: "v1beta",
    httpOptions: {
      headers: { "User-Agent": "voxforge-studio" },
      timeout: 120_000,
    },
  });
}

/**
 * Schedules TTS work across N API keys.
 *
 * - Each key gets its own single-flight slot, so batch items run truly in parallel
 *   across keys without hammering any single key.
 * - Rate-limited keys enter exponential cooldown and are skipped until they recover.
 * - Round-robin on least-recently-used keeps quota burn even across keys.
 */
export class ApiKeyPool {
  private readonly slots: Slot[];
  private readonly waiters = new Set<() => void>();

  constructor(keys: string[]) {
    const unique = Array.from(new Set(keys.map((k) => k.trim()).filter(Boolean)));
    if (unique.length === 0) {
      throw new KeyPoolError(
        "MISSING_API_KEY",
        "No Gemini API key was supplied. Add at least one key in the API Keys panel."
      );
    }
    this.slots = unique.map((key, index) => ({
      index,
      key,
      busy: false,
      cooldownUntil: 0,
      consecutiveFailures: 0,
      lastUsedAt: 0,
      successCount: 0,
      failureCount: 0,
    }));
  }

  get size(): number {
    return this.slots.length;
  }

  snapshot(): KeyPoolSnapshot {
    const now = Date.now();
    return {
      size: this.slots.length,
      available: this.slots.filter((s) => !s.busy && s.cooldownUntil <= now).length,
      cooling: this.slots.filter((s) => s.cooldownUntil > now).length,
      successes: this.slots.reduce((acc, s) => acc + s.successCount, 0),
      failures: this.slots.reduce((acc, s) => acc + s.failureCount, 0),
    };
  }

  private notify(): void {
    for (const waiter of this.waiters) waiter();
    this.waiters.clear();
  }

  private waitForChange(ms: number): Promise<void> {
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.waiters.delete(done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      this.waiters.add(done);
    });
  }

  private async acquire(deadline: number): Promise<Slot> {
    for (;;) {
      const now = Date.now();
      if (now >= deadline) {
        throw new KeyPoolError(
          "KEY_POOL_TIMEOUT",
          "All Gemini API keys are busy or rate limited. Please retry shortly."
        );
      }

      const idle = this.slots
        .filter((s) => !s.busy && s.cooldownUntil <= now)
        .sort((a, b) => a.lastUsedAt - b.lastUsedAt);

      if (idle.length > 0) {
        const slot = idle[0];
        slot.busy = true;
        slot.lastUsedAt = now;
        return slot;
      }

      const busyAll = this.slots.every((s) => s.busy);
      const cooling = this.slots
        .map((s) => s.cooldownUntil)
        .filter((t) => t > now);
      const waitUntil = cooling.length > 0 ? Math.min(...cooling) : now + 250;
      const waitMs = Math.max(25, Math.min(waitUntil - now, 1000, deadline - now));

      await this.waitForChange(busyAll ? waitMs : Math.min(waitMs, 250));
    }
  }

  private release(slot: Slot): void {
    slot.busy = false;
    this.notify();
  }

  async run<T>(
    operation: (client: GoogleGenAI, keySlot: number) => Promise<T>,
    options: RunOptions = {}
  ): Promise<RunResult<T>> {
    const timeoutMs = Math.max(5_000, options.timeoutMs ?? 180_000);
    const deadline = Date.now() + timeoutMs;
    const maxAttempts = this.slots.length * 2;
    let attempts = 0;
    let lastError: unknown = null;

    while (attempts < maxAttempts && Date.now() < deadline) {
      const slot = await this.acquire(deadline);
      attempts += 1;

      try {
        const result = await operation(createClient(slot.key), slot.index + 1);
        slot.successCount += 1;
        slot.consecutiveFailures = 0;
        slot.cooldownUntil = 0;
        this.release(slot);
        return { result, keySlot: slot.index + 1, attempts };
      } catch (err) {
        slot.failureCount += 1;
        slot.consecutiveFailures += 1;
        lastError = err;
        const kind = classifyFailure(err);

        if (kind === "fatal") {
          this.release(slot);
          throw err;
        }

        if (kind === "rate_limited") {
          const backoff = Math.min(
            1000 * 2 ** (slot.consecutiveFailures - 1),
            MAX_BACKOFF_MS
          );
          slot.cooldownUntil = Date.now() + (parseRetryAfterMs(err) ?? backoff);
        } else if (kind === "auth_error") {
          slot.cooldownUntil = Date.now() + AUTH_COOLDOWN_MS;
        }

        this.release(slot);
      }
    }

    throw lastError ??
      new KeyPoolError(
        "KEY_POOL_EXHAUSTED",
        "Every configured Gemini API key failed. Verify your keys in the API Keys panel."
      );
  }
}
