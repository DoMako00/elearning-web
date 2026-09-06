import { useCallback, useEffect, useState } from "react";
import {
  env,
  type DashboardEnrollmentState,
} from "../config/env";

export interface DashboardEnrollment {
  id: string;
}

export interface DashboardEnrollmentViewModel {
  status: DashboardEnrollmentState;
  enrolledCourses: DashboardEnrollment[];
}

const mockEnrolledCourses: DashboardEnrollment[] = [{ id: "advanced-ui-ux" }];

/**
 * Temporary adapter until the student enrollment endpoint is available.
 * Replace only this function with the real query while retaining the view model.
 */
function resolveDashboardEnrollment(): DashboardEnrollmentViewModel {
  const status = env.dashboardEnrollmentState ?? "empty";

  return {
    status,
    enrolledCourses: status === "enrolled" ? mockEnrolledCourses : [],
  };
}

export function useDashboardEnrollment() {
  const [viewModel, setViewModel] = useState<DashboardEnrollmentViewModel>({
    status: "loading",
    enrolledCourses: [],
  });

  const load = useCallback(() => {
    const nextViewModel = resolveDashboardEnrollment();

    if (nextViewModel.status === "loading") {
      setViewModel({ status: "loading", enrolledCourses: [] });
      return;
    }

    setViewModel(nextViewModel);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...viewModel, retry: load };
}
