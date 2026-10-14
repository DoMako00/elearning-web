import { ArrowRight, CalendarDays } from "lucide-react";
import type { ExploreDirection } from "./exploreData";

interface ExploreDirectionsProps {
  items: readonly ExploreDirection[];
  selectedSemester?: number | null;
  onSelectDirection?: (semesterNumber: number) => void;
}


export function ExploreDirections({ items, selectedSemester, onSelectDirection }: ExploreDirectionsProps) {
  return (
    <article className="explore-directions" aria-labelledby="explore-directions-title">
      <header className="explore-directions__header">
        <h3 id="explore-directions-title">Choose a direction</h3>
      </header>

      <div className="explore-directions__grid" role="group" aria-label="Skill directions">
        {items.map((item) => {
          const selected = selectedSemester === item.semesterNumber;
          return (
            <button
              key={item.id}
              type="button"
              className={`explore-direction-card explore-direction-card--${item.colorTheme}${selected ? " is-active" : ""}`}
              onClick={() => onSelectDirection?.(selected ? 0 : item.semesterNumber)}
              aria-label={`Filter by ${item.title}, ${item.subtitle}`}
              aria-pressed={selected}
            >
              <div className="explore-direction-card__icon-wrap">
                <CalendarDays className="explore-direction-card__icon" aria-hidden="true" />
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
