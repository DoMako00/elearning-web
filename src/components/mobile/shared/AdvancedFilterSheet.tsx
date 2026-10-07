import React from "react";
import { BottomSheet } from "./BottomSheet";
import { Star } from "lucide-react";

export interface FilterState {
  level: "all" | "beginner" | "intermediate" | "advanced";
  duration: "any" | "under5" | "5to10" | "over10";
  minRating: number; // 0 for any, or 1 to 5
}

export interface AdvancedFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (newFilters: FilterState) => void;
  onReset: () => void;
}

export const AdvancedFilterSheet: React.FC<AdvancedFilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter Resources">
      <div className="space-y-5 pb-2 text-slate-900">
        {/* Level Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Level
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Levels" },
              { id: "beginner", label: "Beginner" },
              { id: "intermediate", label: "Intermediate" },
              { id: "advanced", label: "Advanced" },
            ].map((item) => {
              const isSelected = localFilters.level === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      level: item.id as FilterState["level"],
                    }))
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white font-bold shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "any", label: "Any" },
              { id: "under5", label: "< 5h" },
              { id: "5to10", label: "5–10h" },
              { id: "over10", label: "10h+" },
            ].map((item) => {
              const isSelected = localFilters.duration === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      duration: item.id as FilterState["duration"],
                    }))
                  }
                  className={`py-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white font-bold shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimum Rating */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Minimum Rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = localFilters.minRating >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      minRating: prev.minRating === star ? 0 : star,
                    }))
                  }
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label={`${star} stars and above`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      isActive
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              );
            })}
            <span className="text-xs font-bold text-slate-600 ml-2">
              {localFilters.minRating > 0
                ? `${localFilters.minRating}.0+`
                : "Any rating"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
