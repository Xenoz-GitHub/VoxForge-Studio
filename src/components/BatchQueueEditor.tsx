import { useState } from "react";
import { Plus, Trash2, Play, SplitSquareVertical } from "lucide-react";
import {
  VOICE_PROFILES,
  type BatchQueueItem,
  type VoiceName,
} from "../types/narration";

interface BatchQueueEditorProps {
  items: BatchQueueItem[];
  defaultVoice: VoiceName;
  defaultStyle: string;
  onChangeItems: (items: BatchQueueItem[]) => void;
  onPlayTakeById: (takeId: string) => void;
}

export function BatchQueueEditor({
  items,
  defaultVoice,
  defaultStyle,
  onChangeItems,
  onPlayTakeById,
}: BatchQueueEditorProps) {
  const [bulkText, setBulkText] = useState("");

  const handleAddRow = () => {
    const newItem: BatchQueueItem = {
      id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: "",
      voiceName: defaultVoice,
      style: "",
      status: "ready",
    };
    onChangeItems([...items, newItem]);
  };

  const handleSplitBulkLines = () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const newRows: BatchQueueItem[] = lines.slice(0, 20).map((line, index) => ({
      id: `batch-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      text: line,
      voiceName: defaultVoice,
      style: "",
      status: "ready",
    }));

    const existingNonEmpty = items.filter((item) => item.text.trim().length > 0);
    onChangeItems([...existingNonEmpty, ...newRows].slice(0, 20));
    setBulkText("");
  };

  const handleUpdateItem = (
    id: string,
    patch: Partial<Pick<BatchQueueItem, "text" | "voiceName" | "style">>
  ) => {
    onChangeItems(
      items.map((item) =>
        item.id === id
          ? { ...item, ...patch, status: "ready", error: undefined }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    const remaining = items.filter((item) => item.id !== id);
    onChangeItems(
      remaining.length > 0
        ? remaining
        : [
            {
              id: `batch-${Date.now()}`,
              text: "",
              voiceName: defaultVoice,
              style: "",
              status: "ready",
            },
          ]
    );
  };

  const handleApplyVoiceToAll = (voice: VoiceName) => {
    onChangeItems(
      items.map((item) => ({
        ...item,
        voiceName: voice,
        status: item.status === "done" ? "ready" : item.status,
      }))
    );
  };

  return (
    <div className="space-y-4">
      {/* Quick Bulk Line Splitter */}
      <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="bulk-lines-input"
            className="text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Paste Multi-Line Script to Split Into Queue
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {items.length} / 20 clips
          </span>
        </div>
        <textarea
          id="bulk-lines-input"
          rows={2}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Paste multiple sentences or lines (one clip per line)..."
          className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 resize-y"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Set all voices:</span>
            <select
              aria-label="Apply voice to all queue items"
              value={defaultVoice}
              onChange={(e) => handleApplyVoiceToAll(e.target.value as VoiceName)}
              className="h-8 px-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md max-w-full min-w-0"
            >
              {VOICE_PROFILES.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.persona})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSplitBulkLines}
            disabled={!bulkText.trim()}
            className="h-8 px-3 text-xs font-medium bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Add Lines to Queue</span>
          </button>
        </div>
      </div>

      {/* Individual Queue Rows */}
      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  Clip {String(idx + 1).padStart(2, "0")}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span
                  className={
                    item.status === "done"
                      ? "text-emerald-700 dark:text-emerald-400 font-medium"
                      : item.status === "error"
                      ? "text-red-600 dark:text-red-400 font-medium"
                      : item.status === "generating"
                      ? "text-orange-600 dark:text-orange-400 font-medium"
                      : "text-slate-500 dark:text-slate-400"
                  }
                >
                  {item.status === "done"
                    ? "Completed"
                    : item.status === "error"
                    ? "Failed"
                    : item.status === "generating"
                    ? "Synthesizing..."
                    : "Ready"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  aria-label={`Voice for clip ${idx + 1}`}
                  value={item.voiceName}
                  onChange={(e) =>
                    handleUpdateItem(item.id, {
                      voiceName: e.target.value as VoiceName,
                    })
                  }
                  className="h-7 px-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded"
                >
                  {VOICE_PROFILES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>

                {item.takeId && (
                  <button
                    type="button"
                    onClick={() => onPlayTakeById(item.takeId!)}
                    title="Load generated clip in player"
                    className="h-7 px-2 text-xs font-medium bg-orange-600 text-white rounded inline-flex items-center gap-1 hover:bg-orange-500 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  aria-label={`Remove clip ${idx + 1}`}
                  className="h-7 w-7 inline-flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              value={item.text}
              onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
              placeholder="Enter text for this clip..."
              aria-label={`Script for clip ${idx + 1}`}
              className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 resize-y"
            />

            <input
              type="text"
              value={item.style}
              onChange={(e) => handleUpdateItem(item.id, { style: e.target.value })}
              placeholder={`Optional style override (defaults to: ${defaultStyle.slice(0, 48)}...)`}
              aria-label={`Style override for clip ${idx + 1}`}
              className="w-full h-8 px-2.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-orange-500"
            />

            {item.error && (
              <p className="text-xs text-red-600 dark:text-red-400">{item.error}</p>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={items.length >= 20}
        onClick={handleAddRow}
        className="w-full h-9 border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Clip to Queue</span>
      </button>
    </div>
  );
}
