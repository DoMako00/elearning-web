import { useQuery } from "@tanstack/react-query";
import { InstructorProfile } from "../../../features/instructor";
import { studentInstructorApi } from "../api/studentInstructorApi";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useParams } from "react-router-dom";
import type { InstructorProfile as InstructorProfileDto } from "../../../types/instructor";

export function InstructorProfilePage() {
  const auth=useAuth();
  const {instructorId}=useParams();
  const query=useQuery({queryKey:["student","instructors"],queryFn:({signal})=>studentInstructorApi.list(signal),enabled:auth.status==="authenticated"});
  if(query.isLoading)return <div className="p-6 text-sm text-slate-500" role="status">Loading instructor directory…</div>;
  if(query.error)return <div className="p-6 text-sm text-rose-700" role="alert">{query.error instanceof Error?query.error.message:"Instructor directory could not be loaded."}</div>;
  const instructors=query.data??[];
  const found=instructorId?instructors.find(value=>value.id===instructorId):instructors[0];
  if(!found)return <div className="p-6 text-sm text-slate-500">No instructor is currently assigned to your published courses.</div>;
  const profile:InstructorProfileDto={id:found.id,name:found.displayName,title:"Assigned to your courses",department:"",institution:"",yearsOfExperience:"",medicalSpecialization:"",location:"",email:found.publicEmail??"",phone:"",officeLocation:"",officeHours:"",bioSummary:"",detailedBio:"",inspirationalQuote:"",joinDate:"",linkedin:"",avatarUrl:"",bannerArtworkUrl:"",isVerified:false,specialties:found.specialties??[],stats:{coursesTaught:found.courses.length,studentsMentored:null,publishedResources:null,averageRating:null,yearsTeaching:"—",responseRate:null,studentCompletion:null},schedule:[],coursesTaught:found.courses.map(course=>({id:course.courseId,title:course.title,category:course.code,studentsCount:null,progressPercentage:null,imageSrc:"",route:"/my-courses"})),reviews:[],achievements:[],publications:[]};
  return <InstructorProfile key={profile.id} initialProfile={profile} isSelf={false} />;
}

export default InstructorProfilePage;
