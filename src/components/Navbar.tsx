import { LogOut, Moon, Sun, UserCheck } from "lucide-react";
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
}: NavbarProps) {
  const prefersReduced = useReducedMotion();

  const navItems: { id: AppView; label: string }[] = [
    { id: "landing", label: "Overview" },
    { id: "dashboard", label: "Dashboard" },
    { id: "studio", label: "Studio" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate("landing")}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md px-1 -ml-1"
        >
          VoxForge Studio
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

        {/* Zone 3: Theme Toggle + Primary Account / Studio Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {!authReady ? (
            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap px-2">
              Checking...
            </span>
          ) : authUser ? (
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              className="h-10 sm:h-9 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="max-w-[96px] sm:max-w-[140px] truncate">
                {authUser.displayName || authUser.email}
              </span>
              <LogOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="h-10 sm:h-9 px-3.5 sm:px-4 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
