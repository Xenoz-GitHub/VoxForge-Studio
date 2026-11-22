export type KeyStorageMode = "device" | "session";

export interface StoredKey {
  id: string;
  value: string;
  label: string;
  addedAt: number;
}

const KEYS_STORAGE = "voxforge_gemini_keys_v1";
const MODE_STORAGE = "voxforge_key_mode_v1";

const GEMINI_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{20,60}$/;

function safeGet(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(store: Storage, key: string, value: string): void {
  try {
    store.setItem(key, value);
  } catch {
    /* storage may be unavailable (private mode / quota) */
  }
}

function safeRemove(store: Storage, key: string): void {
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function isValidGeminiKey(value: string): boolean {
  return GEMINI_KEY_PATTERN.test(value.trim());
}

export function maskKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 10) return "••••••";
  return `${trimmed.slice(0, 6)}••••${trimmed.slice(-4)}`;
}

function readRaw(mode: KeyStorageMode): StoredKey[] {
  const store = mode === "session" ? window.sessionStorage : window.localStorage;
  const raw = safeGet(store, KEYS_STORAGE);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is StoredKey => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as Partial<StoredKey>;
        return (
          typeof candidate.id === "string" &&
          typeof candidate.value === "string" &&
          typeof candidate.label === "string" &&
          typeof candidate.addedAt === "number"
        );
      })
      .filter((item) => isValidGeminiKey(item.value));
  } catch {
    return [];
  }
}

export function getStorageMode(): KeyStorageMode {
  if (typeof window === "undefined") return "session";
  const stored = safeGet(window.localStorage, MODE_STORAGE);
  return stored === "device" ? "device" : "session";
}

export function setStorageMode(mode: KeyStorageMode, keys: StoredKey[]): void {
  if (typeof window === "undefined") return;
  safeSet(window.localStorage, MODE_STORAGE, mode);
  const target = mode === "session" ? window.sessionStorage : window.localStorage;
  const other = mode === "session" ? window.localStorage : window.sessionStorage;
  safeRemove(other, KEYS_STORAGE);
  safeSet(target, KEYS_STORAGE, JSON.stringify(keys));
}

export function loadKeys(): StoredKey[] {
  if (typeof window === "undefined") return [];
  const mode = getStorageMode();
  const keys = readRaw(mode);
  if (keys.length > 0) return keys;
  // Migrate keys saved in the other store after a mode switch.
  const fallback = readRaw(mode === "session" ? "device" : "session");
  if (fallback.length > 0) {
    setStorageMode(mode, fallback);
  }
  return fallback;
}

export function saveKeys(mode: KeyStorageMode, keys: StoredKey[]): void {
  setStorageMode(mode, keys);
}

export function clearKeys(): void {
  if (typeof window === "undefined") return;
  safeRemove(window.localStorage, KEYS_STORAGE);
  safeRemove(window.sessionStorage, KEYS_STORAGE);
}

export function createKey(value: string, label?: string): StoredKey {
  const trimmed = value.trim();
  const suffix = trimmed.slice(-4);
  return {
    id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    value: trimmed,
    label: label?.trim() || `Key ••••${suffix}`,
    addedAt: Date.now(),
  };
}

export function keyValues(keys: StoredKey[]): string[] {
  return Array.from(new Set(keys.map((k) => k.value).filter(isValidGeminiKey)));
}
