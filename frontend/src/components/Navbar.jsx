import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Alignment,
  Intent,
  Navbar as BpNavbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Tag,
} from "@blueprintjs/core";
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
  Sparkles,
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
    if (!isAuthenticated) return [];

    if (role === "ADMIN") {
      return [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Trainees", path: "/trainees", icon: Users },
        { name: "Courses & Providers", path: "/courses", icon: GraduationCap },
        { name: "Skills", path: "/skills", icon: Award },
        { name: "Employment", path: "/employment", icon: BriefcaseBusiness },
      ];
    }

    if (role === "COURSE_PROVIDER") {
      return [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Trainees", path: "/trainees", icon: Users },
        { name: "Courses", path: "/courses", icon: GraduationCap },
        { name: "Skills", path: "/skills", icon: Award },
        { name: "Employment", path: "/employment", icon: BriefcaseBusiness },
        { name: "Course AI", path: "/provider-ai", icon: Sparkles },
      ];
    }

    return [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Courses", path: "/courses", icon: GraduationCap },
      { name: "Skills", path: "/skills", icon: Award },
      { name: "My Employment", path: "/my-employment", icon: BriefcaseBusiness },
      { name: "Career AI", path: "/career-insights", icon: Sparkles },
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
    return (
      location.pathname === targetPath ||
      (targetPath !== "/dashboard" && location.pathname.startsWith(`${targetPath}/`))
    );
  };

  const profilePath =
    role === "TRAINEE"
      ? "/me"
      : role === "COURSE_PROVIDER"
        ? `/providers/${user?.id || 1}`
        : null;

  const isProfileActive =
    role === "TRAINEE"
      ? location.pathname === "/me"
      : role === "COURSE_PROVIDER"
        ? location.pathname === `/providers/${user?.id || 1}`
        : false;

  const roleBadgeConfig = {
    ADMIN: { label: "Admin", variant: "primary" },
    COURSE_PROVIDER: { label: "Course Provider", variant: "default" },
    TRAINEE: { label: "Trainee", variant: "success" },
  };

  const currentRoleBadge = roleBadgeConfig[role] || {
    label: "Guest",
    variant: "outline",
  };

  return (
    <header className="sticky top-0 z-30">
      <BpNavbar>
        <div className="max-w-7xl mx-auto h-full px-2 sm:px-4 flex items-center justify-between gap-3">
          <NavbarGroup align={Alignment.START} className="min-w-0">
            <NavbarHeading className="!mr-2 shrink-0">
              <Link to="/" className="font-semibold tracking-tight">
                SkillTrack
              </Link>
            </NavbarHeading>

            {navLinks.length > 0 && <NavbarDivider className="hidden xl:block" />}

            {navLinks.length > 0 && (
              <nav className="hidden xl:flex items-center gap-1">
                {navLinks.map((item) => {
                  const NavIcon = item.icon;
                  const active = isNavItemActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} className="shrink-0">
                      <Button
                        variant="minimal"
                        active={active}
                        intent={active ? Intent.PRIMARY : Intent.NONE}
                        icon={<NavIcon size={14} />}
                      >
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            )}
          </NavbarGroup>

          <NavbarGroup align={Alignment.END} className="shrink-0 gap-2">
            {import.meta.env.DEV && demoMode && (
              <Tag
                intent={Intent.PRIMARY}
                minimal
                icon={<Radio size={12} />}
                onRemove={() => setDemoMode(false)}
                title="Demo Mode Active (MSW mock data) — Click × to disable"
                className="hidden sm:inline-flex"
              >
                Demo Mode
              </Tag>
            )}

            {isAuthenticated && (
              <Button
                variant="outlined"
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                icon={isDark ? <Sun size={14} /> : <Moon size={14} />}
              />
            )}

            {/* Mobile Navigation Menu */}
            {navLinks.length > 0 && (
              <div className="xl:hidden">
                <Menu>
                  <MenuTrigger
                    render={(props) => (
                      <Button
                        {...props}
                        variant="outlined"
                        aria-label="Open navigation menu"
                        icon={<MenuIcon size={14} />}
                      />
                    )}
                  />
                  <MenuContent align="end">
                    {navLinks.map((item) => {
                      const NavIcon = item.icon;
                      return (
                        <MenuItem
                          key={item.path}
                          icon={<NavIcon size={14} />}
                          active={isNavItemActive(item.path)}
                          onClick={() => navigate(item.path)}
                        >
                          {item.name}
                        </MenuItem>
                      );
                    })}
                  </MenuContent>
                </Menu>
              </div>
            )}

            {/* Dev Role Switcher */}
            {import.meta.env.DEV && isAuthenticated && (
              <Menu>
                <MenuTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      variant="outlined"
                      endIcon={<ChevronDown size={13} />}
                      className="hidden sm:inline-flex"
                      title="Dev-only Role Switcher"
                    >
                      <span className="bp6-text-muted mr-1">Dev:</span>
                      <span>{currentRoleBadge.label}</span>
                    </Button>
                  )}
                />
                <MenuContent align="end">
                  <MenuSeparator title="Dev Persona Switcher" />
                  <MenuItem
                    icon={<Shield size={14} />}
                    active={role === "ADMIN"}
                    onClick={() => {
                      switchPersona("ADMIN");
                      navigate("/dashboard");
                    }}
                  >
                    Administrator
                  </MenuItem>
                  <MenuItem
                    icon={<Layers size={14} />}
                    active={role === "COURSE_PROVIDER"}
                    onClick={() => {
                      switchPersona("COURSE_PROVIDER");
                      navigate("/dashboard");
                    }}
                  >
                    Course Provider (Apex)
                  </MenuItem>
                  <MenuItem
                    icon={<UserCheck size={14} />}
                    active={role === "TRAINEE"}
                    onClick={() => {
                      switchPersona("TRAINEE");
                      navigate("/dashboard");
                    }}
                  >
                    Trainee (Aarav Sharma)
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    icon={<Radio size={14} />}
                    onClick={() => setDemoMode(!demoMode)}
                  >
                    {demoMode ? "Disable Demo Mode" : "Enable Demo Mode"}
                  </MenuItem>
                </MenuContent>
              </Menu>
            )}

            {isAuthenticated ? (
              <Menu>
                <MenuTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      variant="minimal"
                      aria-label="Open profile menu"
                      endIcon={<ChevronDown size={14} />}
                      icon={<Avatar fallback={user?.name || "User"} size="sm" />}
                    >
                      <span className="hidden lg:inline">{user?.name || "Account"}</span>
                    </Button>
                  )}
                />
                <MenuContent align="end">
                  {profilePath ? (
                    <MenuItem
                      multiline
                      className="items-center"
                      icon={role === "COURSE_PROVIDER" ? <Layers size={14} /> : <UserCheck size={14} />}
                      active={isProfileActive}
                      labelElement={
                        <Badge variant={currentRoleBadge.variant}>{currentRoleBadge.label}</Badge>
                      }
                      onClick={() => navigate(profilePath)}
                    >
                      <div className="flex flex-col leading-tight py-0.5">
                        <span className="font-semibold text-[13px]">{user?.name || "Account"}</span>
                        <span className="text-xs opacity-75 truncate max-w-[190px]">
                          {user?.email}
                        </span>
                      </div>
                    </MenuItem>
                  ) : (
                    <>
                      <MenuSeparator title={user?.name || "Account"} />
                      <div className="px-2 py-1 flex items-center justify-between gap-2 text-xs">
                        <span className="bp6-text-muted truncate">{user?.email}</span>
                        <Badge variant={currentRoleBadge.variant}>{currentRoleBadge.label}</Badge>
                      </div>
                    </>
                  )}
                  <MenuSeparator />
                  <MenuItem
                    icon={<LogOut size={14} />}
                    intent={Intent.DANGER}
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    Log Out
                  </MenuItem>
                </MenuContent>
              </Menu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="minimal">Log In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary">Register</Button>
                </Link>
              </div>
            )}
          </NavbarGroup>
        </div>
      </BpNavbar>
    </header>
  );
}
