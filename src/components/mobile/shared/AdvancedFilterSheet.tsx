import React from "react";
import { BottomSheet } from "./BottomSheet";
export interface FilterState {
  level: string;
  semester: string;
}

export interface AdvancedFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  levels: readonly string[];
  semesters: readonly string[];
  onApply: (newFilters: FilterState) => void;
  onReset: () => void;
}

export const AdvancedFilterSheet: React.FC<AdvancedFilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  levels,
  semesters,
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
            {[{ value: "all", label: "All levels" }, ...levels.map((level) => ({ value: level, label: level }))].map((item) => {
              const isSelected = localFilters.level === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      level: item.value,
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

        {/* Semester Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Semester
          </label>
          <div className="flex flex-wrap gap-2">
            {[{ value: "all", label: "All semesters" }, ...semesters.map((semester) => ({ value: semester, label: semester }))].map((item) => {
              const isSelected = localFilters.semester === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      semester: item.value,
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
