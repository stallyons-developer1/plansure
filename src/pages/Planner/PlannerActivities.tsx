import PlannerLayout from "../../layouts/PlannerLayout";
import ActivitiesLookahead from "../../components/ActivitiesLookahead";
import { activitiesData } from "../../components/ActivitiesTable";

// Planner-specific week timeline data - this can be different from user side
const plannerWeekTimelineData = [
  { week: 1, dateRange: "25 Mar - 31 Mar", color: "green" as const, isCurrent: true },
  { week: 2, dateRange: "01 Apr - 07 Apr", color: "green" as const, isCurrent: false },
  { week: 3, dateRange: "08 Apr - 14 Apr", color: "amber" as const, isCurrent: false },
  { week: 4, dateRange: "15 Apr - 21 Apr", color: "amber" as const, isCurrent: false },
  { week: 5, dateRange: "22 Apr - 28 Apr", color: "red" as const, isCurrent: false },
  { week: 6, dateRange: "29 Apr - 05 May", color: "red" as const, isCurrent: false },
];

// For now using the same activities data, but this can be replaced with planner-specific data
const plannerActivitiesData = activitiesData;

const PlannerActivities = () => {
  return (
    <PlannerLayout
      title="Activities & Lookahead"
      subtitle="Manage project activities and lookahead planning"
    >
      <ActivitiesLookahead
        activities={plannerActivitiesData}
        weeks={plannerWeekTimelineData}
        lastUpdated="25 Mar 2026, 09:15"
      />
    </PlannerLayout>
  );
};

export default PlannerActivities;
