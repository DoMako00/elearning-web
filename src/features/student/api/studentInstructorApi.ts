import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

export interface StudentInstructorDto {
  id: string;
  displayName: string;
  publicEmail: string | null;
  specialties: string[];
  courses: Array<{ courseId: string; title: string; code: string }>;
}

export const studentInstructorApi = {
  async list(signal?: AbortSignal): Promise<StudentInstructorDto[]> {
    const client = await requireApiClient();
    const result = await client.getJson<{ ok: true; data: StudentInstructorDto[] }>("/v1/student/instructors", { signal });
    if (result.error) throw new Error(extractApiErrorMessage(result.error, "Instructor directory could not be loaded."));
    if (!result.data) throw new Error("The Instructor API returned an incomplete response.");
    return result.data.data;
  },
};
