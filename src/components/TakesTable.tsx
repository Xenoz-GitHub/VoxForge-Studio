import { useMemo, useState } from "react";
import { Download, Play, Search, Trash2, ArrowUpRight } from "lucide-react";
import type { NarrationTake } from "../types/narration";
import { downloadAudioFile, formatBytes, formatTimecode } from "../utils/audio";

interface TakesTableProps {
  takes: NarrationTake[];
  activeTakeId: string | null;
  onSelectTake: (take: NarrationTake) => void;
  onLoadIntoEditor: (take: NarrationTake) => void;
  onDeleteTake: (takeId: string) => void;
  onQuickGenerate: () => void;
}

export function TakesTable({
  takes,
  activeTakeId,
  onSelectTake,
  onLoadIntoEditor,
  onDeleteTake,
  onQuickGenerate,
}: TakesTableProps) {
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "single" | "dialogue">("all");

  const filteredTakes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return takes.filter((take) => {
      if (modeFilter !== "all" && take.mode !== modeFilter) return false;
      if (!q) return true;
      return (
        take.text.toLowerCase().includes(q) ||
        take.style.toLowerCase().includes(q) ||
        take.voiceName.toLowerCase().includes(q) ||
        take.model.toLowerCase().includes(q)
      );
    });
  }, [takes, query, modeFilter]);

  const handleDownloadAll = () => {
    filteredTakes.forEach((take, index) => {
      setTimeout(() => {
        downloadAudioFile(
          take.audioUrl,
          `voxforge-take-${String(take.takeNumber).padStart(2, "0")}-${take.voiceName.toLowerCase().replace(/\s+/g, "-")}.wav`
        );
      }, index * 180);
    });
  };

  return (
    <section
      id="takes"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
    >
      <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Generated Audio Takes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare voice personas, batch clips, and speaking styles side by side
          </p>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
          {filteredTakes.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All ({filteredTakes.length})</span>
            </button>
          )}

          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter takes by text or voice..."
              aria-label="Filter recorded takes"
              className="h-9 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 w-full sm:w-56"
            />
          </div>

          <div
            className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg"
            role="tablist"
            aria-label="Filter by speech mode"
          >
            {(
              [
                { id: "all", label: "All Takes" },
                { id: "single", label: "Single / Batch" },
                { id: "dialogue", label: "Dual-Speaker" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={modeFilter === tab.id}
                onClick={() => setModeFilter(tab.id)}
                className={`px-2 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 truncate cursor-pointer ${
                  modeFilter === tab.id
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {takes.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            No audio clips generated yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Generate a single clip, audition multiple voices in parallel, or run a batch queue to inspect and export WAV audio here.
          </p>
          <button
            type="button"
            onClick={onQuickGenerate}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-500 text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Generate First Clip
          </button>
        </div>
      ) : filteredTakes.length === 0 ? (
        <div className="px-6 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
          No takes match your current search or mode filter.
        </div>
      ) : (
        <>
          {/* Mobile Touch Cards */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTakes.map((take) => {
              const isSelected = take.id === activeTakeId;
              return (
                <div
                  key={take.id}
                  className={`p-4 space-y-2.5 ${
                    isSelected ? "bg-orange-50/60 dark:bg-orange-500/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      Take #{String(take.takeNumber).padStart(2, "0")} · {take.voiceName}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatTimecode(take.durationSeconds)} · {formatBytes(take.byteLength)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                    {take.text}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectTake(take)}
                      className={`flex-1 h-10 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-orange-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isSelected ? "Loaded" : "Play in Deck"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadAudioFile(
                          take.audioUrl,
                          `voxforge-take-${String(take.takeNumber).padStart(2, "0")}.wav`
                        )
                      }
                      aria-label={`Download take ${take.takeNumber} WAV`}
                      className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTake(take.id)}
                      aria-label={`Delete take ${take.takeNumber}`}
                      className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pl-6 pr-3 whitespace-nowrap">Take</th>
                  <th className="py-2.5 px-3">Script &amp; Delivery</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Voice &amp; Model</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Duration</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Size</th>
                  <th className="py-2.5 pl-3 pr-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredTakes.map((take) => {
                  const isSelected = take.id === activeTakeId;
                  return (
                    <tr
                      key={take.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-orange-50/60 dark:bg-orange-500/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="py-3 pl-6 pr-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                        #{String(take.takeNumber).padStart(2, "0")}
                      </td>
                      <td className="py-3 px-3 max-w-md">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {take.text}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {take.mode === "dialogue" ? "Dual-Speaker" : "Single"}
                          {" · "}
                          {take.style}
                        </p>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {take.voiceName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {take.model === "gemini-3.8-flash-lite-tts"
                            ? "Flash Lite TTS"
                            : "Flash TTS"}
                          {take.keySlot ? ` · Key #${take.keySlot}` : ""}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                        {formatTimecode(take.durationSeconds)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                        {formatBytes(take.byteLength)}
                      </td>
                      <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectTake(take)}
                            className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-orange-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100"
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{isSelected ? "Loaded" : "Load"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onLoadIntoEditor(take)}
                            title="Copy script and direction into editor"
                            aria-label={`Copy take ${take.takeNumber} into editor`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              downloadAudioFile(
                                take.audioUrl,
                                `voxforge-take-${String(take.takeNumber).padStart(2, "0")}.wav`
                              )
                            }
                            title="Download WAV"
                            aria-label={`Download take ${take.takeNumber} WAV`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTake(take.id)}
                            title="Delete take"
                            aria-label={`Delete take ${take.takeNumber}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
