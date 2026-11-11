import { useAuth } from "../context/useAuth";
import { AdminDashboardBoard } from "../components/dashboard/AdminDashboardBoard";
import { ProviderDashboardBoard } from "../components/dashboard/ProviderDashboardBoard";
import { TraineeDashboardBoard } from "../components/dashboard/TraineeDashboardBoard";

export default function Dashboard() {
  const { role } = useAuth();

  if (role === "ADMIN") {
    return <AdminDashboardBoard />;
  }

  if (role === "COURSE_PROVIDER") {
    return <ProviderDashboardBoard />;
  }

  return <TraineeDashboardBoard />;
}
