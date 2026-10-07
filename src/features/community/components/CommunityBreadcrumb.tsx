import { ChevronRight, Home, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface CommunityBreadcrumbProps {
  onlineCount?: number;
  activeTopic?: string;
}

export function CommunityBreadcrumb({
  onlineCount,
  activeTopic,
}: CommunityBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center justify-between gap-2 py-1.5 px-0 text-[13px] font-medium text-slate-500"
    >
      <ol className="flex items-center gap-1.5 list-none m-0 p-0">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <Home className="size-3.5" />
            <span>Home</span>
          </Link>
        </li>
        <li className="flex items-center text-slate-300">
          <ChevronRight className="size-3.5 stroke-[2.2]" />
        </li>
        <li>
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Users className="size-3.5 text-emerald-600" />
            <span>Community</span>
          </span>
        </li>
        {activeTopic && activeTopic !== "All topics" && (
          <>
            <li className="flex items-center text-slate-300">
              <ChevronRight className="size-3.5 stroke-[2.2]" />
            </li>
            <li>
              <span className="text-emerald-700 font-medium px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-200/60 text-xs">
                {activeTopic}
              </span>
            </li>
          </>
        )}
      </ol>

      {/* Subtle live indicator badge */}
      {onlineCount !== undefined && (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden sm:inline text-slate-600">
            <strong className="text-slate-800">{onlineCount}</strong> members active
          </span>
        </div>
      )}
    </nav>
  );
}
