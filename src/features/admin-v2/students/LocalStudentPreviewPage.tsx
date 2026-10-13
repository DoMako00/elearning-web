import { useState } from "react";
import { ArrowLeft, BookOpen, LogOut, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminV2Store, studentAccessBlock } from "../data/adminV2.store";
import { StatusBadge } from "../shared/AdminV2Primitives";
import type { StudentRecord } from "../types/adminV2.types";
import { courseUnitLabel } from "../data/adminV2.selectors";

export function LocalStudentPreviewPage() {
  const data = useAdminV2Store(); const [identifier, setIdentifier] = useState(""); const [code, setCode] = useState(""); const [student, setStudent] = useState<StudentRecord | null>(null); const [error, setError] = useState("");
  const signIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const loginValue = identifier.trim().toLowerCase();
    const match = data.students.find((item) => [item.email, item.accountIdentifier].some((value) => value?.toLowerCase() === loginValue) && item.setupCode === code.trim());
    if (!match) { setError("Email / identifier or setup code was not found in this local preview."); return; }
    setStudent(match); setError("");
  };
  if (student) {
    const current = data.students.find((item) => item.id === student.id) ?? student;
    const block = studentAccessBlock(data, current.id);
    const courses = data.enrollments.filter((item) => item.studentId === current.id && item.status === "Active" && !block).map((item) => data.courses.find((course) => course.id === item.courseId)).filter((item) => !!item);
    return <main className="admin-v2__student-preview"><header><span><BookOpen size={19} /> GreenLearn Student Preview</span><button onClick={() => setStudent(null)}><LogOut size={15} /> Sign out</button></header><section className="admin-v2__student-preview-body"><div className="admin-v2__preview-heading"><div><small>LOCAL ACCOUNT PREVIEW</small><h1>Welcome, {current.fullName}</h1><p>{current.accountIdentifier} · {current.academicLevel} · {current.semester}</p></div><StatusBadge status={current.status} /></div><div className="admin-v2__preview-card"><h2>Course access</h2>{block ? <p className="admin-v2__access-block"><ShieldCheck size={16} />{block}</p> : courses.length ? <div className="admin-v2__preview-courses">{courses.map((course) => <article key={course.id}><BookOpen size={17} /><div><strong>{course.title}</strong><small>{courseUnitLabel(data, course)} · {course.brand === "medway" ? "Medway" : course.brand === "elite" ? "Elite" : "Nexus"}</small></div></article>)}</div> : <p>No courses have been assigned to this account yet.</p>}</div><p className="admin-v2__preview-boundary">Frontend-only preview. This is not production authentication.</p></section></main>;
  }
  return <main className="admin-v2__student-preview"><header><span><BookOpen size={19} /> GreenLearn Student Preview</span><Link to="/admin/students"><ArrowLeft size={15} /> Back to Admin</Link></header><section className="admin-v2__signin-card"><div className="admin-v2__preview-logo"><BookOpen size={21} /></div><small>LOCAL ACCOUNT PREVIEW</small><h1>Student sign in</h1><p>Use the Gmail address and setup code created in this browser's Admin preview.</p><form onSubmit={signIn}><label>Gmail / email address<input type="email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required autoComplete="email" placeholder="student@gmail.com" /></label><label>Temporary setup code<input value={code} onChange={(event) => setCode(event.target.value)} required autoComplete="one-time-code" /></label>{error && <p role="alert">{error}</p>}<button type="submit">Preview Student account</button></form><p className="admin-v2__preview-boundary">Demo-only frontend sign-in. Backend OTP delivery is not connected yet.</p></section></main>;
}
