import { StudentPageRegion } from "./StudentPagePlaceholder";

export function ExplorePage() {
  return (
    <section className="student-page student-page--explore" aria-labelledby="explore-title">
      <header className="explore-toolbar">
        <div className="student-page-intro">
          <span>Discover</span>
          <h1 id="explore-title">Explore</h1>
          <p>Find the next skill worth building.</p>
        </div>
        <StudentPageRegion title="Explore tools" className="explore-toolbar__tools" />
      </header>
      <div className="explore-featured">
        <StudentPageRegion title="Featured learning path" />
        <div className="explore-featured__aside">
          <StudentPageRegion title="Trending now" />
          <StudentPageRegion title="Choose a direction" />
        </div>
      </div>
      <StudentPageRegion title="Topic categories" className="explore-categories" />
      <section className="explore-courses" aria-labelledby="courses-for-you-title">
        <header><h2 id="courses-for-you-title">Courses for you</h2></header>
        <div className="explore-courses__grid">
          <StudentPageRegion title="Course placeholder" />
          <StudentPageRegion title="Course placeholder" />
          <StudentPageRegion title="Course placeholder" />
          <StudentPageRegion title="Course placeholder" />
        </div>
      </section>
    </section>
  );
}
