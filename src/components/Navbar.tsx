import { KeyRound, LogOut, Moon, Sun, UserCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { User } from "firebase/auth";

export type AppView = "landing" | "dashboard" | "studio";
export type ThemeMode = "light" | "dark";

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView, anchorId?: string) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  authReady: boolean;
  authUser: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  keyCount: number;
  onOpenApiKeys: () => void;
}

export function Navbar({
  activeView,
  onNavigate,
  theme,
  onToggleTheme,
  authReady,
  authUser,
  onSignIn,
  onSignOut,
  keyCount,
  onOpenApiKeys,
}: NavbarProps) {
  const prefersReduced = useReducedMotion();

  const navItems: { id: AppView; label: string }[] = [
    { id: "landing", label: "Overview" },
    { id: "dashboard", label: "Dashboard" },
    { id: "studio", label: "Studio" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800/80 transition-colors shadow-sm dark:shadow-slate-900/50">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 h-16 sm:h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Creative Brand Logo - Mobile Optimized */}
        <button
          type="button"
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-2 shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg px-1.5 py-1 -ml-1 group active:scale-95 transition-transform"
        >
          {/* Logo Icon - Slightly Larger on Mobile */}
          <div className="relative w-9 h-9 sm:w-8 sm:h-8">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-emerald-500 rounded-lg group-hover:from-orange-600 group-hover:to-emerald-600 transition-all duration-200 shadow-md shadow-orange-500/30"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white drop-shadow">
                <path d="M12 6L12 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M8 9L8 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M16 9L16 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6"/>
              </svg>
            </div>
          </div>
          
          {/* Brand Name - Responsive Typography */}
          <div className="flex flex-col hidden xs:flex">
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              VoxForge Studio
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide hidden sm:block">
              Voice Crafting Workspace
            </span>
          </div>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links (Desktop) */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded ${
                  isActive
                    ? "text-slate-950 dark:text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <motion.span
                    layoutId={prefersReduced ? undefined : "top-nav-indicator"}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-orange-600 dark:bg-orange-500 rounded-full"
                  />
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onNavigate("landing", "developer")}
            className="py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
          >
            Developer
          </button>
        </nav>

        {/* Zone 3: Theme Toggle + Account - Mobile Optimized */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* API Keys Button - Compact on Mobile */}
          <button
            type="button"
            onClick={onOpenApiKeys}
            aria-label={`Manage Gemini API keys (${keyCount} configured)`}
            title={
              keyCount > 0
                ? `${keyCount} Gemini API key${keyCount === 1 ? "" : "s"} in pool`
                : "Add Gemini API keys"
            }
            className={`h-9 px-2 sm:px-2.5 rounded-lg border flex items-center gap-1 sm:gap-1.5 transition-all shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 active:scale-95 ${
              keyCount > 0
                ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70"
                : "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/70"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-semibold tabular-nums hidden xs:inline">
              {keyCount > 0 ? keyCount : "Keys"}
            </span>
          </button>

          {/* Theme Toggle - Touch-Optimized */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 active:scale-95"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Auth Button - Mobile Optimized */}
          {!authReady ? (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap px-2 hidden xs:inline">
              Checking...
            </span>
          ) : authUser ? (
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              className="h-9 px-2 sm:px-3 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg transition-all inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
            >
              <span className="max-w-[60px] xs:max-w-[80px] sm:max-w-[140px] truncate">
                {authUser.displayName || authUser.email}
              </span>
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="h-9 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-orange-600/20 active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
