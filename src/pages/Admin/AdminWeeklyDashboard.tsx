import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Avatar,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  KeyboardArrowDown as ArrowDownIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import {
  dashboardAPI,
  projectAPI,
  programmeAPI,
  actionAPI,
  userAPI,
} from "../../services/api";
import BlockedActivitiesTable from "../../components/BlockedActivitiesTable";
import ClosureOverridePanel from "../../components/ClosureOverridePanel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

interface Project {
  _id: string;
  name: string;
  phase: string;
  status: string;
}

interface WeekStatus {
  weekNumber: number;
  status: "open" | "closed";
  closedAt?: string;
  closedBy?: string;
  closeType?: string;
  canClose?: boolean;
  canCloseReason?: string;
  isClosed?: boolean;
}

interface ActivityByWeek {
  week: string;
  green: number;
  amber: number;
  red: number;
}

interface ActionOwnership {
  discipline: string;
  open: number;
  closed: number;
  overdue: number;
  openActions?: string[];
  closedActions?: string[];
  overdueActions?: string[];
  activityName?: string;
}

interface WeeklyData {
  project: { name: string } | null;
  cycle: {
    weekNumber: string;
    weekDates: string;
    status: string;
    weekOpened: string;
    closeDeadline: string;
    planner: string;
  } | null;
  stats: {
    activitiesInLookahead: number;
    greenActivities: number;
    greenPercentage: number;
    blockedByActions: number;
    openActions: number;
    overdueActions: number;
    openRequiredActions: number;
    readyForClose: boolean;
  };
  ragDistribution: { green: number; amber: number; red: number };
  actionsByStatus: { open: number; closed: number; overdue: number };
  blockedActivities: Array<{
    activityId: string;
    activityName: string;
    ragStatus: string;
    activityStatus: string;
    isBlocked?: boolean;
    owner: string;
    blocker: string;
    linkedAction: {
      actionId: string;
      title: string;
      status: string;
    } | null;
  }>;
  weeklyPlanPreview: Array<{
    activityId: string;
    activityName: string;
    weekZone: string;
    startDate: string;
    finishDate: string;
    duration: string;
    ragStatus: string;
    owner: string;
    activityStatus: string;
    actionsCount?: number;
    openActionsCount?: number;
  }>;
  plannerToDo: Array<{
    activityId: string;
    activityName: string;
    ragStatus: string;
    owner: string;
    todoItem: string;
    actionId?: string;
    actionStatus?: string;
    priority: string;
    dueDate: string;
  }>;
  activitiesByWeek?: ActivityByWeek[];
  actionOwnership?: ActionOwnership[];
  isProjectEnded?: boolean;
}

const CustomLegend = ({
  items,
}: {
  items: { label: string; color: string }[];
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: { xs: "12px", sm: "15px" },
      marginTop: { xs: 2, sm: 3 },
    }}
  >
    {items.map((item) => (
      <Box
        key={item.label}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: "8px", sm: "14px" },
        }}
      >
        <Box
          sx={{
            width: { xs: 40, sm: 56 },
            height: { xs: 14, sm: 18 },
            bgcolor: item.color,
          }}
        />
        <Typography
          sx={{
            color: COLORS.textSecondary,
            fontSize: { xs: "13px", sm: "16px" },
            fontWeight: 500,
          }}
        >
          {item.label}
        </Typography>
      </Box>
    ))}
  </Box>
);

// Custom tooltip for Activities by Week chart
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const green = payload.find((p) => p.dataKey === "green")?.value || 0;
    const amber = payload.find((p) => p.dataKey === "amber")?.value || 0;
    const red = payload.find((p) => p.dataKey === "red")?.value || 0;

    return (
      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "8px",
          p: 1.5,
          minWidth: 100,
        }}
      >
        <Typography
          sx={{
            color: COLORS.textPrimary,
            fontWeight: 600,
            fontSize: "14px",
            mb: 0.5,
          }}
        >
          {label?.replace("Week ", "W")}
        </Typography>
        <Typography sx={{ color: COLORS.amber, fontSize: "13px" }}>
          amber : {amber}
        </Typography>
        <Typography sx={{ color: COLORS.green, fontSize: "13px" }}>
          green : {green}
        </Typography>
        <Typography sx={{ color: COLORS.red, fontSize: "13px" }}>
          red : {red}
        </Typography>
      </Box>
    );
  }
  return null;
};

// Custom tooltip for Actions by Status chart
const ActionsTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const value = payload[0]?.value || 0;
    const color =
      label === "Open"
        ? COLORS.amber
        : label === "Closed"
          ? COLORS.green
          : COLORS.red;

    return (
      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "8px",
          p: 1.5,
          minWidth: 80,
        }}
      >
        <Typography sx={{ color, fontSize: "13px", fontWeight: 600 }}>
          {label}: {value}
        </Typography>
      </Box>
    );
  }
  return null;
};

// Custom tooltip for RAG Distribution pie chart
const RAGTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) => {
  if (active && payload && payload.length) {
    const { name, value: _value } = payload[0];

    const descriptions: Record<string, string> = {
      Green: "Ready - Activities that are ready to proceed",
      Amber: "At Risk - Activities that are at risk or overdue",
      Red: "Blocked - Activities that are blocked",
    };

    return (
      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "8px",
          p: 1.5,
          maxWidth: 220,
        }}
      >
        <Typography sx={{ color: COLORS.textPrimary, fontSize: "13px" }}>
          {descriptions[name] || name}
        </Typography>
      </Box>
    );
  }
  return null;
};

