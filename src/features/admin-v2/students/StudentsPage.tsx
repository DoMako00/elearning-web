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
import {
  enrollmentFor,
  getPlan,
  getStudentSubscription,
  studentAccessBlock,
} from "../data/adminV2.store";
import { StudentForm } from "./StudentForm";
import {
  courseLevel,
  courseMatchesStudentPlacement,
  courseUnitLabel,
} from "../data/adminV2.selectors";
import {
  createAdminStudent,
  getAdminStudent,
  listAdminStudents,
  resetAdminStudentClaim,
  setAdminStudentStatus,
  updateAdminStudent,
  type AdminStudentDetail,
  type AdminStudentListItem,
} from "../api/adminStudentsApi";

const PAGE_SIZE = 8;
type InspectorTab = "Profile" | "Access" | "Devices" | "Sessions";
const tabs: InspectorTab[] = ["Profile", "Access", "Devices", "Sessions"];

export function StudentsPage() {
  const { data: fixtureData, brand, globalSearch } = useAdminV2();
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
  const [selectedId, setSelectedId] = useState(
    searchParams.get("student") ?? "st-001",
  );
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mutationPending, setMutationPending] = useState(false);
  const mapStudent = (item: AdminStudentListItem): StudentRecord => ({
    id: item.id,
    accountIdentifier: "—",
    fullName: item.displayName ?? "Unnamed Student",
    email: item.emailMasked ?? "",
    phone: item.phoneMasked ?? "",
    brand: (item.platform?.platformCode === "medway" ||
    item.platform?.platformCode === "nexus"
      ? item.platform.platformCode
      : "elite") as BrandCode,
    institution: item.academicInstitution?.toLowerCase().includes("delta")
      ? "Delta"
      : "BUC",
    academicLevel: item.academicLevel ?? "—",
    semester: item.academicSemester ?? item.academicTermOrYear ?? "—",
    program: "",
    status:
      item.status === "suspended"
        ? "Suspended"
        : item.status === "active"
          ? "Active"
          : item.status === "disabled"
            ? "Inactive"
            : "Pending Payment",
    createdAt: "—",
    lastActivity: item.lastSeenAt
      ? new Date(item.lastSeenAt).toLocaleString()
      : "Never",
  });
  const reload = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await listAdminStudents({
        brand: brand === "all" ? undefined : brand,
        search: search || globalSearch || undefined,
        page: 1,
        pageSize: 100,
      });
      setRemoteRows(result.data.map(mapStudent));
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
  }, [brand, globalSearch, search]);
  useEffect(() => {
    if (!selectedId || !remoteRows.some((item) => item.id === selectedId))
      return;
    void getAdminStudent(selectedId, brand === "all" ? undefined : brand)
      .then(setRemoteDetail)
      .catch(() => setRemoteDetail(null));
  }, [selectedId, brand, remoteRows]);
  const data = useMemo(() => {
    const detail = remoteDetail;
    return {
      ...fixtureData,
      students: remoteRows,
      courses: [] as typeof fixtureData.courses,
      plans: [] as typeof fixtureData.plans,
      subscriptions: [] as typeof fixtureData.subscriptions,
      payments: [] as typeof fixtureData.payments,
      enrollments: [] as typeof fixtureData.enrollments,
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
        status: session.revokedAt ? ("Revoked" as const) : ("Active" as const),
      })),
    };
  }, [fixtureData, remoteRows, remoteDetail]);
  const query = (search || globalSearch).toLowerCase();
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
  const selectedEnrollments = selected
    ? data.enrollments.filter(
        (item) => item.studentId === selected.id && item.status === "Active",
      )
    : [];
  const subscription = selected
    ? getStudentSubscription(data, selected.id)
    : undefined;
  const plan = subscription ? getPlan(data, subscription.planId) : undefined;
  const blockedReason = selected
    ? studentAccessBlock(data, selected.id)
    : "Student record is unavailable.";
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
          studentCode: draft.accountIdentifier || null,
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
        academicInstitutionCode:
          draft.institution === "Delta" ? "delta" : "buc",
        academicLevelNumber:
          Number(draft.academicLevel.replace(/\D/g, "")) || 1,
        academicSemesterNumber: Number(draft.semester.replace(/\D/g, "")) || 1,
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
          fullName: draft.fullName,
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
      const result = await resetAdminStudentClaim(
        selected.id,
        "Setup credential reset by an authorized Admin.",
      );
      setCreatedStudent({
        student: { ...selected, accountIdentifier: result.accountIdentifier },
        setupCode: result.setupCode,
        setupExpiresAt: result.setupExpiresAt,
      });
      setNotice("A new setup credential has been issued.");
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
    if (subscription)
      navigate(`/admin/subscriptions?subscription=${subscription.id}`);
    else navigate("/admin/subscriptions");
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
  const thisMonth = data.students.filter(
    (student) =>
      student.createdAt ===
      new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
  ).length;
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
                onChange={(event) => {
                  setBrandFilter(event.target.value as "all" | BrandCode);
                  setPage(1);
                }}
              >
                <option value="all">All brands</option>
                <option value="medway">Medway</option>
                <option value="elite">Elite</option>
                <option value="nexus">Nexus</option>
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
                <option>BUC</option>
                <option>Delta</option>
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
                {Array.from(
                  { length: 12 },
                  (_, index) => `Semester ${index + 1}`,
                ).map((item) => (
                  <option key={item}>{item}</option>
                ))}
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
                const deviceCount = data.devices.filter(
                  (device) =>
                    device.studentId === student.id &&
                    device.status === "Active",
                ).length;
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
                        {deviceCount}/2
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
                      <button
                        disabled={mutationPending}
                        onClick={() => void resetClaim()}
                      >
                        <Copy size={14} /> Reset setup code
                      </button>
                      <button onClick={() => navigate("/student-preview")}>
                        <UserRound size={14} />
                        Sign-in preview
                      </button>
                    </div>
                  </InspectorSection>
                  <InspectorSection title="Activity summary">
                    <InspectorFields
                      fields={[
                        ["Last activity", selected.lastActivity],
                        [
                          "Active sessions",
                          selectedSessions.filter(
                            (session) => session.status === "Active",
                          ).length,
                        ],
                        ["Registered devices", `${activeDevices.length} / 2`],
                        [
                          "Accessible courses",
                          blockedReason ? 0 : selectedEnrollments.length,
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
                      <button
                        className="admin-v2__text-button"
                        onClick={openSubscription}
                      >
                        Open subscription
                      </button>
                    }
                  >
                    <InspectorFields
                      fields={[
                        ["Plan", plan?.name ?? "No plan"],
                        [
                          "Subscription state",
                          subscription ? (
                            <StatusBadge status={subscription.status} />
                          ) : (
                            <span className="admin-v2__not-subscribed">
                              Not subscribed
                            </span>
                          ),
                        ],
                        [
                          "Seat",
                          subscription
                            ? `${subscription.studentIds.indexOf(selected.id) + 1} of ${plan?.capacity ?? subscription.studentIds.length}`
                            : "—",
                        ],
                        ["Start", subscription?.startDate ?? "—"],
                        ["Expiry", subscription?.expiryDate ?? "—"],
                      ]}
                    />
                    {blockedReason && (
                      <p className="admin-v2__access-block">
                        <CircleAlert size={14} />
                        {blockedReason}
                      </p>
                    )}
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
                      {selectedEnrollments.map((enrollment) => {
                        const course = data.courses.find(
                          (item) => item.id === enrollment.courseId,
                        );
                        return (
                          <article key={enrollment.id}>
                            <BookOpen size={15} />
                            <div>
                              <strong>
                                {course?.title ?? "Course unavailable"}
                              </strong>
                              <small>
                                {course
                                  ? `${brandLabel(course.brand)} · ${courseUnitLabel(data, course)}`
                                  : "Enrollment record"}
                              </small>
                              <small>
                                Source: {enrollment.source} · Expires{" "}
                                {enrollment.expiryDate ?? "with subscription"}
                              </small>
                            </div>
                            <span
                              className={`admin-v2__access-state${blockedReason ? " is-blocked" : ""}`}
                            >
                              {blockedReason ? "Blocked" : enrollment.status}
                            </span>
                            <button
                              type="button"
                              disabled
                              title="Resolve access through the Subscription Seat workflow; Enrollment is not an authorization control."
                              aria-label={`Remove ${course?.title ?? "course"} access`}
                            >
                              <X size={14} />
                            </button>
                          </article>
                        );
                      })}
                      {!selectedEnrollments.length && (
                        <p className="admin-v2__empty-inline">
                          No course access assigned.
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
                      <strong>{activeDevices.length} of 2 slots used</strong>
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
                      {selectedDevices.map((device) => (
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
                      {!selectedDevices.length && (
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
                      {selectedSessions.map((session) => (
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
                      {!selectedSessions.length && (
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
              >
                {drawer === "add" ? "Create Student" : "Save changes"}
              </button>
            </FormActions>
          }
        >
          <StudentForm
            brand={selected?.brand ?? (brand === "all" ? "medway" : brand)}
            mode={drawer === "edit" ? "edit" : "create"}
            errorMessage={studentFormError}
            initial={
              drawer === "edit" && selected
                ? {
                    fullName: selected.fullName,
                    accountIdentifier: selected.accountIdentifier,
                    brand: selected.brand,
                    institution: selected.institution,
                    academicLevel: selected.academicLevel,
                    semester: selected.semester,
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
                className="admin-v2__button is-primary"
                onClick={() => setCreatedStudent(null)}
              >
                Done
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
