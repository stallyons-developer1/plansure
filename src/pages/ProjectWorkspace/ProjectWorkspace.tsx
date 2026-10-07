import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  VisibilityOutlined as ViewIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { COLORS } from "../../constants/colors";
import { projectAPI, programmeAPI, actionAPI } from "../../services/api";
import ActionDetailsDialog from "../../components/ActionDetailsDialog";
import BlockedActivitiesTable from "../../components/BlockedActivitiesTable";
import { useAuth } from "../../context/AuthContext";
import completeIcon from "../../assets/Frame.png";
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

const wkParseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const months: { [key: string]: number } = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
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
  const { user: currentUser } = useAuth();
  const [programmeName, setProgrammeName] = useState("");
  /* Held so the action list can be refreshed after one is completed, without
     reloading the whole workspace. */
  const [programmeId, setProgrammeId] = useState<string | null>(null);
  const [actionDetailId, setActionDetailId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [startingExecution, setStartingExecution] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [actionToComplete, setActionToComplete] = useState<{
    _id: string;
    title: string;
  } | null>(null);
  const [completeNote, setCompleteNote] = useState("");
  /* Rob asked for the date the work was actually finished, which is often
     before anyone gets to the app. Today is the common case, so it starts
     there. */
  const [completeDate, setCompleteDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [completeLoading, setCompleteLoading] = useState(false);

  const handleOpenCompleteConfirm = (action: {
    _id: string;
    title: string;
  }) => {
    setActionToComplete(action);
    setCompleteNote("");
    setCompleteDate(new Date().toLocaleDateString("en-CA"));
    setCompleteConfirmOpen(true);
  };

  const handleCloseCompleteConfirm = () => {
    setCompleteConfirmOpen(false);
    setActionToComplete(null);
    setCompleteNote("");
    setCompleteDate(new Date().toLocaleDateString("en-CA"));
  };

  const handleConfirmComplete = async () => {
    if (!actionToComplete) return;
    setCompleteLoading(true);
    try {
      const response = await actionAPI.complete(
        actionToComplete._id,
        completeNote,
        completeDate,
      );
      if (response?.success) {
        if (programmeId) {
          const actionsRes = await actionAPI.getByProgramme(programmeId);
          if (actionsRes.success) {
            setProjectActions(actionsRes.actions || []);
          }
        }
        handleCloseCompleteConfirm();
      }
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "This action could not be completed.";
      setToastMessage(message);
    } finally {
      setCompleteLoading(false);
    }
  };

  /* The one cycle step a User may take. Everything else — opening the week,
     marking it Close-Out Eligible, closing it — stays with the Planner and the
     PM, and the server refuses it here. */
  const handleStartExecution = async () => {
    if (!programmeId) return;
    setStartingExecution(true);
    try {
      const response = await programmeAPI.updateCycleStatus(
        programmeId,
        "Execution",
      );
      if (response?.success) {
        setCurrentStep(3);
        const wcRes = await programmeAPI.getWeeklyControl(programmeId);
        setWeeklyControl(wcRes || null);
      } else {
        setToastMessage("Execution could not be started. Please try again.");
      }
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Execution could not be started. Please try again.";
      setToastMessage(message);
    } finally {
      setStartingExecution(false);
    }
  };
  /* Which week of the project's cycle the current programme is. Sequential and
     set at upload — weeks-status counts within one programme and restarts at 1
     for every new week, so it cannot answer this. */
  const [programmeWeek, setProgrammeWeek] = useState<number | null>(null);
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
      type?: string;
      priority?: string;
      createdBy?: { _id?: string };
    }>
  >([]);
  /* Mirrors what GET /:id/weekly-control returns, which is everything the
     Weekly Control tab shows. Every field is optional so a partial response
     renders rather than throwing. */
  const [weeklyControl, setWeeklyControl] = useState<{
    stats?: {
      cycleStatus?: string;
      inLookahead?: number;
      ready?: number;
      complete?: number;
      blocked?: number;
      openActions?: number;
      overdue?: number;
      readyToClose?: string;
    };
    ragDistribution?: {
      green?: number;
      amber?: number;
      red?: number;
      grey?: number;
    };
    actionsByStatus?: {
      open?: number;
      inProgress?: number;
      closed?: number;
      pmOverride?: number;
      overdue?: number;
    };
    activityCounts?: {
      completed?: number;
      noAction?: number;
      blocked?: number;
      atRisk?: number;
    };
    requiredActionsByStatus?: { open?: number; inProgress?: number };
    blockedRiskActivities?: Array<{
      activityId: string;
      activityName: string;
      ragStatus: string;
      activityStatus: string;
      owner: string;
      blocker: string;
      isBlocked?: boolean;
      linkedAction: {
        actionId: string;
        title?: string;
        status: string;
      } | null;
      startDate?: string;
      finishDate?: string;
    }>;
    weekInfo?: {
      weekNumber?: number;
      currentWeekNumber?: number;
      dateRange?: string;
      totalActivities?: number;
      totalWeeks?: number;
      closedWeeksCount?: number;
    } | null;
    isProjectEnded?: boolean;
  } | null>(null);
  /* How many weeks the superseded programme had closed — see headerWeekNum. */
  const [supersededClosedCount, setSupersededClosedCount] = useState<
    number | null
  >(null);
  /* Which project week the superseded programme was. closedWeeks counts inside
     that one programme and every week gets its own, so it cannot say which week
     of the project has just finished. */
  const [supersededWeek, setSupersededWeek] = useState<number | null>(null);
  const [weeksStatus, setWeeksStatus] = useState<{
    totalWeeks?: number;
    closedWeeksCount?: number;
    weeks?: Array<{
      weekNumber?: number;
      isClosed?: boolean;
      closedAt?: string;
    }>;
  } | null>(null);

  /* Same derivation as the Admin and Planner workspaces: the first week not
     yet closed is the week in progress.

     weeks-status is only fetched for a live programme, so once the cycle has
     moved on and the next programme is not uploaded there is nothing left to
     read and the count carries it instead. weekInfo.currentWeekNumber is a
     calendar count from the programme start, which on a project whose
     activities have not begun stays at 1 however many weeks are closed — it
     is a last resort, not the source of truth. */
  /* Upload refuses unless the previous week is closed, so weekNumber - 1
     weeks are closed by definition. */
  const headerWeekNum =
    programmeWeek ??
    (supersededWeek !== null ? supersededWeek + 1 : null) ??
    weeksStatus?.weeks?.find((w) => !w.isClosed)?.weekNumber ??
    weeksStatus?.totalWeeks ??
    (supersededClosedCount !== null
      ? supersededClosedCount + 1
      : (weeklyControl?.weekInfo?.currentWeekNumber ?? 1));

  const headerClosedCount = programmeWeek
    ? programmeWeek - 1
    : supersededWeek !== null
      ? supersededWeek
      : (weeksStatus?.closedWeeksCount ?? supersededClosedCount ?? 0);

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
    "Open Meeting",
    "Upload a programme",
    "Execution",
    "Close-Out Eligible",
    "Closed",
  ];

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
          /* The cycle has moved past this programme and the next one has not
             been uploaded yet. Showing its activities would present a closed
             week's data as current — the defect QA raised, where every account
             except the one that closed the week kept seeing the old data. */
          if (programme.awaitingNextUpload) {
            setActivities([]);
            setProgrammeName("");
            setProgrammeWeek(null);
            setSupersededClosedCount(programme.closedWeeks?.length ?? 0);
            setSupersededWeek(programme.weekNumber ?? null);
            return;
          }
          setSupersededClosedCount(null);
          setSupersededWeek(null);
          setProgrammeWeek(programme.weekNumber ?? null);
          const activitiesData = programme.extractedData?.activities || [];

          setActivities(activitiesData);
          setUploaderName(programme.uploadedBy?.name || "");
          setProgrammeName(programme.name || programme.originalFileName || "");

          setCurrentStep(stepFromCycleStatus(programme.cycleStatus));

          try {
            setProgrammeId(programme._id);
            const actionsRes = await actionAPI.getByProgramme(programme._id);
            if (actionsRes.success) {
              setProjectActions(actionsRes.actions || []);
            }
          } catch (err) {
            console.error("Failed to fetch actions:", err);
          }

          try {
            const wcRes = await programmeAPI.getWeeklyControl(programme._id);
            setWeeklyControl(wcRes || null);
          } catch (err) {
            console.error("Failed to fetch weekly control:", err);
          }

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
                  Week {headerWeekNum} ({headerClosedCount} closed)
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
            <Tab label="Actions" />
            <Tab label="Weekly Control" />
          </Tabs>
        </Box>

        {activeTab === 0 &&
          (() => {
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
                      (a) =>
                        a.activityStatus === "Complete" ||
                        a.activityStatus === "Completed" ||
                        a.ragStatus === "Blue",
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
                {
                  week: "Week 1",
                  label: "Committed",
                  color: COLORS.green,
                  weekNum: 1,
                },
                {
                  week: "Week 2",
                  label: "Committed",
                  color: COLORS.green,
                  weekNum: 2,
                },
                {
                  week: "Week 3",
                  label: "Readiness",
                  color: COLORS.amber,
                  weekNum: 3,
                },
                {
                  week: "Week 4",
                  label: "Readiness",
                  color: COLORS.amber,
                  weekNum: 4,
                },
                {
                  week: "Week 5",
                  label: "Strategic",
                  color: COLORS.red,
                  weekNum: 5,
                },
                {
                  week: "Week 6",
                  label: "Strategic",
                  color: COLORS.red,
                  weekNum: 6,
                },
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
                return {
                  zone: `Week ${weekNum}`,
                  color: "muted",
                  beyond: true,
                };
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

              const mapped: TableActivity[] = withinLookahead.map(
                (activity) => {
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
                },
              );

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
                    onActionClick={(a) => setActionDetailId(a._id)}
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

        {activeTab === 3 &&
          (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue = (a: { status: string; dueDate?: string }) =>
              a.status !== "Completed" &&
              a.status !== "PM Override" &&
              !!a.dueDate &&
              new Date(a.dueDate) < today;

            const stats = [
              {
                label: "Total",
                value: projectActions.length,
                color: COLORS.textPrimary,
              },
              {
                label: "Open",
                value: projectActions.filter((a) => a.status === "Open").length,
                color: COLORS.blue,
              },
              {
                label: "In Progress",
                value: projectActions.filter((a) => a.status === "In Progress")
                  .length,
                color: COLORS.amber,
              },
              {
                label: "Closed",
                value: projectActions.filter(
                  (a) => a.status === "Completed" || a.status === "PM Override",
                ).length,
                color: COLORS.green,
              },
              {
                label: "Overdue Actions",
                value: projectActions.filter(isOverdue).length,
                color: COLORS.red,
              },
            ];

            const COLUMNS =
              "80px minmax(180px, 1fr) 140px 90px 140px 105px 110px 95px 100px";

            /* The guards the server actually enforces, so the control is only
               offered where it will work. The cycle stage is deliberately not
               among them: completing an action was never gated on execution
               server-side, and a User cannot start execution themselves, so
               the old check left them unable to close their own work. */
            const blockedReason = (a: {
              status: string;
              createdAt?: string;
              assignee?: { _id?: string };
              createdBy?: { _id?: string };
            }): string | null => {
              if (a.status === "Completed") return "Already completed";
              if (a.status === "PM Override")
                return "Force-closed by PM Override — cannot be completed";
              if (isActionFromClosedWeek(a))
                return "Cannot complete an action from a closed week";
              const me = String(currentUser?.id || "");
              const mine =
                String(a.assignee?._id || "") === me ||
                String(a.createdBy?._id || "") === me;
              if (!mine)
                return "Only the assignee or the person who raised it can complete this action";
              return null;
            };
            const canComplete = (a: Parameters<typeof blockedReason>[0]) =>
              blockedReason(a) === null;

            return (
              <Box>
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
                  {stats.map((stat) => (
                    <Box
                      key={stat.label}
                      sx={{
                        bgcolor: COLORS.bgSecondary,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "12px",
                        py: 2,
                        px: 2,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          color: stat.color,
                          fontSize: 24,
                          fontWeight: 600,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        sx={{ color: COLORS.textMuted, fontSize: 12, mt: 0.5 }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box
                  sx={{
                    bgcolor: COLORS.bgSecondary,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "12px",
                    overflowX: "auto",
                  }}
                >
                  <Box sx={{ minWidth: "fit-content" }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: COLUMNS,
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        borderBottom: `1px solid ${COLORS.border}`,
                        minWidth: 1040,
                      }}
                    >
                      {[
                        "ACTION ID",
                        "ACTION TITLE",
                        "LINKED ACTIVITY",
                        "TYPE",
                        "ASSIGNEE",
                        "DUE DATE",
                        "STATUS",
                        "PRIORITY",
                        "ACTIONS",
                      ].map((header) => (
                        <Typography
                          key={header}
                          sx={{
                            color: COLORS.textMuted,
                            fontSize: "12px",
                            fontWeight: 600,
                            letterSpacing: "0.5px",
                            textAlign: "center",
                          }}
                        >
                          {header}
                        </Typography>
                      ))}
                    </Box>

                    {projectActions.length === 0 ? (
                      <Typography
                        sx={{
                          color: COLORS.textMuted,
                          fontSize: 14,
                          textAlign: "center",
                          py: 5,
                        }}
                      >
                        No actions on this project yet.
                      </Typography>
                    ) : (
                      projectActions.map((action, index) => (
                        <Box
                          key={action._id}
                          onClick={() => setActionDetailId(action._id)}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: COLUMNS,
                            gap: 1.5,
                            px: 2,
                            py: 2,
                            alignItems: "center",
                            minWidth: 1040,
                            cursor: "pointer",
                            borderBottom:
                              index < projectActions.length - 1
                                ? `1px solid ${COLORS.border}`
                                : "none",
                            "&:hover": { bgcolor: COLORS.bgTertiary },
                          }}
                        >
                          <Typography
                            sx={{
                              color: COLORS.blue,
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            {action._id.slice(-6).toUpperCase()}
                          </Typography>
                          <Typography
                            sx={{ color: COLORS.textPrimary, fontSize: 13 }}
                          >
                            {action.title}
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            {action.linkedActivity?.activityId || "-"}
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            {action.type || "-"}
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            {action.assignee?.name || "-"}
                          </Typography>
                          <Typography
                            sx={{
                              color: isOverdue(action)
                                ? COLORS.red
                                : COLORS.textSecondary,
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            {action.dueDate
                              ? new Date(action.dueDate).toLocaleDateString(
                                  "en-GB",
                                )
                              : "-"}
                          </Typography>
                          <Box
                            sx={{ display: "flex", justifyContent: "center" }}
                          >
                            {(() => {
                              /* Same precedence the Planner uses: an override
                                 or an overdue date outranks the stored status. */
                              let label = action.status;
                              let bg = COLORS.bgTertiary;
                              let fg = COLORS.textSecondary;
                              if (action.status === "PM Override") {
                                label = "PM Override";
                                bg = `${COLORS.amber}25`;
                                fg = COLORS.amber;
                              } else if (
                                isActionFromClosedWeek(action) &&
                                action.status !== "Completed" &&
                                action.type !== "Optional"
                              ) {
                                label = "PM Override";
                                bg = `${COLORS.amber}25`;
                                fg = COLORS.amber;
                              } else if (isOverdue(action)) {
                                label = "Overdue";
                                bg = `${COLORS.red}25`;
                                fg = COLORS.red;
                              } else if (action.status === "Open") {
                                bg = `${COLORS.blue}25`;
                                fg = COLORS.blue;
                              } else if (action.status === "In Progress") {
                                bg = `${COLORS.amber}25`;
                                fg = COLORS.amber;
                              } else if (action.status === "Completed") {
                                bg = `${COLORS.green}25`;
                                fg = COLORS.green;
                              }
                              return (
                                <Box
                                  sx={{
                                    bgcolor: bg,
                                    color: fg,
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: "5px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {label}
                                </Box>
                              );
                            })()}
                          </Box>
                          <Box
                            sx={{ display: "flex", justifyContent: "center" }}
                          >
                            <Box
                              sx={{
                                bgcolor:
                                  action.priority === "Required"
                                    ? `${COLORS.red}20`
                                    : action.priority === "Low"
                                      ? `${COLORS.green}20`
                                      : `${COLORS.amber}20`,
                                color:
                                  action.priority === "Required"
                                    ? COLORS.red
                                    : action.priority === "Low"
                                      ? COLORS.green
                                      : COLORS.amber,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: "5px",
                                fontSize: "12px",
                                fontWeight: 500,
                              }}
                            >
                              {action.priority || "-"}
                            </Box>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 1.5,
                            }}
                          >
                            <ViewIcon
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionDetailId(action._id);
                              }}
                              titleAccess="View details"
                              sx={{
                                fontSize: 18,
                                color: COLORS.textMuted,
                                cursor: "pointer",
                                opacity: 0.7,
                                /* Opacity only, as in the Admin and Planner
                                   action tables — their icons are images and
                                   cannot recolour, so nothing else does. */
                                "&:hover": { opacity: 1 },
                              }}
                            />
                            <Box
                              component="img"
                              src={completeIcon}
                              onClick={(e) => {
                                e.stopPropagation();
                                const reason = blockedReason(action);
                                if (reason) {
                                  setToastMessage(reason);
                                  return;
                                }
                                handleOpenCompleteConfirm({
                                  _id: action._id,
                                  title: action.title,
                                });
                              }}
                              title={
                                blockedReason(action) || "Mark as complete"
                              }
                              sx={{
                                width: 16,
                                height: 16,
                                cursor: canComplete(action)
                                  ? "pointer"
                                  : "not-allowed",
                                opacity: canComplete(action) ? 0.7 : 0.3,
                                "&:hover": {
                                  opacity: canComplete(action) ? 1 : 0.3,
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })()}

        {activeTab === 4 &&
          (() => {
            const st = weeklyControl?.stats;
            const rag = weeklyControl?.ragDistribution;
            const abs = weeklyControl?.actionsByStatus;
            const req = weeklyControl?.requiredActionsByStatus;
            const info = weeklyControl?.weekInfo;
            const cycleStatus =
              st?.cycleStatus || steps[currentStep - 1] || "-";
            const canStart = currentStep === 2;
            const openRequired = (req?.open ?? 0) + (req?.inProgress ?? 0);

            const tip = {
              tooltip: {
                sx: {
                  bgcolor: COLORS.bgSecondary,
                  color: COLORS.textPrimary,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: "12px",
                  maxWidth: 250,
                  p: 1,
                },
              },
              arrow: { sx: { color: COLORS.bgSecondary } },
            };

            const stats = [
              {
                label: "Cycle Status",
                value: cycleStatus,
                color: COLORS.textPrimary,
              },
              {
                label: "In Lookahead",
                value: st?.inLookahead ?? 0,
                color: COLORS.blue,
              },
              { label: "Ready", value: st?.ready ?? 0, color: COLORS.green },
              {
                label: "Completed",
                value: st?.complete ?? 0,
                color: COLORS.blue,
              },
              { label: "Blocked", value: st?.blocked ?? 0, color: COLORS.red },
              {
                label: "Open Actions",
                value: st?.openActions ?? 0,
                color: COLORS.blue,
              },
              { label: "Overdue", value: st?.overdue ?? 0, color: COLORS.red },
              {
                label: "Ready to Close",
                value: st?.readyToClose ?? "-",
                color: st?.readyToClose === "Yes" ? COLORS.green : COLORS.red,
              },
            ];

            /* Colours and wording taken from the Planner's chart so the two
               are the same picture. */
            const ragBands = [
              {
                label: "Green",
                value: rag?.green ?? 0,
                color: "#22C55E",
                tooltip: "Ready - Activities that are ready to proceed",
              },
              {
                label: "Amber",
                value: rag?.amber ?? 0,
                color: "#F59E0B",
                tooltip: "At Risk - Activities that are at risk or overdue",
              },
              {
                label: "Red",
                value: rag?.red ?? 0,
                color: "#EF4444",
                tooltip: "Blocked - Activities that are blocked",
              },
            ];
            const grey = rag?.grey ?? 0;
            const ragTotal = ragBands.reduce((sum, d) => sum + d.value, 0);

            const bars = [
              {
                label: "Open",
                value: abs?.open ?? 0,
                color: COLORS.blue,
                tooltip:
                  "Open - Actions that are newly created and need to be addressed",
              },
              {
                label: "Ready",
                value: abs?.inProgress ?? 0,
                color: COLORS.amber,
                tooltip: "Ready - Actions that are currently in progress",
              },
              {
                label: "Completed",
                value: abs?.closed ?? 0,
                color: COLORS.green,
                tooltip:
                  "Completed - Actions that have been successfully completed",
              },
              {
                label: "Overdue",
                value: abs?.overdue ?? 0,
                color: COLORS.red,
                tooltip:
                  "Overdue - Actions that are past their due date and need immediate attention",
              },
            ];
            const maxValue = Math.max(...bars.map((b) => b.value), 1);
            const yAxisMax = Math.max(Math.ceil(maxValue * 1.2), 4);
            const stepCount = Math.min(yAxisMax, 5);
            const stepSize = Math.ceil(yAxisMax / stepCount);
            const actualMax = stepSize * stepCount;
            const yAxisSteps: number[] = [];
            for (let i = stepCount; i >= 0; i--) yAxisSteps.push(i * stepSize);

            const panel = {
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              p: 3,
            };
            const heading = {
              color: COLORS.textPrimary,
              fontSize: 14,
              fontWeight: 600,
              mb: 2,
            };

            return (
              <Box>
                <Box
                  sx={{
                    bgcolor: "rgba(59, 130, 246, 0.1)",
                    border: `1px solid ${COLORS.blue}`,
                    borderRadius: "12px",
                    p: 2,
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "16px",
                      fontWeight: 600,
                    }}
                  >
                    Week {headerWeekNum} Data
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                  >
                    {info?.dateRange || "-"} • {info?.totalActivities ?? 0}{" "}
                    activities this week
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      sm: "repeat(4, 1fr)",
                      lg: "repeat(8, 1fr)",
                    },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  {stats.map((c) => (
                    <StatCard
                      key={c.label}
                      label={c.label}
                      value={c.value}
                      valueColor={c.color}
                    />
                  ))}
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 3,
                    mb: 3,
                  }}
                >
                  <Box sx={panel}>
                    <Typography sx={heading}>RAG Distribution</Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: 200,
                      }}
                    >
                      <svg width="180" height="180" viewBox="0 0 180 180">
                        {(() => {
                          const segments = ragBands.filter((d) => d.value > 0);
                          if (segments.length === 0 && grey > 0) {
                            segments.push({
                              label: "Grey",
                              value: grey,
                              color: "#6B7280",
                              tooltip:
                                "Unassigned - Activities awaiting triage (no action assigned yet)",
                            });
                          }
                          const total = segments.reduce(
                            (sum, d) => sum + d.value,
                            0,
                          );
                          if (total === 0) return null;

                          const strokeWidth = 28;
                          const radius = (180 - strokeWidth) / 2;
                          const center = 90;
                          let currentAngle = -90;

                          if (segments.length === 1) {
                            return (
                              <Tooltip
                                title={segments[0].tooltip}
                                placement="top"
                                arrow
                                slotProps={tip}
                              >
                                <circle
                                  cx={center}
                                  cy={center}
                                  r={radius}
                                  fill="none"
                                  stroke={segments[0].color}
                                  strokeWidth={strokeWidth}
                                  style={{ cursor: "pointer" }}
                                />
                              </Tooltip>
                            );
                          }

                          return segments.map((segment, i) => {
                            const sweepAngle = (segment.value / total) * 360;
                            const startAngle = currentAngle;
                            const endAngle = startAngle + sweepAngle;
                            currentAngle = endAngle;

                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;
                            const x1 = center + radius * Math.cos(startRad);
                            const y1 = center + radius * Math.sin(startRad);
                            const x2 = center + radius * Math.cos(endRad);
                            const y2 = center + radius * Math.sin(endRad);
                            const largeArc = sweepAngle > 180 ? 1 : 0;

                            return (
                              <Tooltip
                                key={i}
                                title={segment.tooltip}
                                placement="top"
                                arrow
                                slotProps={tip}
                              >
                                <path
                                  d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                                  fill="none"
                                  stroke={segment.color}
                                  strokeWidth={strokeWidth}
                                  style={{ cursor: "pointer" }}
                                />
                              </Tooltip>
                            );
                          });
                        })()}
                      </svg>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 3,
                        mt: 2,
                      }}
                    >
                      {ragBands.map((d) => (
                        <Tooltip
                          key={d.label}
                          title={d.tooltip}
                          placement="bottom"
                          arrow
                          slotProps={tip}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              cursor: "pointer",
                            }}
                          >
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                bgcolor: d.color,
                              }}
                            />
                            <Typography
                              sx={{ color: COLORS.textSecondary, fontSize: 12 }}
                            >
                              {d.label} (
                              {ragTotal > 0
                                ? Math.round((d.value / ragTotal) * 100)
                                : 0}
                              %)
                            </Typography>
                          </Box>
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>

                  <Box sx={panel}>
                    <Typography sx={heading}>Actions by Status</Typography>
                    <Box sx={{ display: "flex", height: 200 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          height: "100%",
                          pr: 1,
                          pb: 2,
                        }}
                      >
                        {yAxisSteps.map((val, idx) => (
                          <Typography
                            key={idx}
                            sx={{
                              color: COLORS.textMuted,
                              fontSize: "10px",
                              lineHeight: 1,
                              textAlign: "right",
                              minWidth: 16,
                            }}
                          >
                            {val}
                          </Typography>
                        ))}
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            position: "relative",
                            borderLeft: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {yAxisSteps.map((_, i) => (
                            <Box
                              key={i}
                              sx={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: `${(i / (yAxisSteps.length - 1)) * 100}%`,
                                borderTop: `1px solid ${COLORS.border}`,
                                opacity: 0.3,
                              }}
                            />
                          ))}
                          <Box
                            sx={{
                              display: "flex",
                              height: "100%",
                              alignItems: "flex-end",
                              justifyContent: "space-evenly",
                            }}
                          >
                            {bars.map((bar, i) => (
                              <Tooltip
                                key={i}
                                title={bar.tooltip}
                                placement="top"
                                arrow
                                slotProps={tip}
                              >
                                <Box
                                  sx={{
                                    width: 60,
                                    height:
                                      bar.value > 0
                                        ? `${(bar.value / actualMax) * 100}%`
                                        : 0,
                                    bgcolor: bar.color,
                                    borderRadius: "4px 4px 0 0",
                                    minHeight: bar.value > 0 ? 8 : 0,
                                    cursor: "pointer",
                                  }}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-evenly",
                            pt: 1,
                            borderTop: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {bars.map((bar) => (
                            <Tooltip
                              key={bar.label}
                              title={bar.tooltip}
                              placement="bottom"
                              arrow
                              slotProps={tip}
                            >
                              <Typography
                                sx={{
                                  color: COLORS.textMuted,
                                  fontSize: "10px",
                                  width: 60,
                                  textAlign: "center",
                                  cursor: "pointer",
                                }}
                              >
                                {bar.label}
                              </Typography>
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <BlockedActivitiesTable
                    activities={weeklyControl?.blockedRiskActivities || []}
                    cycleStatus={cycleStatus}
                    isProjectEnded={weeklyControl?.isProjectEnded}
                  />
                </Box>

                <Box sx={panel}>
                  <Typography sx={heading}>Cycle Control</Typography>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: 13,
                      mt: -1.5,
                      mb: 2,
                    }}
                  >
                    {currentStep >= 3
                      ? "Execution in progress. Monitor activities and actions."
                      : "Start execution to begin work on this week."}
                  </Typography>

                  {openRequired > 0 && (
                    <Box
                      sx={{
                        bgcolor: `${COLORS.amber}15`,
                        border: `1px solid ${COLORS.amber}`,
                        borderRadius: "8px",
                        px: 2,
                        py: 1.5,
                        mb: 2,
                        color: COLORS.amber,
                        fontSize: 13,
                      }}
                    >
                      {openRequired} open required action(s) need to be
                      completed before closing.
                    </Box>
                  )}

                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <Button
                      onClick={() => setActiveTab(3)}
                      sx={{
                        bgcolor: COLORS.blue,
                        color: "#fff",
                        textTransform: "none",
                        px: 2.5,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: 13,
                        fontWeight: 500,
                        "&:hover": { bgcolor: COLORS.blueHover },
                      }}
                    >
                      Go to Actions
                    </Button>

                    {currentStep < 3 && (
                      <Button
                        onClick={handleStartExecution}
                        disabled={!canStart || startingExecution}
                        title={
                          canStart
                            ? "Start execution for this week"
                            : "The week has to be opened first"
                        }
                        sx={{
                          bgcolor: COLORS.green,
                          color: "#fff",
                          textTransform: "none",
                          px: 2.5,
                          py: 1,
                          borderRadius: "8px",
                          fontSize: 13,
                          fontWeight: 500,
                          "&:hover": { bgcolor: "#16a34a" },
                          "&.Mui-disabled": {
                            bgcolor: "#3a3a3a",
                            color: "#666",
                          },
                        }}
                      >
                        {startingExecution ? (
                          <CircularProgress size={18} sx={{ color: "#fff" }} />
                        ) : (
                          "Start Execution"
                        )}
                      </Button>
                    )}
                  </Box>

                  <Typography
                    sx={{ color: COLORS.textMuted, fontSize: 12, mt: 2 }}
                  >
                    Marking the week Close-Out Eligible, closing and locking it,
                    and PM Override are carried out by the PM.
                  </Typography>
                </Box>
              </Box>
            );
          })()}
      </Box>

      {/* Opened from the Activities table or the Actions tab. A User closes
          their own work from here. */}
      <ActionDetailsDialog
        open={actionDetailId !== null}
        actionId={actionDetailId}
        onCompleted={async () => {
          if (!programmeId) return;
          try {
            const actionsRes = await actionAPI.getByProgramme(programmeId);
            if (actionsRes.success) {
              setProjectActions(actionsRes.actions || []);
            }
          } catch (err) {
            console.error("Failed to refresh actions:", err);
          }
        }}
        onClose={() => setActionDetailId(null)}
      />

      {/* Position and colouring copied from the Planner workspace so the same
          message looks the same whoever sees it. */}

      {/* Complete Action Confirmation Modal — the same shape and wording the
          Planner uses, so closing an action feels identical whoever does it. */}
      <Dialog
        open={completeConfirmOpen}
        onClose={handleCloseCompleteConfirm}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.8)" } },
          paper: {
            sx: {
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              backgroundImage: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Complete Action
          </Typography>
          <IconButton
            onClick={handleCloseCompleteConfirm}
            sx={{ color: COLORS.textMuted, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src={completeIcon}
                sx={{
                  width: 28,
                  height: 28,
                  filter:
                    "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(5323%) hue-rotate(107deg) brightness(92%) contrast(88%)",
                }}
              />
            </Box>
            <Box>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Are you sure you want to complete this action?
              </Typography>
              <Typography
                sx={{ color: COLORS.textMuted, fontSize: "13px", mt: 0.5 }}
              >
                {actionToComplete?.title}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
              }}
            >
              Closure Narrative{" "}
              <Box component="span" sx={{ color: COLORS.red }}>
                *
              </Box>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="What was the response or outcome? (required)"
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: COLORS.bgPrimary,
                  borderRadius: "8px",
                  "& fieldset": { borderColor: COLORS.border },
                  "&:hover fieldset": { borderColor: COLORS.border },
                  "&.Mui-focused fieldset": {
                    borderColor: COLORS.blue,
                    borderWidth: 1,
                  },
                },
                "& .MuiOutlinedInput-input": {
                  color: COLORS.textPrimary,
                  fontSize: "14px",
                },
              }}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
              }}
            >
              Completion Date{" "}
              <Box component="span" sx={{ color: COLORS.red }}>
                *
              </Box>
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={completeDate}
              onChange={(e) => setCompleteDate(e.target.value)}
              slotProps={{
                htmlInput: { max: new Date().toLocaleDateString("en-CA") },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: COLORS.bgPrimary,
                  borderRadius: "8px",
                  "& fieldset": { borderColor: COLORS.border },
                  "&:hover fieldset": { borderColor: COLORS.border },
                  "&.Mui-focused fieldset": {
                    borderColor: COLORS.blue,
                    borderWidth: 1,
                  },
                },
                "& .MuiOutlinedInput-input": {
                  color: completeDate ? COLORS.textPrimary : COLORS.textMuted,
                  fontSize: "14px",
                  py: 1.2,
                  "&::-webkit-calendar-picker-indicator": {
                    filter: "invert(1)",
                    cursor: "pointer",
                    opacity: 0.6,
                  },
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
          <Button
            onClick={handleCloseCompleteConfirm}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.bgPrimary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 1,
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": { bgcolor: COLORS.bgTertiary },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmComplete}
            disabled={
              completeLoading ||
              completeNote.trim().length < 10 ||
              !completeDate
            }
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.green,
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": { bgcolor: "#16a34a" },
              "&:disabled": { bgcolor: COLORS.green, opacity: 0.7 },
            }}
          >
            {completeLoading ? (
              <CircularProgress size={20} sx={{ color: COLORS.white }} />
            ) : (
              "Yes, Complete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastMessage !== ""}
        autoHideDuration={4000}
        onClose={() => setToastMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToastMessage("")}
          severity="warning"
          sx={{
            bgcolor: COLORS.amber,
            color: "#000",
            fontWeight: 500,
            "& .MuiAlert-icon": { color: "#000" },
          }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