const AdminWeeklyDashboard = () => {
  const navigate = useNavigate();
  const amberColor = "#F59E0B";
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState<WeeklyData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [programmeId, setProgrammeId] = useState<string>("");
  const [_weeksStatus, setWeeksStatus] = useState<WeekStatus[]>([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(1);
  const [activitiesByWeekData, setActivitiesByWeekData] = useState<
    ActivityByWeek[]
  >([]);
  const [actionOwnershipData, setActionOwnershipData] = useState<
    ActionOwnership[]
  >([]);
  const [isClosingWeek, setIsClosingWeek] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  // Assign action modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningActivity, setAssigningActivity] = useState<{
    activityId: string;
    activityName: string;
    startDate?: string;
    finishDate?: string;
  } | null>(null);
  const [assignFormData, setAssignFormData] = useState({
    title: "",
    description: "",
    type: "Required",
    priority: "Medium",
    assignee: "",
    dueDate: "",
  });
  const [assignError, setAssignError] = useState("");
  const [assignSaveLoading, setAssignSaveLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<
    Array<{ _id: string; name: string; email: string }>
  >([]);

  // Reassign action modal state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassigningAction, setReassigningAction] = useState<{
    _id?: string;
    actionId: string;
    title: string;
    currentAssignee?: string;
    currentAssigneeName?: string;
  } | null>(null);
  const [reassignAssignee, setReassignAssignee] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState("");
  const [users, setUsers] = useState<
    Array<{ _id: string; name: string; email: string; role: string }>
  >([]);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await projectAPI.getAll();
        if (res.success) {
          const projectsList = res.projects || [];
          setProjects(projectsList);
          // Select first project by default
          if (projectsList.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projectsList[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch programme when project changes
  useEffect(() => {
    const fetchProgramme = async () => {
      if (!selectedProjectId) {
        setProgrammeId("");
        setWeeksStatus([]);
        setData(null);
        return;
      }

      try {
        const response = await programmeAPI.getByProject(selectedProjectId);
        if (response.success && response.programme) {
          setProgrammeId(response.programme._id);
        } else {
          setProgrammeId("");
          setWeeksStatus([]);
          setData(null);
        }
      } catch (error) {
        console.error("Error fetching programme:", error);
        setProgrammeId("");
        setWeeksStatus([]);
        setData(null);
      }
    };

    fetchProgramme();
  }, [selectedProjectId]);

  // Fetch weeks status when programmeId changes
  useEffect(() => {
    const fetchWeeksStatus = async () => {
      if (!programmeId) {
        setWeeksStatus([]);
        setCurrentWeekNumber(1);
        return;
      }

      try {
        const response = await programmeAPI.getWeeksStatus(programmeId);
        if (response.success && response.weeks) {
          setWeeksStatus(response.weeks);
          // Find the first open week, or default to next week after last closed
          const weeks = response.weeks;
          const firstOpenWeek = weeks.find(
            (w: WeekStatus) => w.status === "open",
          );
          if (firstOpenWeek) {
            setCurrentWeekNumber(firstOpenWeek.weekNumber);
          } else {
            // All weeks are closed, show the last closed week + 1
            const maxClosedWeek = Math.max(
              ...weeks
                .filter((w: WeekStatus) => w.status === "closed")
                .map((w: WeekStatus) => w.weekNumber),
              0,
            );
            setCurrentWeekNumber(maxClosedWeek + 1);
          }
        }
      } catch (error) {
        console.error("Error fetching weeks status:", error);
        setWeeksStatus([]);
        setCurrentWeekNumber(1);
      }
    };

    fetchWeeksStatus();
  }, [programmeId]);

  // Fetch weekly dashboard data when project and week number are set
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProjectId) {
        setData(null);
        return;
      }

      try {
        setLoadingData(true);
        const response = await dashboardAPI.getWeeklyDashboard(
          selectedProjectId,
          currentWeekNumber,
        );
        if (response.success) {
          setData(response.weekly);

          // Set activities by week data if available
          if (response.weekly?.activitiesByWeek) {
            setActivitiesByWeekData(response.weekly.activitiesByWeek);
          }

          // Set action ownership data if available
          if (response.weekly?.actionOwnership) {
            setActionOwnershipData(response.weekly.actionOwnership);
          }
        }
      } catch (error) {
        console.error("Error fetching weekly dashboard:", error);
        setData(null);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [selectedProjectId, currentWeekNumber]);

  // Fetch weekly control data for activities by week chart
  useEffect(() => {
    const fetchWeeklyControlData = async () => {
      if (!programmeId) {
        setActivitiesByWeekData([]);
        setActionOwnershipData([]);
        return;
      }

      try {
        const response = await programmeAPI.getWeeklyControl(
          programmeId,
          currentWeekNumber,
        );
        if (response.success && response.weeklyControl) {
          const wc = response.weeklyControl;

          // Build activities by week data from the response
          if (wc.activitiesByWeek && Array.isArray(wc.activitiesByWeek)) {
            setActivitiesByWeekData(wc.activitiesByWeek);
          }

          // Build action ownership data
          if (wc.actionOwnership && Array.isArray(wc.actionOwnership)) {
            setActionOwnershipData(wc.actionOwnership);
          }
        }
      } catch (error) {
        console.error("Error fetching weekly control data:", error);
      }
    };

    fetchWeeklyControlData();
  }, [programmeId, currentWeekNumber]);

  // Extract discipline from activity name
  const extractDiscipline = (activityName: string): string => {
    const name = (activityName || "").toLowerCase().trim();

    // Construction discipline patterns
    const disciplinePatterns: { [key: string]: string[] } = {
      Structural: [
        "steel",
        "structure",
        "column",
        "beam",
        "slab",
        "concrete",
        "rebar",
        "structural",
        "frame",
        "framing",
      ],
      MEP: [
        "mep",
        "mechanical",
        "hvac",
        "piping",
        "duct",
        "ventilation",
        "air conditioning",
      ],
      Electrical: [
        "electrical",
        "wiring",
        "cable",
        "power",
        "lighting",
        "switchgear",
        "panel",
      ],
      Plumbing: ["plumbing", "pipe", "drainage", "water", "sanitary", "sewer"],
      Civil: [
        "civil",
        "excavation",
        "earthwork",
        "grading",
        "paving",
        "road",
        "site work",
      ],
      Architectural: [
        "architectural",
        "partition",
        "ceiling",
        "flooring",
        "tiling",
        "painting",
        "plastering",
        "drywall",
        "wall",
        "door",
        "window",
      ],
      Facade: [
        "facade",
        "cladding",
        "curtain wall",
        "glazing",
        "external",
        "envelope",
      ],
      Roofing: ["roof", "roofing", "waterproof", "membrane", "insulation"],
      Foundation: ["foundation", "footing", "pile", "piling", "ground"],
      Finishing: [
        "finishing",
        "fit-out",
        "fitout",
        "interior",
        "decoration",
        "paint",
      ],
      Testing: [
        "test",
        "testing",
        "commission",
        "commissioning",
        "inspection",
        "handover",
        "snag",
      ],
      Design: ["design", "drawing", "approval", "permit", "submittal"],
    };

    // Find matching discipline
    for (const [discipline, keywords] of Object.entries(disciplinePatterns)) {
      if (keywords.some((kw) => name.includes(kw))) {
        return discipline;
      }
    }

    return "General";
  };

  // Fetch actions for ownership chart - grouped by DISCIPLINE (work area)
  useEffect(() => {
    const fetchActionsData = async () => {
      if (!programmeId) return;

      try {
        const response = await actionAPI.getByProgramme(programmeId);
        if (response.success && response.actions) {
          // Group actions by DISCIPLINE (extracted from activity name)
          const ownershipMap: {
            [key: string]: {
              open: number;
              closed: number;
              overdue: number;
              openActions: string[];
              closedActions: string[];
              overdueActions: string[];
              activityName: string;
            };
          } = {};
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          response.actions.forEach(
            (action: {
              title?: string;
              assignee?: { name?: string };
              assigneeName?: string;
              linkedActivity?: { activityName?: string };
              status?: string;
              dueDate?: string;
            }) => {
              // Extract discipline from activity name
              const activityName = action.linkedActivity?.activityName || "";
              const discipline = extractDiscipline(activityName);
              const actionName = action.title || "";

              if (!ownershipMap[discipline]) {
                ownershipMap[discipline] = {
                  open: 0,
                  closed: 0,
                  overdue: 0,
                  openActions: [],
                  closedActions: [],
                  overdueActions: [],
                  activityName,
                };
              }

              if (action.status === "Closed" || action.status === "Completed") {
                ownershipMap[discipline].closed++;
                if (actionName)
                  ownershipMap[discipline].closedActions.push(actionName);
              } else {
                const dueDate = action.dueDate
                  ? new Date(action.dueDate)
                  : null;
                if (dueDate && dueDate < today) {
                  ownershipMap[discipline].overdue++;
                  if (actionName)
                    ownershipMap[discipline].overdueActions.push(actionName);
                } else {
                  ownershipMap[discipline].open++;
                  if (actionName)
                    ownershipMap[discipline].openActions.push(actionName);
                }
              }
            },
          );

          const ownershipArray = Object.entries(ownershipMap)
            .map(([discipline, counts]) => ({
              discipline,
              ...counts,
            }))
            .sort(
              (a, b) =>
                b.open + b.closed + b.overdue - (a.open + a.closed + a.overdue),
            ) // Sort by total actions
            .slice(0, 5); // Limit to top 5

          if (ownershipArray.length > 0) {
            setActionOwnershipData(ownershipArray);
          }
        }
      } catch (error) {
        console.error("Error fetching actions:", error);
      }
    };

    fetchActionsData();
  }, [programmeId]);

  // Handler for Close Week - closes 2 weeks and switches to next closable week
  const handleCloseWeek = async () => {
    if (!programmeId || isClosingWeek) return;

    setIsClosingWeek(true);
    try {
      // Close first week
      const response1 = await programmeAPI.closeWeek(
        programmeId,
        currentWeekNumber,
        "Normal Close",
      );

      if (response1.success && !response1.isFullyClosed) {
        // Close the second week - pass isSecondOfPair=true to skip date validation
        await programmeAPI.closeWeek(
          programmeId,
          currentWeekNumber + 1,
          "Normal Close",
          undefined,
          true, // isSecondOfPair - skip date check for second week
        );
      }

      if (response1.success) {
        // Refresh weeks status
        const weeksResponse = await programmeAPI.getWeeksStatus(programmeId);
        if (weeksResponse.success && weeksResponse.weeks) {
          setWeeksStatus(weeksResponse.weeks);

          // Find the next closable week or default to currentWeekNumber + 2
          const nextClosableWeek = weeksResponse.weeks.find(
            (w: WeekStatus) => w.canClose,
          );
          const nextWeekNumber =
            nextClosableWeek?.weekNumber || currentWeekNumber + 2;
          setCurrentWeekNumber(nextWeekNumber);
        } else {
          // Fallback: increment by 2 since we closed 2 weeks
          setCurrentWeekNumber((prev) => prev + 2);
        }
      }
    } catch (error) {
      console.error("Failed to close week:", error);
    } finally {
      setIsClosingWeek(false);
    }
  };

  // Handler for PM Override - closes 2 weeks with override reason and switches to next closable week
  const handlePMOverride = async () => {
    if (!programmeId || isClosingWeek || overrideReason.length < 10) return;

    setIsClosingWeek(true);
    try {
      // Close first week with PM Override
      const response1 = await programmeAPI.closeWeek(
        programmeId,
        currentWeekNumber,
        "PM Override",
        overrideReason,
      );

      if (response1.success && !response1.isFullyClosed) {
        // Close the second week with PM Override - pass isSecondOfPair=true to skip date validation
        await programmeAPI.closeWeek(
          programmeId,
          currentWeekNumber + 1,
          "PM Override",
          overrideReason,
          true, // isSecondOfPair - skip date check for second week
        );
      }

      if (response1.success) {
        // Refresh weeks status
        const weeksResponse = await programmeAPI.getWeeksStatus(programmeId);
        if (weeksResponse.success && weeksResponse.weeks) {
          setWeeksStatus(weeksResponse.weeks);

          // Find the next closable week or default to currentWeekNumber + 2
          const nextClosableWeek = weeksResponse.weeks.find(
            (w: WeekStatus) => w.canClose,
          );
          const nextWeekNumber =
            nextClosableWeek?.weekNumber || currentWeekNumber + 2;
          setCurrentWeekNumber(nextWeekNumber);
        } else {
          // Fallback: increment by 2 since we closed 2 weeks
          setCurrentWeekNumber((prev) => prev + 2);
        }

        // Reset modal state
        setShowOverrideModal(false);
        setOverrideReason("");
      }
    } catch (error) {
      console.error("Failed to close week with override:", error);
    } finally {
      setIsClosingWeek(false);
    }
  };

  // Handler for Open Meeting
  const handleOpenMeeting = async () => {
    if (!programmeId) return;

    try {
      const response = await programmeAPI.updateCycleStatus(
        programmeId,
        "Meeting Open",
      );
      if (response.success) {
        // Refresh dashboard data
        const dashResponse = await dashboardAPI.getWeeklyDashboard(
          selectedProjectId,
          currentWeekNumber,
        );
        if (dashResponse.success) {
          setData(dashResponse.weekly);
        }
      }
    } catch (error) {
      console.error("Failed to open meeting:", error);
    }
  };

  // Handler for Start Execution
  const handleStartExecution = async () => {
    if (!programmeId) return;

    try {
      const response = await programmeAPI.updateCycleStatus(
        programmeId,
        "Execution",
      );
      if (response.success) {
        // Refresh dashboard data
        const dashResponse = await dashboardAPI.getWeeklyDashboard(
          selectedProjectId,
          currentWeekNumber,
        );
        if (dashResponse.success) {
          setData(dashResponse.weekly);
        }
      }
    } catch (error) {
      console.error("Failed to start execution:", error);
    }
  };

  // Fetch team members for assign modal (only active planners)
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await userAPI.getAll({ status: "active" });
        if (response.success) {
          const activeUsers = (response.users || []).filter(
            (user: { role: string; status: string }) =>
              (user.role === "planner" || user.role === "user") &&
              user.status === "active",
          );
          setTeamMembers(activeUsers);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };
    fetchTeamMembers();
  }, []);

  // Fetch all users for reassign modal (only planners, exclude admins)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userAPI.getAll({ status: "active" });
        if (response.success) {
          const plannerUsers = (response.users || []).filter(
            (user: { role: string; status: string }) =>
              (user.role === "planner" || user.role === "user") &&
              user.status === "active",
          );
          setUsers(plannerUsers);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Assign modal handlers
  const handleAssignClose = () => {
    setAssignModalOpen(false);
    setAssigningActivity(null);
    setAssignFormData({
      title: "",
      description: "",
      type: "Required",
      priority: "Medium",
      assignee: "",
      dueDate: "",
    });
    setAssignError("");
  };

  const handleAssignSave = async () => {
    if (!assigningActivity || !programmeId) return;

    setAssignError("");

    if (
      !assignFormData.title ||
      !assignFormData.assignee ||
      !assignFormData.dueDate
    ) {
      setAssignError(
        "Please fill in all required fields (Title, Assignee, Due Date)",
      );
      return;
    }

    setAssignSaveLoading(true);
    try {
      const response = await actionAPI.create({
        programmeId: programmeId,
        linkedActivity: {
          activityId: assigningActivity.activityId,
          activityName: assigningActivity.activityName,
        },
        title: assignFormData.title,
        description: assignFormData.description,
        type: assignFormData.type,
        priority: assignFormData.priority,
        assignee: assignFormData.assignee,
        dueDate: assignFormData.dueDate,
      });

      if (response.success) {
        // Refresh dashboard data
        const dashResponse = await dashboardAPI.getWeeklyDashboard(
          selectedProjectId,
          currentWeekNumber,
        );
        if (dashResponse.success) {
          setData(dashResponse.weekly);
        }
        handleAssignClose();
      }
    } catch (error: unknown) {
      console.error("Failed to create action:", error);
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create action. Please try again.";
      setAssignError(errorMessage);
    } finally {
      setAssignSaveLoading(false);
    }
  };

  const handleAssignChange = (field: string, value: string) => {
    setAssignFormData({ ...assignFormData, [field]: value });
  };

  // Reassign modal handlers
  const handleOpenReassign = (action: {
    _id?: string;
    actionId: string;
    title: string;
    currentAssignee?: string;
  }) => {
    // Find the assignee name from users or teamMembers
    const assigneeUser =
      users.find((u) => u._id === action.currentAssignee) ||
      teamMembers.find((u) => u._id === action.currentAssignee);
    setReassigningAction({
      _id: action._id,
      actionId: action.actionId,
      title: action.title,
      currentAssignee: action.currentAssignee,
      currentAssigneeName:
        assigneeUser?.name || action.currentAssignee || "Unknown",
    });
    setReassignAssignee("");
    setReassignError("");
    setReassignModalOpen(true);
  };

  const handleCloseReassign = () => {
    setReassignModalOpen(false);
    setReassigningAction(null);
    setReassignAssignee("");
    setReassignError("");
  };

  const handleReassignSave = async () => {
    if (!reassigningAction || !reassignAssignee) {
      setReassignError("Please select a new assignee");
      return;
    }

    if (reassignAssignee === reassigningAction.currentAssignee) {
      setReassignError("Please select a different assignee");
      return;
    }

    setReassignLoading(true);
    setReassignError("");

    try {
      const response = await actionAPI.update(reassigningAction._id || "", {
        assignee: reassignAssignee,
      });

      if (response.success) {
        // Refresh dashboard data
        const dashResponse = await dashboardAPI.getWeeklyDashboard(
          selectedProjectId,
          currentWeekNumber,
        );
        if (dashResponse.success) {
          setData(dashResponse.weekly);
        }
        handleCloseReassign();
      }
    } catch (error: unknown) {
      console.error("Failed to reassign action:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reassign action. Please try again.";
      setReassignError(errorMessage);
    } finally {
      setReassignLoading(false);
    }
  };

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProjectId(event.target.value);
  };

  const ragTotal =
    (data?.ragDistribution?.green || 0) +
    (data?.ragDistribution?.amber || 0) +
    (data?.ragDistribution?.red || 0);
  const greenPct =
    ragTotal > 0
      ? Math.round(((data?.ragDistribution?.green || 0) / ragTotal) * 100)
      : 0;
  const amberPct =
    ragTotal > 0
      ? Math.round(((data?.ragDistribution?.amber || 0) / ragTotal) * 100)
      : 0;
  const redPct =
    ragTotal > 0
      ? Math.round(((data?.ragDistribution?.red || 0) / ragTotal) * 100)
      : 0;

  const getWeeklyRag = () => {
    if (ragTotal === 0)
      return {
        color: COLORS.textSecondary,
        label: "N/A",
        bgcolor: "rgba(150, 150, 150, 0.15)",
      };
    if (redPct > 30)
      return {
        color: COLORS.red,
        label: "Red",
        bgcolor: "rgba(239, 68, 68, 0.15)",
      };
    if (greenPct >= 70)
      return {
        color: COLORS.green,
        label: "Green",
        bgcolor: "rgba(34, 197, 94, 0.15)",
      };
    return {
      color: amberColor,
      label: "Amber",
      bgcolor: "rgba(245, 158, 11, 0.15)",
    };
  };
  const weeklyRag = getWeeklyRag();

  const getCycleStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return COLORS.textSecondary;
      case "In Review":
        return COLORS.amber;
      case "Approved":
        return COLORS.green;
      case "Closed":
        return COLORS.blue;
      default:
        return COLORS.blue;
    }
  };

  const cycleStatus = data?.cycle?.status || "Draft";
  const cycleStatusColor = getCycleStatusColor(cycleStatus);
  const cycleStatusBg = `${cycleStatusColor}15`;

  // Project dropdown component
  const projectDropdown = (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <Select
        value={selectedProjectId}
        onChange={handleProjectChange}
        displayEmpty
        IconComponent={ArrowDownIcon}
        sx={{
          bgcolor: COLORS.bgSecondary,
          color: COLORS.textPrimary,
          borderRadius: "8px",
          border: `1px solid ${COLORS.border}`,
          fontSize: "14px",
          fontWeight: 500,
          "& .MuiOutlinedInput-notchedOutline": {
            border: "none",
          },
          "& .MuiSelect-icon": {
            color: COLORS.textSecondary,
          },
          "&:hover": {
            bgcolor: COLORS.bgTertiary,
          },
        }}
        MenuProps={{
          slotProps: {
            paper: {
              sx: {
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                mt: 1,
                "& .MuiMenuItem-root": {
                  color: COLORS.textPrimary,
                  fontSize: "14px",
                  "&:hover": {
                    bgcolor: COLORS.bgTertiary,
                  },
                  "&.Mui-selected": {
                    bgcolor: COLORS.blueBgMedium,
                    "&:hover": {
                      bgcolor: COLORS.blueBgMedium,
                    },
                  },
                },
              },
            },
          },
        }}
      >
        {projects.length === 0 ? (
          <MenuItem value="" disabled>
            No projects available
          </MenuItem>
        ) : (
          projects.map((project) => (
            <MenuItem key={project._id} value={project._id}>
              {project.name}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );

  if (loading) {
    return (
      <AdminLayout
        title="Weekly Dashboard"
        subtitle="Live operational control for the current cycle"
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Weekly Dashboard"
      subtitle="Live operational control for the current cycle"
      headerAction={projectDropdown}
    >
      {loadingData ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      ) : projects.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
            gap: 2,
          }}
        >
          <Typography sx={{ color: COLORS.textMuted, fontSize: "16px" }}>
            No projects found. Create a project first.
          </Typography>
        </Box>
      ) : !programmeId && selectedProjectId ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
            gap: 2,
          }}
        >
          <Typography sx={{ color: COLORS.textMuted, fontSize: "16px" }}>
            No programme uploaded for this project yet.
          </Typography>
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
            Upload a programme PDF to see weekly dashboard data.
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              p: 3,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  md: "1fr 1.5fr 1fr 1fr 1fr 1fr 1fr",
                },
                gap: 3,
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: COLORS.white,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 0.75,
                  }}
                >
                  PROJECT
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {data?.project?.name || "No Project"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.white,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 0.75,
                  }}
                >
                  ACTIVE 2-WEEK PERIOD
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {data?.cycle?.weekNumber || "N/A"}{" "}
                  <Typography
                    component="span"
                    sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
                  >
                    {data?.cycle?.weekDates || ""}
                  </Typography>
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.white,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 0.75,
                  }}
                >
                  WEEKCYCLE STATUS
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderRadius: "20px",
                    px: 2,
                    py: 0.75,
                    width: "fit-content",
                    bgcolor: cycleStatusBg,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: cycleStatusColor,
                    }}
                  />
                  <Typography
                    sx={{
                      color: cycleStatusColor,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {cycleStatus}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.white,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 0.75,
                  }}
                >
                  2-WEEK RAG
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderRadius: "20px",
                    px: 2,
                    py: 0.75,
                    width: "fit-content",
                    bgcolor: weeklyRag.bgcolor,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: weeklyRag.color,
                    }}
                  />
                  <Typography
                    sx={{
                      color: weeklyRag.color,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {weeklyRag.label}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.white,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 0.75,
                  }}
                >
                  WEEK OPENED
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {data?.cycle?.weekOpened || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.white,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 0.75,
                  }}
                >
                  Close Deadline
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {data?.cycle?.closeDeadline || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.white,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 0.75,
                  }}
                >
                  PLANNER
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {data?.cycle?.planner || "-"}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr 1fr",
                md: "repeat(7, 1fr)",
              },
              gap: 2,
              mt: 3,
            }}
          >
            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  mb: 1,
                  textAlign: "center",
                }}
              >
                WEEKCYCLE STATUS
              </Typography>
              <Typography
                sx={{
                  color: COLORS.blue,
                  fontSize: "28px",
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                {cycleStatus}
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  height: 6,
                  bgcolor: COLORS.bgTertiary,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${
                      cycleStatus === "Draft"
                        ? 15
                        : cycleStatus === "Uploaded"
                          ? 30
                          : cycleStatus === "Meeting Open"
                            ? 50
                            : cycleStatus === "Execution"
                              ? 70
                              : cycleStatus === "Close-Out Eligible"
                                ? 85
                                : cycleStatus === "Closed"
                                  ? 100
                                  : 0
                    }%`,
                    height: "100%",
                    bgcolor: COLORS.blue,
                    borderRadius: "4px",
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  mb: 1,
                  textAlign: "center",
                }}
              >
                ACTIVITIES IN LOOKAHED
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "32px",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {data?.stats?.activitiesInLookahead || 0}
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                }}
              >
                2-week scope
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  mb: 1,
                  textAlign: "center",
                }}
              >
                GREEN ACTIVITIES
              </Typography>
              <Typography
                sx={{
                  color: COLORS.green,
                  fontSize: "32px",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {data?.stats?.greenActivities || 0}
              </Typography>
              <Typography
                sx={{
                  color: COLORS.green,
                  fontSize: "12px",
                }}
              >
                {greenPct}% on track
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  mb: 1,
                  textAlign: "center",
                }}
              >
                BLOCKED BY ACTIONS
              </Typography>
              <Typography
                sx={{
                  color: COLORS.red,
                  fontSize: "32px",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {data?.stats?.blockedByActions || 0}
              </Typography>
              <Typography
                sx={{
                  color: COLORS.red,
                  fontSize: "12px",
                }}
              >
                Requires resolution
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  mb: 1,
                  textAlign: "center",
                }}
              >
                OPEN ACTIONS
              </Typography>
              <Typography
                sx={{
                  color: amberColor,
                  fontSize: "32px",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {data?.stats?.openActions || 0}
              </Typography>
              <Typography
                sx={{
                  color: amberColor,
                  fontSize: "12px",
                }}
              >
                Pending closure
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  mb: 1,
                  textAlign: "center",
                }}
              >
                OVER DUE ACTIONS
              </Typography>
              <Typography
                sx={{
                  color: COLORS.red,
                  fontSize: "32px",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {data?.stats?.overdueActions || 0}
              </Typography>
              <Typography
                sx={{
                  color: COLORS.red,
                  fontSize: "12px",
                }}
              >
                Past deadline
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  mb: 1,
                  textAlign: "center",
                }}
              >
                READY FOR CLOSE
              </Typography>
              <Typography
                sx={{
                  color: data?.stats?.readyForClose ? COLORS.green : COLORS.red,
                  fontSize: "32px",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {data?.stats?.readyForClose ? "Yes" : "No"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: data?.stats?.readyForClose
                      ? COLORS.green
                      : COLORS.red,
                  }}
                />
                <Typography
                  sx={{
                    color: data?.stats?.readyForClose
                      ? COLORS.green
                      : COLORS.red,
                    fontSize: "12px",
                  }}
                >
                  {data?.stats?.readyForClose ? "All clear" : "Blockers remain"}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 2, sm: 3 },
              mt: { xs: 2, sm: 3 },
            }}
          >
            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: { xs: 2, sm: 3 },
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: { xs: "14px", sm: "16px" },
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Activities by Week
              </Typography>
              <CustomLegend
                items={[
                  { label: "Green", color: COLORS.green },
                  { label: "Amber", color: COLORS.amber },
                  { label: "Red", color: COLORS.red },
                ]}
              />
              <Box
                sx={{
                  overflowX: "auto",
                  overflowY: "hidden",
                  mt: 2,
                  "&::-webkit-scrollbar": {
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: COLORS.bgTertiary,
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: COLORS.blue,
                    borderRadius: "4px",
                    "&:hover": {
                      background: "#4A90D9",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    width:
                      activitiesByWeekData.length > 8
                        ? `${activitiesByWeekData.length * 50}px`
                        : "100%",
                    minWidth: "100%",
                    height: { xs: 220, sm: 280 },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activitiesByWeekData}
                      barCategoryGap="20%"
                      barGap={0}
                      margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="0"
                        stroke={COLORS.borderDark}
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="week"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
                        tickFormatter={(value) => value.replace("Week ", "W")}
                        interval={0}
                      />
                      <YAxis
                        axisLine={{ stroke: COLORS.borderDark }}
                        tickLine={false}
                        tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                        domain={[
                          0,
                          (_dataMax: number) => {
                            const maxTotal = Math.max(
                              ...activitiesByWeekData.map(
                                (d) => d.green + d.amber + d.red,
                              ),
                              1,
                            );
                            // Round up to next even number + 2
                            return Math.ceil((maxTotal + 2) / 2) * 2;
                          },
                        ]}
                        allowDecimals={false}
                        width={30}
                        tickCount={5}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={false}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="green"
                        stackId="a"
                        fill={COLORS.green}
                        radius={0}
                        barSize={60}
                      />
                      <Bar
                        dataKey="amber"
                        stackId="a"
                        fill={COLORS.amber}
                        radius={0}
                        barSize={60}
                      />
                      <Bar
                        dataKey="red"
                        stackId="a"
                        fill={COLORS.red}
                        radius={0}
                        barSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: { xs: "14px", sm: "16px" },
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                RAG Distribution
              </Typography>
              <Box
                sx={{
                  height: { xs: 200, sm: 250 },
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Green",
                          value: greenPct || 0,
                          color: COLORS.green,
                        },
                        {
                          name: "Amber",
                          value: amberPct || 0,
                          color: COLORS.amber,
                        },
                        { name: "Red", value: redPct || 0, color: COLORS.red },
                      ].filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius="70%"
                      outerRadius="100%"
                      paddingAngle={0}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {greenPct > 0 && <Cell fill={COLORS.green} />}
                      {amberPct > 0 && <Cell fill={COLORS.amber} />}
                      {redPct > 0 && <Cell fill={COLORS.red} />}
                    </Pie>
                    <Tooltip
                      content={<RAGTooltip />}
                      isAnimationActive={false}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <CustomLegend
                items={[
                  { label: "Green", color: COLORS.green },
                  { label: "Amber", color: COLORS.amber },
                  { label: "Red", color: COLORS.red },
                ]}
              />
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: { xs: "14px", sm: "16px" },
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Actions by Status
              </Typography>
              {(data?.actionsByStatus?.open || 0) +
                (data?.actionsByStatus?.closed || 0) +
                (data?.actionsByStatus?.overdue || 0) ===
              0 ? (
                <Box
                  sx={{
                    height: { xs: 220, sm: 280 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                  >
                    No actions assigned
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: { xs: 220, sm: 280 } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Open",
                          value: data?.actionsByStatus?.open || 0,
                        },
                        {
                          name: "Closed",
                          value: data?.actionsByStatus?.closed || 0,
                        },
                        {
                          name: "Overdue",
                          value: data?.actionsByStatus?.overdue || 0,
                        },
                      ]}
                      barCategoryGap="40%"
                    >
                      <CartesianGrid
                        strokeDasharray="0"
                        stroke={COLORS.borderDark}
                        horizontal={true}
                        vertical={true}
                        verticalCoordinatesGenerator={(props) => {
                          const { offset, width } = props;
                          const barCount = 3;
                          const chartWidth = width - offset.left - offset.right;
                          const step = chartWidth / barCount;
                          const lines = [];
                          for (let i = 0; i <= barCount; i++) {
                            lines.push(offset.left + i * step);
                          }
                          return lines;
                        }}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                        domain={[
                          0,
                          (_dataMax: number) => {
                            const max = Math.max(
                              data?.actionsByStatus?.open || 0,
                              data?.actionsByStatus?.closed || 0,
                              data?.actionsByStatus?.overdue || 0,
                              1,
                            );
                            return Math.max(max + 2, 3);
                          },
                        ]}
                        allowDecimals={false}
                        tickCount={7}
                      />
                      <Tooltip
                        content={<ActionsTooltip />}
                        cursor={false}
                        isAnimationActive={false}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                        <Cell fill={COLORS.amber} />
                        <Cell fill={COLORS.green} />
                        <Cell fill={COLORS.red} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: { xs: "14px", sm: "16px" },
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Action Ownership by Discipline
              </Typography>
              {actionOwnershipData.length === 0 ? (
                <Box
                  sx={{
                    height: { xs: 200, sm: 250 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                  >
                    No actions assigned
                  </Typography>
                </Box>
              ) : (
                <>
                  <CustomLegend
                    items={[
                      { label: "Open", color: COLORS.amber },
                      { label: "Closed", color: COLORS.green },
                      { label: "Overdue", color: COLORS.red },
                    ]}
                  />
                  <Box sx={{ height: { xs: 200, sm: 250 }, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={actionOwnershipData}
                        layout="vertical"
                        barCategoryGap="20%"
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="0"
                          stroke={COLORS.borderDark}
                          horizontal={true}
                          vertical={true}
                        />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                          domain={[
                            0,
                            (_dataMax: number) => {
                              const max = Math.max(
                                ...actionOwnershipData.map(
                                  (d) => d.open + d.closed + d.overdue,
                                ),
                                1,
                              );
                              return Math.ceil((max + 2) / 2) * 2;
                            },
                          ]}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="discipline"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                          width={80}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const openActions =
                                payload[0]?.payload?.openActions || [];
                              const closedActions =
                                payload[0]?.payload?.closedActions || [];
                              const overdueActions =
                                payload[0]?.payload?.overdueActions || [];
                              return (
                                <Box
                                  sx={{
                                    bgcolor: COLORS.bgSecondary,
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: "8px",
                                    p: 1.5,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      color: COLORS.textPrimary,
                                      fontWeight: 600,
                                      fontSize: "13px",
                                      mb: 0.5,
                                    }}
                                  >
                                    Discipline: {label}
                                  </Typography>
                                  {openActions.length > 0 && (
                                    <Typography
                                      sx={{
                                        color: COLORS.amber,
                                        fontSize: "12px",
                                      }}
                                    >
                                      Open: {openActions.join(", ")}
                                    </Typography>
                                  )}
                                  {closedActions.length > 0 && (
                                    <Typography
                                      sx={{
                                        color: COLORS.green,
                                        fontSize: "12px",
                                      }}
                                    >
                                      Closed: {closedActions.join(", ")}
                                    </Typography>
                                  )}
                                  {overdueActions.length > 0 && (
                                    <Typography
                                      sx={{
                                        color: COLORS.red,
                                        fontSize: "12px",
                                      }}
                                    >
                                      Overdue: {overdueActions.join(", ")}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            }
                            return null;
                          }}
                          cursor={false}
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey="open"
                          stackId="a"
                          fill={COLORS.amber}
                          barSize={25}
                        />
                        <Bar
                          dataKey="closed"
                          stackId="a"
                          fill={COLORS.green}
                          barSize={25}
                        />
                        <Bar
                          dataKey="overdue"
                          stackId="a"
                          fill={COLORS.red}
                          barSize={25}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </>
              )}
            </Box>
          </Box>

          <Box id="blocked-activities-section" sx={{ mt: { xs: 2, sm: 3 } }}>
            <BlockedActivitiesTable
              activities={data?.blockedActivities || []}
              weeklyPlanPreview={data?.weeklyPlanPreview || []}
              plannerToDo={data?.plannerToDo || []}
              isProjectEnded={data?.isProjectEnded || false}
              cycleStatus={data?.cycle?.status || ""}
              onAssignClick={(activity) => {
                setAssigningActivity({
                  activityId: activity.activityId,
                  activityName: activity.activityName,
                  startDate: activity.startDate,
                  finishDate: activity.finishDate,
                });
                setAssignFormData({
                  title: "",
                  description: "",
                  type: "Required",
                  priority: "Medium",
                  assignee: "",
                  dueDate: "",
                });
                setAssignModalOpen(true);
              }}
              onUnblockClick={async (activityId) => {
                if (!programmeId) return;
                try {
                  await programmeAPI.updateActivity(programmeId, activityId, {
                    isBlocked: false,
                    activityStatus: "Ready",
                  });
                  // Refresh dashboard data
                  const dashResponse = await dashboardAPI.getWeeklyDashboard(
                    selectedProjectId,
                    currentWeekNumber,
                  );
                  if (dashResponse.success) {
                    setData(dashResponse.weekly);
                  }
                } catch (error) {
                  console.error("Error unblocking activity:", error);
                }
              }}
              onActionIdClick={() => {
                navigate("/admin/action");
              }}
              onReassignClick={(action) => {
                handleOpenReassign(action);
              }}
            />
          </Box>

          <Box sx={{ mt: { xs: 2, sm: 3 } }}>
            <ClosureOverridePanel
              cycleStatus={data?.cycle?.status || ""}
              overdueActions={data?.stats?.overdueActions || 0}
              blockedActivities={data?.stats?.blockedByActions || 0}
              outstandingActions={data?.stats?.openActions || 0}
              openRequiredActions={data?.stats?.openRequiredActions || 0}
              weekNumber={currentWeekNumber}
              canClose={
                // Check both readyForClose (no blockers) and date-based canClose from weeks status
                (data?.stats?.readyForClose || false) &&
                (_weeksStatus.find((w) => w.weekNumber === currentWeekNumber)
                  ?.canClose ??
                  true)
              }
              canCloseReason={
                _weeksStatus.find((w) => w.weekNumber === currentWeekNumber)
                  ?.canCloseReason || ""
              }
              isProjectEnded={data?.isProjectEnded || false}
              isWeekClosed={
                _weeksStatus.find((w) => w.weekNumber === currentWeekNumber)
                  ?.status === "closed" || data?.cycle?.status === "Closed"
              }
              isClosing={isClosingWeek}
              onCloseWeek={handleCloseWeek}
              onPMOverride={() => setShowOverrideModal(true)}
              onGoToActions={() => {
                navigate("/admin/action");
              }}
              onOpenMeeting={handleOpenMeeting}
              onStartExecution={handleStartExecution}
              showOverrideModal={showOverrideModal}
              overrideReason={overrideReason}
              onOverrideReasonChange={setOverrideReason}
              onConfirmOverride={handlePMOverride}
              onCancelOverride={() => {
                setShowOverrideModal(false);
                setOverrideReason("");
              }}
            />
          </Box>

          {/* Assign Activity Modal */}
          <Dialog
            open={assignModalOpen}
            onClose={handleAssignClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
              backdrop: {
                sx: {
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                },
              },
              paper: {
                sx: {
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  backgroundImage: "none",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  maxWidth: 500,
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
                pt: 2,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  Assign Activity
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  {assigningActivity?.activityId}
                </Typography>
              </Box>
              <IconButton
                onClick={handleAssignClose}
                sx={{ color: COLORS.textMuted, p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2 }}>
              {/* Error Message */}
              {assignError && (
                <Box
                  sx={{
                    bgcolor: "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${COLORS.red}`,
                    borderRadius: "8px",
                    px: 2,
                    py: 1.5,
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.red,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {assignError}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {/* Activity Name (Read-only) */}
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.5,
                      mt: 1,
                    }}
                  >
                    Activity
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      border: `1px solid ${COLORS.border}`,
                      px: 1.5,
                      py: 1.2,
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                      }}
                    >
                      {assigningActivity?.activityName || "Unknown Activity"}
                    </Typography>
                  </Box>
                </Box>

                {/* Title */}
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.5,
                      mt: 2,
                    }}
                  >
                    Action Title <span style={{ color: COLORS.red }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Enter action title..."
                    value={assignFormData.title}
                    onChange={(e) =>
                      handleAssignChange("title", e.target.value)
                    }
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
                        py: 1.2,
                        "&::placeholder": {
                          color: COLORS.textMuted,
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Box>

                {/* Type | Priority row */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        fontWeight: 500,
                        mb: 0.5,
                        mt: 2,
                      }}
                    >
                      Type
                    </Typography>
                    <Select
                      fullWidth
                      value={assignFormData.type}
                      onChange={(e) =>
                        handleAssignChange("type", e.target.value)
                      }
                      IconComponent={ArrowDownIcon}
                      sx={{
                        bgcolor: COLORS.bgPrimary,
                        borderRadius: "8px",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: COLORS.border,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: COLORS.border,
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: COLORS.blue,
                          borderWidth: 1,
                        },
                        "& .MuiSelect-select": {
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          py: 1.2,
                        },
                        "& .MuiSvgIcon-root": { color: COLORS.textSecondary },
                      }}
                      MenuProps={{
                        slotProps: {
                          paper: {
                            sx: {
                              bgcolor: COLORS.bgSecondary,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: "8px",
                              "& .MuiMenuItem-root": {
                                color: COLORS.textPrimary,
                                fontSize: "14px",
                                "&:hover": { bgcolor: COLORS.bgTertiary },
                                "&.Mui-selected": {
                                  bgcolor: COLORS.blueBgMedium,
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="Required">Required</MenuItem>
                      <MenuItem value="Optional">Optional</MenuItem>
                    </Select>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        fontWeight: 500,
                        mb: 0.5,
                        mt: 2,
                      }}
                    >
                      Priority
                    </Typography>
                    <Select
                      fullWidth
                      value={assignFormData.priority}
                      onChange={(e) =>
                        handleAssignChange("priority", e.target.value)
                      }
                      IconComponent={ArrowDownIcon}
                      sx={{
                        bgcolor: COLORS.bgPrimary,
                        borderRadius: "8px",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: COLORS.border,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: COLORS.border,
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: COLORS.blue,
                          borderWidth: 1,
                        },
                        "& .MuiSelect-select": {
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          py: 1.2,
                        },
                        "& .MuiSvgIcon-root": { color: COLORS.textSecondary },
                      }}
                      MenuProps={{
                        slotProps: {
                          paper: {
                            sx: {
                              bgcolor: COLORS.bgSecondary,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: "8px",
                              "& .MuiMenuItem-root": {
                                color: COLORS.textPrimary,
                                fontSize: "14px",
                                "&:hover": { bgcolor: COLORS.bgTertiary },
                                "&.Mui-selected": {
                                  bgcolor: COLORS.blueBgMedium,
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </Select>
                  </Box>
                </Box>

                {/* Assignee | Due Date row */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        fontWeight: 500,
                        mb: 0.5,
                        mt: 2,
                      }}
                    >
                      Assignee <span style={{ color: COLORS.red }}>*</span>
                    </Typography>
                    <Select
                      fullWidth
                      value={assignFormData.assignee}
                      onChange={(e) =>
                        handleAssignChange("assignee", e.target.value)
                      }
                      displayEmpty
                      IconComponent={ArrowDownIcon}
                      sx={{
                        bgcolor: COLORS.bgPrimary,
                        borderRadius: "8px",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: COLORS.border,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: COLORS.border,
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: COLORS.blue,
                          borderWidth: 1,
                        },
                        "& .MuiSelect-select": {
                          color: assignFormData.assignee
                            ? COLORS.textPrimary
                            : COLORS.textMuted,
                          fontSize: "14px",
                          py: 1.2,
                        },
                        "& .MuiSvgIcon-root": { color: COLORS.textSecondary },
                      }}
                      MenuProps={{
                        slotProps: {
                          paper: {
                            sx: {
                              bgcolor: COLORS.bgSecondary,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: "8px",
                              maxHeight: 200,
                              "& .MuiMenuItem-root": {
                                color: COLORS.textPrimary,
                                fontSize: "14px",
                                "&:hover": { bgcolor: COLORS.bgTertiary },
                                "&.Mui-selected": {
                                  bgcolor: COLORS.blueBgMedium,
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        {teamMembers.length === 0
                          ? "No users available"
                          : "Select assignee..."}
                      </MenuItem>
                      {teamMembers.map((u) => (
                        <MenuItem key={u._id} value={u._id}>
                          {u.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        fontWeight: 500,
                        mb: 0.5,
                        mt: 2,
                      }}
                    >
                      Due Date <span style={{ color: COLORS.red }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={assignFormData.dueDate}
                      onChange={(e) =>
                        handleAssignChange("dueDate", e.target.value)
                      }
                      slotProps={{
                        htmlInput: {
                          min: assigningActivity?.startDate,
                          max: assigningActivity?.finishDate,
                        },
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
                          color: assignFormData.dueDate
                            ? COLORS.textPrimary
                            : COLORS.textMuted,
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
                </Box>
              </Box>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                borderTop: `1px solid ${COLORS.border}`,
                gap: 1.5,
              }}
            >
              <Button
                onClick={handleAssignClose}
                sx={{
                  color: COLORS.textSecondary,
                  bgcolor: "transparent",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  textTransform: "none",
                  px: 2.5,
                  py: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: COLORS.bgTertiary,
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignSave}
                disabled={assignSaveLoading}
                sx={{
                  color: "#fff",
                  bgcolor: COLORS.blue,
                  borderRadius: "8px",
                  textTransform: "none",
                  px: 2.5,
                  py: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: COLORS.blueHover,
                  },
                  "&:disabled": {
                    bgcolor: COLORS.blue,
                    opacity: 0.7,
                  },
                }}
              >
                {assignSaveLoading ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  "Assign"
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Reassign Action Modal */}
          <Dialog
            open={reassignModalOpen}
            onClose={handleCloseReassign}
            maxWidth="xs"
            fullWidth
            slotProps={{
              backdrop: {
                sx: {
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                },
              },
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
                pt: 2,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  Reassign Action
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 400,
                    mt: 0.5,
                  }}
                >
                  {reassigningAction?.title}
                </Typography>
              </Box>
              <IconButton
                onClick={handleCloseReassign}
                sx={{ color: COLORS.textMuted, p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2 }}>
              {/* Error Message */}
              {reassignError && (
                <Box
                  sx={{
                    bgcolor: "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${COLORS.red}`,
                    borderRadius: "8px",
                    px: 2,
                    py: 1.5,
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.red,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {reassignError}
                  </Typography>
                </Box>
              )}

              {/* Current Assignee */}
              <Box sx={{ mb: 2, mt: 1 }}>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  Current Assignee
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    border: `1px solid ${COLORS.border}`,
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: "10px",
                      fontWeight: 600,
                      bgcolor: COLORS.blue,
                    }}
                  >
                    {reassigningAction?.currentAssigneeName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?"}
                  </Avatar>
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                    }}
                  >
                    {reassigningAction?.currentAssigneeName || "Unknown"}
                  </Typography>
                </Box>
              </Box>

              {/* New Assignee */}
              <Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Reassign To <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <Select
                  fullWidth
                  value={reassignAssignee}
                  onChange={(e) => setReassignAssignee(e.target.value)}
                  displayEmpty
                  IconComponent={ArrowDownIcon}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.border,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.border,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.blue,
                      borderWidth: 1,
                    },
                    "& .MuiSelect-select": {
                      color: reassignAssignee
                        ? COLORS.textPrimary
                        : COLORS.textMuted,
                      fontSize: "14px",
                      py: 1.2,
                    },
                    "& .MuiSvgIcon-root": { color: COLORS.textSecondary },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: COLORS.bgSecondary,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "8px",
                          maxHeight: 200,
                          "& .MuiMenuItem-root": {
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            "&:hover": { bgcolor: COLORS.bgTertiary },
                            "&.Mui-selected": {
                              bgcolor: COLORS.blueBgMedium,
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    Select new assignee...
                  </MenuItem>
                  {users
                    .filter((u) => u._id !== reassigningAction?.currentAssignee)
                    .map((u) => (
                      <MenuItem key={u._id} value={u._id}>
                        {u.name}
                      </MenuItem>
                    ))}
                </Select>
              </Box>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                borderTop: `1px solid ${COLORS.border}`,
                gap: 1.5,
              }}
            >
              <Button
                onClick={handleCloseReassign}
                sx={{
                  color: COLORS.textSecondary,
                  bgcolor: "transparent",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  textTransform: "none",
                  px: 2.5,
                  py: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: COLORS.bgTertiary,
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassignSave}
                disabled={reassignLoading || !reassignAssignee}
                sx={{
                  color: "#fff",
                  bgcolor: COLORS.amber,
                  borderRadius: "8px",
                  textTransform: "none",
                  px: 2.5,
                  py: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: "#d97706",
                  },
                  "&.Mui-disabled": {
                    bgcolor: COLORS.textMuted,
                    color: COLORS.bgPrimary,
                  },
                }}
              >
                {reassignLoading ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  "Reassign"
                )}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminWeeklyDashboard;
