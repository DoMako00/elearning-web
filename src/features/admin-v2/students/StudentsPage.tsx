import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Activity,
  BookOpen,
  CircleAlert,
  Eye,
  Laptop,
  LockKeyhole,
  Monitor,
  Plus,
  Search,
  Smartphone,
  UserRound,
  Users,
  X,
  Copy,
} from "lucide-react";
import { useAdminV2 } from "../layout/AdminV2Layout";
import {
  BrandBadge,
  ConfirmDialog,
  Drawer,
  FormActions,
  FormField,
  StatusBadge,
} from "../shared/AdminV2Primitives";
import {
  InspectorFields,
  InspectorSection,
  Pagination,
  TableFrame,
} from "../shared/AdminV2Table";
import type {
  BrandCode,
  StudentDraft,
  StudentRecord,
} from "../types/adminV2.types";
import { enrollmentFor } from "../data/adminV2.store";
import { StudentForm } from "./StudentForm";
import {
  courseLevel,
  courseMatchesStudentPlacement,
  courseUnitLabel,
} from "../data/adminV2.selectors";
import { listBrandAccess, listInstitutions, type AcademicInstitution, type BrandAccess } from "../api/adminAcademicApi";
import {
  bootstrapAdminStudentClaim,
  createAdminStudent,
  getAdminStudent,
  resetAdminStudentClaim,
  setAdminStudentStatus,
  updateAdminStudent,
  type AdminStudentDetail,
  type AdminStudentListItem,
} from "../api/adminStudentsApi";
import { listAllAdminStudents } from "../api/adminOperationsApi";
import { toEnglishStudentName } from "../api/studentDisplay";

const PAGE_SIZE = 8;
type InspectorTab = "Profile" | "Access" | "Devices" | "Sessions";
const tabs: InspectorTab[] = ["Profile", "Access", "Devices", "Sessions"];

