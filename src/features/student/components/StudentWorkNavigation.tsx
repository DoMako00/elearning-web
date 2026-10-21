import { NavLink } from "react-router-dom";
import "./StudentWorkNavigation.css";

export function StudentWorkNavigation() {
  return (
    <nav className="student-work-navigation" aria-label="Learning work">
      <NavLink
        to="/assignments"
        className={({ isActive }) => `student-work-navigation__link${isActive ? " is-active" : ""}`}
      >
        Assignments
      </NavLink>
      <NavLink
        to="/assessments"
        className={({ isActive }) => `student-work-navigation__link${isActive ? " is-active" : ""}`}
      >
        Assessments
      </NavLink>
    </nav>
  );
}
