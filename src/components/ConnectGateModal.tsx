import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  UserCheck,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FacebookBrandIcon, TikTokBrandIcon } from "./BrandIcons";

interface ConnectGateModalProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  userDisplayName?: string;
  communityConnected: boolean;
  isSaving: boolean;
  authError: string | null;
  onClose: () => void;
  onSignIn: () => Promise<void>;
  onConfirmCommunityAndProceed: () => Promise<void>;
}

const FACEBOOK_WAIT_SECONDS = 10;

export function ConnectGateModal({
  isOpen,
  isAuthenticated,
  userDisplayName,
  communityConnected,
  isSaving,
  authError,
  onClose,
  onSignIn,
  onConfirmCommunityAndProceed,
}: ConnectGateModalProps) {
  const [clickedTikTok, setClickedTikTok] = useState(false);
  const [fbStarted, setFbStarted] = useState(false);
  const [fbSecondsLeft, setFbSecondsLeft] = useState<number>(FACEBOOK_WAIT_SECONDS);
  const [fbUnlocked, setFbUnlocked] = useState(false);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!fbStarted || fbUnlocked) return;

    const timer = window.setInterval(() => {
      setFbSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setFbUnlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [fbStarted, fbUnlocked]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      await onSignIn();
    } finally {
      setSigningIn(false);
    }
  };

  const handleFacebookClick = () => {
    if (!fbStarted) {
      setFbStarted(true);
      setFbSecondsLeft(FACEBOOK_WAIT_SECONDS);
    }
  };

  const fbReady = communityConnected || fbUnlocked;
  const canUnlock = isAuthenticated && (communityConnected || (fbUnlocked && confirmedCheck));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-modal-title"
    >
      <div className="w-full sm:max-w-lg max-h-[90dvh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transition-colors">
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="gate-modal-title"
                className="font-display text-base font-bold text-slate-900 dark:text-white leading-snug"
              >
                Sign In &amp; Connect Before Generating
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify your account and connect with developer John Lloyd Suarez
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close verification dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Step 1: Firebase Google Authentication */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Step 1 · Verify Account with Google
              </div>
              {isAuthenticated ? (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 truncate max-w-[160px]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{userDisplayName || "Signed in"}</span>
                </span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  Required
                </span>
              )}
            </div>

            {!isAuthenticated && (
              <button
                type="button"
                disabled={signingIn}
                onClick={handleGoogleLogin}
                className="w-full h-11 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-400 text-white dark:text-slate-950 text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {signingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Step 2: Facebook (Required + 10s timer) & TikTok (Optional) */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Step 2 · Connect with Developer
              </div>
              {communityConnected ? (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmed</span>
                </span>
              ) : fbUnlocked ? (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              ) : fbStarted ? (
                <span className="text-xs font-mono font-semibold text-orange-600 dark:text-orange-400 inline-flex items-center gap-1 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{fbSecondsLeft}s</span>
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Required Facebook Button with 10s Countdown */}
              <motion.a
                href="https://www.facebook.com/Zawn.Loid.SuwaRizz111"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleFacebookClick}
                whileHover={prefersReduced ? undefined : { y: -1 }}
                className={`group p-3 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                  fbReady
                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40"
                    : fbStarted
                    ? "border-orange-300 dark:border-orange-500/50 bg-orange-50/50 dark:bg-orange-500/10"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#1877F2]/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <motion.div
                    whileHover={
                      prefersReduced ? undefined : { scale: 1.1, rotate: -4 }
                    }
                    className="shrink-0"
                  >
                    <FacebookBrandIcon className="w-6 h-6" />
                  </motion.div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      Add on Facebook
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {fbReady
                        ? "Verification complete"
                        : fbStarted
                        ? `Wait ${fbSecondsLeft}s after adding to unlock`
                        : "Required"}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold inline-flex items-center gap-1 shrink-0 tabular-nums ${
                    fbReady
                      ? "text-emerald-700 dark:text-emerald-400"
                      : fbStarted
                      ? "font-mono text-orange-600 dark:text-orange-400"
                      : "text-[#1877F2] dark:text-blue-400"
                  }`}
                >
                  {fbReady ? (
                    <>
                      <span>Unlocked</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </>
                  ) : fbStarted ? (
                    <span>Wait {fbSecondsLeft}s</span>
                  ) : (
                    <>
                      <span>Go</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </span>
              </motion.a>

              {/* Optional TikTok Button */}
              <motion.a
                href="https://www.tiktok.com/@xenozexe0.0"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setClickedTikTok(true)}
                whileHover={prefersReduced ? undefined : { y: -1 }}
                className={`group p-3 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                  clickedTikTok
                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-900/50 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <motion.div
                    whileHover={
                      prefersReduced ? undefined : { scale: 1.1, rotate: -4 }
                    }
                    className="shrink-0"
                  >
                    <TikTokBrandIcon className="w-6 h-6" />
                  </motion.div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      Follow on TikTok
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Optional
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white inline-flex items-center gap-0.5 shrink-0">
                  {clickedTikTok ? "Opened" : "Go"}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </motion.a>
            </div>

            {!communityConnected && (
              <label
                className={`flex items-start gap-2.5 pt-1 select-none ${
                  fbUnlocked ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!fbUnlocked}
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 accent-orange-600 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  I have added <strong>John Lloyd Suarez</strong> on Facebook
                  {!fbUnlocked && fbStarted
                    ? ` (available in ${fbSecondsLeft}s)`
                    : !fbUnlocked
                    ? " (click Add on Facebook above first)"
                    : "."}
                </span>
              </label>
            )}
          </div>

          {authError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300"
            >
              {authError}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canUnlock || isSaving}
            onClick={onConfirmCommunityAndProceed}
            className="h-10 px-5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : !communityConnected && fbStarted && !fbUnlocked ? (
              <span>Unlock in {fbSecondsLeft}s...</span>
            ) : (
              <span>Unlock &amp; Generate Audio</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