export function StudentsPage() {
  const { data: storeData, brand, globalSearch } = useAdminV2();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<InspectorTab>("Profile");
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<"all" | BrandCode>("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [institution, setInstitution] = useState("all");
  const [semester, setSemester] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(searchParams.get("student") ?? "");
  const [drawer, setDrawer] = useState<
    "add" | "edit" | "grant" | "device" | null
  >(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    detail: string;
    confirmLabel?: string;
    action: () => void;
  } | null>(null);
  const [targetDevice, setTargetDevice] = useState("");
  const [notice, setNotice] = useState("");
  const [studentFormError, setStudentFormError] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<{
    student: StudentRecord;
    setupCode: string;
    setupExpiresAt: string;
  } | null>(null);
  const [grantCourseIds, setGrantCourseIds] = useState<string[]>([]);
  const [remoteRows, setRemoteRows] = useState<StudentRecord[]>([]);
  const [remoteDetail, setRemoteDetail] = useState<AdminStudentDetail | null>(
    null,
  );
  const [studentBrandOptions, setStudentBrandOptions] = useState<BrandAccess[]>([]);
  const [studentInstitutionOptions, setStudentInstitutionOptions] = useState<AcademicInstitution[]>([]);
  const [studentPlacementOptionsLoading, setStudentPlacementOptionsLoading] = useState(false);
  const [studentPlacementOptionsError, setStudentPlacementOptionsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [mutationPending, setMutationPending] = useState(false);
  const mapStudent = (item: AdminStudentListItem): StudentRecord => ({
    id: item.id,
    accountIdentifier: "—",
    fullName: item.displayName ?? "Unnamed Student",
    email: item.emailMasked ?? "",
    phone: item.phoneMasked ?? "",
    brand: (() => {
      const code = item.platform?.platformCode;
      if (code === "medway" || code === "elite" || code === "nexus") return code;
      throw new Error("The server returned a Student without a valid Brand.");
    })(),
    institution: item.academicInstitution?.trim() || "—",
    academicInstitutionId: item.academicInstitutionId,
    academicLevel: item.academicLevel ?? "—",
    academicLevelId: item.academicLevelId,
    semester: item.academicSemester ?? item.academicTermOrYear ?? "—",
    academicSemesterId: item.academicSemesterId,
    program: "",
    activeDeviceCount: item.activeDeviceCount,
    claimStatus: item.claimStatus,
    claimBootstrapRequired: item.claimBootstrapRequired,
    status:
      item.status === "suspended"
        ? "Suspended"
        : item.status === "active"
          ? "Active"
          : item.status === "disabled"
            ? "Inactive"
            : "Pending",
    createdAt: item.createdAt,
    lastActivity: item.lastSeenAt
      ? new Date(item.lastSeenAt).toLocaleString()
      : "Never",
  });
  const reload = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await listAllAdminStudents(brand);
      setRemoteRows(result.map(mapStudent));
    } catch (error) {
      setRemoteRows([]);
      setLoadError(
        error instanceof Error ? error.message : "Unable to load Students.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void reload();
  }, [brand]);
  useEffect(() => {
    let current = true;
    setStudentPlacementOptionsLoading(true);
    setStudentPlacementOptionsError("");
    void Promise.all([listBrandAccess(), listInstitutions()])
      .then(([brands, institutions]) => {
        if (!current) return;
        setStudentBrandOptions(brands);
        setStudentInstitutionOptions(institutions);
      })
      .catch((error: unknown) => {
        if (!current) return;
        setStudentBrandOptions([]);
        setStudentInstitutionOptions([]);
        setStudentPlacementOptionsError(error instanceof Error ? error.message : "Brand and academic placement options could not be loaded.");
      })
      .finally(() => { if (current) setStudentPlacementOptionsLoading(false); });
    return () => { current = false; };
  }, []);
  useEffect(() => {
    if (!remoteRows.length) {
      if (!loading && selectedId) setSelectedId("");
      return;
    }
    if (selectedId && remoteRows.some((item) => item.id === selectedId)) return;
    const requestedId = searchParams.get("student");
    setSelectedId(remoteRows.find((item) => item.id === requestedId)?.id ?? remoteRows[0].id);
  }, [remoteRows, selectedId, searchParams, loading]);
  useEffect(() => {
    let current = true;
    const selectedRow = remoteRows.find((item) => item.id === selectedId);
    setRemoteDetail(null);
    setDetailError("");
    if (!selectedRow) { setDetailLoading(false); return () => { current = false; }; }
    setDetailLoading(true);
    void getAdminStudent(selectedId, selectedRow.brand)
      .then((detail) => { if (current) setRemoteDetail(detail); })
      .catch((error: unknown) => { if (current) setDetailError(error instanceof Error ? error.message : "Student details could not be loaded."); })
      .finally(() => { if (current) setDetailLoading(false); });
    return () => { current = false; };
  }, [selectedId, remoteRows]);
  const data = useMemo(() => {
    const detail = remoteDetail?.id === selectedId ? remoteDetail : null;
    return {
      ...storeData,
      students: remoteRows,
      courses: [] as typeof storeData.courses,
      plans: [] as typeof storeData.plans,
      subscriptions: [] as typeof storeData.subscriptions,
      payments: [] as typeof storeData.payments,
      enrollments: [] as typeof storeData.enrollments,
      devices: (detail?.devices ?? []).map((device) => ({
        id: device.id,
        studentId: detail?.id ?? "",
        name: device.platform ?? "Registered device",
        category:
          device.slot === "mobile"
            ? ("Mobile" as const)
            : ("Additional device" as const),
        type:
          device.slot === "mobile"
            ? ("Phone" as const)
            : ("PC / laptop" as const),
        platform: device.platform ?? "—",
        browser: device.browser ?? "—",
        firstSeen: new Date(device.firstSeenAt).toLocaleString(),
        lastSeen: new Date(device.lastSeenAt).toLocaleString(),
        status: device.revokedAt ? ("Revoked" as const) : ("Active" as const),
      })),
      sessions: (detail?.sessions ?? []).map((session) => ({
        id: session.id,
        studentId: detail?.id ?? "",
        deviceId: session.deviceId ?? "",
        device: "Backend session",
        platform: "—",
        browser: "—",
        created: new Date(session.createdAt).toLocaleString(),
        lastActivity: new Date(session.lastSeenAt).toLocaleString(),
        status:
          session.revokedAt || (session.expiresAt && Date.parse(session.expiresAt) <= Date.now())
            ? ("Revoked" as const)
            : ("Active" as const),
      })),
    };
  }, [storeData, remoteRows, remoteDetail, selectedId]);
  const query = (search || globalSearch).toLowerCase();
  const institutionFilterValues = useMemo(() => [...new Set(data.students.map((item) => item.institution).filter(Boolean))].sort(), [data.students]);
  const semesterFilterValues = useMemo(() => [...new Set(data.students.map((item) => item.semester).filter((item) => item && item !== "—"))].sort(), [data.students]);
  const rows = useMemo(
    () =>
      data.students.filter(
        (student) =>
          (brand === "all" || student.brand === brand) &&
          (brandFilter === "all" || student.brand === brandFilter) &&
          (level === "all" || student.academicLevel === level) &&
          (status === "all" ||
            student.status.toLowerCase().replaceAll(" ", "_") === status) &&
          (institution === "all" || student.institution === institution) &&
          (semester === "all" || student.semester === semester) &&
          (!query ||
            `${student.fullName} ${student.accountIdentifier} ${student.email}`
              .toLowerCase()
              .includes(query)),
      ),
    [
      brand,
      brandFilter,
      data.students,
      institution,
      level,
      query,
      semester,
      status,
    ],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected =
    rows.find((student) => student.id === selectedId) ??
    data.students.find((student) => student.id === selectedId) ??
    rows[0];
  const selectedDevices = selected
    ? data.devices.filter((device) => device.studentId === selected.id)
    : [];
  const selectedSessions = selected
    ? data.sessions.filter((session) => session.studentId === selected.id)
    : [];
  const activeDevices = selectedDevices.filter(
    (device) => device.status === "Active",
  );
  const selectedAccess = selected && remoteDetail?.id === selected.id ? remoteDetail.access : undefined;
  const setAccountStatus = async (
    studentId: string,
    next: StudentRecord["status"],
  ) => {
    setMutationPending(true);
    setNotice("");
    try {
      await setAdminStudentStatus(
        studentId,
        next === "Suspended" ? "suspended" : "active",
        next === "Suspended"
          ? "Suspended by an authorized Admin."
          : "Restored by an authorized Admin.",
      );
      await reload();
      setNotice(
        next === "Suspended" ? "Student suspended." : "Student restored.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to update Student status.",
      );
    } finally {
      setMutationPending(false);
    }
  };

  const saveStudent = async (draft: StudentDraft) => {
    setMutationPending(true);
    setStudentFormError("");
    try {
      if (drawer === "edit" && selected) {
        const result = await updateAdminStudent(selected.id, {
          fullName: draft.fullName,
          phone: draft.phone || undefined,
          ...(draft.accountIdentifier.trim() ? { studentCode: draft.accountIdentifier.trim() } : {}),
          academicInstitutionId: draft.academicInstitutionId,
          academicLevelId: draft.academicLevelId,
          academicSemesterId: draft.academicSemesterId,
          expectedVersion: remoteDetail?.version ?? 1,
        });
        setRemoteDetail(result);
        setDrawer(null);
        await reload();
        return;
      }
      const result = await createAdminStudent({
        fullName: draft.fullName,
        ...(draft.phone?.trim() ? { phone: draft.phone.trim() } : {}),
        brandCode: draft.brand,
        academicInstitutionCode: draft.academicInstitutionCode,
        academicLevelNumber: draft.academicLevelNumber,
        academicSemesterNumber: draft.academicSemesterNumber,
        studentCode: draft.accountIdentifier || undefined,
        programLabel: draft.program || undefined,
      });
      setSelectedId(result.studentProfileId);
      setPage(1);
      setDrawer(null);
      setCreatedStudent({
        student: {
          id: result.studentProfileId,
          accountIdentifier: result.accountIdentifier,
          setupCode: result.setupCode,
          fullName: toEnglishStudentName(draft.fullName),
          email: "",
          phone: draft.phone,
          brand: draft.brand,
          institution: draft.institution,
          academicLevel: draft.academicLevel,
          semester: draft.semester,
          program: draft.program,
          status: "Pending Payment",
          createdAt: "Just now",
          lastActivity: "Never",
        },
        setupCode: result.setupCode,
        setupExpiresAt: result.setupExpiresAt,
      });
      await reload();
    } catch (error) {
      setStudentFormError(
        error instanceof Error ? error.message : "Unable to save Student.",
      );
    } finally {
      setMutationPending(false);
    }
  };
  const resetClaim = async () => {
    if (!selected) return;
    setMutationPending(true);
    setNotice("");
    try {
      const reason = selected.claimBootstrapRequired
        ? "Initial setup credential issued by an authorized Admin."
        : "Setup credential reset by an authorized Admin.";
      const result = selected.claimBootstrapRequired
        ? await bootstrapAdminStudentClaim(selected.id, reason, selected.brand)
        : await resetAdminStudentClaim(selected.id, reason, selected.brand);
      setCreatedStudent({
        student: { ...selected, accountIdentifier: result.accountIdentifier },
        setupCode: result.setupCode,
        setupExpiresAt: result.setupExpiresAt,
      });
      setNotice("A new setup credential has been issued.");
      await reload();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to reset the setup credential.",
      );
    } finally {
      setMutationPending(false);
    }
  };
  const copyText = async (value: string) => {
    await navigator.clipboard?.writeText(value);
    setNotice("Copied to clipboard.");
  };
  const openSubscription = () => {
    navigate("/admin/subscriptions");
  };
  const createPurchase = (studentId: string) => {
    navigate(`/admin/subscriptions?startPurchase=1&purchaseStudent=${encodeURIComponent(studentId)}`);
  };

  const activeStudents = data.students.filter(
    (student) => student.status === "Active",
  ).length;
  const medwayStudents = data.students.filter(
    (student) => student.brand === "medway",
  ).length;
  const eliteStudents = data.students.filter(
    (student) => student.brand === "elite",
  ).length;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
  const thisMonth = data.students.filter((student) => {
    const createdAt = Date.parse(student.createdAt);
    return Number.isFinite(createdAt) && createdAt >= monthStart.getTime() && createdAt < nextMonthStart.getTime();
  }).length;
  const activeShare = data.students.length
    ? Math.round((activeStudents / data.students.length) * 100)
    : 0;
  const medwayShare = data.students.length
    ? Math.round((medwayStudents / data.students.length) * 100)
    : 0;
  const eliteShare = data.students.length
    ? Math.round((eliteStudents / data.students.length) * 100)
    : 0;
  const newStudentShare = data.students.length
    ? Math.round((thisMonth / data.students.length) * 100)
    : 0;

  const slotCategory = targetDevice
    ? selectedDevices.find((device) => device.id === targetDevice)?.category
    : activeDevices.some((device) => device.category === "Mobile")
      ? "Additional device"
      : "Mobile";
  const saveDevice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("Device registration and replacement are not available through a safe profile-scoped Admin command.");
  };
  const saveCourseGrants = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("Direct course grants are not supported. Assign the Student to a Subscription Seat instead.");
  };
  return (
    <section className="admin-v2__page admin-v2__students">
      {(loading || loadError) && (
        <div
          className="admin-v2__inline-notice"
          role={loadError ? "alert" : "status"}
        >
          {loading ? "Loading Students…" : loadError}
        </div>
      )}
      {studentPlacementOptionsError && (
        <div className="admin-v2__inline-notice" role="alert">
          Brand and academic placement options could not be loaded: {studentPlacementOptionsError}
        </div>
      )}
      <div className="admin-v2__metrics admin-v2__student-metrics">
        <Stat
          icon={Users}
          label="Active Students"
          value={String(activeStudents)}
          note={`${activeShare}% of records`}
          progress={activeShare}
        />
        <Stat
          icon={BookOpen}
          label="Medway Students"
          value={String(medwayStudents)}
          note={`${medwayShare}% of records`}
          progress={medwayShare}
        />
        <Stat
          icon={UserRound}
          label="Elite Students"
          value={String(eliteStudents)}
          note={`${eliteShare}% of records`}
          progress={eliteShare}
        />
        <Stat
          icon={Activity}
          label="New This Month"
          value={String(thisMonth)}
          note="Created this month"
          progress={newStudentShare}
        />
      </div>
      <div className="admin-v2__workgrid has-inspector">
        <TableFrame
          title="Students"
          count={`${rows.length} students`}
          toolbar={
            <div className="admin-v2__table-tools admin-v2__student-tools">
              <label className="admin-v2__search">
                <Search size={15} />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search students..."
                  aria-label="Search students"
                />
              </label>
              <select
                aria-label="Brand"
                value={brandFilter}
                disabled={!studentBrandOptions.length}
                onChange={(event) => {
                  setBrandFilter(event.target.value as "all" | BrandCode);
                  setPage(1);
                }}
              >
                <option value="all">All brands</option>
                {studentBrandOptions
                  .filter((item) => item.status.toLowerCase() === "active")
                  .map((item) => (
                    <option key={item.id} value={item.code}>
                      {item.name}
                    </option>
                  ))}
              </select>
              <select
                aria-label="Academic level"
                value={level}
                onChange={(event) => {
                  setLevel(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All levels</option>
                {[
                  ...new Set(data.students.map((item) => item.academicLevel)),
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                aria-label="Student status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="payment_rejected">Payment Rejected</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                className="admin-v2__button"
                onClick={() => setShowMore((value) => !value)}
              >
                More filters
              </button>
              <button
                disabled={mutationPending}
                className="admin-v2__button is-primary"
                onClick={() => setDrawer("add")}
              >
                <Plus size={15} /> Add Student
              </button>
            </div>
          }
          footer={
            <Pagination
              page={page}
              pageCount={pageCount}
              total={rows.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          }
        >
          {showMore && (
            <div className="admin-v2__more-filters">
              <select
                aria-label="Institution"
                value={institution}
                onChange={(event) => {
                  setInstitution(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All institutions</option>
                {institutionFilterValues.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select
                aria-label="Semester"
                value={semester}
                onChange={(event) => {
                  setSemester(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All semesters</option>
                {semesterFilterValues.map((item) => <option key={item}>{item}</option>)}
              </select>
              <button
                onClick={() => {
                  setSearch("");
                  setBrandFilter("all");
                  setLevel("all");
                  setStatus("all");
                  setInstitution("all");
                  setSemester("all");
                  setPage(1);
                }}
              >
                Clear
              </button>
            </div>
          )}
          <table className="admin-v2__table admin-v2__student-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Account identifier</th>
                <th>Brand</th>
                <th>Academic level</th>
                <th>Semester</th>
                <th>Status</th>
                <th>Devices</th>
                <th>Last activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((student) => {
                const deviceCount = student.activeDeviceCount;
                return (
                  <tr
                    key={student.id}
                    className={selected?.id === student.id ? "is-selected" : ""}
                    onClick={() => {
                      setSelectedId(student.id);
                      setTab("Profile");
                    }}
                  >
                    <td>
                      <span className="admin-v2__student-cell">
                        <i>
                          {student.fullName
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </i>
                        <b>
                          {student.fullName}
                          <small>
                            {student.email || "Email not connected"}
                          </small>
                        </b>
                      </span>
                    </td>
                    <td>{student.accountIdentifier}</td>
                    <td>
                      <BrandBadge brand={student.brand} />
                    </td>
                    <td>{student.academicLevel}</td>
                    <td>{student.semester}</td>
                    <td>
                      <StudentStatus status={student.status} />
                    </td>
                    <td>
                      <span className="admin-v2__device-count">
                        <Monitor size={13} />
                        {deviceCount ?? "—"}/2
                      </span>
                    </td>
                    <td>{student.lastActivity}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-v2__view-student"
                        aria-label={`View student ${student.fullName}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(student.id);
                          setTab("Profile");
                        }}
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visible.length && (
            <div className="admin-v2__empty">
              No students match these filters.
            </div>
          )}
        </TableFrame>
        {selected && (
          <aside className="admin-v2__inspector admin-v2__student-inspector">
            <header className="admin-v2__student-head">
              <div className="admin-v2__student-avatar">
                {selected.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <div>
                <h2>{selected.fullName}</h2>
                <p>
                  {selected.accountIdentifier} <span>·</span>{" "}
                  {selected.email || "No email on record"}
                </p>
              </div>
              <StudentStatus status={selected.status} />
            </header>
            <nav className="admin-v2__tabs" aria-label="Student details">
              {tabs.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={tab === item ? "is-active" : ""}
                  aria-selected={tab === item}
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ))}
            </nav>
            <div className="admin-v2__inspector-content">
              {tab === "Profile" && (
                <>
                  <InspectorSection
                    title="Student profile"
                    action={
                      <button
                        className="admin-v2__text-button"
                        onClick={() => {
                          setStudentFormError("");
                          setDrawer("edit");
                        }}
                      >
                        Edit
                      </button>
                    }
                  >
                    <InspectorFields
                      fields={[
                        ["Full name", selected.fullName],
                        ["Account identifier", selected.accountIdentifier],
                        ["Gmail / email", selected.email || "Not connected"],
                        ["Brand", <BrandBadge brand={selected.brand} />],
                        ["Institution", selected.institution],
                        ["Academic level", selected.academicLevel],
                        ["Semester", selected.semester],
                        ["Program", selected.program || "Not set"],
                        [
                          "Account status",
                          <StudentStatus status={selected.status} />,
                        ],
                      ]}
                    />
                  </InspectorSection>
                  <InspectorSection title="Quick actions">
                    <div className="admin-v2__quick-actions">
                      <button
                        disabled={mutationPending}
                        className={
                          selected.status === "Suspended" ? "" : "is-danger"
                        }
                        onClick={() =>
                          void setAccountStatus(
                            selected.id,
                            selected.status === "Suspended"
                              ? "Active"
                              : "Suspended",
                          )
                        }
                      >
                        <LockKeyhole size={14} />
                        {selected.status === "Suspended"
                          ? "Restore account"
                          : "Suspend account"}
                      </button>
                      {(selected.claimBootstrapRequired || selected.claimStatus === "unclaimed" || selected.claimStatus === "setup_expired" || selected.claimStatus === "locked") && (
                        <button
                          disabled={mutationPending}
                          onClick={() => void resetClaim()}
                        >
                          <Copy size={14} /> {selected.claimBootstrapRequired ? "Issue setup code" : "Reset setup code"}
                        </button>
                      )}
                      {import.meta.env.DEV && (
                        <button
                          title="Isolated demo data only; this is not the selected Student account."
                          onClick={() => navigate("/student-preview")}
                        >
                          <UserRound size={14} />
                          Demo preview
                        </button>
                      )}
                    </div>
                  </InspectorSection>
                  <InspectorSection title="Activity summary">
                    <InspectorFields
                      fields={[
                        ["Last activity", selected.lastActivity],
                        [
                          "Active sessions",
                          detailLoading ? "Loading…" : detailError ? "—" : selectedSessions.filter(
                            (session) => session.status === "Active",
                          ).length,
                        ],
                        ["Registered devices", detailLoading ? "Loading…" : detailError ? "—" : `${activeDevices.length} / 2`],
                        [
                          "Active access grants",
                          detailLoading ? "Loading…" : (selectedAccess?.activeGrantCount ?? "—"),
                        ],
                      ]}
                    />
                  </InspectorSection>
                </>
              )}
              {tab === "Access" && (
                <div className="admin-v2__student-access">
                  <InspectorSection
                    title="Subscription / plan summary"
                    action={
                      <div className="admin-v2__student-purchase-actions">
                        <button className="admin-v2__text-button" onClick={openSubscription}>Open subscriptions</button>
                        <button className="admin-v2__text-button" onClick={() => createPurchase(selected.id)}>Create purchase</button>
                      </div>
                    }
                  >
                    <InspectorFields
                      fields={[
                        ["Active owner subscriptions", detailLoading ? "Loading…" : (selectedAccess?.activeSubscriptionCount ?? "—")],
                        ["Active access grants", detailLoading ? "Loading…" : (selectedAccess?.activeGrantCount ?? "—")],
                        ["Enrollment records", detailLoading ? "Loading…" : (selectedAccess?.enrollmentCount ?? "—")],
                        ["Expired grants", detailLoading ? "Loading…" : (selectedAccess?.expiredGrantCount ?? "—")],
                        ["Revoked grants", detailLoading ? "Loading…" : (selectedAccess?.revokedGrantCount ?? "—")],
                      ]}
                    />
                    {detailError && (
                      <p className="admin-v2__access-block" role="alert">
                        <CircleAlert size={14} />
                        {detailError}
                      </p>
                    )}
                    <p className="admin-v2__source-note">Enrollment counts are informational; access is authorized by the active Subscription Seat and AccessGrant.</p>
                  </InspectorSection>
                  <InspectorSection title="Academic placement">
                    <InspectorFields
                      fields={[
                        ["Institution", selected.institution],
                        ["Brand", <BrandBadge brand={selected.brand} />],
                        ["Level", selected.academicLevel],
                        ["Semester", selected.semester],
                        ["Program", selected.program || "Not set"],
                      ]}
                    />
                  </InspectorSection>
                  <InspectorSection
                    title="Accessible courses"
                    action={
                      <button
                        className="admin-v2__text-button"
                        disabled
                        title="Course access is managed through the Subscription Seat workflow."
                        onClick={() => {
                          setGrantCourseIds([]);
                          setDrawer("grant");
                        }}
                      >
                        <Plus size={13} /> Assign course
                      </button>
                    }
                  >
                    <div className="admin-v2__access-list">
                      {detailLoading ? (
                        <p className="admin-v2__empty-inline" role="status">Loading access summary…</p>
                      ) : detailError ? (
                        <p className="admin-v2__empty-inline" role="alert">Access summary could not be loaded.</p>
                      ) : selectedAccess?.activeGrantCount ? (
                        <p className="admin-v2__empty-inline">
                          {selectedAccess.activeGrantCount} active AccessGrant{selectedAccess.activeGrantCount === 1 ? "" : "s"} recorded. Course-level access is managed through the Subscription and Seat records.
                        </p>
                      ) : (
                        <p className="admin-v2__empty-inline">
                          {selectedAccess ? "No active AccessGrants are recorded." : "Access summary is unavailable."}
                        </p>
                      )}
                    </div>
                  </InspectorSection>
                  <p className="admin-v2__source-note">
                    Enrollment records academic participation. Protected access is determined by the active Subscription Seat and AccessGrant.
                  </p>
                </div>
              )}
              {tab === "Devices" && (
                <>
                  <InspectorSection title="Registered devices">
                    <div className="admin-v2__slot-summary">
                      <strong>{detailLoading ? "Loading device slots…" : detailError ? "Device data unavailable" : `${activeDevices.length} of 2 slots used`}</strong>
                      <div>
                        <span
                          className={
                            activeDevices.some(
                              (item) => item.category === "Mobile",
                            )
                              ? "is-filled"
                              : ""
                          }
                        >
                          <Smartphone size={14} />
                          Mobile
                        </span>
                        <span
                          className={
                            activeDevices.some(
                              (item) => item.category === "Additional device",
                            )
                              ? "is-filled"
                              : ""
                          }
                        >
                          <Laptop size={14} />
                          Additional
                        </span>
                      </div>
                      <small>1 mobile + 1 PC, laptop, or tablet</small>
                    </div>
                    <div className="admin-v2__device-list">
                      {detailLoading ? (
                        <p className="admin-v2__empty-inline" role="status">Loading registered devices…</p>
                      ) : detailError ? (
                        <p className="admin-v2__empty-inline" role="alert">Device details could not be loaded.</p>
                      ) : selectedDevices.map((device) => (
                        <article
                          key={device.id}
                          className={
                            device.status !== "Active" ? "is-inactive" : ""
                          }
                        >
                          <span className="admin-v2__device-icon">
                            {device.type === "Phone" ? (
                              <Smartphone size={18} />
                            ) : (
                              <Laptop size={18} />
                            )}
                          </span>
                          <div className="admin-v2__device-copy">
                            <strong>{device.name}</strong>
                            <small>
                              {device.category} · {device.platform} ·{" "}
                              {device.browser}
                            </small>
                            <small>
                              First seen {device.firstSeen} · Last seen{" "}
                              {device.lastSeen}
                            </small>
                          </div>
                          <StatusBadge status={device.status} />
                        </article>
                      ))}
                      {!detailLoading && !detailError && !selectedDevices.length && (
                        <p className="admin-v2__empty-inline">
                          No registered devices.
                        </p>
                      )}
                    </div>
                  </InspectorSection>
                </>
              )}
              {tab === "Sessions" && (
                <>
                  <InspectorSection
                    title="Sessions"
                    action={
                      <span className="admin-v2__source-note">Read-only</span>
                    }
                  >
                    <div className="admin-v2__session-list">
                      {detailLoading ? (
                        <p className="admin-v2__empty-inline" role="status">Loading sessions…</p>
                      ) : detailError ? (
                        <p className="admin-v2__empty-inline" role="alert">Session details could not be loaded.</p>
                      ) : selectedSessions.map((session) => (
                        <article key={session.id}>
                          <span className="admin-v2__device-icon">
                            <Monitor size={17} />
                          </span>
                          <div>
                            <strong>{session.device}</strong>
                            <small>
                              {session.platform} · {session.browser}
                            </small>
                            <small>
                              Created {session.created} · Active{" "}
                              {session.lastActivity}
                            </small>
                          </div>
                          <StatusBadge status={session.status} />
                        </article>
                      ))}
                      {!detailLoading && !detailError && !selectedSessions.length && (
                        <p className="admin-v2__empty-inline">
                          No sessions recorded.
                        </p>
                      )}
                    </div>
                  </InspectorSection>
                  <div className="admin-v2__session-note">
                    <CircleAlert size={14} />
                    Devices are registered hardware records. Sessions represent
                    separate sign-ins.
                  </div>
                </>
              )}
            </div>
            {notice && (
              <div className="admin-v2__inline-notice" role="status">
                <button aria-label="Dismiss" onClick={() => setNotice("")}>
                  <X size={12} />
                </button>
                {notice}
              </div>
            )}
          </aside>
        )}
      </div>
      {(drawer === "add" || drawer === "edit") && (
        <Drawer
          title={drawer === "add" ? "Add student" : "Edit student"}
          subtitle={
            drawer === "add"
              ? "Create an OTP-ready account profile"
              : "Update identity and academic placement"
          }
          onClose={() => {
            setStudentFormError("");
            setDrawer(null);
          }}
          footer={
            <FormActions>
              <button
                className="admin-v2__button"
                onClick={() => setDrawer(null)}
              >
                Cancel
              </button>
              <button
                className="admin-v2__button is-primary"
                type="submit"
                form="shared-student-form"
                disabled={mutationPending || studentPlacementOptionsLoading || !!studentPlacementOptionsError || (drawer === "edit" && (!remoteDetail || remoteDetail.id !== selected?.id || detailLoading || !!detailError))}
              >
                {drawer === "add" ? "Create Student" : "Save changes"}
              </button>
            </FormActions>
          }
        >
          <StudentForm
            brand={selected?.brand ?? (brand === "all" ? undefined : brand)}
            brandOptions={studentBrandOptions}
            institutions={studentInstitutionOptions}
            optionsLoading={studentPlacementOptionsLoading}
            optionsError={studentPlacementOptionsError || undefined}
            mode={drawer === "edit" ? "edit" : "create"}
            errorMessage={studentFormError}
            initial={
              drawer === "edit" && selected
                ? {
                    fullName: selected.fullName,
                    accountIdentifier: selected.accountIdentifier,
                    brand: selected.brand,
                    institution: selected.institution,
                    academicInstitutionId: selected.academicInstitutionId ?? undefined,
                    academicLevel: selected.academicLevel,
                    academicLevelId: selected.academicLevelId ?? undefined,
                    semester: selected.semester,
                    academicSemesterId: selected.academicSemesterId ?? undefined,
                    program: selected.program,
                  }
                : undefined
            }
            onSubmit={saveStudent}
          />
        </Drawer>
      )}
      {drawer === "grant" && selected && (
        <Drawer
          title="Assign course access"
          subtitle={`Choose eligible courses for ${selected.fullName}`}
          onClose={() => setDrawer(null)}
          footer={
            <FormActions>
              <button
                className="admin-v2__button"
                onClick={() => setDrawer(null)}
              >
                Cancel
              </button>
              <button
                className="admin-v2__button is-primary"
                form="course-grant-form"
                type="submit"
                disabled={!grantCourseIds.length}
              >
                Assign selected
              </button>
            </FormActions>
          }
        >
          <form
            id="course-grant-form"
            className="admin-v2__picker-list"
            onSubmit={saveCourseGrants}
          >
            {data.courses
              .filter(
                (course) =>
                  course.brand === selected.brand &&
                  course.status !== "Archived" &&
                  !enrollmentFor(data, selected.id, course.id) &&
                  (course.scope === "Standalone" ||
                    courseLevel(data, course) === selected.academicLevel) &&
                  courseMatchesStudentPlacement(data, course, selected),
              )
              .map((course) => (
                <label key={course.id}>
                  <input
                    type="checkbox"
                    name="courses"
                    value={course.id}
                    checked={grantCourseIds.includes(course.id)}
                    onChange={() =>
                      setGrantCourseIds((current) =>
                        current.includes(course.id)
                          ? current.filter((id) => id !== course.id)
                          : [...current, course.id],
                      )
                    }
                  />
                  <span>
                    <strong>{course.title}</strong>
                    <small>
                      {brandLabel(course.brand)} ·{" "}
                      {courseUnitLabel(data, course)} ·{" "}
                      {courseLevel(data, course)}
                    </small>
                  </span>
                </label>
              ))}
            {!data.courses.some(
              (course) =>
                course.brand === selected.brand &&
                course.status !== "Archived" &&
                !enrollmentFor(data, selected.id, course.id) &&
                (course.scope === "Standalone" ||
                  courseLevel(data, course) === selected.academicLevel) &&
                courseMatchesStudentPlacement(data, course, selected),
            ) && (
              <p className="admin-v2__empty-inline">
                No eligible courses match this Student's brand, institution, and
                academic level.
              </p>
            )}
          </form>
        </Drawer>
      )}
      {drawer === "device" && selected && slotCategory && (
        <Drawer
          title={targetDevice ? "Replace device" : "Register device"}
          subtitle="One mobile device and one additional device are permitted."
          onClose={() => {
            setDrawer(null);
            setTargetDevice("");
          }}
          footer={
            <FormActions>
              <button
                className="admin-v2__button"
                onClick={() => setDrawer(null)}
              >
                Cancel
              </button>
              <button
                className="admin-v2__button is-primary"
                form="device-form"
                type="submit"
              >
                {targetDevice ? "Replace device" : "Register device"}
              </button>
            </FormActions>
          }
        >
          <form
            id="device-form"
            className="admin-v2__form"
            onSubmit={saveDevice}
          >
            <FormField label="Device name" wide>
              <input name="name" required placeholder="e.g. iPhone 15" />
            </FormField>
            <FormField label="Device type">
              <select name="type">
                {(slotCategory === "Mobile"
                  ? ["Phone"]
                  : ["PC / laptop", "Tablet"]
                ).map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Slot">
              <input readOnly value={slotCategory} />
            </FormField>
            <FormField label="Platform / OS">
              <input name="platform" placeholder="e.g. iOS 18" />
            </FormField>
            <FormField label="Browser">
              <input name="browser" placeholder="e.g. Safari" />
            </FormField>
          </form>
        </Drawer>
      )}
      {createdStudent && (
        <Drawer
          title="Student created"
          subtitle="Backend-provisioned account · setup code shown once"
          onClose={() => setCreatedStudent(null)}
          footer={
            <FormActions>
              <button
                className="admin-v2__button"
                onClick={() => setCreatedStudent(null)}
              >
                Done
              </button>
              <button
                className="admin-v2__button is-primary"
                onClick={() => {
                  const studentId = createdStudent.student.id;
                  setCreatedStudent(null);
                  createPurchase(studentId);
                }}
              >
                Continue to purchase
              </button>
            </FormActions>
          }
        >
          <div className="admin-v2__credential-success">
            <span>
              <UserRound size={18} />
            </span>
            <h3>{createdStudent.student.fullName}</h3>
            <p>
              Give these one-time credentials to the Student through an approved
              secure channel. The setup code is not retrievable after this
              notice closes.
            </p>
            <Credential
              label="Account identifier"
              value={createdStudent.student.accountIdentifier}
              onCopy={copyText}
            />
            <Credential
              label="Temporary setup code"
              value={createdStudent.setupCode}
              onCopy={copyText}
            />
            <Credential
              label="Setup code expires"
              value={new Date(createdStudent.setupExpiresAt).toLocaleString()}
            />
          </div>
        </Drawer>
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          detail={confirm.detail}
          confirmLabel={confirm.confirmLabel}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.action}
        />
      )}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
  progress,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  note: string;
  progress: number;
}) {
  return (
    <article className="admin-v2__student-stat">
      <span>
        <Icon size={19} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{note}</em>
        <i className="admin-v2__student-stat-track" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </i>
      </div>
    </article>
  );
}
function StudentStatus({ status }: { status: StudentRecord["status"] }) {
  return <StatusBadge status={status} />;
}
function brandLabel(brand: BrandCode) {
  return brand === "medway" ? "Medway" : brand === "elite" ? "Elite" : "Nexus";
}
function Credential({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: (value: string) => void;
}) {
  return (
    <div className="admin-v2__credential">
      <small>{label}</small>
      <code>{value}</code>
      {onCopy && (
        <button
          type="button"
          aria-label={`Copy ${label}`}
          onClick={() => onCopy(value)}
        >
          <Copy size={14} />
        </button>
      )}
    </div>
  );
}
