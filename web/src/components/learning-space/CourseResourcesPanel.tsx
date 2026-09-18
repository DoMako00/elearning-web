import { Download, FileSpreadsheet, FileText, ListFilter, Presentation, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { COURSE_RESOURCES } from "./learningSpaceData";

const TYPE_FILTERS = ["All types", "PDF", "PPTX", "DOCX", "CSV"] as const;
const MODULE_FILTERS = ["All modules", "Module 1", "Module 2", "Module 3"] as const;

function FileGlyph({ extension }: { extension: string }) {
  if (extension === "pptx") return <Presentation aria-hidden="true" />;
  if (extension === "csv") return <FileSpreadsheet aria-hidden="true" />;
  return <FileText aria-hidden="true" />;
}

export function CourseResourcesPanel() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>("All types");
  const [module, setModule] = useState<(typeof MODULE_FILTERS)[number]>("All modules");

  const resources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return COURSE_RESOURCES.filter((resource) => {
      const matchesQuery =
        !normalized ||
        resource.title.toLowerCase().includes(normalized) ||
        resource.description.toLowerCase().includes(normalized);
      const matchesType = type === "All types" || resource.extension === type.toLowerCase();
      const matchesModule = module === "All modules" || resource.module === Number(module.replace("Module ", ""));
      return matchesQuery && matchesType && matchesModule;
    });
  }, [module, query, type]);

  return (
    <div className="learning-resources">
      <header className="learning-resources__header">
        <div>
          <h2>Course resources</h2>
          <p>Access reading materials, guides, atlases, and other resources for Human Anatomy I.</p>
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
        <select value={module} aria-label="Filter by module" onChange={(event) => setModule(event.target.value as (typeof MODULE_FILTERS)[number])}>
          {MODULE_FILTERS.map((option) => (
            <option key={option}>{option}</option>
          ))}
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
              <th>Module</th>
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
                      <small>{resource.description}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="learning-resources__module">Module {resource.module}</span>
                </td>
                <td>
                  <span className={`learning-resources__type learning-resources__type--${resource.extension}`}>
                    {resource.extension.toUpperCase()}
                  </span>
                </td>
                <td>{resource.size}</td>
                <td>{resource.added}</td>
                <td>
                  <button type="button" aria-label={`Download ${resource.title}`}>
                    <Download aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 ? <p className="learning-resources__empty">No resources match those filters.</p> : null}
      </div>
    </div>
  );
}
