import AdminLayout from "../../layouts/AdminLayout";
import ActivitiesLookahead from "../../components/ActivitiesLookahead";
import { activitiesData } from "../../components/ActivitiesTable";

const adminWeekTimelineData = [
  {
    week: 1,
    dateRange: "25 Mar - 31 Mar",
    color: "green" as const,
    isCurrent: true,
  },
  {
    week: 2,
    dateRange: "01 Apr - 07 Apr",
    color: "green" as const,
    isCurrent: false,
  },
  {
    week: 3,
    dateRange: "08 Apr - 14 Apr",
    color: "amber" as const,
    isCurrent: false,
  },
  {
    week: 4,
    dateRange: "15 Apr - 21 Apr",
    color: "amber" as const,
    isCurrent: false,
  },
  {
    week: 5,
    dateRange: "22 Apr - 28 Apr",
    color: "red" as const,
    isCurrent: false,
  },
  {
    week: 6,
    dateRange: "29 Apr - 05 May",
    color: "red" as const,
    isCurrent: false,
  },
];

const adminActivitiesData = activitiesData;

const AdminActivities = () => {
  return (
    <AdminLayout
      title="Activities & Lookahead"
      subtitle="Manage project activities and lookahead planning"
    >
      <ActivitiesLookahead
        activities={adminActivitiesData}
        weeks={adminWeekTimelineData}
        lastUpdated="25 Mar 2026, 09:15"
      />
    </AdminLayout>
  );
};

export default AdminActivities;
