import { Home, LayoutDashboard, Mic2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { AppView } from "./Navbar";

interface MobileBottomNavProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

export function MobileBottomNav({
  activeView,
  onNavigate,
}: MobileBottomNavProps) {
  const prefersReduced = useReducedMotion();
  
  const tabs: { id: AppView; label: string; Icon: typeof Home }[] = [
    { id: "landing", label: "Overview", Icon: Home },
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "studio", label: "Studio", Icon: Mic2 },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <div className="grid grid-cols-3 h-16">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`min-h-[64px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 relative ${
                isActive
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId={prefersReduced ? undefined : "mobile-nav-indicator"}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              
              {/* Icon with Active State */}
              <motion.div
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.2 }}
                    className="absolute inset-0 bg-orange-500 rounded-full blur-md"
                  />
                )}
              </motion.div>
              
              {/* Label */}
              <span className={`text-[11px] leading-none tracking-tight whitespace-nowrap font-medium ${
                isActive ? 'font-semibold' : 'font-normal'
              }`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
