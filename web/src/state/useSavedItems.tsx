import React, { createContext, useContext, useState, useEffect } from "react";

export type SavedItemType = "course" | "note" | "article" | "path";

export interface SavedItemRecord {
  id: string;
  type: SavedItemType;
  savedAt?: string;
}

interface SavedItemsContextType {
  savedIds: Record<string, SavedItemRecord>;
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string, type?: SavedItemType) => void;
  getSavedCountByType: (type: SavedItemType) => number;
}

// Initial mock saved items (course-1, course-2, course-4) matching screenshot's "Saved 3" badge
const INITIAL_SAVED_ITEMS: Record<string, SavedItemRecord> = {
  "course-1": { id: "course-1", type: "course" },
  "course-2": { id: "course-2", type: "course" },
  "course-4": { id: "course-4", type: "course" },
};

const SavedItemsContext = createContext<SavedItemsContextType | null>(null);

export const SavedItemsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [savedIds, setSavedIds] = useState<Record<string, SavedItemRecord>>(() => {
    try {
      const stored = localStorage.getItem("greenlearn_saved_items");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return INITIAL_SAVED_ITEMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("greenlearn_saved_items", JSON.stringify(savedIds));
    } catch {
      // Ignore
    }
  }, [savedIds]);

  const isSaved = (id: string): boolean => {
    return Boolean(savedIds[id]);
  };

  const toggleSaved = (id: string, type: SavedItemType = "course") => {
    setSavedIds((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { id, type, savedAt: new Date().toISOString() };
      }
      return next;
    });
  };

  const getSavedCountByType = (type: SavedItemType): number => {
    return Object.values(savedIds).filter((item) => item.type === type).length;
  };

  return (
    <SavedItemsContext.Provider
      value={{
        savedIds,
        isSaved,
        toggleSaved,
        getSavedCountByType,
      }}
    >
      {children}
    </SavedItemsContext.Provider>
  );
};

export function useSavedItems(): SavedItemsContextType {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error("useSavedItems must be used within a SavedItemsProvider");
  }
  return context;
}
