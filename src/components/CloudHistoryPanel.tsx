import { ArrowUpRight, Cloud, Trash2 } from "lucide-react";
import type { CloudGenerationDoc } from "../firebase";
import { formatBytes, formatTimecode } from "../utils/audio";

interface CloudHistoryPanelProps {
  isAuthenticated: boolean;
  records: CloudGenerationDoc[];
  onSignIn: () => void;
  onReloadRecord: (record: CloudGenerationDoc) => void;
  onDeleteRecord: (recordId: string) => void;
}

export function CloudHistoryPanel({
  isAuthenticated,
  records,
  onSignIn,
  onReloadRecord,
  onDeleteRecord,
}: CloudHistoryPanelProps) {
  return (
    <section
      id="cloud-history"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
    >
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Cloud className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Saved Cloud Generation History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Synced to Cloud Firestore for your signed-in account across sessions
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {records.length} saved {records.length === 1 ? "record" : "records"}
          </span>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="px-6 py-10 text-center space-y-3">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Sign in with Google to access your cloud history
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Every narration, batch clip, and dialogue prompt you generate is stored securely in your private Firestore history.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="px-6 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
          Your cloud history is empty. Generate your first audio clip above to save it automatically.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pl-6 pr-3">Saved Script &amp; Direction</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Voice &amp; Model</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Duration</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Size</th>
                <th className="py-2.5 pl-3 pr-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {records.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 pl-6 pr-3 max-w-md">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {rec.text}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {rec.mode === "dialogue" ? "Dual-Speaker" : "Single"}
                      {" · "}
                      {rec.style || "Default delivery"}
                    </p>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {rec.voiceName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {rec.model === "gemini-3.8-flash-lite-tts"
                        ? "Flash Lite TTS"
                        : "Flash TTS"}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                    {formatTimecode(rec.durationSeconds)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                    {formatBytes(rec.byteLength)}
                  </td>
                  <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onReloadRecord(rec)}
                        className="h-8 px-2.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Reload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(rec.id)}
                        aria-label="Delete saved record"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
