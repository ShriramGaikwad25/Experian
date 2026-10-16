import {
  Bell,
  Bot,
  CalendarClock,
  ClipboardCheck,
  Clock,
  FileText,
  House,
  Inbox,
  KeyRound,
  Library,
  List,
  Plug,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  subItems?: NavItem[];
  /** Show β next to the label (e.g. pre-release features) */
  beta?: boolean;
}

export const navLinks: NavItem[] = [
  {
    name: "Home",
    href: "/",
    icon: House,
  },
  {
    name: "Events",
    href: "/assurance-events/all-events",
    icon: Inbox,
    subItems: [
      { name: "All Events", href: "/assurance-events/all-events", icon: List },
    ],
  },
  {
    name: "Agent Studio",
    href: "/assurance-events/event-definitions",
    icon: Bot,
    subItems: [
      { name: "Event Definitions", href: "/assurance-events/event-definitions", icon: FileText },
      { name: "Control Library", href: "/assurance-events/control-library", icon: Library },
      { name: "Review Forms", href: "/assurance-events/review-forms", icon: ClipboardCheck },
      { name: "Studio Configuration", href: "/assurance-events/studio-configuration", icon: SlidersHorizontal },
    ],
  },
  {
    name: "Integrations",
    href: "/assurance-events/datalake/entitlements",
    icon: Plug,
    subItems: [
      { name: "Datalake Entitlements", href: "/assurance-events/datalake/entitlements", icon: KeyRound },
    ],
  },
  {
    name: "Administration",
    href: "/assurance-events/sla",
    icon: ShieldCheck,
    subItems: [
      { name: "SLA", href: "/assurance-events/sla", icon: Clock },
      { name: "Notifications", href: "/assurance-events/notifications", icon: Bell },
      { name: "Scheduler", href: "/assurance-events/scheduler", icon: CalendarClock },
    ],
  },
];
