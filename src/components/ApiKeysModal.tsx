import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  clearKeys,
  createKey,
  getStorageMode,
  isValidGeminiKey,
  keyValues,
  loadKeys,
  maskKey,
  saveKeys,
  type KeyStorageMode,
  type StoredKey,
} from "../utils/keyVault";

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysChanged: (keys: StoredKey[]) => void;
}

export function ApiKeysModal({ isOpen, onClose, onKeysChanged }: ApiKeysModalProps) {
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [mode, setMode] = useState<KeyStorageMode>("session");
  const [draftValue, setDraftValue] = useState<string>("");
  const [draftLabel, setDraftLabel] = useState<string>("");
  const [revealAll, setRevealAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Reload from storage whenever the panel opens so it reflects the real vault.
  useEffect(() => {
    if (!isOpen) return;
    setKeys(loadKeys());
    setMode(getStorageMode());
    setDraftValue("");
    setDraftLabel("");
    setError(null);
    setNotice(null);
    setRevealAll(false);
  }, [isOpen]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const persist = useCallback(
    (nextKeys: StoredKey[], nextMode: KeyStorageMode = mode) => {
      if (nextKeys.length === 0) {
        clearKeys();
      } else {
        saveKeys(nextMode, nextKeys);
      }
      setKeys(nextKeys);
      setMode(nextMode);
      onKeysChanged(nextKeys);
    },
    [mode, onKeysChanged]
  );

  const handleAdd = useCallback(() => {
    const value = draftValue.trim();
    if (!value) {
      setError("Paste a Gemini API key first.");
      return;
    }

    // Accept one key or a comma/newline separated list for fast bulk entry.
    const candidates = value
      .split(/[\s,;]+/)
      .map((k) => k.trim())
      .filter(Boolean);

    const invalid = candidates.filter((k) => !isValidGeminiKey(k));
    if (invalid.length > 0) {
      setError(
        `${invalid.length} entr${invalid.length === 1 ? "y does" : "ies do"} not look like a Gemini key (expected to start with "AIza").`
      );
      return;
    }

    const existing = new Set(keys.map((k) => k.value));
    const fresh = candidates.filter((k) => !existing.has(k));
    if (fresh.length === 0) {
      setError("That key is already in your pool.");
      return;
    }

    const created = fresh.map((value, idx) =>
      createKey(value, fresh.length === 1 ? draftLabel : `Key ${keys.length + idx + 1}`)
    );
    persist([...keys, ...created]);
    setDraftValue("");
    setDraftLabel("");
    setError(null);
    setNotice(`Added ${created.length} key${created.length === 1 ? "" : "s"} to your pool.`);
  }, [draftLabel, draftValue, keys, persist]);

  const handleRemove = useCallback(
    (id: string) => {
      const next = keys.filter((k) => k.id !== id);
      persist(next);
      setNotice("Key removed.");
      setError(null);
    },
    [keys, persist]
  );

  const handleClearAll = useCallback(() => {
    persist([]);
    setNotice("All keys removed from this browser.");
    setError(null);
  }, [persist]);

  const handleModeChange = useCallback(
    (nextMode: KeyStorageMode) => {
      persist(keys, nextMode);
      setNotice(
        nextMode === "device"
          ? "Keys will persist on this device after you close the browser."
          : "Keys will be cleared when this browser session ends."
      );
    },
    [keys, persist]
  );

  const uniqueCount = useMemo(() => keyValues(keys).length, [keys]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-keys-title"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4 py-6 overflow-y-auto"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <header className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 h-9 w-9 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-4.5 h-4.5" />
            </span>
            <div>
              <h2
                id="api-keys-title"
                className="font-display text-base font-bold text-slate-950 dark:text-white"
              >
                Gemini API Keys
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add one or many keys. Generation spreads across your pool automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close API keys panel"
            className="h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 px-3 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Keys stay in this browser and are sent only to your own server for each
              request. They are never uploaded to the database.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Your pool
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {uniqueCount} key{uniqueCount === 1 ? "" : "s"}
              </span>
              {keys.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRevealAll((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {revealAll ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {revealAll ? "Hide" : "Reveal"}
                </button>
              )}
            </div>
          </div>

          {keys.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-4 py-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No keys yet. Paste one below to enable generation.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {keys.map((key, index) => (
                <li
                  key={key.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {key.label}
                      </span>
                    </div>
                    <code className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {revealAll ? key.value : maskKey(key.value)}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(key.id)}
                    aria-label={`Remove ${key.label}`}
                    className="h-8 w-8 shrink-0 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2.5 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <label
              htmlFor="api-key-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Add key{keys.length > 0 ? "s" : ""}
            </label>
            <textarea
              id="api-key-input"
              rows={2}
              value={draftValue}
              onChange={(event) => {
                setDraftValue(event.target.value);
                setError(null);
                setNotice(null);
              }}
              placeholder="AIza... (paste one key, or several separated by commas or new lines)"
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 resize-y"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={draftLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                placeholder="Optional label (e.g. Project A)"
                className="h-9 flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="h-9 px-4 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to pool
              </button>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </p>
            )}
            {notice && !error && (
              <p className="flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{notice}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Storage
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "session", title: "This session", detail: "Cleared on browser close" },
                  { id: "device", title: "This device", detail: "Remembered after close" },
                ] as const
              ).map((option) => {
                const selected = mode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleModeChange(option.id)}
                    aria-pressed={selected}
                    className={`text-left rounded-lg border px-3 py-2 transition-colors cursor-pointer ${
                      selected
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {option.title}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {option.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          {keys.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              Remove all keys
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-full sm:w-auto px-4 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
