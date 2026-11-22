import { useState } from "react";
import { Layers, Mic2, Radio, BookOpen, Film } from "lucide-react";
import { TTS_TEMPLATES, type TtsTemplate } from "../types/narration";

interface TemplatesPanelProps {
  activeTemplateId: string;
  onSelectTemplate: (template: TtsTemplate) => void;
  scriptPreview: string;
  activeStyle: string;
  activeVoiceSummary: string;
}

export function TemplatesPanel({
  activeTemplateId,
  onSelectTemplate,
  scriptPreview,
  activeStyle,
  activeVoiceSummary,
}: TemplatesPanelProps) {
  const [imageError, setImageError] = useState(false);

  const activeTemplate =
    TTS_TEMPLATES.find((t) => t.id === activeTemplateId) ?? TTS_TEMPLATES[0];

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case "news-broadcast":
        return <Radio className="w-4 h-4 text-orange-600 shrink-0" />;
      case "batch-multitake":
        return <Layers className="w-4 h-4 text-orange-600 shrink-0" />;
      case "cartoon-windmill":
        return <Film className="w-4 h-4 text-orange-600 shrink-0" />;
      case "dual-podcast":
        return <Mic2 className="w-4 h-4 text-orange-600 shrink-0" />;
      default:
        return <BookOpen className="w-4 h-4 text-orange-600 shrink-0" />;
    }
  };

  return (
    <div
      id="templates"
      className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden transition-colors"
    >
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Voice Templates &amp; Cue Preview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTemplate.category} · {activeVoiceSummary}
          </p>
        </div>
      </div>

      {/* Template Switcher Row */}
      <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
        {TTS_TEMPLATES.map((template) => {
          const isActive = template.id === activeTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                setImageError(false);
                onSelectTemplate(template);
              }}
              aria-pressed={isActive}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "bg-slate-900 dark:bg-orange-600 border-slate-900 dark:border-orange-600 text-white"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {template.label}
            </button>
          );
        })}
      </div>

      {/* Active Cue Preview */}
      {activeTemplate.imageUrl && !imageError ? (
        <div className="relative aspect-16/9 w-full bg-slate-900 overflow-hidden">
          <img
            src={activeTemplate.imageUrl}
            alt="Cartoon story frame of a teenage inventor beside a five-metre windmill made from bicycle scraps"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent pointer-events-none"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="text-xs font-medium text-orange-300 mb-1">
              Active Script Preview
            </div>
            <p className="text-sm font-medium leading-snug text-slate-50 line-clamp-2">
              “{scriptPreview}”
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2.5">
            {getTemplateIcon(activeTemplate.id)}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Active Script &amp; Delivery Summary
            </span>
          </div>
          <blockquote className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 line-clamp-3">
            “{scriptPreview}”
          </blockquote>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
            Direction: {activeStyle || "Natural, clear studio pronunciation."}
          </p>
        </div>
      )}
    </div>
  );
}
