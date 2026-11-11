import { useAuth } from "../context/useAuth";
import TraineeProfile from "./TraineeProfile";
import { Card, CardContent } from "../components/ui/Card";
import { UserCheck } from "lucide-react";

export default function TraineeMe() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              My Learning Journey & Outcomes
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Manage your course enrollments, earned skills, employment status, and communication
              consent.
            </p>
          </div>
        </CardContent>
      </Card>

      <TraineeProfile customId={user?.id || 1} isSelfView={true} />
    </div>
  );
}
