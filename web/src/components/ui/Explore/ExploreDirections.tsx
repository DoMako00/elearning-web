import { ArrowRight } from "lucide-react";
import { DIRECTION_ITEMS, type DirectionItem } from "./exploreData";

interface ExploreDirectionsProps {
  onSelectDirection?: (categoryId: string) => void;
}

export function ExploreDirections({ onSelectDirection }: ExploreDirectionsProps) {
  return (
    <article className="explore-directions" aria-labelledby="explore-directions-title">
      <header className="explore-directions__header">
        <h3 id="explore-directions-title">Choose a direction</h3>
      </header>

      <div className="explore-directions__grid" role="group" aria-label="Skill directions">
        {DIRECTION_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`explore-direction-card explore-direction-card--${item.colorTheme}`}
              onClick={() => onSelectDirection?.(item.categoryId)}
              aria-label={`Direction: ${item.title}, ${item.subtitle}`}
            >
              <div className="explore-direction-card__icon-wrap">
                <Icon className="explore-direction-card__icon" aria-hidden="true" />
              </div>

              <div className="explore-direction-card__text">
                <h4 className="explore-direction-card__title">{item.title}</h4>
                <p className="explore-direction-card__subtitle">{item.subtitle}</p>
              </div>

              <div className="explore-direction-card__arrow" aria-hidden="true">
                <ArrowRight className="size-3.5" />
              </div>
            </button>
          );
        })}
      </div>
    </article>
  );
}
