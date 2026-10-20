import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upcoming } from "../Upcoming/Upcoming";
import { getStudentProtectedMedia, type StudentCourseItem, type StudentLessonItem } from "../../api/studentCoursesApi";
import type { UpcomingItem } from "../Upcoming/upcoming.types";

export function SessionContentCard({course, lesson, number, loading, error}: {course?: StudentCourseItem; lesson?: StudentLessonItem | null; number?: number; loading: boolean; error: boolean}) {
  const navigate = useNavigate();
  const [openError,setOpenError] = useState<string | null>(null);
  useEffect(() => {setOpenError(null);},[lesson?.lessonId]);
  const content = lesson?.learningItems ?? [];
  const items: UpcomingItem[] = content.map(item => ({id:item.id,title:item.title,time:`${item.kind.toUpperCase()} · ${item.state.replaceAll("_"," ")}`,tag:item.kind,iconType:item.kind}));
  const open = async (item: UpcomingItem) => {
    setOpenError(null);
    const source = content.find(entry => entry.id === item.id);
    if (!source || !course || !lesson) return;
    if (!source.available) {setOpenError("This material has not been released yet.");return;}
    if (source.kind === "assignment") {navigate(`/assignments/${source.id}`);return;}
    if (source.kind === "exam" || source.kind === "quiz") {navigate(`/assessments/${source.id}`);return;}
    if (source.kind === "video") {navigate(`/my-courses/${course.courseId}/lessons/${lesson.lessonId}`);return;}
    if (source.assetId) {
      try {const result = await getStudentProtectedMedia({assetId:source.assetId});window.open(result.delivery.url,"_blank","noopener,noreferrer");}
      catch {setOpenError("This file could not be opened. Please try again.");}
    }
  };
  return <Upcoming title={lesson ? `Session ${number} contents` : "Session contents"} items={items} count={items.length}
    loading={loading} errorMessage={openError ?? (error ? "Session contents could not be loaded." : undefined)}
    emptyMessage={lesson ? "No materials, assignments or exams are attached to this session yet." : "Session contents will appear when your module's lessons are published."}
    actionLabel={lesson?.playbackAvailable && course?.access.canOpen ? "Open session" : "View module"} onOpenItem={item => void open(item)}
    onViewCalendar={() => {if(course) navigate(lesson?.playbackAvailable && course.access.canOpen ? `/my-courses/${course.courseId}/lessons/${lesson.lessonId}` : `/my-courses/${course.courseId}`);}} />;
}
