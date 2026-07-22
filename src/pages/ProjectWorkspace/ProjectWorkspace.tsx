import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { COLORS } from "../../constants/colors";
import { projectAPI, programmeAPI, actionAPI } from "../../services/api";
import ActivitiesTable, {
  type Activity as TableActivity,
} from "../../components/ActivitiesTable";
import AdminActivitiesSummary from "../../components/AdminActivitiesSummary";

interface ProjectData {
  _id: string;
  name: string;
  phase: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdBy?: { name: string; email: string };
}

interface Activity {
  activityId: string;
  activityName: string;
  duration: string;
  startDate: string;
  finishDate: string;
  status: string;
  ragStatus: string;
  activityStatus: string;
  weekZone: string | null;
}

const StepIndicator = ({
  number,
  label,
  isActive,
  isCompleted,
}: {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minWidth: { xs: 70, sm: 90, md: "auto" },
    }}
  >
    <Box
      sx={{
        width: { xs: 32, sm: 36, md: 38 },
        height: { xs: 32, sm: 36, md: 38 },
        borderRadius: "50%",
        bgcolor: isActive || isCompleted ? COLORS.blue : "transparent",
        border: isActive || isCompleted ? "none" : `2px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isActive || isCompleted ? "#fff" : COLORS.border,
        fontWeight: 500,
        fontSize: { xs: "13px", sm: "14px", md: "15px" },
        transition: "all 0.2s ease",
      }}
    >
      {number}
    </Box>
    <Typography
      sx={{
        color: isActive || isCompleted ? COLORS.textPrimary : COLORS.border,
        fontSize: { xs: "11px", sm: "12px", md: "14px" },
        fontWeight: 400,
        mt: { xs: 0.5, sm: 0.75, md: 1 },
        mb: 0,
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Typography>
  </Box>
);

const StatCard = ({
  label,
  value,
  subLabel,
  valueColor = COLORS.textPrimary,
}: {
  label: string;
  value: number | string;
  subLabel?: string;
  valueColor?: string;
}) => (
  <Card
    sx={{
      bgcolor: COLORS.bgSecondary,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 2,
      height: 80,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      p: 1.5,
    }}
  >
    <Typography
      sx={{
        color: "#94A3B8",
        fontSize: "12px",
        fontWeight: 500,
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        color: valueColor,
        fontSize: "24px",
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {value}
    </Typography>
    {subLabel && (
      <Typography
        sx={{
          color: "#94A3B8",
          fontSize: "12px",
          fontWeight: 500,
          mt: 0.25,
        }}
      >
        {subLabel}
      </Typography>
    )}
  </Card>
);

// Parse a programme date string (DD-MMM-YY or ISO) to a Date (matches Admin/Planner)
const wkParseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const months: { [key: string]: number } = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const cleanDate = dateStr.replace(/\s*[A*]$/, "").trim();
  const match = cleanDate.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = months[match[2]];
    let year = parseInt(match[3]);
    year = year < 50 ? 2000 + year : 1900 + year;
    return new Date(year, month, day);
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// RAG zone sort priority (Completed first, then nearer weeks) — matches Admin/Planner
const getRAGZonePriority = (zone: string): number => {
  switch (zone) {
    case "Completed":
      return 0;
    case "Weeks 1-2":
      return 1;
    case "Weeks 3-4":
      return 2;
    case "Weeks 5-6":
      return 3;
    default:
      return 4;
  }
};

const ProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [ragFilter, setRagFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState<number | null>(null);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [uploaderName, setUploaderName] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const activitiesPerPage = 20;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projectActions, setProjectActions] = useState<
    Array<{
      _id: string;
      title: string;
      linkedActivity: { activityId: string; activityName: string };
      status: string;
      dueDate?: string;
      assignee?: { _id?: string; name?: string };
      createdAt?: string;
    }>
  >([]);
  const [weeklyControl, setWeeklyControl] = useState<{
    stats?: { inLookahead?: number; cycleStatus?: string };
    actionsByStatus?: { open?: number; overdue?: number };
    weekInfo?: { currentWeekNumber?: number; totalWeeks?: number; closedWeeksCount?: number };
  } | null>(null);
  const [weeksStatus, setWeeksStatus] = useState<{
    weeks?: Array<{ isClosed?: boolean; closedAt?: string }>;
  } | null>(null);

  // An open action whose week was PM-override-closed shouldn't count as "open"
  const isActionFromClosedWeek = (action: {
    createdAt?: string;
    status?: string;
  }) => {
    if (!weeksStatus?.weeks || !action.createdAt) return false;
    if (action.status === "Completed" || action.status === "Cancelled")
      return false;
    const actionDate = new Date(action.createdAt);
    const closedWeeks = weeksStatus.weeks.filter(
      (w) => w.isClosed && w.closedAt,
    );
    if (closedWeeks.length === 0) return false;
    const mostRecentClosure = closedWeeks.reduce(
      (latest, week) => {
        if (!latest) return week;
        if (!week.closedAt || !latest.closedAt) return latest;
        return new Date(week.closedAt) > new Date(latest.closedAt)
          ? week
          : latest;
      },
      null as { isClosed?: boolean; closedAt?: string } | null,
    );
    if (!mostRecentClosure?.closedAt) return false;
    return actionDate < new Date(mostRecentClosure.closedAt);
  };
  const steps = [
    "Draft",
    "Meeting Open",
    "Execution",
    "Close-Out Eligible",
    "Closed",
  ];

  // Map backend cycleStatus -> stepper index (1..5), same as Planner/Admin
  const stepFromCycleStatus = (cycleStatus?: string): number => {
    switch (cycleStatus) {
      case "Meeting Open":
        return 2;
      case "Execution":
        return 3;
      case "Close-Out Eligible":
        return 4;
      case "Closed":
        return 5;
      case "Uploaded":
      case "Draft":
      default:
        return 1;
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const response = await projectAPI.getById(projectId);
        if (response.success) {
          setProject(response.project);
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const fetchProgramme = async () => {
      if (!projectId) return;
      try {
        const response = await programmeAPI.getByProject(projectId);
        if (response.success && response.programme) {
          const programme = response.programme;
          const activitiesData = programme.extractedData?.activities || [];

          setActivities(activitiesData);
          // Owner column shows whoever uploaded the programme PDF
          setUploaderName(programme.uploadedBy?.name || "");
          setProgrammeName(programme.name || programme.originalFileName || "");

          // Derive cycle stepper from the programme's real cycle status
          setCurrentStep(stepFromCycleStatus(programme.cycleStatus));

          try {
            const actionsRes = await actionAPI.getByProgramme(programme._id);
            if (actionsRes.success) {
              setProjectActions(actionsRes.actions || []);
            }
          } catch (err) {
            console.error("Failed to fetch actions:", err);
          }

          // Weekly control feeds the real Open/Overdue action counts + week info
          try {
            const wcRes = await programmeAPI.getWeeklyControl(programme._id);
            setWeeklyControl(wcRes || null);
          } catch (err) {
            console.error("Failed to fetch weekly control:", err);
          }

          // Weeks status (used to exclude PM-override'd actions)
          try {
            const wsRes = await programmeAPI.getWeeksStatus(programme._id);
            setWeeksStatus(wsRes || null);
          } catch (err) {
            console.error("Failed to fetch weeks status:", err);
          }
        }
      } catch (error) {
        console.error("Failed to fetch programme:", error);
      }
    };
    fetchProgramme();
  }, [projectId]);

  const getActionsForActivity = (activityId: string) => {
    return projectActions.filter(
      (action) => action.linkedActivity?.activityId === activityId,
    );
  };

  const ownerName = uploaderName || "Unknown";
  const ownerInitials = ownerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isLoading) {
    return (
      <DashboardLayout
        title="Project Workspace"
        subtitle="Manage weekly control cycle"
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout
        title="Project Workspace"
        subtitle="Manage weekly control cycle"
      >
        <Typography sx={{ color: COLORS.textPrimary }}>
          Project not found
        </Typography>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Project Workspace"
      subtitle="Manage weekly control cycle"
    >
      <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            minHeight: { xs: "auto", md: 210 },
            p: { xs: 2, sm: 2.5, md: 3 },
            mb: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: { xs: 2.5, md: 0 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "flex-start" },
              gap: { xs: 1.5, md: 2 },
              mb: 0,
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 0.75,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.border,
                    fontSize: { xs: "11px", sm: "12px" },
                    fontWeight: 400,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => navigate("/dashboard/projects")}
                >
                  Projects
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.textLight,
                    fontSize: { xs: "11px", sm: "12px" },
                    fontWeight: 400,
                  }}
                >
                  &nbsp;/ {project.name}
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: { xs: "20px", sm: "24px", md: "26px" },
                  fontWeight: 700,
                  mb: 0.5,
                  lineHeight: 1.2,
                }}
              >
                {project.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.border,
                    fontSize: { xs: "12px", sm: "14px" },
                    fontWeight: 400,
                  }}
                >
                  Phase:
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.textLight,
                    fontSize: { xs: "12px", sm: "14px" },
                    fontWeight: 400,
                  }}
                >
                  &nbsp;{project.phase}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2 },
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: { xs: "11px", sm: "12px" },
                    fontWeight: 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  Week {weeklyControl?.weekInfo?.currentWeekNumber ?? 1} (Current
                  Week)
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgTertiary,
                  color: COLORS.textSecondary,
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 0.75, sm: 1 },
                  borderRadius: "10px",
                  fontSize: { xs: "11px", sm: "13px" },
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {steps[currentStep - 1]}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: { xs: "flex-start", lg: "center" },
              maxWidth: "100%",
              width: "100%",
              overflowX: "auto",
              overflowY: "hidden",
              pb: 1,
              px: { xs: 1, sm: 0 },
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {steps.map((step, index) => (
              <Box
                key={step}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  minWidth: "fit-content",
                }}
              >
                <StepIndicator
                  number={index + 1}
                  label={step}
                  isActive={index + 1 === currentStep}
                  isCompleted={index + 1 < currentStep}
                />
                {index < steps.length - 1 && (
                  <Box
                    sx={{
                      width: { xs: 40, sm: 55, md: 75 },
                      height: 2,
                      bgcolor:
                        index + 1 < currentStep ? COLORS.blue : COLORS.border,
                      mx: { xs: "16px", sm: "28px", md: "46px" },
                      mt: { xs: "15px", sm: "17px", md: "19px" },
                      transition: "all 0.2s ease",
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Card>

        <Box
          sx={{
            mb: 3,
            borderBottom: `2px solid ${COLORS.border}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: "auto",
              mb: "-2px",
              "& .MuiTabs-indicator": {
                bgcolor: COLORS.blue,
                height: "2px",
                bottom: 0,
              },
              "& .MuiTab-root": {
                color: COLORS.textMuted,
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
                minHeight: "auto",
                py: 1.5,
                px: 0,
                mr: 4,
                "&.Mui-selected": {
                  color: COLORS.blue,
                },
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Programme Upload" />
            <Tab label="Activities & Lookahead" />
          </Tabs>
        </Box>

        {activeTab === 0 &&
          (() => {
            // Overview KPIs over the 6-week lookahead (matches the table),
            // excluding PM-override'd actions — same as Admin/Planner.
            const ovToday = new Date();
            ovToday.setHours(0, 0, 0, 0);
            const ovSixWeekEnd = new Date(ovToday);
            ovSixWeekEnd.setDate(ovToday.getDate() + 42);
            const ovActivities = activities.filter((a) => {
              const start = wkParseDate(a.startDate);
              if (!start) return false;
              return start >= ovToday && start < ovSixWeekEnd;
            });
            const ovInLookahead = ovActivities.length;
            const ovGreenReady = ovActivities.filter(
              (a) => a.activityStatus === "Ready",
            ).length;
            const ovOpenActions = projectActions.filter(
              (a) => a.status === "Open" && !isActionFromClosedWeek(a),
            ).length;
            const ovOverdueActions = projectActions.filter(
              (a) =>
                a.status !== "Completed" &&
                a.status !== "Cancelled" &&
                !isActionFromClosedWeek(a) &&
                a.dueDate &&
                new Date(a.dueDate) < ovToday,
            ).length;
            return (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 2,
                  mb: 3,
                }}
              >
                <StatCard
                  label="Activities in Lookahead"
                  value={ovInLookahead}
                />
                <StatCard
                  label={`${ovGreenReady} Green & Ready`}
                  value={ovGreenReady}
                  subLabel={`of ${ovInLookahead} total`}
                  valueColor={COLORS.green}
                />
                <StatCard
                  label="Open Actions"
                  value={ovOpenActions}
                  valueColor={COLORS.amber}
                />
                <StatCard
                  label="Overdue Actions"
                  value={ovOverdueActions}
                  valueColor={COLORS.red}
                />
              </Box>
            );
          })()}

        {activeTab === 1 && (
          <Box>
            {activities.length === 0 ? (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 4,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: COLORS.textMuted, fontSize: "15px" }}>
                  No programme has been uploaded for this project yet.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      bgcolor: "rgba(34, 197, 94, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography sx={{ color: COLORS.green, fontSize: "24px" }}>
                      ✓
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "18px",
                        fontWeight: 600,
                      }}
                    >
                      Programme Uploaded Successfully
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
                    >
                      {programmeName}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      sm: "repeat(3, 1fr)",
                      md: "repeat(5, 1fr)",
                    },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const sixWeekEnd = new Date(today);
                    sixWeekEnd.setDate(today.getDate() + 42);
                    const in6 = activities.filter((a) => {
                      const start = wkParseDate(a.startDate || "");
                      if (!start) return false;
                      return start >= today && start < sixWeekEnd;
                    });
                    const readyCount = in6.filter(
                      (a) =>
                        a.activityStatus === "Ready" ||
                        (!a.activityStatus && a.ragStatus !== "Blocked"),
                    ).length;
                    const atRiskCount = in6.filter(
                      (a) => a.activityStatus === "At Risk",
                    ).length;
                    const completeCount = in6.filter(
                      (a) => a.activityStatus === "Complete",
                    ).length;
                    const blockedCount = in6.filter(
                      (a) =>
                        a.activityStatus === "Blocked" ||
                        a.ragStatus === "Blocked",
                    ).length;
                    const stat = (
                      value: number,
                      label: string,
                      color: string,
                    ) => (
                      <Box
                        sx={{
                          bgcolor: COLORS.bgTertiary,
                          borderRadius: "8px",
                          p: 2,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{ color, fontSize: "24px", fontWeight: 700 }}
                        >
                          {value}
                        </Typography>
                        <Typography
                          sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                        >
                          {label}
                        </Typography>
                      </Box>
                    );
                    return (
                      <>
                        {stat(
                          activities.length,
                          "Total Activities",
                          COLORS.textPrimary,
                        )}
                        {stat(readyCount, "Ready", COLORS.green)}
                        {stat(atRiskCount, "At Risk", COLORS.amber)}
                        {stat(completeCount, "Completed", COLORS.blue)}
                        {stat(blockedCount, "Blocked", COLORS.red)}
                      </>
                    );
                  })()}
                </Box>

                <Button
                  onClick={() => setActiveTab(2)}
                  sx={{
                    bgcolor: COLORS.blue,
                    color: "#fff",
                    textTransform: "none",
                    px: 3,
                    py: 1,
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    "&:hover": { bgcolor: COLORS.blueHover },
                  }}
                >
                  View Activities & Lookahead
                </Button>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            {/* Week Zones */}
            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                height: 80,
                px: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                overflowX: "auto",
                mb: 3,
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {/* All weeks */}
              <Box
                onClick={() => {
                  setWeekFilter(null);
                  setActivitiesPage(1);
                }}
                sx={{
                  minWidth: 80,
                  height: 58,
                  flexShrink: 0,
                  border: `2px solid ${weekFilter === null ? COLORS.blue : COLORS.border}`,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  bgcolor:
                    weekFilter === null ? COLORS.blueBgMedium : "transparent",
                }}
              >
                <Typography
                  sx={{
                    color:
                      weekFilter === null ? COLORS.blue : COLORS.textSecondary,
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  All
                </Typography>
              </Box>
              {[
                { week: "Week 1", label: "Committed", color: COLORS.green, weekNum: 1 },
                { week: "Week 2", label: "Committed", color: COLORS.green, weekNum: 2 },
                { week: "Week 3", label: "Readiness", color: COLORS.amber, weekNum: 3 },
                { week: "Week 4", label: "Readiness", color: COLORS.amber, weekNum: 4 },
                { week: "Week 5", label: "Strategic", color: COLORS.red, weekNum: 5 },
                { week: "Week 6", label: "Strategic", color: COLORS.red, weekNum: 6 },
              ].map((item) => (
                <Box
                  key={item.weekNum}
                  onClick={() => {
                    setWeekFilter(item.weekNum);
                    setActivitiesPage(1);
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 140,
                    height: 58,
                    border: `2px solid ${item.color}`,
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    bgcolor:
                      weekFilter === item.weekNum
                        ? `${item.color}30`
                        : item.label !== "Committed"
                          ? `${item.color}10`
                          : "transparent",
                  }}
                >
                  <Typography
                    sx={{
                      color: item.color,
                      fontSize: "12px",
                      fontWeight: weekFilter === item.weekNum ? 700 : 500,
                    }}
                  >
                    {item.week}
                  </Typography>
                  <Typography
                    sx={{ color: "#8E9CB1", fontSize: "12px", fontWeight: 400 }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Status Filters */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mb: 2,
                overflowX: "auto",
                pb: 1,
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {[
                { label: "All", value: "all" },
                { label: "Blocked", value: "Blocked" },
                { label: "Ready", value: "Ready" },
                { label: "Completed", value: "Completed" },
                { label: "At Risk", value: "At Risk" },
              ].map((filter) => (
                <Box
                  key={filter.value}
                  onClick={() => setRagFilter(filter.value)}
                  sx={{
                    px: 2.5,
                    py: 1,
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    bgcolor:
                      ragFilter === filter.value
                        ? COLORS.blueBgMedium
                        : "transparent",
                    color:
                      ragFilter === filter.value
                        ? COLORS.blue
                        : COLORS.textSecondary,
                    border: `1px solid ${ragFilter === filter.value ? COLORS.blue : COLORS.border}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor:
                        ragFilter === filter.value
                          ? COLORS.blueBgMedium
                          : COLORS.whiteHoverLight,
                    },
                  }}
                >
                  {filter.label}
                </Box>
              ))}
            </Box>

            {/* Activities Table - shared component (matches Admin/Planner) */}
            {(() => {
              const allActivities = activities;

              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const sixWeekEnd = new Date(today);
              sixWeekEnd.setDate(today.getDate() + 42);

              const getActivityWeek = (startDate: string): number | null => {
                const activityStart = wkParseDate(startDate);
                if (!activityStart) return null;
                const msPerDay = 1000 * 60 * 60 * 24;
                const daysFromToday = Math.floor(
                  (activityStart.getTime() - today.getTime()) / msPerDay,
                );
                if (daysFromToday < 0) return null;
                const weekNum = Math.floor(daysFromToday / 7) + 1;
                if (weekNum > 6) return null;
                return weekNum;
              };

              const filtered = allActivities
                .filter((activity) => {
                  const matchesStatus =
                    ragFilter === "all" ||
                    activity.activityStatus === ragFilter;
                  if (!matchesStatus) return false;
                  const activityStart = wkParseDate(activity.startDate);
                  if (!activityStart) return true;
                  if (activityStart < today || activityStart >= sixWeekEnd)
                    return false;
                  if (weekFilter !== null) {
                    const activityWeek = getActivityWeek(activity.startDate);
                    return activityWeek !== null && activityWeek === weekFilter;
                  }
                  return true;
                })
                .sort((a, b) => {
                  const getZone = (activity: Activity) => {
                    const start = wkParseDate(activity.startDate);
                    if (
                      activity.activityStatus === "Complete" ||
                      activity.activityStatus === "Completed" ||
                      activity.startDate?.includes(" A") ||
                      activity.finishDate?.includes(" A")
                    ) {
                      return "Completed";
                    }
                    if (!start) return "Unknown";
                    const msPerDay = 1000 * 60 * 60 * 24;
                    const daysFromToday = Math.floor(
                      (start.getTime() - today.getTime()) / msPerDay,
                    );
                    const weekNum = Math.floor(daysFromToday / 7) + 1;
                    if (weekNum <= 2) return "Weeks 1-2";
                    if (weekNum <= 4) return "Weeks 3-4";
                    if (weekNum <= 6) return "Weeks 5-6";
                    return "Beyond";
                  };
                  return (
                    getRAGZonePriority(getZone(a)) -
                    getRAGZonePriority(getZone(b))
                  );
                });

              const ragZoneFor = (
                startDate: string,
                finishDate: string,
                activityStatus?: string,
              ): { zone: string; color: string; beyond?: boolean } => {
                if (
                  activityStatus === "Complete" ||
                  activityStatus === "Completed" ||
                  startDate?.includes(" A") ||
                  finishDate?.includes(" A")
                ) {
                  return { zone: "Completed", color: "blue" };
                }
                if (!startDate) return { zone: "N/A", color: "muted" };
                const start = wkParseDate(startDate);
                if (!start) return { zone: "N/A", color: "muted" };
                const msPerDay = 1000 * 60 * 60 * 24;
                const daysFromToday = Math.floor(
                  (start.getTime() - today.getTime()) / msPerDay,
                );
                const weekNum = Math.floor(daysFromToday / 7) + 1;
                if (weekNum <= 2) return { zone: "Weeks 1-2", color: "green" };
                if (weekNum <= 4) return { zone: "Weeks 3-4", color: "amber" };
                if (weekNum <= 6) return { zone: "Weeks 5-6", color: "red" };
                return { zone: `Week ${weekNum}`, color: "muted", beyond: true };
              };

              const statusTypeFor = (status: string): string => {
                switch (status) {
                  case "Ready":
                    return "green";
                  case "At Risk":
                    return "amber";
                  case "Blocked":
                    return "red";
                  case "Complete":
                  case "Completed":
                    return "blue";
                  case "Action Open":
                    return "blue";
                  case "Action Overdue":
                    return "red";
                  default:
                    return "green";
                }
              };

              const withinLookahead = filtered.filter(
                (activity) =>
                  !ragZoneFor(
                    activity.startDate,
                    activity.finishDate,
                    activity.activityStatus,
                  ).beyond,
              );

              const mapped: TableActivity[] = withinLookahead.map((activity) => {
                const rag = ragZoneFor(
                  activity.startDate,
                  activity.finishDate,
                  activity.activityStatus,
                );
                const linked = getActionsForActivity(activity.activityId);
                const displayStatus =
                  activity.activityStatus === "Complete"
                    ? "Completed"
                    : activity.activityStatus || "Ready";
                return {
                  id: activity.activityId,
                  name: activity.activityName,
                  startDate: activity.startDate,
                  endDate: activity.finishDate,
                  duration: activity.duration || "",
                  ragZone: rag.zone,
                  ragColor: rag.color,
                  actions: linked.length,
                  status: displayStatus,
                  statusType: statusTypeFor(displayStatus),
                  owner: {
                    initials: ownerInitials,
                    name: ownerName,
                    color: COLORS.blue,
                  },
                  notes: "",
                  linkedActionsData: linked.map((a) => ({
                    _id: a._id,
                    title: a.title,
                    status: a.status,
                    dueDate: a.dueDate,
                    assignee: a.assignee,
                  })),
                };
              });

              const totalPages = Math.ceil(mapped.length / activitiesPerPage);
              const startIndex = (activitiesPage - 1) * activitiesPerPage;
              const pageItems = mapped.slice(
                startIndex,
                startIndex + activitiesPerPage,
              );

              let readyCount = 0;
              let atRiskCount = 0;
              let blockedCount = 0;
              let completeCount = 0;
              mapped.forEach((m) => {
                switch (m.status) {
                  case "Ready":
                    readyCount++;
                    break;
                  case "At Risk":
                    atRiskCount++;
                    break;
                  case "Blocked":
                    blockedCount++;
                    break;
                  case "Complete":
                  case "Completed":
                    completeCount++;
                    break;
                  // Unassigned (untriaged) is deliberately uncounted — it is
                  // not Ready. Chips will not sum to the total.
                }
              });
              const now = new Date();
              const lastUpdatedStr =
                now.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }) +
                ", " +
                now.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

              return (
                <Box sx={{ mb: 3 }}>
                  <ActivitiesTable
                    activities={pageItems}
                    currentPage={activitiesPage}
                    totalPages={totalPages}
                    totalActivities={mapped.length}
                    onPageChange={setActivitiesPage}
                    activitiesPerPage={activitiesPerPage}
                  />
                  <AdminActivitiesSummary
                    totalActivities={mapped.length}
                    readyCount={readyCount}
                    atRiskCount={atRiskCount}
                    blockedCount={blockedCount}
                    completeCount={completeCount}
                    lastUpdated={lastUpdatedStr}
                  />
                </Box>
              );
            })()}
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
