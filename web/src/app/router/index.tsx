import { createBrowserRouter } from "react-router-dom";
import { adminRoutes } from "./admin.routes";
import { publicRoutes } from "./public.routes";
import { studentRoutes } from "./student.routes";

export const router = createBrowserRouter([
  ...publicRoutes,
  ...studentRoutes,
  ...adminRoutes,
]);
