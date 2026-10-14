import { Download, FileText, ListFilter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getStudentProtectedMedia } from "../../features/student/api/studentCoursesApi";
import type { LearningSpaceResource } from "./learningSpaceMappers";

const TYPE_FILTERS = ["All types", "PDF", "VIDEO"] as const;

function FileGlyph({ extension: _extension }: { extension: LearningSpaceResource["extension"] }) {
  return <FileText aria-hidden="true" />;
}

export function CourseResourcesPanel({ resources: courseResources, courseTitle, onOpenLesson }: { resources: readonly LearningSpaceResource[]; courseTitle: string; onOpenLesson: (lessonId: string) => void }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>("All types");
  const [chapterId, setChapterId] = useState("all");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chapters = useMemo(() => [...new Map(courseResources.map((resource) => [resource.chapterId, { id: resource.chapterId, title: resource.chapterTitle }])).values()], [courseResources]);

  const resources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return courseResources.filter((resource) => {
      const matchesQuery = !normalized || resource.title.toLowerCase().includes(normalized) || resource.chapterTitle.toLowerCase().includes(normalized);
      const matchesType = type === "All types" || resource.extension.toUpperCase() === type;
      const matchesChapter = chapterId === "all" || resource.chapterId === chapterId;
      return matchesQuery && matchesType && matchesChapter;
    });
  }, [chapterId, courseResources, query, type]);

  const openResource = async (resource: LearningSpaceResource) => {
    if (!resource.available || openingId) return;
    setError(null);
    if (resource.extension === "video") {
      onOpenLesson(resource.lessonId);
      return;
    }
    setOpeningId(resource.id);
    try {
      const delivery = await getStudentProtectedMedia({ assetId: resource.id });
      window.location.assign(delivery.delivery.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The protected resource could not be opened.");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="learning-resources">
      <header className="learning-resources__header">
        <div>
          <h2>Course resources</h2>
          <p>Published lesson resources for {courseTitle}. Protected files open only after server authorization.</p>
        </div>
      </header>
      <div className="learning-resources__toolbar">
        <label className="learning-resources__search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Search resources..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select value={type} aria-label="Filter by file type" onChange={(event) => setType(event.target.value as (typeof TYPE_FILTERS)[number])}>
          {TYPE_FILTERS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select value={chapterId} aria-label="Filter by chapter" onChange={(event) => setChapterId(event.target.value)}>
          <option value="all">All chapters</option>
          {chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
        </select>
        <button type="button" className="learning-resources__filter" aria-label="More filters">
          <ListFilter aria-hidden="true" />
        </button>
      </div>
      <div className="learning-resources__table-wrap">
        <table className="learning-resources__table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Chapter</th>
              <th>Type</th>
              <th>Size</th>
              <th>Added</th>
              <th>
                <span className="sr-only">Download</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id}>
                <td>
                  <div className="learning-resources__file">
                    <span className={`workspace-file-icon workspace-file-icon--${resource.extension}`}>
                      <FileGlyph extension={resource.extension} />
                    </span>
                    <span>
                      <strong>{resource.title}</strong>
                      <small>{resource.chapterTitle}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="learning-resources__module">{resource.chapterTitle}</span>
                </td>
                <td>
                  <span className={`learning-resources__type learning-resources__type--${resource.extension}`}>
                    {resource.extension.toUpperCase()}
                  </span>
                </td>
                <td aria-label="File size not provided by the API">—</td>
                <td aria-label="Added date not provided by the API">—</td>
                <td>
                  <button type="button" aria-label={`Open protected ${resource.title}`} disabled={!resource.available || openingId === resource.id} onClick={() => void openResource(resource)}>
                    <Download aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error ? <p className="learning-resources__empty" role="alert">{error}</p> : null}
        {resources.length === 0 ? <p className="learning-resources__empty">No published lesson resources are available for this course.</p> : null}
      </div>
    </div>
  );
}
