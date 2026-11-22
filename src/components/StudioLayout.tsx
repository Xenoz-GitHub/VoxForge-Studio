import { Cpu, LayoutDashboard, Mic2, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

interface StudioLayoutProps {
  onNavigateToDashboard: () => void;
  onReset: () => void;
  sidebarContent: ReactNode;
  mainContent: ReactNode;
  rightContent: ReactNode;
}

export function StudioLayout({
  onNavigateToDashboard,
  onReset,
  sidebarContent,
  mainContent,
  rightContent,
}: StudioLayoutProps) {
  return (
    <main className="flex-1 w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Studio Header */}
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Mic2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Voice Studio
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Create professional voice tracks with AI
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden xs:inline">Dashboard</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden xs:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Layout - 3 Column Grid */}
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Sidebar - Mode & Configuration */}
          <div className="lg:col-span-3 space-y-4">
            {sidebarContent}
          </div>

          {/* Center - Main Input Area */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-orange-500" />
                  Script & Configuration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter text and customize voice delivery
                </p>
              </div>

              <div className="p-4 sm:p-5">
                {mainContent}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Preview & History */}
          <div className="lg:col-span-3 space-y-4">
            {rightContent}
          </div>
        </div>
      </div>
    </main>
  );
}
