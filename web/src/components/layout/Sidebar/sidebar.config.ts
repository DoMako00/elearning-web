import {
  // BadgeCheck,
  LibraryBig,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  Compass,
  Home,
  MessageSquare,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface SidebarItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  enabled: boolean;
}

export interface SidebarProfile {
  name: string;
  role: string;
  initials: string;
}

export const primarySidebarItems: SidebarItem[] = [
  { label: "Home", icon: Home, href: "/", enabled: true },
  { label: "My Courses", icon: LibraryBig, href: "/my-courses", enabled: true },
  { label: "Explore", icon: Compass, href: "/explore", enabled: true },
  { label: "Calendar", icon: CalendarDays, href: "/calendar", enabled: true },
  {
    label: "Assignments",
    icon: ClipboardCheck,
    href: "/assignments",
    enabled: true,
  },
  // {
  //   label: "Certificates",
  //   icon: BadgeCheck,
  //   href: "/certificates",
  //   enabled: false,
  // },
  {
    label: "Messages",
    icon: MessageSquare,
    href: "/messages",
    badge: 3,
    enabled: true,
  },
  { label: "Community", icon: UsersRound, href: "/community", enabled: false },
];

export const secondarySidebarItems: SidebarItem[] = [
  { label: "Settings", icon: Settings, href: "/settings", enabled: false },
  { label: "Help Center", icon: CircleHelp, href: "/help", enabled: false },
];

export const sidebarProfile: SidebarProfile = {
  name: "Juliana",
  role: "Student",
  initials: "J",
};
