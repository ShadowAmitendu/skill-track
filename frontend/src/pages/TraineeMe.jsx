import { EntityTitle, H3, Icon } from "@blueprintjs/core";
import { useAuth } from "../context/useAuth";
import TraineeProfile from "./TraineeProfile";
import { Card } from "../components/ui/Card";

export default function TraineeMe() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <Card>
        <EntityTitle
          icon={<Icon icon="user" size={20} />}
          heading={H3}
          title="My Learning Journey & Outcomes"
          subtitle="Manage your personal details, earned skills, course enrollments, and communication consent."
        />
      </Card>

      <TraineeProfile customId={user?.id || 1} isSelfView={true} />
    </div>
  );
}
