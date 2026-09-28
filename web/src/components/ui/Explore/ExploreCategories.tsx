import { CATEGORY_TABS } from "./exploreData";

interface ExploreCategoriesProps {
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function ExploreCategories({
  activeCategory,
  onSelectCategory,
}: ExploreCategoriesProps) {
  return (
    <nav className="explore-categories" aria-label="Topic categories">
      <div className="explore-categories__track" role="tablist">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
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
              {Icon && <Icon className="explore-category-tab__icon" aria-hidden="true" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
