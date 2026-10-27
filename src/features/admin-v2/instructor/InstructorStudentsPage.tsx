import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Badge, Button, Card, Group, Modal, Select, SimpleGrid, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { AlertCircle, BookOpen, Copy, KeyRound, Plus, Search, UserRound, UserX } from "lucide-react";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { cancelInstructorStudent, createInstructorStudent, listInstructorStudents, type InstructorStudentCredentials, type InstructorStudentRecord } from "../api/instructorWorkspaceApi";
import { extractApiErrorMessage } from "../../../app/api/client";
import { Link } from "react-router-dom";

const statusColor = (status: InstructorStudentRecord["status"]) => status === "active" ? "green" : status === "pending" ? "yellow" : "red";

export function InstructorStudentsPage() {
  const { workspace } = useAdminV2();
  const queryClient = useQueryClient();
  const courses = workspace.courses.filter((course) => course.status !== "archived");
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [credentials, setCredentials] = useState<InstructorStudentCredentials | null>(null);
  const [cancelStudent, setCancelStudent] = useState<InstructorStudentRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [formError, setFormError] = useState("");
  const students = useQuery({ queryKey: ["instructor", "students", search], queryFn: () => listInstructorStudents(search) });
  const create = useMutation({
    mutationFn: createInstructorStudent,
    onSuccess: (result) => {
      setCredentials(result);
      setFullName(""); setPhone(""); setFormError("");
      void queryClient.invalidateQueries({ queryKey: ["instructor", "students"] });
    },
    onError: (error) => setFormError(extractApiErrorMessage(error, "The student account could not be created.")),
  });
  const cancel = useMutation({
    mutationFn: ({ studentId, reason }: { studentId: string; reason: string }) => cancelInstructorStudent(studentId, reason),
    onSuccess: () => { setCancelStudent(null); setCancelReason(""); void queryClient.invalidateQueries({ queryKey: ["instructor", "students"] }); },
  });
  const rows = useMemo(() => students.data ?? [], [students.data]);
  const submit = () => {
    if (!courseId || !fullName.trim()) { setFormError("Choose an assigned course and enter the student's name."); return; }
    create.mutate({ courseId, fullName: fullName.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) });
  };

  return <section className="admin-v2__page admin-v2__instructor-students" aria-label="Instructor student management">
    <Group justify="space-between" align="flex-end" wrap="wrap" mb="md">
      <div><Badge color="green" variant="light" mb={6}>COURSE STUDENTS</Badge><Title order={1}>Students</Title><Text c="dimmed" size="sm" mt={4}>Create student accounts for your assigned courses and manage accounts you created.</Text></div>
      <Button data-instructor-guide-target="students-purchases" component={Link} to="/admin/instructor/subscriptions" leftSection={<BookOpen size={16} />} variant="light" color="green">View purchase requests</Button>
    </Group>

    <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
      <Card data-instructor-guide-target="students-create" withBorder shadow="xs" radius="md" p="md" className="admin-v2__instructor-student-create">
        <Group gap="xs" mb="sm"><UserRound size={18} color="var(--mantine-color-green-7)" /><Title order={3}>Create student account</Title></Group>
        <Text size="xs" c="dimmed" mb="md">The course determines the student's Brand and academic placement. Account access remains pending until the Super Admin approves payment.</Text>
        <Stack gap="sm">
          {formError && <Alert color="red" icon={<AlertCircle size={16} />} p="sm">{formError}</Alert>}
          <Select label="Assigned course" placeholder="Choose a course" data={courses.map((course) => ({ value: course.id, label: `${course.title} · ${course.code}` }))} value={courseId || null} onChange={(value) => setCourseId(value ?? "")} searchable nothingFoundMessage="No assigned courses" />
          <TextInput label="Student full name" placeholder="Enter the student's name" value={fullName} onChange={(event) => setFullName(event.currentTarget.value)} maxLength={160} />
          <TextInput label="Phone (optional)" placeholder="+20…" value={phone} onChange={(event) => setPhone(event.currentTarget.value)} maxLength={32} />
          <Button leftSection={<Plus size={16} />} color="green" onClick={submit} loading={create.isPending} disabled={!courses.length}>Create student</Button>
          {!courses.length && <Alert color="yellow" variant="light">A Super Admin needs to assign a course before you can create a student account.</Alert>}
        </Stack>
      </Card>

      <Card data-instructor-guide-target="students-roster" withBorder shadow="xs" radius="md" p="md" className="admin-v2__instructor-student-roster">
        <Group justify="space-between" align="center" mb="md" wrap="wrap"><div><Title order={3}>Your course students</Title><Text size="xs" c="dimmed" mt={3}>Only students connected to your assigned courses or created by you are listed.</Text></div><TextInput data-instructor-guide-target="students-search" leftSection={<Search size={15} />} placeholder="Search students" value={search} onChange={(event) => setSearch(event.currentTarget.value)} /></Group>
        {students.isError && <Alert color="red" icon={<AlertCircle size={16} />} title="Students could not be loaded" mb="sm"><Button size="xs" variant="light" onClick={() => void students.refetch()}>Try again</Button></Alert>}
        {students.isLoading ? <Text c="dimmed" py="xl" ta="center">Loading course students…</Text> : !rows.length ? <Stack align="center" gap="xs" py="xl"><UserRound size={25} color="var(--mantine-color-green-7)" /><Text fw={650}>No students in your course workspace yet</Text><Text size="sm" c="dimmed" ta="center">Create the first account here. It will stay pending until payment review is complete.</Text></Stack> : <Table.ScrollContainer minWidth={660}><Table verticalSpacing="sm" highlightOnHover><Table.Thead><Table.Tr><Table.Th>Student</Table.Th><Table.Th>Academic placement</Table.Th><Table.Th>Course access</Table.Th><Table.Th>Status</Table.Th><Table.Th /></Table.Tr></Table.Thead><Table.Tbody>{rows.map((student) => <Table.Tr key={student.id}><Table.Td><Text fw={650} size="sm">{student.displayName ?? "Student"}</Text><Text size="xs" c="dimmed">{student.createdByInstructor ? "Created by you" : "Assigned course student"}</Text></Table.Td><Table.Td><Text size="xs">{student.academicInstitution ?? "—"} · {student.academicLevel ?? "—"} · {student.academicSemester ?? "—"}</Text></Table.Td><Table.Td><Text size="xs" lineClamp={2}>{student.courseTitles.join(", ") || "No active course link yet"}</Text></Table.Td><Table.Td><Badge color={statusColor(student.status)} variant="light">{student.status.replace("_", " ")}</Badge></Table.Td><Table.Td>{student.createdByInstructor && student.status !== "disabled" && <Button size="xs" variant="subtle" color="red" leftSection={<UserX size={14} />} onClick={() => { setCancelStudent(student); setCancelReason(""); cancel.reset(); }}>Cancel</Button>}</Table.Td></Table.Tr>)}</Table.Tbody></Table></Table.ScrollContainer>}
      </Card>
    </SimpleGrid>

    <Modal opened={Boolean(credentials)} onClose={() => setCredentials(null)} title="Student account created" centered>
      {credentials && <Stack gap="sm"><Alert color="green" title="Save these setup details" icon={<KeyRound size={16} />}>The setup code is shown once. Share it securely with the student. The account remains pending until payment approval.</Alert><TextInput label="Account identifier" value={credentials.accountIdentifier} readOnly rightSection={<Button variant="subtle" size="compact-xs" onClick={() => void navigator.clipboard?.writeText(credentials.accountIdentifier)} aria-label="Copy account identifier"><Copy size={14} /></Button>} /><TextInput label="One-time setup code" value={credentials.setupCode} readOnly rightSection={<Button variant="subtle" size="compact-xs" onClick={() => void navigator.clipboard?.writeText(credentials.setupCode)} aria-label="Copy setup code"><Copy size={14} /></Button>} /><Text size="xs" c="dimmed">Expires {new Date(credentials.setupExpiresAt).toLocaleString()}.</Text><Button component={Link} to={`/admin/instructor/subscriptions?startPurchase=1&purchaseStudent=${encodeURIComponent(credentials.studentProfileId)}`} color="green" onClick={() => setCredentials(null)}>Continue to subscription purchase</Button></Stack>}
    </Modal>

    <Modal opened={Boolean(cancelStudent)} onClose={() => setCancelStudent(null)} title="Cancel student account?" centered>
      {cancelStudent && <Stack>{cancel.isError && <Alert color="red" icon={<AlertCircle size={16} />}>{extractApiErrorMessage(cancel.error, "The student account could not be cancelled.")}</Alert>}<Alert color="yellow" variant="light">This revokes this student's Brand access and ends active sessions. If a payment request is under review or the student has an active Subscription, the Super Admin must resolve it first. Records are retained for audit.</Alert><Text fw={600}>{cancelStudent.displayName}</Text><TextInput label="Reason" placeholder="Required for the audit record" value={cancelReason} onChange={(event) => setCancelReason(event.currentTarget.value)} maxLength={500} /><Group justify="flex-end"><Button variant="default" onClick={() => setCancelStudent(null)}>Keep account</Button><Button color="red" leftSection={<UserX size={15} />} loading={cancel.isPending} disabled={!cancelReason.trim()} onClick={() => cancel.mutate({ studentId: cancelStudent.id, reason: cancelReason.trim() })}>Cancel account</Button></Group></Stack>}
    </Modal>
  </section>;
}

export default InstructorStudentsPage;
