"use client";
import { withBasePath } from "@/lib/basePath";
import { useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Dropdown from "./Dropdown";
import { navLinks, NavItem } from "./Navi";
import { useAuth } from "@/contexts/AuthContext";
import { getCookie, COOKIE_NAMES, getCurrentUser } from "@/lib/auth";
import { useLeftSidebar } from "@/contexts/LeftSidebarContext";

const flattenNavItems = (items: NavItem[]): NavItem[] =>
  items.flatMap((item) => [item, ...(item.subItems?.length ? flattenNavItems(item.subItems) : [])]);

/** Page title from the longest sidebar link matching the current path. */
const getHeadingFromNav = (currentPath: string): string | null => {
  const navPath = (href: string) => href.split("?")[0].split("#")[0];
  const candidates = flattenNavItems(navLinks).filter((item) => {
    if (!item.href || item.href === "/") return currentPath === "/";
    const h = navPath(item.href);
    return currentPath === h || currentPath.startsWith(`${h}/`);
  });
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.href.length - a.href.length)[0]?.name || null;
};

const getDisplayName = (email: string | undefined): string => {
  // Prefer authenticated user from context (set to userid at login)
  if (email) return email;
  // Fallback to cookie `uidTenant`
  try {
    const raw = getCookie(COOKIE_NAMES.UID_TENANT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.userid) return parsed.userid;
    }
  } catch {}
  return getCurrentUser()?.email || "IAM Admin";
};

const HeaderContent = () => {
  const pathname = usePathname();
  const router = useRouter();
  const closeUserMenuRef = useRef<(() => void) | null>(null);
  const { logout, user } = useAuth();
  const { isVisible, toggleSidebar } = useLeftSidebar();

  const navbarHeading = pathname ? getHeadingFromNav(pathname) : null;
  const displayName = getDisplayName(user?.email);
  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
  const avatarColor = `hsl(${(displayName.charCodeAt(0) * 137.508) % 360}, 70%, 50%)`;

  const handleUserDropdownCloseMenu = useCallback((closeFunc: () => void) => {
    closeUserMenuRef.current = closeFunc;
  }, []);

  const handleLogoutClick = () => {
    closeUserMenuRef.current?.();
    logout();
  };

  return (
    <div
      className="flex h-[60px] w-full items-center justify-between text-xs md:text-sm pl-0 pr-4"
      style={{ backgroundColor: '#27B973' }}
    >
      {/* Left Section */}
      <div className="flex items-center h-full -ml-3 flex-1">
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center px-3 py-3 mr-4 text-white hover:bg-white/10 rounded-md transition-colors"
          title={isVisible ? "Hide sidebar" : "Show sidebar"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform duration-200 h-5 w-5 flex-shrink-0"
          >
            <path
              d="M3 12H21M3 6H21M3 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Logo and Brand */}
        <div className="flex items-center gap-3 mr-8">
          <button
            onClick={() => router.push('/')}
            className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
            aria-label="Navigate to home"
          >
            <Image
              src={withBasePath("/kf-logo.svg")}
              alt=""
              width={32}
              height={32}
              priority
              className="flex-shrink-0 rounded-md ring-1 ring-white/30"
            />
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white">
              KeyForge
            </span>
          </button>
        </div>

        <div className="flex items-center justify-center flex-1 px-4">
          {navbarHeading && (
            <p className="text-lg font-semibold text-white">{navbarHeading}</p>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center h-full justify-end gap-2 px-3">
        <div className="flex items-center gap-3">
          <div
            className="rounded-full w-9 h-9 flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <span className="text-white font-medium text-[11px] md:text-xs max-w-[180px] truncate">
            {displayName}
          </span>
          <Dropdown
            Icon={() => (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            className="!p-0 !bg-transparent !border-0"
            title="User profile"
            onCloseMenu={handleUserDropdownCloseMenu}
          >
            <button
              onClick={handleLogoutClick}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              Logout
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default HeaderContent;
