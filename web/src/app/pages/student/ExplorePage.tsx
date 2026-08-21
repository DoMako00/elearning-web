import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EXPLORE_COURSES,
  ExploreCategories,
  ExploreCourses,
  ExploreDirections,
  ExploreHero,
  ExploreTrending,
} from "../../../components/ui/Explore";
import "../../../components/ui/Explore/Explore.css";

export function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredCourses = useMemo(() => {
    return EXPLORE_COURSES.filter((course) => {
      if (activeCategory !== "all" && course.categoryId !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          course.title.toLowerCase().includes(q) ||
          course.category.toLowerCase().includes(q) ||
          course.level.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section className="student-page student-page--explore" aria-labelledby="explore-title">
      <div className="explore-workspace">
        <header className="explore-toolbar">
          <div className="student-page-intro">
            <span>Discover</span>
            <h1 id="explore-title">Explore</h1>
            <p>Find the next skill worth building.</p>
          </div>

          <div className="explore-toolbar__tools">
            <div className="explore-search-bar">
              <Search aria-hidden="true" />
              <input
                type="text"
                placeholder="What do you want to learn?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search courses, skills, or topics"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="explore-search-bar__clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </div>

            <button
              type="button"
              className="explore-filter-btn"
              aria-label="Filter options"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
            </button>

            <span className="explore-courses-count">
              {searchQuery || activeCategory !== "all"
                ? `${filteredCourses.length} courses`
                : "124 courses"}
            </span>
          </div>
        </header>

        <div className="explore-top-section">
          <ExploreHero />
          <div className="explore-aside">
            <ExploreTrending
              onSelectTopic={(topic) => setSearchQuery(topic.title)}
            />
            <ExploreDirections
              onSelectDirection={(catId) => setActiveCategory(catId)}
            />
          </div>
        </div>

        <ExploreCategories
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        <ExploreCourses
          courses={filteredCourses}
          searchQuery={searchQuery}
          onClearSearch={() => {
            setSearchQuery("");
            setActiveCategory("all");
          }}
        />
      </div>
    </section>
  );
}
