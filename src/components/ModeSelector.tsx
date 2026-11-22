import type { NarrationMode } from "../types/narration";

interface ModeSelectorProps {
  currentMode: NarrationMode;
  onModeChange: (mode: NarrationMode) => void;
}

const modes = [
  {
    id: "single" as const,
    label: "Single Voice",
    icon: "🎤",
    description: "One voice track",
  },
  {
    id: "batch" as const,
    label: "Batch Queue",
    icon: "📋",
    description: "Multiple clips",
  },
  {
    id: "dialogue" as const,
    label: "Dialogue",
    icon: "💬",
    description: "Two speakers",
  },
];

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
        Generation Mode
      </h3>
      <div className="space-y-2">
        {modes.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onModeChange(mode.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer active:scale-[0.99] ${
                isActive
                  ? "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-500/5 shadow-sm ring-1 ring-orange-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg leading-none">{mode.icon}</span>
                <span
                  className={`text-sm font-semibold ${
                    isActive
                      ? "text-orange-700 dark:text-orange-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {mode.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 ml-7">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
