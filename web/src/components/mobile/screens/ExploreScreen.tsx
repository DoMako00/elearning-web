import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopAppBar } from "../TopAppBar";
import {
  HeroBand,
  MobileSearchBar,
  CategoryChipsRow,
  FeaturedPathCard,
  SectionHeader,
  TrendingRow,
  ResourceCard,
  AdvancedFilterSheet,
  EmptyState,
  type LearningPath,
  type ResourceCardData,
  type CategoryItem,
  type FilterState,
} from "../shared";
import {
  SlidersHorizontal,
  Stethoscope,
  Heart,
  Microscope,
  Brain,
  FlaskConical,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react";

// Existing images from course-library, assignments, and onboarding/instructor
import anatomyImage from "../../../Assets/course-library/human-anatomy.webp";
import histologyImage from "../../../Assets/course-library/histology-basics.webp";
import physiologyImage from "../../../Assets/course-library/medical-physiology.webp";
import biochemistryImage from "../../../Assets/course-library/biochemistry-essentials.webp";
import myCoursesAnatomyOverlay from "../../../Assets/dashboard/my-courses-anatomy-overlay.png";

// Categories matching screenshot
const EXPLORE_CATEGORIES: CategoryItem[] = [
  { key: "all", label: "All" },
  { key: "anatomy", label: "Anatomy", icon: <Stethoscope className="w-3.5 h-3.5" /> },
  { key: "physiology", label: "Physiology", icon: <Heart className="w-3.5 h-3.5" /> },
  { key: "histology", label: "Histology", icon: <Microscope className="w-3.5 h-3.5" /> },
  { key: "neuroscience", label: "Neuroscience", icon: <Brain className="w-3.5 h-3.5" /> },
  { key: "pharmacology", label: "Pharmacology", icon: <FlaskConical className="w-3.5 h-3.5" /> },
];

// Single featured learning path matching screenshot
const FEATURED_LEARNING_PATH: LearningPath = {
  slug: "master-human-anatomy",
  title: "Master Human Anatomy",
  description:
    "Build a complete understanding of the human body — from skeletal structure to organ systems.",
  weeks: 12,
  tags: ["EDITOR'S PICK", "12-WEEK PATH"],
  learnerCount: "18.7k",
  illustration: myCoursesAnatomyOverlay,
  avatars: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
  ],
};

interface TrendingItemData {
  id: string;
  rank: string;
  title: string;
  subtitle: string;
  category: string;
  categoryId: string;
  rating: number;
  slug: string;
  level: "beginner" | "intermediate" | "advanced";
  durationHours: number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

// 3 Trending items matching screenshot
const TRENDING_ITEMS: TrendingItemData[] = [
  {
    id: "trend-1",
    rank: "01",
    title: "Human Anatomy I",
    subtitle: "Intermediate · 8h · 12 docs",
    category: "Anatomy",
    categoryId: "anatomy",
    rating: 4.8,
    slug: "human-anatomy-i",
    level: "intermediate",
    durationHours: 8,
    icon: <Stethoscope className="w-5 h-5" />,
    iconBgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "trend-2",
    rank: "02",
    title: "Histology Basics",
    subtitle: "Beginner · 6h · 10 docs",
    category: "Histology",
    categoryId: "histology",
    rating: 4.9,
    slug: "histology-basics",
    level: "beginner",
    durationHours: 6,
    icon: <Microscope className="w-5 h-5" />,
    iconBgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    id: "trend-3",
    rank: "03",
    title: "Medical Physiology",
    subtitle: "Intermediate · 10h · 14 docs",
    category: "Physiology",
    categoryId: "physiology",
    rating: 4.7,
    slug: "medical-physiology",
    level: "intermediate",
    durationHours: 10,
    icon: <Activity className="w-5 h-5" />,
    iconBgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

// Medical Modules For You grid cards (contains 4 modules matching screenshot + 1 NOT enrolled item)
const MEDICAL_MODULES: (ResourceCardData & {
  level: "beginner" | "intermediate" | "advanced";
  durationHours: number;
})[] = [
  {
    id: "mod-1",
    title: "Human Anatomy I",
    subtitle: "Structure & Organization",
    category: "ANATOMY",
    categoryId: "anatomy",
    imageSrc: anatomyImage,
    documentsCount: 12,
    learnersCount: "15.2k",
    slug: "human-anatomy-i", // ENROLLED
    level: "intermediate",
    durationHours: 8.5,
    rating: 4.8,
  },
  {
    id: "mod-2",
    title: "Histology Basics",
    subtitle: "Tissues of the Human Body",
    category: "HISTOLOGY",
    categoryId: "histology",
    imageSrc: histologyImage,
    documentsCount: 10,
    learnersCount: "22.1k",
    slug: "histology-basics", // ENROLLED
    level: "beginner",
    durationHours: 6,
    rating: 4.9,
  },
  {
    id: "mod-3",
    title: "Medical Physiology",
    subtitle: "How the body works",
    category: "PHYSIOLOGY",
    categoryId: "physiology",
    imageSrc: physiologyImage,
    documentsCount: 14,
    learnersCount: "9.8k",
    slug: "medical-physiology", // ENROLLED
    level: "intermediate",
    durationHours: 10,
    rating: 4.7,
  },
  {
    id: "mod-4",
    title: "Biochemistry Essentials",
    subtitle: "Core chemical processes",
    category: "BIOCHEMISTRY",
    categoryId: "biochemistry",
    imageSrc: biochemistryImage,
    documentsCount: 8,
    learnersCount: "13.4k",
    slug: "biochemistry-essentials", // ENROLLED
    level: "intermediate",
    durationHours: 7.2,
    rating: 4.6,
  },
  {
    id: "mod-5",
    title: "Clinical Pharmacology",
    subtitle: "Drug Mechanisms & Therapy",
    category: "PHARMACOLOGY",
    categoryId: "pharmacology",
    imageSrc: biochemistryImage,
    documentsCount: 14,
    learnersCount: "8.7k",
    slug: "clinical-pharmacology", // NOT ENROLLED (deliberately tested per prompt!)
    level: "advanced",
    durationHours: 11,
    rating: 4.9,
  },
];

const INITIAL_FILTERS: FilterState = {
  level: "all",
  duration: "any",
  minRating: 0,
};

export const ExploreScreen: React.FC = () => {
  const navigate = useNavigate();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Common predicate check for both trending and modules
  const matchesFilters = (item: {
    title: string;
    subtitle: string;
    categoryId: string;
    level: string;
    durationHours: number;
    rating?: number;
  }) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Category Chip
    if (activeCategory !== "all" && item.categoryId !== activeCategory) {
      return false;
    }

    // 3. Advanced Filter: Level
    if (advancedFilters.level !== "all" && item.level !== advancedFilters.level) {
      return false;
    }

    // 4. Advanced Filter: Duration
    if (advancedFilters.duration === "under5" && item.durationHours >= 5) {
      return false;
    }
    if (
      advancedFilters.duration === "5to10" &&
      (item.durationHours < 5 || item.durationHours > 10)
    ) {
      return false;
    }
    if (advancedFilters.duration === "over10" && item.durationHours <= 10) {
      return false;
    }

    // 5. Advanced Filter: Min Rating
    if (
      advancedFilters.minRating > 0 &&
      (item.rating || 0) < advancedFilters.minRating
    ) {
      return false;
    }

    return true;
  };

  const filteredTrending = useMemo(() => {
    return TRENDING_ITEMS.filter(matchesFilters);
  }, [searchQuery, activeCategory, advancedFilters]);

  const filteredModules = useMemo(() => {
    return MEDICAL_MODULES.filter(matchesFilters);
  }, [searchQuery, activeCategory, advancedFilters]);

  const hasActiveAdvancedFilters =
    advancedFilters.level !== "all" ||
    advancedFilters.duration !== "any" ||
    advancedFilters.minRating > 0;

  const totalResults = filteredTrending.length + filteredModules.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      {/* 1. Fixed TopAppBar main variant */}
      <TopAppBar variant="main" />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 2. HeroBand: Heading + Subtitle */}
        <HeroBand
          heading="Explore"
          subtitle="Discover study resources to go further."
        />

        <div className="px-4 pb-12 space-y-5 max-w-lg mx-auto">
          {/* 3. MobileSearchBar with Filter Sliders Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <MobileSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search anatomy, physiology, histology..."
              />
            </div>

            {/* Filter sheet trigger button */}
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              aria-label="Filter resources"
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                hasActiveAdvancedFilters
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* 4. CategoryChipsRow (wraps to 2 rows per screenshot) */}
          <CategoryChipsRow
            categories={EXPLORE_CATEGORIES}
            activeKey={activeCategory}
            onChange={setActiveCategory}
          />

