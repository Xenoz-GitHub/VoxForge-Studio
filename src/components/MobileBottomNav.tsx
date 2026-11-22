import { Home, LayoutDashboard, Mic2 } from "lucide-react";
import type { AppView } from "./Navbar";

interface MobileBottomNavProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

export function MobileBottomNav({
  activeView,
  onNavigate,
}: MobileBottomNavProps) {
  const tabs: { id: AppView; label: string; Icon: typeof Home }[] = [
    { id: "landing", label: "Overview", Icon: Home },
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "studio", label: "Studio", Icon: Mic2 },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/92 dark:bg-slate-950/92 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
    >
      <div className="grid grid-cols-3 h-14">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                isActive
                  ? "text-orange-600 dark:text-orange-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-none tracking-tight whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
