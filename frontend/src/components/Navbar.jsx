import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  BriefcaseBusiness,
  UserCheck,
  LogOut,
  ChevronDown,
  Shield,
  Layers,
  Menu as MenuIcon,
  Radio,
  Sun,
  Moon,
} from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "./ui/Menu";
import { Button } from "./ui/Button";

export function Navbar() {
  const { role, user, isAuthenticated, logout, switchPersona, demoMode, setDemoMode } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { name: "Courses", path: "/courses", icon: GraduationCap },
        { name: "Skills", path: "/skills", icon: Award },
      ];
    }

    if (role === "ADMIN" || role === "COURSE_PROVIDER") {
      return [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Trainees", path: "/trainees", icon: Users },
        { name: "Courses & Providers", path: "/courses", icon: GraduationCap },
        { name: "Skills", path: "/skills", icon: Award },
        { name: "Employment", path: "/employment", icon: BriefcaseBusiness },
      ];
    }

    return [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "My Profile", path: "/me", icon: UserCheck },
      { name: "Courses & Providers", path: "/courses", icon: GraduationCap },
      { name: "Skills", path: "/skills", icon: Award },
      { name: "My Employment", path: "/me?tab=employment", icon: BriefcaseBusiness },
    ];
  };

  const navLinks = getNavLinks();

  const isNavItemActive = (itemPath) => {
    const [targetPath, targetQuery] = itemPath.split("?");
    if (targetQuery) {
      const targetTab = new URLSearchParams(targetQuery).get("tab");
      const currentTab = new URLSearchParams(location.search).get("tab");
      return location.pathname === targetPath && currentTab === targetTab;
    }
    if (targetPath === "/me") {
      const currentTab = new URLSearchParams(location.search).get("tab");
      return location.pathname === "/me" && currentTab !== "employment";
    }
    return (
      location.pathname === targetPath ||
      (targetPath !== "/dashboard" && location.pathname.startsWith(`${targetPath}/`))
    );
  };

  const roleBadgeConfig = {
    ADMIN: { label: "Admin", variant: "dark" },
    COURSE_PROVIDER: { label: "Course Provider", variant: "neutral" },
    TRAINEE: { label: "Trainee", variant: "outline" },
  };

  const currentRoleBadge = roleBadgeConfig[role] || {
    label: "Guest",
    variant: "outline",
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      {import.meta.env.DEV && demoMode && (
        <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 px-4 py-1.5 text-xs flex items-center justify-between gap-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mx-auto truncate">
            <Radio size={13} className="text-gray-300 shrink-0" />
            <span className="truncate">
              <strong className="font-medium text-white">Demo Mode Active</strong> — Using
              in-browser MSW mock handlers for UI preview.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDemoMode(false)}
            className="text-gray-300 hover:text-white underline text-[11px] shrink-0 cursor-pointer"
          >
            Disable Demo Mode
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="text-sm font-semibold text-gray-900 dark:text-gray-50 shrink-0">
              SkillTrack
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                      active
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/70 dark:hover:text-gray-50"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:outline-gray-100"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Mobile Navigation Menu */}
            <div className="md:hidden">
              <Menu>
                <MenuTrigger
                  render={(props) => (
                    <button
                      {...props}
                      type="button"
                      aria-label="Open navigation menu"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 outline-none focus-visible:outline-2 focus-visible:outline-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:outline-gray-100"
                    >
                      <MenuIcon size={16} />
                    </button>
                  )}
                />
                <MenuContent align="end">
                  {navLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <MenuItem key={item.path} onClick={() => navigate(item.path)}>
                        <Icon size={14} />
                        <span>{item.name}</span>
                      </MenuItem>
                    );
                  })}
                </MenuContent>
              </Menu>
            </div>

            {/* Dev Role Switcher */}
            {import.meta.env.DEV && (
              <Menu>
                <MenuTrigger
                  render={(props) => (
                    <button
                      {...props}
                      type="button"
                      className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-gray-900 dark:bg-gray-950 dark:hover:bg-gray-800 dark:text-gray-300 dark:border-gray-800 dark:focus-visible:outline-gray-100"
                      title="Dev-only Role Switcher"
                    >
                      <span className="text-gray-500 dark:text-gray-400">Dev:</span>
                      <span className="text-gray-900 dark:text-gray-50">{currentRoleBadge.label}</span>
                      <ChevronDown size={13} className="text-gray-400 dark:text-gray-500" />
                    </button>
                  )}
                />
                <MenuContent align="end">
                  <div className="px-2.5 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dev Persona Switcher
                  </div>
                  <MenuItem
                    onClick={() => {
                      switchPersona("ADMIN");
                      navigate("/dashboard");
                    }}
                  >
                    <Shield size={14} />
                    <span>Administrator</span>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      switchPersona("COURSE_PROVIDER");
                      navigate("/dashboard");
                    }}
                  >
                    <Layers size={14} />
                    <span>Course Provider (Apex)</span>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      switchPersona("TRAINEE");
                      navigate("/dashboard");
                    }}
                  >
                    <UserCheck size={14} />
                    <span>Trainee (Aarav Sharma)</span>
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem onClick={() => setDemoMode(!demoMode)}>
                    <Radio size={14} />
                    <span>{demoMode ? "Disable Demo Mode" : "Enable Demo Mode"}</span>
                  </MenuItem>
                </MenuContent>
              </Menu>
            )}

            {isAuthenticated ? (
              <Menu>
                <MenuTrigger
                  render={(props) => (
                    <button
                      {...props}
                      type="button"
                      className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-gray-900 dark:focus-visible:outline-gray-100"
                    >
                      <Avatar fallback={user?.name || "User"} size="sm" />
                      <div className="hidden lg:block text-left text-xs">
                        <p className="font-medium text-gray-900 dark:text-gray-50 leading-tight">
                          {user?.name || "Account"}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                          {currentRoleBadge.label}
                        </p>
                      </div>
                      <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 hidden lg:block" />
                    </button>
                  )}
                />
                <MenuContent align="end">
                  <div className="px-2.5 py-1.5 border-b border-gray-200 dark:border-gray-800 mb-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-50 truncate">{user?.name}</p>
                      <Badge variant={currentRoleBadge.variant}>{currentRoleBadge.label}</Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <MenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard size={14} /> Dashboard
                  </MenuItem>
                  {role === "TRAINEE" && (
                    <MenuItem onClick={() => navigate("/me")}>
                      <UserCheck size={14} /> My Profile & Courses
                    </MenuItem>
                  )}
                  {role === "COURSE_PROVIDER" && (
                    <MenuItem onClick={() => navigate(`/providers/${user?.id || 1}`)}>
                      <Layers size={14} /> Provider Profile
                    </MenuItem>
                  )}
                  <MenuSeparator />
                  <MenuItem
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="text-red-700 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-800 dark:text-red-400 dark:data-[highlighted]:bg-red-950/60 dark:data-[highlighted]:text-red-300"
                  >
                    <LogOut size={14} /> Log Out
                  </MenuItem>
                </MenuContent>
              </Menu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
