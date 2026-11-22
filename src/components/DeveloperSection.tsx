import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  EmailBrandIcon,
  FacebookBrandIcon,
  GitHubBrandIcon,
  PhoneBrandIcon,
  TikTokBrandIcon,
  WhatsAppBrandIcon,
} from "./BrandIcons";

const DEVELOPER_PFP_URL = "/assets/developer-pfp.jpg";

export function DeveloperSection() {
  const [imgError, setImgError] = useState(false);
  const prefersReduced = useReducedMotion();

  const channels = [
    {
      id: "facebook",
      title: "Facebook",
      actionLabel: "Connect on Facebook",
      href: "https://www.facebook.com/Zawn.Loid.SuwaRizz111",
      external: true,
      renderIcon: () => <FacebookBrandIcon className="w-7 h-7" />,
      accentClass:
        "hover:border-[#1877F2]/60 hover:bg-[#1877F2]/5",
    },
    {
      id: "tiktok",
      title: "TikTok",
      actionLabel: "Follow on TikTok",
      href: "https://www.tiktok.com/@xenozexe0.0",
      external: true,
      renderIcon: () => <TikTokBrandIcon className="w-7 h-7" />,
      accentClass:
        "hover:border-slate-900/50 hover:bg-slate-100/80",
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      actionLabel: "Message · +63 952 633 0651",
      href: "https://wa.me/639526330651",
      external: true,
      renderIcon: () => <WhatsAppBrandIcon className="w-7 h-7" />,
      accentClass:
        "hover:border-[#25D366]/60 hover:bg-[#25D366]/5",
    },
    {
      id: "github",
      title: "GitHub",
      actionLabel: "View GitHub Profile",
      href: "https://github.com/Xenoz-GitHub",
      external: true,
      renderIcon: () => <GitHubBrandIcon className="w-7 h-7" />,
      accentClass:
        "hover:border-slate-900/50 hover:bg-slate-100/80",
    },
    {
      id: "email",
      title: "Email",
      actionLabel: "Send an Email",
      href: "mailto:johnlloydsuarez676@gmail.com",
      external: false,
      renderIcon: () => <EmailBrandIcon className="w-7 h-7" />,
      accentClass:
        "hover:border-red-500/50 hover:bg-red-50/40",
    },
    {
      id: "phone",
      title: "Mobile Contact",
      actionLabel: "Call · +63 952 633 0651",
      href: "tel:+639526330651",
      external: false,
      renderIcon: () => (
        <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center">
          <PhoneBrandIcon className="w-3.5 h-3.5" />
        </div>
      ),
      accentClass:
        "hover:border-orange-500/60 hover:bg-orange-50/60",
    },
  ];

  return (
    <section id="developer" className="max-w-[1360px] mx-auto px-4 sm:px-6 py-14 sm:py-16 w-full">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch transition-colors">
        {/* Left: Developer Profile Picture & Bio */}
        <div className="lg:col-span-5 bg-slate-900 dark:bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between gap-6 border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-800 shrink-0">
              {!imgError ? (
                <img
                  src={DEVELOPER_PFP_URL}
                  alt="John Lloyd Suarez profile picture"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-2xl font-bold text-orange-400">
                  JLS
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-medium text-orange-400">
                Developer &amp; Creator
              </div>
              <h2 className="font-display text-2xl font-bold text-white mt-0.5">
                John Lloyd Suarez
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Computer Science Student · Full-Stack Web Developer
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            As a Computer Science student passionate about building practical software and speech tools, I created VoxForge Studio to bring multi-take voice generation, parallel batch rendering, and expressive direction into one streamlined workspace. Reach out anytime for project collaborations, custom web builds, or technical inquiries.
          </p>

          <div className="text-xs text-slate-400 border-t border-slate-800 pt-4">
            Direct Contact · Philippines (+63) · 0952 633 0651
          </div>
        </div>

        {/* Right: Direct Action Buttons with Animated Official Platform Icons */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center gap-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Connect with John Lloyd Suarez
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose a platform below to connect or message directly
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {channels.map((ch) => (
              <motion.a
                key={ch.id}
                href={ch.href}
                target={ch.external ? "_blank" : undefined}
                rel={ch.external ? "noopener noreferrer" : undefined}
                whileHover={prefersReduced ? undefined : { y: -2 }}
                whileTap={prefersReduced ? undefined : { scale: 0.99 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className={`group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 transition-colors flex items-center justify-between gap-3 ${ch.accentClass} dark:hover:bg-slate-800/70`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <motion.div
                    whileHover={
                      prefersReduced ? undefined : { scale: 1.14, rotate: -5 }
                    }
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs"
                  >
                    {ch.renderIcon()}
                  </motion.div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {ch.title}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                      {ch.actionLabel}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
