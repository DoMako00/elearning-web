import type { RouteObject } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";

export const studentRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
  },
];
