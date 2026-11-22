import { TTS_MODELS, type TtsModelId } from "../types/narration";

interface ModelSelectorProps {
  currentModel: TtsModelId;
  onModelChange: (model: TtsModelId) => void;
}

export function ModelSelector({
  currentModel,
  onModelChange,
}: ModelSelectorProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        AI Model
      </h3>
      <div className="space-y-2">
        {TTS_MODELS.map((model) => {
          const isSelected = currentModel === model.id;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onModelChange(model.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer active:scale-[0.99] ${
                isSelected
                  ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/10 dark:to-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div
                  className={`text-xs font-semibold ${
                    isSelected
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {model.label}
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                )}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                {model.summary}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
