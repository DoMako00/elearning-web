import { Box, Sparkles, TrendingUp } from "lucide-react";
import { TRENDING_ITEMS, type TrendingItem } from "./exploreData";

interface ExploreTrendingProps {
  onSelectTopic?: (topic: TrendingItem) => void;
}

export function ExploreTrending({ onSelectTopic }: ExploreTrendingProps) {
  const renderIcon = (item: TrendingItem) => {
    switch (item.iconType) {
      case "js":
        return <span className="trending-icon__js">JS</span>;
      case "cube":
        return <Box className="size-4" aria-hidden="true" />;
      case "sparkles":
        return <Sparkles className="size-4" aria-hidden="true" />;
    }
  };

  return (
    <article className="explore-trending" aria-labelledby="explore-trending-title">
      <header className="explore-trending__header">
        <h3 id="explore-trending-title">Trending now</h3>
      </header>

      <ul className="explore-trending__list" role="list">
        {TRENDING_ITEMS.map((item) => (
          <li key={item.id} className="explore-trending__item">
            <button
              type="button"
              className="explore-trending__button"
              onClick={() => onSelectTopic?.(item)}
              aria-label={`${item.title}, ${item.level}, ${item.duration}, rated ${item.rating}`}
            >
              <span className="explore-trending__rank">{item.rank}</span>

              <div className={`explore-trending__icon ${item.bgClass}`}>
                {renderIcon(item)}
              </div>

              <div className="explore-trending__details">
                <h4 className="explore-trending__name">{item.title}</h4>
                <p className="explore-trending__meta">
                  <span>{item.level}</span>
                  <span className="explore-trending__dot">•</span>
                  <span>{item.duration}</span>
                  <span className="explore-trending__dot">•</span>
                  <span className="explore-trending__rating">★ {item.rating}</span>
                </p>
              </div>

              <div className="explore-trending__trend" aria-hidden="true">
                <TrendingUp className="size-4" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
