import { AdminSideDrawer } from "../../../features/admin/components/AdminSideDrawer";
import { WorkspaceBadge } from "../../../features/admin/components/AdminWorkspacePrimitives";
import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers3,
  Search,
} from "lucide-react";
import {
  adminDeliveryRequest,
  catalogueBrandAccessPath,
  catalogueInstitutionsPath,
  type CatalogueBrand,
  type CatalogueInstitution,
  type CatalogueLevel,
  type CatalogueModule,
  type CatalogueSemester,
} from "../../../features/admin/api/adminDelivery.http";
import type {
  AdminBrandContext,
  AdminBrandView,
} from "../../../features/admin/api";

interface CurriculumContext {
  readonly brandView: AdminBrandView;
  readonly availableBrands: readonly AdminBrandContext[];
}

function itemLabel(brand: AdminBrandView, levelNumber: number): string {
  if (brand === "nexus") return "Module";
  if (brand === "elite" || brand === "medway") {
    return levelNumber === 1 ? "Subject" : "Module";
  }
  return "Subject / module";
}

export function AdminCurriculumPage() {
  const { brandView, availableBrands } = useOutletContext<CurriculumContext>();
  const [institutions, setInstitutions] = useState<
    readonly CatalogueInstitution[]
  >([]);
  const [brandAccess, setBrandAccess] = useState<readonly CatalogueBrand[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<"year" | "semester" | "unit" | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void Promise.all([
      adminDeliveryRequest<CatalogueInstitution[]>(catalogueInstitutionsPath, {
        signal: controller.signal,
      }),
      adminDeliveryRequest<CatalogueBrand[]>(catalogueBrandAccessPath, {
        signal: controller.signal,
      }),
    ])
      .then(([catalogueRows, accessRows]) => {
        if (!Array.isArray(catalogueRows) || !Array.isArray(accessRows)) {
          throw new Error("The academic catalogue response is invalid.");
        }
        setInstitutions(catalogueRows);
        setBrandAccess(accessRows);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setInstitutions([]);
          setBrandAccess([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Academic catalogues could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  const activeBrandCodes = useMemo(
    () =>
      new Set<string>(
        brandView === "all"
          ? availableBrands.map((item) => item.brandCode)
          : availableBrands
              .filter((item) => item.brandCode === brandView)
              .map((item) => item.brandCode),
      ),
    [availableBrands, brandView],
  );
  const visibleInstitutions = useMemo(() => {
    const allowedIds = new Set(
      brandAccess
        .filter((item) => activeBrandCodes.has(item.code))
        .flatMap((item) =>
          item.allowedAcademicInstitutions.map((institution) => institution.id),
        ),
    );
    return institutions.filter(
      (item) => item.status === "active" && allowedIds.has(item.id),
    );
  }, [activeBrandCodes, brandAccess, institutions]);

  useEffect(() => {
    if (!visibleInstitutions.some((item) => item.id === institutionId)) {
      setInstitutionId(visibleInstitutions[0]?.id ?? "");
    }
  }, [institutionId, visibleInstitutions]);

  const institution = visibleInstitutions.find(
    (item) => item.id === institutionId,
  );
  const levels = institution?.levels ?? [];
  const level = levels.find((item) => item.id === levelId) ?? levels[0];
  const semesters = level?.semesters ?? [];
  const semester =
    semesters.find((item) => item.id === semesterId) ?? semesters[0];
  const modules = semester?.modules ?? [];
  const filteredModules = modules.filter((item) =>
    `${item.code} ${item.sourceDisplayLabel}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const selectedModule =
    modules.find((item) => item.id === moduleId) ?? modules[0];
  const subjectLabel = itemLabel(brandView, level?.levelNumber ?? 1);

  useEffect(() => {
    if (!levels.some((item) => item.id === levelId))
      setLevelId(levels[0]?.id ?? "");
  }, [levelId, levels]);

  useEffect(() => {
    if (!semesters.some((item) => item.id === semesterId))
      setSemesterId(semesters[0]?.id ?? "");
  }, [semesterId, semesters]);

  useEffect(() => {
    if (!modules.some((item) => item.id === moduleId))
      setModuleId(modules[0]?.id ?? "");
  }, [moduleId, modules]);

  return (
    <section
      className="admin-page admin-curriculum-live"
      aria-label="Academic curriculum"
    >
      <div className="admin-curriculum-live__toolbar">
        <label className="admin-curriculum-live__catalogue">
          <span>Academic catalogue</span>
          <select
            aria-label="Academic catalogue"
            value={institutionId}
            disabled={loading || visibleInstitutions.length === 0}
            onChange={(event) => {
              setInstitutionId(event.target.value);
              setLevelId("");
              setSemesterId("");
              setModuleId("");
            }}
          >
            {visibleInstitutions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-curriculum-live__search">
          <Search aria-hidden="true" />
          <span className="admin-sr-only">Search academic catalogue</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${subjectLabel.toLocaleLowerCase()}s`}
          />
        </label>
        <button type="button" onClick={() => setEditor("year")}>
          Add academic year
        </button>
        <Link to="/admin/courses" className="admin-curriculum-live__action">
          Open courses <ChevronRight aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <section className="admin-curriculum-live__state" role="status">
          <BookOpen aria-hidden="true" />
          <h2>Loading curriculum</h2>
          <p>Reading the authorized academic catalogues.</p>
        </section>
      ) : error ? (
        <section className="admin-curriculum-live__state" role="alert">
          <BookOpen aria-hidden="true" />
          <h2>Curriculum unavailable</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry
          </button>
        </section>
      ) : !institution || !level || !semester ? (
        <section className="admin-curriculum-live__state">
          <BookOpen aria-hidden="true" />
          <h2>No catalogue available for this brand</h2>
          <p>
            Only active academic catalogues authorized for the selected brand
            are shown.
          </p>
        </section>
      ) : (
        <div className="admin-curriculum-live__workspace">
          <aside
            className="admin-curriculum-live__levels"
            aria-label="Academic levels"
          >
            <header>
              <GraduationCap aria-hidden="true" />
              <span>Levels</span>
            </header>
            <nav>
              {levels.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === level.id ? "is-selected" : ""}
                  aria-pressed={item.id === level.id}
                  onClick={() => {
                    setLevelId(item.id);
                    setSemesterId("");
                    setModuleId("");
                  }}
                >
                  <span>
                    <strong>{item.displayTitle}</strong>
                    <small>
                      {item.semesters.reduce(
                        (count, row) => count + row.modules.length,
                        0,
                      )}{" "}
                      {itemLabel(
                        brandView,
                        item.levelNumber,
                      ).toLocaleLowerCase()}
                      s · {item.semesters.length} semesters
                    </small>
                  </span>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))}
            </nav>
          </aside>

          <section
            className="admin-curriculum-live__catalogue-view"
            aria-label={`${institution.displayName} ${level.displayTitle}`}
          >
            <header className="admin-curriculum-live__section-heading">
              <div>
                <span>{institution.displayName}</span>
                <h2>{level.displayTitle}</h2>
              </div>
              <span className="admin-curriculum-live__record-count">
                {filteredModules.length} {subjectLabel.toLocaleLowerCase()}
                {filteredModules.length === 1 ? "" : "s"}
              </span>
            </header>
            <div className="admin-curriculum-accordions">
              {semesters.map((item) => (
                <section className="admin-curriculum-semester" key={item.id}>
                  <button
                    type="button"
                    aria-expanded={item.id === semester.id}
                    className="admin-curriculum-semester__toggle"
                    onClick={() => {
                      setSemesterId(item.id);
                      setModuleId("");
                    }}
                  >
                    <ChevronRight aria-hidden="true" />
                    <strong>{item.displayTitle}</strong>
                    <WorkspaceBadge
                      value={`${item.modules.length} ${subjectLabel.toLowerCase()}s`}
                    />
                  </button>
                  {item.id === semester.id && (
                    <div className="admin-curriculum-live__table-wrap">
                      <table>
                        <caption className="admin-sr-only">
                          {subjectLabel} catalogue
                        </caption>
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>{subjectLabel}</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredModules.map((unit) => (
                            <tr
                              key={unit.id}
                              className={
                                unit.id === selectedModule?.id
                                  ? "is-selected"
                                  : ""
                              }
                            >
                              <td>
                                <button
                                  className="admin-curriculum-live__row-select"
                                  type="button"
                                  onClick={() => setModuleId(unit.id)}
                                >
                                  {unit.code}
                                </button>
                              </td>
                              <td>
                                <button
                                  className="admin-curriculum-live__row-select"
                                  type="button"
                                  onClick={() => setModuleId(unit.id)}
                                >
                                  {unit.sourceDisplayLabel || unit.code}
                                </button>
                              </td>
                              <td>
                                <WorkspaceBadge value={unit.reviewStatus} />
                              </td>
                            </tr>
                          ))}
                          {!filteredModules.length && (
                            <tr>
                              <td colSpan={3}>No items match this search.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="admin-workspace-actions">
                        <button type="button" onClick={() => setEditor("unit")}>
                          Add {subjectLabel.toLowerCase()}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditor("semester")}
                        >
                          Edit semester
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              ))}
              <button type="button" onClick={() => setEditor("semester")}>
                Add semester
              </button>
            </div>
          </section>

          <aside
            className="admin-curriculum-live__inspector"
            aria-label="Selected academic item"
          >
            {selectedModule && (
              <button type="button" onClick={() => setEditor("unit")}>
                Edit {subjectLabel.toLowerCase()}
              </button>
            )}
            {selectedModule ? (
              <ModuleInspector
                module={selectedModule}
                institution={institution}
                level={level}
                semester={semester}
                subjectLabel={subjectLabel}
              />
            ) : (
              <div className="admin-curriculum-live__inspector-empty">
                <Layers3 aria-hidden="true" />
                <h2>Select an item</h2>
                <p>
                  Academic references are shared catalogue data. They do not
                  create a brand course or Student access.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
      <AdminSideDrawer
        open={editor !== null}
        title={
          editor === "unit"
            ? `${subjectLabel} details`
            : editor === "semester"
              ? "Semester details"
              : "Academic year details"
        }
        eyebrow="Curriculum structure"
        onClose={() => setEditor(null)}
      >
        <div className="admin-workspace-form">
          <p role="status">
            Curriculum editing is prepared for the next API integration. These
            fields do not save changes to the shared academic catalogue.
          </p>
          <label>
            Title
            <input
              key={editor}
              defaultValue={
                editor === "unit"
                  ? selectedModule?.sourceDisplayLabel
                  : editor === "semester"
                    ? semester?.displayTitle
                    : level?.displayTitle
              }
            />
          </label>
          <label>
            Code
            <input
              defaultValue={editor === "unit" ? selectedModule?.code : ""}
            />
          </label>
          <label>
            Academic year
            <select defaultValue={level?.id}>
              {levels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayTitle}
                </option>
              ))}
            </select>
          </label>
          <label>
            Semester
            <select defaultValue={semester?.id}>
              {semesters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayTitle}
                </option>
              ))}
            </select>
          </label>
          <label>
            Presentation
            <input readOnly value={subjectLabel} />
          </label>
          <button type="button" disabled>
            Save · API integration required
          </button>
        </div>
      </AdminSideDrawer>
    </section>
  );
}