          {/* 5. FeaturedPathCard (Dark green card) */}
          {activeCategory === "all" && !searchQuery.trim() && !hasActiveAdvancedFilters && (
            <FeaturedPathCard
              path={FEATURED_LEARNING_PATH}
              onExplore={() =>
                navigate(`/explore/paths/${FEATURED_LEARNING_PATH.slug}`)
              }
            />
          )}

          {/* Empty State when zero results */}
          {totalResults === 0 ? (
            <div className="pt-4">
              <EmptyState
                icon={<Layers className="w-6 h-6" />}
                title="No matching resources found"
                subtitle="Try adjusting your search terms, changing the category, or clearing active filters."
                action={{
                  label: "Reset All Filters",
                  onClick: () => {
                    setSearchQuery("");
                    setActiveCategory("all");
                    setAdvancedFilters(INITIAL_FILTERS);
                  },
                }}
              />
            </div>
          ) : (
            <>
              {/* 6. Trending now Section */}
              {filteredTrending.length > 0 && (
                <section aria-label="Trending now">
                  <SectionHeader
                    title="Trending now"
                    actionLabel="See all"
                    onAction={() => {}}
                  />
                  <div className="space-y-2.5">
                    {filteredTrending.map((item) => (
                      <TrendingRow
                        key={item.id}
                        rank={item.rank}
                        icon={item.icon}
                        iconBgColor={item.iconBgColor}
                        iconColor={item.iconColor}
                        title={item.title}
                        subtitle={item.subtitle}
                        trailingSlot={
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            <span>{item.rating.toFixed(1)}</span>
                          </div>
                        }
                        onClick={() => navigate(`/my-courses/${item.slug}`)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 7. Medical Modules For You Section */}
              {filteredModules.length > 0 && (
                <section aria-label="Medical Modules For You">
                  <SectionHeader
                    title="Medical Modules For You"
                    actionLabel="See all"
                    onAction={() => {}}
                  />
                  <p className="text-xs text-slate-400 font-medium -mt-2 mb-3">
                    Curated study materials, notes, and documents.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredModules.map((module) => (
                      <ResourceCard
                        key={module.id}
                        resource={module}
                        onClick={() => navigate(`/my-courses/${module.slug}`)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Advanced Filter Bottom Sheet */}
      <AdvancedFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={advancedFilters}
        onApply={(newFilters) => setAdvancedFilters(newFilters)}
        onReset={() => setAdvancedFilters(INITIAL_FILTERS)}
      />
    </div>
  );
};

export default ExploreScreen;
