import {
  TrendingUp,
  ArrowRight,
  Atom,
  LayoutGrid,
  BarChart2,
  Cpu,
  Brain,
  MessageSquare,
} from "lucide-react";
import type { TrendingTopic } from "../types/community";

interface TrendingTopicsWidgetProps {
  topics: TrendingTopic[];
  onTopicClick?: (topic: TrendingTopic) => void;
  onViewAllClick?: () => void;
}

export function TrendingTopicsWidget({
  topics,
  onTopicClick,
  onViewAllClick,
}: TrendingTopicsWidgetProps) {
  // Map icon identifiers to corresponding Lucide icons & styling
  const renderTopicIcon = (type: TrendingTopic["topicIcon"]) => {
    switch (type) {
      case "atom":
        return (
          <div className="size-7 grid place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <Atom className="size-4" />
          </div>
        );
      case "layout":
        return (
          <div className="size-7 grid place-items-center rounded-lg bg-purple-50 text-purple-600">
            <LayoutGrid className="size-4" />
          </div>
        );
      case "chart":
        return (
          <div className="size-7 grid place-items-center rounded-lg bg-blue-50 text-blue-600">
            <BarChart2 className="size-4" />
          </div>
        );
      case "nextjs":
        return (
          <div className="size-7 grid place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <Cpu className="size-4" />
          </div>
        );
      case "brain":
        return (
          <div className="size-7 grid place-items-center rounded-lg bg-amber-50 text-amber-600">
            <Brain className="size-4" />
          </div>
        );
      default:
        return (
          <div className="size-7 grid place-items-center rounded-lg bg-slate-50 text-slate-600">
            <MessageSquare className="size-4" />
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs h-full">
      <div className="min-w-0">
        {/* Header Title with Trending icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center">
              <TrendingUp className="size-3.5" />
            </div>
            <h4 className="text-[14px] sm:text-[14.5px] font-bold text-slate-900 tracking-tight">
              Trending topics
            </h4>
          </div>
          <span className="text-[11px] font-medium text-slate-400">This week</span>
        </div>

        {/* Topics List */}
        <div className="divide-y divide-slate-100/90">
          {topics.slice(0, 5).map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => onTopicClick?.(topic)}
              className="w-full flex items-center justify-between py-1.5 px-1.5 text-left rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="shrink-0 scale-95 sm:scale-100 origin-left">
                  {renderTopicIcon(topic.topicIcon)}
                </div>
                <span className="text-[12px] sm:text-[13px] font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                  {topic.title}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium shrink-0 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                {topic.repliesCount} replies
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer "View all topics" link with arrow */}
      <div className="mt-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onViewAllClick}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer group"
        >
          <span>View all topics</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