function ModuleInspector({
  module,
  institution,
  level,
  semester,
  subjectLabel,
}: {
  readonly module: CatalogueModule;
  readonly institution: CatalogueInstitution;
  readonly level: CatalogueLevel;
  readonly semester: CatalogueSemester;
  readonly subjectLabel: string;
}) {
  return (
    <>
      <header>
        <span>Academic reference</span>
        <strong>{module.reviewStatus.replaceAll("_", " ")}</strong>
      </header>
      <div className="admin-curriculum-live__identity">
        <span>{module.code}</span>
        <h2>{module.sourceDisplayLabel || module.code}</h2>
        <p>
          {institution.displayName} · {level.displayTitle} ·{" "}
          {semester.displayTitle}
        </p>
      </div>
      <dl>
        <div>
          <dt>Type</dt>
          <dd>{subjectLabel}</dd>
        </div>
        <div>
          <dt>Catalogue status</dt>
          <dd>{module.reviewStatus.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Resource references</dt>
          <dd>{module.resourceCount}</dd>
        </div>
        <div>
          <dt>Academic chapters</dt>
          <dd>{module.chapters.length}</dd>
        </div>
      </dl>
      <section className="admin-curriculum-live__outline">
        <h3>Academic chapter outline</h3>
        {module.chapters.length ? (
          <ol>
            {module.chapters.map((chapter) => (
              <li key={chapter.id}>
                <span>{chapter.code}</span>
                {chapter.title}
              </li>
            ))}
          </ol>
        ) : (
          <p>No academic chapter references are recorded.</p>
        )}
      </section>
      <p className="admin-curriculum-live__note">
        This view reads the shared academic catalogue. Brand-owned courses and
        lesson delivery are managed separately.
      </p>
    </>
  );
}
