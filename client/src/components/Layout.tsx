import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alignment,
  Button,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Navbar,
  Popover,
  Position,
  Tag,
  type IconName,
} from "@blueprintjs/core";
import { getHomeRouteForRole, useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { showInfo } from "../lib/toaster";

interface NavEntry {
  label: string;
  path: string;
  icon: IconName;
  divider?: string;
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    void showInfo("Signed out");
    navigate("/login");
  };

  const getSidebarEntries = (): NavEntry[] => {
    if (!user) {
      return [
        { label: "Login", path: "/login", icon: "log-in" },
        { label: "Register", path: "/register", icon: "new-person" },
        { label: "Skills Directory", path: "/skills", icon: "badge" },
      ];
    }

    if (user.role === "admin") {
      return [
        { label: "Admin Dashboard", path: "/admin", icon: "dashboard" },
        { label: "Trainees", path: "/trainees", icon: "people" },
        { label: "Courses & Providers", path: "/courses", icon: "book" },
        { label: "Skills", path: "/skills", icon: "badge" },
        { label: "Employment", path: "/employment", icon: "briefcase" },
      ];
    }

    if (user.role === "cp") {
      return [
        { label: "Courses & Providers", path: "/courses", icon: "book" },
        { label: "Trainees", path: "/trainees", icon: "people" },
        { label: "Skills", path: "/skills", icon: "badge" },
        { label: "Employment", path: "/employment", icon: "briefcase" },
        {
          label: "Course Suggestions & Chat",
          path: "/ai/provider",
          icon: "predictive-analysis",
          divider: "AI Assistant",
        },
      ];
    }

    const traineeEntries: NavEntry[] = [
      { label: "My Profile", path: "/me", icon: "user" },
      { label: "Courses & Providers", path: "/courses", icon: "book" },
      { label: "Skills", path: "/skills", icon: "badge" },
    ];

    if (user.roleCategory === "IT") {
      traineeEntries.push(
        {
          label: "Skill Gap",
          path: "/ai/skill-gap",
          icon: "learning",
          divider: "AI Career Tools (IT)",
        },
        { label: "Role Match", path: "/ai/role-match", icon: "comparison" },
        { label: "Future Careers", path: "/ai/future-careers", icon: "trending-up" }
      );
    }

    return traineeEntries;
  };

  const entries = getSidebarEntries();

  const roleTagIntent =
    user?.role === "admin"
      ? Intent.PRIMARY
      : user?.role === "cp"
        ? Intent.WARNING
        : Intent.SUCCESS;

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(`${path}/`));

  return (
    <div className="st-shell">
      <Navbar>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading
            style={{ cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate(user ? getHomeRouteForRole(user.role) : "/login")}
          >
            Skill-Track
          </Navbar.Heading>
          <Navbar.Divider />
          <span className="bp5-text-muted" style={{ fontSize: 12 }}>
            Consent-Based Trainee & Career Intelligence
          </span>
        </Navbar.Group>

        <Navbar.Group align={Alignment.RIGHT}>
          <Button
            minimal
            icon={dark ? "flash" : "moon"}
            onClick={toggleDark}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle dark mode"
          />
          {user ? (
            <>
              <Navbar.Divider />
              <Tag minimal intent={roleTagIntent} style={{ textTransform: "uppercase" }}>
                {user.role}
              </Tag>
              <Popover
                position={Position.BOTTOM_RIGHT}
                content={
                  <Menu>
                    <MenuDivider title={user.email} />
                    {user.role === "trainee" && (
                      <MenuItem
                        icon="user"
                        text="My Profile"
                        onClick={() => navigate("/me")}
                      />
                    )}
                    {user.role === "cp" && user.providerId && (
                      <MenuItem
                        icon="office"
                        text="Organization Profile"
                        onClick={() => navigate(`/providers/${user.providerId}`)}
                      />
                    )}
                    <MenuItem
                      icon="log-out"
                      intent={Intent.DANGER}
                      text="Logout"
                      onClick={() => void handleLogout()}
                    />
                  </Menu>
                }
              >
                <Button minimal rightIcon="caret-down" icon="person" text={user.name} />
              </Popover>
            </>
          ) : (
            <>
              <Button minimal text="Login" onClick={() => navigate("/login")} />
              <Button intent="primary" text="Register" onClick={() => navigate("/register")} />
            </>
          )}
        </Navbar.Group>
      </Navbar>

      <div className="st-body">
        <aside className="st-sidebar">
          <Menu style={{ background: "transparent", padding: 0 }}>
            {entries.map((entry) => (
              <div key={entry.path}>
                {entry.divider && <MenuDivider title={entry.divider} />}
                <MenuItem
                  icon={entry.icon}
                  text={entry.label}
                  active={isActive(entry.path)}
                  intent={isActive(entry.path) ? Intent.PRIMARY : Intent.NONE}
                  onClick={() => navigate(entry.path)}
                />
              </div>
            ))}
          </Menu>
        </aside>

        <main className="st-main">{children}</main>
      </div>
    </div>
  );
}
