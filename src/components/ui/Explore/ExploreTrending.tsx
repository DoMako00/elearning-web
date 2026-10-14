import { ArrowRight, BookOpen } from "lucide-react";
import type { ExploreCourse } from "./exploreData";

interface ExploreTrendingProps {
  courses: readonly ExploreCourse[];
  onSelectTopic?: (course: ExploreCourse) => void;
}

export function ExploreTrending({ courses, onSelectTopic }: ExploreTrendingProps) {
  return (
    <article className="explore-trending" aria-labelledby="explore-trending-title">
      <header className="explore-trending__header">
        <h3 id="explore-trending-title">Recently updated</h3>
      </header>

      <ul className="explore-trending__list" role="list">
        {courses.map((item, index) => (
          <li key={item.id} className="explore-trending__item">
            <button
              type="button"
              className="explore-trending__button"
              onClick={() => onSelectTopic?.(item)}
              aria-label={`${item.title}, ${item.level}, ${item.semester}, ${item.lessonCount} lessons`}
            >
              <span className="explore-trending__rank">{String(index + 1).padStart(2, "0")}</span>

              <div className={`explore-trending__icon ${["trending-icon--green", "trending-icon--purple", "trending-icon--yellow"][index % 3]}`}>
                <BookOpen className="size-4" aria-hidden="true" />
              </div>

              <div className="explore-trending__details">
                <h4 className="explore-trending__name">{item.title}</h4>
                <p className="explore-trending__meta">
                  <span>{item.level}</span>
                  <span className="explore-trending__dot">•</span>
                  <span>{item.lessonCount} lessons</span>
                </p>
              </div>

              <div className="explore-trending__trend" aria-hidden="true">
                <ArrowRight className="size-4" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
