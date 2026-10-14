import type { ExploreCategory } from "./exploreData";

interface ExploreCategoriesProps {
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  categories: readonly ExploreCategory[];
}

export function ExploreCategories({
  activeCategory,
  onSelectCategory,
  categories,
}: ExploreCategoriesProps) {
  return (
    <nav className="explore-categories" aria-label="Topic categories">
      <div className="explore-categories__track" role="tablist">
        {categories.map((tab) => {
          const isActive = activeCategory === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`explore-category-tab ${isActive ? "is-active" : ""}`}
              onClick={() => onSelectCategory(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
