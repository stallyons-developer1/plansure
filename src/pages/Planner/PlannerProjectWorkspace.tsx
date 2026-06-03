import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Skeleton,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowRight as ArrowRightIcon,
} from "@mui/icons-material";
import editIcon from "../../assets/tabler_edit.png";
import viewIcon from "../../assets/Frame.png";
import lockIcon from "../../assets/lock.png";
import uploadIcon from "../../assets/sidebar/upload.png";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PlannerLayout from "../../layouts/PlannerLayout";
import { COLORS } from "../../constants/colors";
import ProjectHeader from "../../components/ProjectHeader";
import {
  projectAPI,
  programmeAPI,
  actionAPI,
  userAPI,
  exportAPI,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatCard from "../../components/StatCard";
import RAGDonutChart from "../../components/RAGDonutChart";
import RecentCycleHistory from "../../components/RecentCycleHistory";
import BlockedActivitiesTable from "../../components/BlockedActivitiesTable";
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
  team?: { user: { name: string; email: string }; role: string }[];
}

const defaultDashboardData = {
  week: "Week 1",
  weekDates: "Current Week",
  planner: "Not assigned",
  activitiesInLookahead: 0,
  greenReady: 0,
  totalGreen: 0,
  openActions: 0,
  overdueActions: 0,
  ragDistribution: { green: 0, amber: 0, red: 0 },
  cycleHistory: [] as Array<{
    week: string;
    dates: string;
    status: string;
    statusType: "green" | "amber";
    score: number;
  }>,
};

const steps = [
  "Draft",
  "Meeting Open",
  "Execution",
  "Close-Out Eligible",
  "Closed",
];

const parseDate = (dateStr: string): Date | null => {
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

const getRAGColor = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return "green";

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) return "green";

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);

  if (diffWeeks <= 0) return "green";
  if (diffWeeks <= 2) return "green";
  if (diffWeeks <= 4) return "amber";
  return "red";
};

const getRAGPriority = (color: string): number => {
  if (color === "green") return 1;
  if (color === "amber") return 2;
  return 3;
};

// Convert date string to YYYY-MM-DD format for HTML date input
const toDateInputFormat = (dateStr: string): string => {
  if (!dateStr) return "";

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Handle DD-MMM-YY format (e.g., "25-Oct-21")
  const months: { [key: string]: string } = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const match = dateStr
    .replace(/\s*[A*]$/, "")
    .trim()
    .match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);
  if (match) {
    const day = match[1];
    const month = months[match[2]];
    let year = parseInt(match[3]);
    year = year < 50 ? 2000 + year : 1900 + year;
    return `${year}-${month}-${day}`;
  }

  // Try parsing as a Date object
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
};

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  linkedActivity: string;
  type: string;
  assignee: { initials: string; name: string };
  assigneeId?: string;
  dueDate: string;
  status: string;
  priority: string;
  createdAt?: string;
}

const PlannerProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "actions") return 3;
    if (tabParam === "dashboard") return 0;
    if (tabParam === "upload") return 1;
    if (tabParam === "activities") return 2;
    if (tabParam === "weekly") return 4;
    if (tabParam === "governance") return 5;
    return 1;
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [ragFilter, setRagFilter] = useState("all");
  const [activitiesPage, setActivitiesPage] = useState(1);
  const activitiesPerPage = 20;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [, setEditingIndex] = useState<number | null>(null);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editSaveLoading, setEditSaveLoading] = useState(false);
  const [cycleStage, setCycleStage] = useState<
    "draft" | "meetingOpen" | "execution"
  >("draft");
  const [closureChecklist, setClosureChecklist] = useState({
    plannerReview: true,
    todoGenerated: false,
    overdueAcknowledged: false,
    blockedAcknowledged: false,
  });
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isWeekClosed, setIsWeekClosed] = useState(false);
  const [savedOverrideReason, setSavedOverrideReason] = useState("");
  const [lockedViewWeek, setLockedViewWeek] = useState<number | null>(null); // Lock view to specific week after Closure & Export PM Override
  const [weeksStatus, setWeeksStatus] = useState<{
    totalWeeks: number;
    currentWeekNumber: number;
    closedWeeksCount: number;
    progress: number;
    isFullyClosed: boolean;
    weeks: Array<{
      weekNumber: number;
      startDate: string;
      endDate: string;
      twoWeekEndDate: string;
      status: string;
      isClosed: boolean;
      canClose: boolean;
      canCloseReason: string | null;
      closedAt: string | null;
      closeType: string | null;
      stats: {
        totalActivities: number;
        green: number;
        amber: number;
        red: number;
      };
    }>;
  } | null>(null);
  const [closingWeek, setClosingWeek] = useState<number | null>(null);

  // Export functionality state
  const [exportGatingStatus, setExportGatingStatus] = useState({
    isGated: true,
    cycleStatus: "Execution",
  });
  const [exportCounts, setExportCounts] = useState({
    greenActivitiesReady: 0,
    weeklyPlanTotal: 0,
    outstandingActions: 0,
    overdueActions: 0,
    blockedActivities: 0,
    completedActions: 0,
    pmOverrideActions: 0,
  });
  const [isExporting, setIsExporting] = useState<
    "weekly" | "todo" | "pdf" | null
  >(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isLoadingProgramme, setIsLoadingProgramme] = useState(true);
  const [uploadedProgramme, setUploadedProgramme] = useState<{
    _id: string;
    name: string;
    totalActivities: number;
    cycleStatus: string;
    isLocked: boolean;
    overrideReason?: string;
    summary: {
      green: number;
      amber: number;
      red: number;
      inLookahead: number;
    };
  } | null>(null);

  const [lookaheadData, setLookaheadData] = useState<{
    activities: Array<{
      activityId: string;
      activityName: string;
      duration: string;
      startDate: string;
      finishDate: string;
      status: string;
      ragStatus: string;
      activityStatus: string;
      weekZone: string | null;
      actionsCount?: number;
      openActionsCount?: number;
    }>;
    summary: {
      total: number;
      inLookahead: number;
      green: number;
      amber: number;
      red: number;
      blocked: number;
    };
    weekZones: Array<{
      weekNumber: number;
      label: string;
      category: string;
      activitiesCount: number;
    }>;
  } | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(
    null,
  );
  const [projectActions, setProjectActions] = useState<
    Array<{
      _id: string;
      title: string;
      linkedActivity: { activityId: string; activityName: string };
      type: string;
      status: string;
      priority: string;
      assignee?: { name: string };
      dueDate: string;
    }>
  >([]);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [actionToComplete, setActionToComplete] = useState<{
    _id: string;
    title: string;
  } | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [users, setUsers] = useState<
    Array<{ _id: string; name: string; email: string; role: string }>
  >([]);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningActivity, setAssigningActivity] = useState<{
    activityId: string;
    activityName: string;
    startDate: string;
    finishDate: string;
  } | null>(null);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignAssignee, setAssignAssignee] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignPriority, setAssignPriority] = useState("Medium");
  const [assignType, setAssignType] = useState("Required");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [reassigningAction, setReassigningAction] = useState<{
    _id: string;
    title: string;
    currentAssignee?: string;
    currentAssigneeName?: string;
  } | null>(null);
  const [reassignAssignee, setReassignAssignee] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState("");

  useEffect(() => {
    if (activeTab === 3 && selectedActionId) {
      setTimeout(() => {
        const element = document.getElementById(
          `action-row-${selectedActionId}`,
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [activeTab, selectedActionId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "actions") setActiveTab(3);
    else if (tabParam === "dashboard") setActiveTab(0);
    else if (tabParam === "upload") setActiveTab(1);
    else if (tabParam === "activities") setActiveTab(2);
    else if (tabParam === "weekly") setActiveTab(4);
    else if (tabParam === "governance") setActiveTab(5);
  }, [location.search]);

  const [weeklyControlData, setWeeklyControlData] = useState<{
    stats: {
      cycleStatus: string;
      inLookahead: number;
      green: number;
      blocked: number;
      openActions: number;
      overdue: number;
      readyToClose: string;
    };
    ragDistribution: {
      green: number;
      amber: number;
      red: number;
    };
    actionsByStatus: {
      open: number;
      inProgress: number;
      closed: number;
      pmOverride: number;
      overdue: number;
    };
    weeklyActionsByStatus: {
      open: number;
      inProgress: number;
      closed: number;
      overdue: number;
    };
    blockedRiskActivities: Array<{
      activityId: string;
      activityName: string;
      ragStatus: string;
      activityStatus?: string;
      isBlocked?: boolean;
      owner: string;
      blocker: string;
      linkedAction: { actionId: string; title?: string; status: string } | null;
    }>;
    activityCounts?: {
      completed: number;
      blocked: number;
      atRisk: number;
    };
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
    weekInfo?: {
      weekNumber: number;
      weekNumberEnd?: number;
      currentWeekNumber: number;
      dateRange: string;
      totalActivities: number;
    } | null;
    isProjectEnded?: boolean;
    projectEndDate?: string | null;
    programmeId?: string;
  } | null>(null);
  const [, setIsLoadingWeeklyControl] = useState(false);

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
    const fetchUsers = async () => {
      try {
        const response = await userAPI.getAll({ status: "active" });
        if (response.success) {
          const activeUsers = (response.users || []).filter(
            (u: { _id: string; role: string; status: string }) =>
              u.role === "planner" &&
              u.status === "active" &&
              u._id !== user?.id,
          );
          setUsers(activeUsers);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Reusable function to fetch programme data
  const refetchProgramme = async () => {
    if (!projectId) return;
    try {
      const response = await programmeAPI.getByProject(projectId);
      if (response.success && response.programme) {
        const programme = response.programme;
        const activities = programme.extractedData?.activities || [];
        const summary = programme.extractedData?.summary || {
          total: 0,
          inLookahead: 0,
          green: 0,
          amber: 0,
          red: 0,
          blocked: 0,
        };

        setUploadedProgramme({
          _id: programme._id,
          name: programme.name,
          totalActivities:
            programme.extractedData?.totalActivities || activities.length,
          cycleStatus: programme.cycleStatus || "Draft",
          isLocked: programme.isLocked || false,
          overrideReason: programme.overrideReason,
          summary: {
            green: summary.green || 0,
            amber: summary.amber || 0,
            red: summary.red || 0,
            inLookahead: summary.inLookahead || activities.length,
          },
        });

        setLookaheadData({
          activities: activities.map(
            (a: {
              activityId?: string;
              activityName?: string;
              duration?: string;
              startDate?: string;
              finishDate?: string;
              status?: string;
              ragStatus?: string;
              activityStatus?: string;
              weekZone?: string | null;
              actionsCount?: number;
              openActionsCount?: number;
              isBlocked?: boolean;
              ownerName?: string;
            }) => ({
              activityId: a.activityId || "",
              activityName: a.activityName || "",
              duration: a.duration || "",
              startDate: a.startDate || "",
              finishDate: a.finishDate || "",
              status: a.status || "",
              ragStatus: a.ragStatus || "",
              activityStatus: a.activityStatus || "",
              weekZone: a.weekZone || null,
              actionsCount: a.actionsCount || 0,
              openActionsCount: a.openActionsCount || 0,
              isBlocked: a.isBlocked || false,
              ownerName: a.ownerName || "",
            }),
          ),
          summary: {
            total: summary.total || activities.length,
            inLookahead: summary.inLookahead || activities.length,
            green: summary.green || 0,
            amber: summary.amber || 0,
            red: summary.red || 0,
            blocked: summary.blocked || 0,
          },
          weekZones: [],
        });
      }
    } catch (error) {
      console.error("Failed to refetch programme:", error);
    }
  };

  useEffect(() => {
    const fetchProgramme = async () => {
      if (!projectId) return;
      try {
        const response = await programmeAPI.getByProject(projectId);
        if (response.success && response.programme) {
          const programme = response.programme;
          const activities = programme.extractedData?.activities || [];
          const summary = programme.extractedData?.summary || {
            total: 0,
            inLookahead: 0,
            green: 0,
            amber: 0,
            red: 0,
            blocked: 0,
          };

          setUploadedProgramme({
            _id: programme._id,
            name: programme.name,
            totalActivities:
              programme.extractedData?.totalActivities || activities.length,
            cycleStatus: programme.cycleStatus || "Draft",
            isLocked: programme.isLocked || false,
            overrideReason: programme.overrideReason,
            summary: {
              green: summary.green || 0,
              amber: summary.amber || 0,
              red: summary.red || 0,
              inLookahead: summary.inLookahead || activities.length,
            },
          });

          setLookaheadData({
            activities: activities.map(
              (a: {
                activityId?: string;
                activityName?: string;
                duration?: string;
                startDate?: string;
                finishDate?: string;
                status?: string;
                ragStatus?: string;
                activityStatus?: string;
                weekZone?: string | null;
                actionsCount?: number;
                openActionsCount?: number;
              }) => ({
                activityId: a.activityId || "",
                activityName: a.activityName || "",
                duration: a.duration || "",
                startDate: a.startDate || "",
                finishDate: a.finishDate || "",
                status: a.status || "",
                ragStatus: a.ragStatus || "",
                activityStatus: a.activityStatus || "",
                weekZone: a.weekZone || null,
                actionsCount: a.actionsCount || 0,
                openActionsCount: a.openActionsCount || 0,
              }),
            ),
            summary: {
              total: summary.total || activities.length,
              inLookahead: summary.inLookahead || activities.length,
              green: summary.green || 0,
              amber: summary.amber || 0,
              red: summary.red || 0,
              blocked: summary.blocked || 0,
            },
            weekZones: [
              {
                weekNumber: 1,
                label: "Week 1",
                category: "Weeks 1-2",
                activitiesCount: 0,
              },
              {
                weekNumber: 2,
                label: "Week 2",
                category: "Weeks 1-2",
                activitiesCount: 0,
              },
              {
                weekNumber: 3,
                label: "Week 3",
                category: "Weeks 3-4",
                activitiesCount: 0,
              },
              {
                weekNumber: 4,
                label: "Week 4",
                category: "Weeks 3-4",
                activitiesCount: 0,
              },
              {
                weekNumber: 5,
                label: "Week 5",
                category: "Weeks 5-6",
                activitiesCount: 0,
              },
              {
                weekNumber: 6,
                label: "Week 6",
                category: "Weeks 5-6",
                activitiesCount: 0,
              },
            ],
          });
          // Note: Don't call fetchWeeklyControlData here - let the useEffect handle it
          // once weeksStatus is loaded to ensure correct week number is used
        }
      } catch (error) {
        console.error("Failed to fetch programme:", error);
      } finally {
        setIsLoadingProgramme(false);
      }
    };
    fetchProgramme();
  }, [projectId]);

  useEffect(() => {
    const fetchProjectActions = async () => {
      if (!uploadedProgramme?._id) return;
      try {
        const response = await actionAPI.getAll({
          programmeId: uploadedProgramme._id,
        });
        if (response.success) {
          setProjectActions(response.actions || []);
        }
      } catch (error) {
        console.error("Failed to fetch actions:", error);
      }
    };
    fetchProjectActions();
  }, [uploadedProgramme?._id]);

  // Fetch weeks status for week-by-week closure
  const fetchWeeksStatus = async () => {
    if (!uploadedProgramme?._id) return;
    try {
      const response = await programmeAPI.getWeeksStatus(uploadedProgramme._id);
      if (response.success) {
        setWeeksStatus(response);
      }
    } catch (error) {
      console.error("Failed to fetch weeks status:", error);
    }
  };

  useEffect(() => {
    fetchWeeksStatus();
  }, [uploadedProgramme?._id]);

  // Refetch weekly control data when weeksStatus changes (to filter by current week)
  useEffect(() => {
    if (uploadedProgramme?._id && weeksStatus) {
      // If we have a locked view week (from Closure & Export PM Override), use that
      if (lockedViewWeek !== null) {
        fetchWeeklyControlData(uploadedProgramme._id, lockedViewWeek);
        return;
      }
      // Get the next closable week number, or current week
      const closableWeek = weeksStatus.weeks.find((w) => w.canClose);
      const weekNumber =
        closableWeek?.weekNumber || weeksStatus.currentWeekNumber;
      fetchWeeklyControlData(uploadedProgramme._id, weekNumber);
    }
  }, [weeksStatus?.closedWeeksCount, uploadedProgramme?._id, lockedViewWeek]);

  const handleCloseSpecificWeek = async (
    weekNumber: number,
    closeType: string = "Normal Close",
  ) => {
    if (!uploadedProgramme?._id) return;
    setClosingWeek(weekNumber);
    try {
      // Close 2 weeks at once since we display 2 weeks together
      console.log(
        "[PM Override] Closing week",
        weekNumber,
        "closeType:",
        closeType,
      );
      const response1: {
        success: boolean;
        isFullyClosed: boolean;
        isLastWeek?: boolean;
      } = await programmeAPI.closeWeek(
        uploadedProgramme._id,
        weekNumber,
        closeType,
        closeType === "PM Override" ? overrideReason : undefined,
      );
      console.log("[PM Override] response1:", response1);

      let response2: {
        success: boolean;
        isFullyClosed: boolean;
        isLastWeek?: boolean;
      } = { success: false, isFullyClosed: false };
      if (response1.success && !response1.isFullyClosed) {
        // Close the second week - pass isSecondOfPair=true for safety
        console.log("[PM Override] Closing week", weekNumber + 1);
        response2 = await programmeAPI.closeWeek(
          uploadedProgramme._id,
          weekNumber + 1,
          closeType,
          closeType === "PM Override" ? overrideReason : undefined,
          true, // isSecondOfPair
        );
        console.log("[PM Override] response2:", response2);
      }

      if (response1.success) {
        console.log(
          "[PM Override] response1 success, fetching updated weeks status...",
        );
        // Fetch updated weeks status
        const updatedWeeksStatus = await programmeAPI.getWeeksStatus(
          uploadedProgramme._id,
        );
        console.log("[PM Override] updatedWeeksStatus:", {
          closedWeeksCount: updatedWeeksStatus.closedWeeksCount,
          currentWeekNumber: updatedWeeksStatus.currentWeekNumber,
          weeks: updatedWeeksStatus.weeks
            ?.map(
              (w: {
                weekNumber: number;
                canClose: boolean;
                isClosed: boolean;
              }) => ({
                weekNumber: w.weekNumber,
                canClose: w.canClose,
                isClosed: w.isClosed,
              }),
            )
            .slice(0, 15), // Only log first 15 weeks for readability
        });

        if (updatedWeeksStatus.success) {
          setWeeksStatus(updatedWeeksStatus);

          // Explicitly fetch weekly control data for the NEXT closable week
          // (weekNumber + 2 because we just closed weekNumber and weekNumber+1)
          const nextClosableWeek = updatedWeeksStatus.weeks.find(
            (w: { canClose: boolean }) => w.canClose,
          );
          const nextWeekNumber =
            nextClosableWeek?.weekNumber ||
            updatedWeeksStatus.currentWeekNumber;
          console.log(
            "[PM Override] Next closable week:",
            nextClosableWeek?.weekNumber,
            "Using weekNumber:",
            nextWeekNumber,
          );
          await fetchWeeklyControlData(uploadedProgramme._id, nextWeekNumber);
          // Also refresh programme data to ensure all UI is updated
          await refetchProgramme();
        }

        // Update programme status based on response
        if (response1.isLastWeek || response2.isLastWeek) {
          // All weeks completed - set to Close-Out Eligible
          setCycleStage("execution");
          setCurrentStep(4); // Close-Out Eligible step
          setUploadedProgramme((prev) =>
            prev ? { ...prev, cycleStatus: "Close-Out Eligible" } : null,
          );
        } else if (response1.isFullyClosed || response2.isFullyClosed) {
          setIsWeekClosed(true);
          setCurrentStep(5); // Closed step
          setUploadedProgramme((prev) =>
            prev ? { ...prev, cycleStatus: "Closed", isLocked: true } : null,
          );
        } else {
          // Reset to Draft for next week
          setCycleStage("draft");
          setCurrentStep(1);
          setUploadedProgramme((prev) =>
            prev ? { ...prev, cycleStatus: "Draft" } : null,
          );
        }
      }
    } catch (error) {
      console.error("Failed to close week:", error);
    } finally {
      setClosingWeek(null);
    }
  };

  const getActionsForActivity = (activityId: string) => {
    return projectActions.filter(
      (action) => action.linkedActivity?.activityId === activityId,
    );
  };

  // Check if an action is from a closed week (should be disabled after PM Override)
  const isActionFromClosedWeek = (action: {
    createdAt?: string;
    status?: string;
  }) => {
    if (!weeksStatus?.weeks || !action.createdAt) return false;

    // Actions that are completed or cancelled should not be disabled
    if (action.status === "Completed" || action.status === "Cancelled")
      return false;

    const actionDate = new Date(action.createdAt);

    // Find the most recently closed week
    const closedWeeks = weeksStatus.weeks.filter(
      (w) => w.isClosed && w.closedAt,
    );
    if (closedWeeks.length === 0) return false;

    // Find the most recent closure by closedAt date
    const mostRecentClosure = closedWeeks.reduce(
      (latest, week) => {
        if (!latest) return week;
        if (!week.closedAt || !latest.closedAt) return latest;
        return new Date(week.closedAt) > new Date(latest.closedAt)
          ? week
          : latest;
      },
      null as (typeof closedWeeks)[0] | null,
    );

    if (!mostRecentClosure?.closedAt) return false;

    // If action was created BEFORE the most recent week was closed,
    // it means this action was from a previous week cycle that has now been closed/PM Override'd
    const closureDate = new Date(mostRecentClosure.closedAt);
    return actionDate < closureDate;
  };

  const handleCycleAction = async () => {
    if (!uploadedProgramme?._id) return;

    try {
      let nextStatus = "";
      let nextStep = currentStep;

      if (cycleStage === "draft") {
        nextStatus = "Meeting Open";
        nextStep = 2;
      } else if (cycleStage === "meetingOpen") {
        nextStatus = "Execution";
        nextStep = 3;
      }

      if (nextStatus) {
        const response = await programmeAPI.updateCycleStatus(
          uploadedProgramme._id,
          nextStatus,
        );
        if (response.success) {
          if (cycleStage === "draft") {
            setCycleStage("meetingOpen");
          } else if (cycleStage === "meetingOpen") {
            setCycleStage("execution");
          }
          setCurrentStep(nextStep);
          setUploadedProgramme({
            ...uploadedProgramme,
            cycleStatus: nextStatus,
          });

          // Refresh weeks status first, then weekly control data
          const weeksResponse = await programmeAPI.getWeeksStatus(
            uploadedProgramme._id,
          );
          if (weeksResponse) {
            setWeeksStatus(weeksResponse);
            // Get the current week number for fetching weekly control data
            const closableWeek = weeksResponse.weeks?.find(
              (w: { canClose: boolean }) => w.canClose,
            );
            const weekNumber =
              closableWeek?.weekNumber || weeksResponse.currentWeekNumber;
            await fetchWeeklyControlData(uploadedProgramme._id, weekNumber);
          }
        }
      }
    } catch (error) {
      console.error("Failed to update cycle status:", error);
    }
  };

  const handleFinalClose = async () => {
    if (!uploadedProgramme?._id) return;

    try {
      const response = await programmeAPI.updateCycleStatus(
        uploadedProgramme._id,
        "Closed",
      );
      if (response.success) {
        setCurrentStep(5);
        setIsWeekClosed(true);
        setUploadedProgramme({
          ...uploadedProgramme,
          cycleStatus: "Closed",
          isLocked: true,
        });
      }
    } catch (error) {
      console.error("Failed to close week:", error);
    }
  };

  const handleOverrideClose = async () => {
    if (!uploadedProgramme?._id || overrideReason.length < 10) return;

    // Find the week to close
    const weekToClose = weeksStatus?.weeks.find((w) => w.canClose)?.weekNumber;
    if (!weekToClose) {
      console.error("No week available to close");
      return;
    }

    try {
      // Save override reason for display
      setSavedOverrideReason(overrideReason);
      setShowOverrideForm(false);

      // Use handleCloseSpecificWeek with "PM Override" to actually close the weeks
      await handleCloseSpecificWeek(weekToClose, "PM Override");

      // Clear the override reason input
      setOverrideReason("");
    } catch (error) {
      console.error("Failed to close weeks with override:", error);
    }
  };

  // Handler for PM Override from Closure & Export tab - stays on closed week
  const handleOverrideCloseForExport = async () => {
    if (!uploadedProgramme?._id || overrideReason.length < 10) return;

    const weekToClose = weeksStatus?.weeks.find((w) => w.canClose)?.weekNumber;
    if (!weekToClose) {
      console.error("No week available to close");
      return;
    }

    setClosingWeek(weekToClose);
    try {
      setSavedOverrideReason(overrideReason);
      setShowOverrideForm(false);

      // Close 2 weeks at once
      const response1 = await programmeAPI.closeWeek(
        uploadedProgramme._id,
        weekToClose,
        "PM Override",
        overrideReason,
      );

      if (response1.success && !response1.isFullyClosed) {
        await programmeAPI.closeWeek(
          uploadedProgramme._id,
          weekToClose + 1,
          "PM Override",
          overrideReason,
        );
      }

      if (response1.success) {
        // Lock the view to the closed week BEFORE updating weeksStatus
        // This prevents the useEffect from automatically switching to the next week
        setLockedViewWeek(weekToClose);

        // Fetch updated weeks status
        const updatedWeeksStatus = await programmeAPI.getWeeksStatus(
          uploadedProgramme._id,
        );

        if (updatedWeeksStatus.success) {
          setWeeksStatus(updatedWeeksStatus);

          // Stay on the CLOSED week (not next) - fetch data for the week we just closed
          await fetchWeeklyControlData(uploadedProgramme._id, weekToClose);

          // Also refresh programme data to ensure all UI is updated
          await refetchProgramme();

          // Update export gating status - cycle should now be Close-Out Eligible or Closed
          setExportGatingStatus({
            isGated: false,
            cycleStatus: "Close-Out Eligible",
          });
        }

        // Update programme status if fully closed
        if (response1.isFullyClosed) {
          setIsWeekClosed(true);
          setUploadedProgramme((prev) =>
            prev ? { ...prev, cycleStatus: "Closed", isLocked: true } : null,
          );
        } else {
          // Update to Close-Out Eligible
          setUploadedProgramme((prev) =>
            prev ? { ...prev, cycleStatus: "Close-Out Eligible" } : null,
          );
        }
      }

      setOverrideReason("");
    } catch (error) {
      console.error("Failed to close weeks with override:", error);
    } finally {
      setClosingWeek(null);
    }
  };

  const getCycleButtonText = () => {
    if (cycleStage === "draft") return "Open Meeting";
    if (cycleStage === "meetingOpen") return "Start Execution";
    return "In Execution";
  };

  const getCycleStatusText = () => {
    if (uploadedProgramme?.cycleStatus) {
      return uploadedProgramme.cycleStatus;
    }
    if (cycleStage === "draft") return "Draft";
    if (cycleStage === "meetingOpen") return "Meeting Open";
    return "Execution";
  };

  const handleEditClick = (
    action: ActionItem,
    index: number,
    actionId: string,
  ) => {
    setEditingAction({ ...action });
    setEditingIndex(index);
    setEditingActionId(actionId);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditingAction(null);
    setEditingIndex(null);
    setEditingActionId(null);
  };

  const handleEditUpdate = async () => {
    if (!editingAction || !editingActionId) return;

    setEditSaveLoading(true);
    try {
      const selectedActivity = lookaheadData?.activities?.find(
        (a) => a.activityId === editingAction.linkedActivity,
      );
      const activityName = selectedActivity?.activityName || "Unknown activity";

      const response = await actionAPI.update(editingActionId, {
        programmeId: uploadedProgramme?._id,
        linkedActivity: {
          activityId: editingAction.linkedActivity,
          activityName: activityName,
        },
        title: editingAction.title,
        description: editingAction.description,
        type: editingAction.type,
        priority: editingAction.priority,
        status: editingAction.status,
        assignee: editingAction.assigneeId,
        dueDate: editingAction.dueDate,
      });

      if (response.success) {
        const actionsRes = await actionAPI.getAll({
          programmeId: uploadedProgramme?._id,
        });
        if (actionsRes.success) {
          setProjectActions(actionsRes.actions || []);
        }
        handleEditClose();
      }
    } catch (error) {
      console.error("Failed to update action:", error);
      alert("Failed to update action. Please try again.");
    } finally {
      setEditSaveLoading(false);
    }
  };

  const handleEditChange = (field: keyof ActionItem, value: string) => {
    if (editingAction) {
      setEditingAction({ ...editingAction, [field]: value });
    }
  };

  const handleOpenCompleteConfirm = (action: {
    _id: string;
    title: string;
  }) => {
    setActionToComplete(action);
    setCompleteConfirmOpen(true);
  };

  const handleCloseCompleteConfirm = () => {
    setCompleteConfirmOpen(false);
    setActionToComplete(null);
  };

  const handleConfirmComplete = async () => {
    if (!actionToComplete) return;

    setCompleteLoading(true);
    try {
      const response = await actionAPI.complete(actionToComplete._id);
      if (response.success) {
        if (projectId) {
          const actionsRes = await actionAPI.getAll({
            programmeId: uploadedProgramme?._id,
          });
          if (actionsRes.success) {
            setProjectActions(actionsRes.actions || []);
          }
        }
        // Refresh weekly control data to remove completed activity from blocked/risk list
        if (uploadedProgramme?._id) {
          // Use the SAME weekNumber that the useEffect uses to ensure consistent data
          const closableWeek = weeksStatus?.weeks?.find(
            (w: { canClose: boolean }) => w.canClose,
          );
          const weekNumber =
            closableWeek?.weekNumber || weeksStatus?.currentWeekNumber;
          await fetchWeeklyControlData(uploadedProgramme._id, weekNumber);
        }
        handleCloseCompleteConfirm();
      }
    } catch (error) {
      console.error("Failed to complete action:", error);
      alert("Failed to complete action. Please try again.");
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleOpenAssignModal = (activity: {
    activityId: string;
    activityName: string;
    startDate: string;
    finishDate: string;
  }) => {
    setAssigningActivity(activity);
    setAssignTitle("");
    setAssignAssignee("");
    setAssignDueDate(activity.startDate);
    setAssignPriority("Medium");
    setAssignType("Required");
    setAssignError("");
    setAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setAssignModalOpen(false);
    setAssigningActivity(null);
    setAssignTitle("");
    setAssignAssignee("");
    setAssignDueDate("");
    setAssignError("");
  };

  const handleAssignSave = async () => {
    if (!assigningActivity || !uploadedProgramme?._id) return;

    if (!assignTitle.trim()) {
      setAssignError("Action title is required");
      return;
    }
    if (!assignAssignee) {
      setAssignError("Please select an assignee");
      return;
    }
    if (!assignDueDate) {
      setAssignError("Due date is required");
      return;
    }

    setAssignLoading(true);
    setAssignError("");

    try {
      const response = await actionAPI.create({
        programmeId: uploadedProgramme._id,
        linkedActivity: {
          activityId: assigningActivity.activityId,
          activityName: assigningActivity.activityName,
        },
        title: assignTitle,
        assignee: assignAssignee,
        dueDate: assignDueDate,
        priority: assignPriority,
        type: assignType,
      });

      if (response.success) {
        // Keep modal open, show loading while fetching updated data
        // Small delay to ensure MongoDB has committed the write
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Use the SAME weekNumber that the useEffect uses to ensure consistent data
        const closableWeek = weeksStatus?.weeks?.find(
          (w: { canClose: boolean }) => w.canClose,
        );
        const weekNumber =
          closableWeek?.weekNumber || weeksStatus?.currentWeekNumber;

        // Fetch weekly control data FIRST (this updates all 3 tabs)
        await fetchWeeklyControlData(uploadedProgramme._id, weekNumber);

        // Refresh actions and lookahead data
        const [actionsRes, lookaheadRes] = await Promise.all([
          actionAPI.getAll({ programmeId: uploadedProgramme._id }),
          programmeAPI.getLookahead(uploadedProgramme._id),
        ]);

        if (actionsRes.success) {
          setProjectActions(actionsRes.actions || []);
        }
        if (lookaheadRes.activities) {
          setLookaheadData({
            activities: lookaheadRes.activities,
            summary: lookaheadRes.summary,
            weekZones: lookaheadRes.weekZones,
          });
        }

        // Close modal AFTER all data is refreshed
        handleCloseAssignModal();
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create action. Please try again.";
      setAssignError(errorMessage);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleOpenReassign = (action: {
    _id: string;
    title: string;
    assignee?: { _id?: string; name?: string };
  }) => {
    setReassigningAction({
      _id: action._id,
      title: action.title,
      currentAssignee: action.assignee?._id,
      currentAssigneeName: action.assignee?.name,
    });
    setReassignAssignee(action.assignee?._id || "");
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
      const response = await actionAPI.update(reassigningAction._id, {
        assignee: reassignAssignee,
      });

      if (response.success) {
        if (uploadedProgramme?._id) {
          const actionsRes = await actionAPI.getAll({
            programmeId: uploadedProgramme._id,
          });
          if (actionsRes.success) {
            setProjectActions(actionsRes.actions || []);
          }
        }
        handleCloseReassign();
      }
    } catch (error: unknown) {
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

  const handleFileSelect = (file: File) => {
    if (file.type === "application/pdf" && file.size <= 50 * 1024 * 1024) {
      setUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const fetchWeeklyControlData = async (
    programmeId: string,
    weekNumber?: number,
  ) => {
    setIsLoadingWeeklyControl(true);
    try {
      const response = await programmeAPI.getWeeklyControl(
        programmeId,
        weekNumber,
      );
      setWeeklyControlData({
        stats: response.stats || {
          cycleStatus: "Draft",
          inLookahead: 0,
          green: 0,
          blocked: 0,
          openActions: 0,
          overdue: 0,
          readyToClose: "No",
        },
        ragDistribution: response.ragDistribution || {
          green: 0,
          amber: 0,
          red: 0,
        },
        actionsByStatus: response.actionsByStatus || {
          open: 0,
          inProgress: 0,
          closed: 0,
          overdue: 0,
        },
        weeklyActionsByStatus: response.weeklyActionsByStatus || {
          open: 0,
          inProgress: 0,
          closed: 0,
          overdue: 0,
        },
        blockedRiskActivities: response.blockedRiskActivities || [],
        activityCounts: response.activityCounts || { completed: 0, blocked: 0, atRisk: 0 },
        weeklyPlanPreview: response.weeklyPlanPreview || [],
        plannerToDo: response.plannerToDo || [],
        weekInfo: response.weekInfo || null,
        isProjectEnded: response.isProjectEnded || false,
        projectEndDate: response.projectEndDate || null,
        programmeId: response.programmeId || programmeId,
      });
    } catch (error) {
      console.error("Failed to fetch weekly control data:", error);
    } finally {
      setIsLoadingWeeklyControl(false);
    }
  };

  // Calculate export counts when data changes
  useEffect(() => {
    if (weeklyControlData && uploadedProgramme) {
      const cycleStatus = weeklyControlData.stats?.cycleStatus || "Draft";
      const ungatedStatuses = [
        "Execution",
        "Close-Out Eligible",
        "Approved",
        "Closed",
      ];
      const isGated = !ungatedStatuses.includes(cycleStatus);

      setExportGatingStatus({
        isGated,
        cycleStatus,
      });

      // Sync cycleStage and currentStep with actual cycle status from database
      if (cycleStatus === "Uploaded" || cycleStatus === "Draft") {
        setCycleStage("draft");
        setCurrentStep(1);
      } else if (cycleStatus === "Meeting Open") {
        setCycleStage("meetingOpen");
        setCurrentStep(2);
      } else if (cycleStatus === "Execution") {
        setCycleStage("execution");
        setCurrentStep(3);
      } else if (cycleStatus === "Close-Out Eligible") {
        setCycleStage("execution");
        setCurrentStep(4);
      } else if (cycleStatus === "Closed") {
        setCycleStage("execution");
        setCurrentStep(5);
      }

      // Green activities ready = count of green RAG activities in current week
      const greenActivitiesReady =
        weeklyControlData.ragDistribution?.green ||
        weeklyControlData.stats?.green ||
        0;

      // Completed actions (for weekly plan)
      const completedActions = weeklyControlData.actionsByStatus?.closed || 0;

      // PM Override actions (for weekly plan)
      const pmOverrideActions = weeklyControlData.actionsByStatus?.pmOverride || 0;

      // Overdue actions (all)
      const overdueActions = weeklyControlData.actionsByStatus?.overdue || 0;

      // Outstanding actions for Planner To-Do = open + inProgress + overdue (from CURRENT 2 WEEKS only)
      // Use weeklyActionsByStatus which is filtered to current week's actions
      const outstandingActions =
        (weeklyControlData.weeklyActionsByStatus?.open || 0) +
        (weeklyControlData.weeklyActionsByStatus?.inProgress || 0) +
        (weeklyControlData.weeklyActionsByStatus?.overdue || 0);

      // Blocked activities (for UI display)
      const blockedActivities =
        weeklyControlData.blockedRiskActivities?.length || 0;

      // Activity counts from backend (for Weekly Plan export)
      const completedActivitiesCount = weeklyControlData.activityCounts?.completed || 0;
      const blockedActivitiesCount = weeklyControlData.activityCounts?.blocked || 0;
      const atRiskActivitiesCount = weeklyControlData.activityCounts?.atRisk || 0;

      // Weekly Plan total = Actions + Activities (Completed + Blocked + At Risk)
      const weeklyPlanTotal = completedActions + overdueActions + pmOverrideActions +
        completedActivitiesCount + blockedActivitiesCount + atRiskActivitiesCount;

      setExportCounts({
        greenActivitiesReady,
        weeklyPlanTotal,
        outstandingActions,
        overdueActions,
        blockedActivities,
        completedActions,
        pmOverrideActions,
      });

      // Update closure checklist based on real data - auto-check all
      setClosureChecklist({
        // Planner review complete: checked when there are green activities ready
        plannerReview: greenActivitiesReady > 0,
        // To-do list generated: checked when no outstanding actions remain
        todoGenerated: outstandingActions === 0,
        // Overdue acknowledged: checked when no overdue actions
        overdueAcknowledged: overdueActions === 0,
        // Blocked acknowledged: checked when no blocked activities
        blockedAcknowledged: blockedActivities === 0,
      });
    }
  }, [weeklyControlData, uploadedProgramme]);

  // Handle export downloads
  const handleExportWeeklyPlan = async () => {
    if (!uploadedProgramme) return;

    try {
      setIsExporting("weekly");
      // Use locked view week if set (from PM Override), otherwise use current closable week
      const closableWeek = weeksStatus?.weeks.find((w) => w.canClose);
      const weekNumber =
        lockedViewWeek ??
        closableWeek?.weekNumber ??
        weeksStatus?.currentWeekNumber;
      const response = await exportAPI.generateWeeklyPlan(weekNumber);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Weekly_Plan_Week${weekNumber}_${project?.name || "export"}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Update checklist
      setClosureChecklist((prev) => ({ ...prev, plannerReview: true }));
    } catch (error) {
      console.error("Error exporting weekly plan:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPlannerTodo = async () => {
    if (!uploadedProgramme) return;

    try {
      setIsExporting("todo");
      // Use locked view week if set (from PM Override), otherwise use current closable week
      const closableWeek = weeksStatus?.weeks.find((w) => w.canClose);
      const weekNumber =
        lockedViewWeek ??
        closableWeek?.weekNumber ??
        weeksStatus?.currentWeekNumber;
      const response = await exportAPI.generatePlannerTodo(weekNumber);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Planner_ToDo_Week${weekNumber}_${project?.name || "export"}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Update checklist
      setClosureChecklist((prev) => ({ ...prev, todoGenerated: true }));
    } catch (error) {
      console.error("Error exporting planner todo:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!uploadedFile || !project) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const programmeName = uploadedFile.name.replace(/\.pdf$/i, "");
      const response = await programmeAPI.upload(
        uploadedFile,
        programmeName,
        projectId,
      );

      if (response.success) {
        const programme = response.programme;
        const activities =
          programme.activities || programme.extractedData?.activities || [];
        const summary = programme.summary ||
          programme.extractedData?.summary || {
            total: 0,
            inLookahead: 0,
            green: 0,
            amber: 0,
            red: 0,
            blocked: 0,
          };

        setUploadedProgramme({
          _id: programme._id,
          name: programme.name,
          totalActivities:
            programme.extractedData?.totalActivities || activities.length,
          cycleStatus: programme.cycleStatus || "Draft",
          isLocked: programme.isLocked || false,
          overrideReason: programme.overrideReason,
          summary: {
            green: summary.green || 0,
            amber: summary.amber || 0,
            red: summary.red || 0,
            inLookahead: summary.inLookahead || activities.length,
          },
        });
        setUploadedFile(null);

        setLookaheadData({
          activities: activities.map(
            (a: {
              activityId?: string;
              activityName?: string;
              duration?: string;
              startDate?: string;
              finishDate?: string;
              status?: string;
              ragStatus?: string;
              activityStatus?: string;
              weekZone?: string | null;
              actionsCount?: number;
              openActionsCount?: number;
            }) => ({
              activityId: a.activityId || "",
              activityName: a.activityName || "",
              duration: a.duration || "",
              startDate: a.startDate || "",
              finishDate: a.finishDate || "",
              status: a.status || "",
              ragStatus: a.ragStatus || "",
              activityStatus: a.activityStatus || "",
              weekZone: a.weekZone || null,
              actionsCount: a.actionsCount || 0,
              openActionsCount: a.openActionsCount || 0,
            }),
          ),
          summary: {
            total: summary.total || activities.length,
            inLookahead: summary.inLookahead || activities.length,
            green: summary.green || 0,
            amber: summary.amber || 0,
            red: summary.red || 0,
            blocked: summary.blocked || 0,
          },
          weekZones: [
            {
              weekNumber: 1,
              label: "Week 1",
              category: "Weeks 1-2",
              activitiesCount: 0,
            },
            {
              weekNumber: 2,
              label: "Week 2",
              category: "Weeks 1-2",
              activitiesCount: 0,
            },
            {
              weekNumber: 3,
              label: "Week 3",
              category: "Weeks 3-4",
              activitiesCount: 0,
            },
            {
              weekNumber: 4,
              label: "Week 4",
              category: "Weeks 3-4",
              activitiesCount: 0,
            },
            {
              weekNumber: 5,
              label: "Week 5",
              category: "Weeks 5-6",
              activitiesCount: 0,
            },
            {
              weekNumber: 6,
              label: "Week 6",
              category: "Weeks 5-6",
              activitiesCount: 0,
            },
          ],
        });
        // Note: Don't call fetchWeeklyControlData here - let the useEffect handle it
        // once weeksStatus is loaded to ensure correct week number is used
      }
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            errors?: { field: string; message: string }[];
          };
        };
      };
      if (err.response?.data?.errors) {
        setUploadError(err.response.data.errors[0]?.message || "Upload failed");
      } else if (err.response?.data?.message) {
        setUploadError(err.response.data.message);
      } else {
        setUploadError("Failed to upload programme. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadError("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Start of today (midnight) - actions are only overdue after due date has fully passed
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Calculate action stats from projectActions (same data source as the table)
  // Use weeklyControlData.actionsByStatus which excludes actions from PM Override'd weeks
  // Calculate action stats from projectActions for Actions tab (shows ALL actions)
  const actionStats = {
    total: projectActions.length,
    open: projectActions.filter((a) => a.status === "Open").length,
    inProgress: projectActions.filter((a) => a.status === "In Progress").length,
    closed: projectActions.filter((a) => a.status === "Completed").length,
    overdue: projectActions.filter(
      (a) =>
        a.dueDate &&
        new Date(a.dueDate) < startOfToday &&
        a.status !== "Completed" &&
        a.status !== "Cancelled",
    ).length,
  };

  // Weekly action stats for PM Override warning (week-filtered, excludes PM Override'd actions)
  const weeklyActionStats = {
    total:
      (weeklyControlData?.weeklyActionsByStatus?.open || 0) +
      (weeklyControlData?.weeklyActionsByStatus?.inProgress || 0) +
      (weeklyControlData?.weeklyActionsByStatus?.closed || 0),
    open: weeklyControlData?.weeklyActionsByStatus?.open || 0,
    inProgress: weeklyControlData?.weeklyActionsByStatus?.inProgress || 0,
    closed: weeklyControlData?.weeklyActionsByStatus?.closed || 0,
    overdue: weeklyControlData?.weeklyActionsByStatus?.overdue || 0,
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber === currentStep && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (isLoading) {
    return (
      <PlannerLayout
        title="Project Workspace"
        subtitle="Manage weekly control cycle"
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 400,
          }}
        >
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      </PlannerLayout>
    );
  }

  if (!project) {
    return (
      <PlannerLayout
        title="Project Workspace"
        subtitle="Manage weekly control cycle"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 400,
            gap: 2,
          }}
        >
          <Typography sx={{ color: COLORS.textPrimary, fontSize: "18px" }}>
            Project not found
          </Typography>
          <Button
            onClick={() => navigate("/planner/projects")}
            sx={{
              bgcolor: COLORS.blue,
              color: "#fff",
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: "8px",
              "&:hover": { bgcolor: COLORS.blueHover },
            }}
          >
            Back to Projects
          </Button>
        </Box>
      </PlannerLayout>
    );
  }

  const planner =
    project.team?.find((t) => t.role === "Planner")?.user?.name ||
    project.createdBy?.name ||
    defaultDashboardData.planner;

  return (
    <PlannerLayout
      title="Project Workspace"
      subtitle="Manage weekly control cycle"
    >
      <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
        <ProjectHeader
          breadcrumb={{
            label: "Projects",
            onClick: () => navigate("/planner/projects"),
          }}
          projectName={project.name}
          phase={project.phase}
          week={
            weeksStatus
              ? `Week ${weeksStatus.currentWeekNumber}`
              : defaultDashboardData.week
          }
          weekDates={
            weeksStatus
              ? `${weeksStatus.closedWeeksCount}/${weeksStatus.totalWeeks} closed`
              : defaultDashboardData.weekDates
          }
          planner={planner}
          currentStep={currentStep}
          steps={steps}
          onStepClick={handleStepClick}
        />

        <Box
          sx={{
            mb: 3,
            borderBottom: `2px solid ${COLORS.border}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => {
              setActiveTab(newValue);
              if (newValue !== 3) {
                setSelectedActionId(null);
              }
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: "auto",
              mb: "-1.5px",
              "& .MuiTabs-scrollButtons": {
                color: COLORS.textMuted,
                "&.Mui-disabled": { opacity: 0.3 },
              },
              "& .MuiTabs-indicator": {
                bgcolor: COLORS.blue,
                height: "1.5px",
                bottom: 0,
              },
              "& .MuiTab-root": {
                color: COLORS.white,
                textTransform: "none",
                fontSize: { xs: "12px", sm: "14px" },
                fontWeight: 500,
                minHeight: "auto",
                py: 1.5,
                px: 0,
                mr: { xs: 2, sm: 4 },
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
            <Tab label="Closure & Export" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
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
                value={defaultDashboardData.activitiesInLookahead}
              />
              <StatCard
                label={`${defaultDashboardData.activitiesInLookahead} Green & Ready`}
                value={defaultDashboardData.greenReady}
                subLabel={`of ${defaultDashboardData.totalGreen} green`}
                valueColor={COLORS.green}
              />
              <StatCard
                label="Open Actions"
                value={defaultDashboardData.openActions}
                valueColor={COLORS.amber}
              />
              <StatCard
                label="Overdue Actions"
                value={defaultDashboardData.overdueActions}
                valueColor={COLORS.red}
              />
            </Box>

            {(defaultDashboardData.ragDistribution.green > 0 ||
              defaultDashboardData.ragDistribution.amber > 0 ||
              defaultDashboardData.ragDistribution.red > 0 ||
              defaultDashboardData.cycleHistory.length > 0) && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                  gap: 3,
                }}
              >
                {(defaultDashboardData.ragDistribution.green > 0 ||
                  defaultDashboardData.ragDistribution.amber > 0 ||
                  defaultDashboardData.ragDistribution.red > 0) && (
                  <RAGDonutChart data={defaultDashboardData.ragDistribution} />
                )}
                {defaultDashboardData.cycleHistory.length > 0 && (
                  <RecentCycleHistory
                    cycleHistory={defaultDashboardData.cycleHistory}
                  />
                )}
              </Box>
            )}
          </>
        )}

        {activeTab === 1 && (
          <Box>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={handleInputChange}
              style={{ display: "none" }}
            />

            {isLoadingProgramme ? (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 4,
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
                >
                  <Skeleton
                    variant="circular"
                    width={48}
                    height={48}
                    sx={{ bgcolor: COLORS.bgTertiary }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton
                      variant="text"
                      width="60%"
                      height={28}
                      sx={{ bgcolor: COLORS.bgTertiary }}
                    />
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={20}
                      sx={{ bgcolor: COLORS.bgTertiary }}
                    />
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
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      variant="rectangular"
                      height={80}
                      sx={{ bgcolor: COLORS.bgTertiary, borderRadius: "8px" }}
                    />
                  ))}
                </Box>
                <Skeleton
                  variant="rectangular"
                  width={200}
                  height={40}
                  sx={{ bgcolor: COLORS.bgTertiary, borderRadius: "8px" }}
                />
              </Box>
            ) : uploadedProgramme ? (
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
                  <Box>
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
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "14px",
                      }}
                    >
                      {uploadedProgramme.name}
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
                  <Box
                    sx={{
                      bgcolor: COLORS.bgTertiary,
                      borderRadius: "8px",
                      p: 2,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "24px",
                        fontWeight: 700,
                      }}
                    >
                      {uploadedProgramme.totalActivities}
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                    >
                      Total Activities
                    </Typography>
                  </Box>
                  {(() => {
                    const activities = lookaheadData?.activities || [];
                    const readyCount = activities.filter(
                      (a) =>
                        a.activityStatus === "Ready" ||
                        (!a.activityStatus && a.ragStatus !== "Blocked"),
                    ).length;
                    const atRiskCount = activities.filter(
                      (a) => a.activityStatus === "At Risk",
                    ).length;
                    const completeCount = activities.filter(
                      (a) => a.activityStatus === "Complete",
                    ).length;
                    const blockedCount = activities.filter(
                      (a) =>
                        a.activityStatus === "Blocked" ||
                        a.ragStatus === "Blocked",
                    ).length;
                    return (
                      <>
                        <Box
                          sx={{
                            bgcolor: COLORS.bgTertiary,
                            borderRadius: "8px",
                            p: 2,
                            textAlign: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              color: COLORS.green,
                              fontSize: "24px",
                              fontWeight: 700,
                            }}
                          >
                            {readyCount}
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "12px",
                            }}
                          >
                            Ready
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            bgcolor: COLORS.bgTertiary,
                            borderRadius: "8px",
                            p: 2,
                            textAlign: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              color: COLORS.amber,
                              fontSize: "24px",
                              fontWeight: 700,
                            }}
                          >
                            {atRiskCount}
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "12px",
                            }}
                          >
                            At Risk
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            bgcolor: COLORS.bgTertiary,
                            borderRadius: "8px",
                            p: 2,
                            textAlign: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              color: COLORS.blue,
                              fontSize: "24px",
                              fontWeight: 700,
                            }}
                          >
                            {completeCount}
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "12px",
                            }}
                          >
                            Complete
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            bgcolor: COLORS.bgTertiary,
                            borderRadius: "8px",
                            p: 2,
                            textAlign: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              color: COLORS.red,
                              fontSize: "24px",
                              fontWeight: 700,
                            }}
                          >
                            {blockedCount}
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "12px",
                            }}
                          >
                            Blocked
                          </Typography>
                        </Box>
                      </>
                    );
                  })()}
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
                      "&:hover": {
                        bgcolor: COLORS.blueHover,
                      },
                    }}
                  >
                    View Activities & Lookahead
                  </Button>
                  {/* <Button
                    onClick={handleDeleteProgramme}
                    disabled={isDeleting}
                    sx={{
                      bgcolor: "transparent",
                      color: COLORS.red,
                      border: `1px solid ${COLORS.red}`,
                      textTransform: "none",
                      px: 3,
                      py: 1,
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 500,
                      minWidth: 140,
                      "&:hover": {
                        bgcolor: "rgba(239, 68, 68, 0.1)",
                      },
                      "&.Mui-disabled": {
                        color: COLORS.textMuted,
                        borderColor: COLORS.border,
                      },
                    }}
                  >
                    {isDeleting ? (
                      <CircularProgress size={20} sx={{ color: COLORS.red }} />
                    ) : (
                      "Delete Programme"
                    )}
                  </Button> */}
                </Box>
              </Box>
            ) : !uploadedFile ? (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 6,
                  px: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "16px",
                    fontWeight: 400,
                    mb: 2,
                  }}
                >
                  No programme uploaded yet. Upload a PDF first.
                </Typography>
                <Button
                  onClick={handleBrowseClick}
                  sx={{
                    bgcolor: COLORS.blue,
                    color: "#fff",
                    textTransform: "none",
                    px: 3,
                    py: 1,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    "&:hover": {
                      bgcolor: COLORS.blueHover,
                    },
                  }}
                >
                  Go to Upload
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 3,
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 600,
                    mb: 2.5,
                  }}
                >
                  Upload Programs PDF
                </Typography>

                <Box
                  onClick={handleBrowseClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  sx={{
                    border: `1px dashed ${isDragOver ? COLORS.blue : COLORS.border}`,
                    borderRadius: "12px",
                    py: 6,
                    px: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    bgcolor: isDragOver ? `${COLORS.blue}08` : "transparent",
                    "&:hover": {
                      borderColor: COLORS.blue,
                      bgcolor: `${COLORS.blue}08`,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={uploadIcon}
                    sx={{
                      width: 60,
                      height: 60,
                      mb: 2,
                      opacity: 0.6,
                    }}
                  />
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 500,
                      mb: 0.5,
                    }}
                  >
                    Drop your PDF here or click to browse
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    PDF only, max 50MB
                  </Typography>
                </Box>

                {uploadError && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#EF4444",
                        fontSize: "14px",
                        textAlign: "center",
                      }}
                    >
                      {uploadError}
                    </Typography>
                  </Box>
                )}

                <Box
                  sx={{
                    bgcolor: COLORS.bgTertiary,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "12px",
                    p: 2,
                    mt: 2.5,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: { xs: 2, sm: 0 },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "8px",
                        bgcolor: "#EF4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    <Box>
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {uploadedFile.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: COLORS.textMuted,
                          fontSize: "12px",
                          fontWeight: 400,
                        }}
                      >
                        {formatFileSize(uploadedFile.size)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                      sx={{
                        color: COLORS.textSecondary,
                        bgcolor: "transparent",
                        border: `1px solid ${COLORS.border}`,
                        textTransform: "none",
                        px: 2,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": {
                          bgcolor: COLORS.bgTertiary,
                        },
                        "&.Mui-disabled": {
                          color: COLORS.textMuted,
                        },
                      }}
                    >
                      Remove
                    </Button>
                    <Button
                      onClick={handleUploadAndProcess}
                      disabled={isUploading}
                      sx={{
                        bgcolor: COLORS.blue,
                        color: "#fff",
                        textTransform: "none",
                        px: 2.5,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        minWidth: 140,
                        whiteSpace: "nowrap",
                        "&:hover": {
                          bgcolor: COLORS.blueHover,
                        },
                        "&.Mui-disabled": {
                          bgcolor: COLORS.blueDisabled,
                          color: "rgba(255, 255, 255, 0.5)",
                        },
                      }}
                    >
                      {isUploading ? (
                        <CircularProgress size={20} sx={{ color: "#fff" }} />
                      ) : (
                        "Upload & Process"
                      )}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
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
              {[
                { week: "Week 1", label: "Committed", color: COLORS.green },
                { week: "Week 2", label: "Committed", color: COLORS.green },
                { week: "Week 3", label: "Readiness", color: COLORS.amber },
                { week: "Week 4", label: "Readiness", color: COLORS.amber },
                { week: "Week 5", label: "Strategic", color: COLORS.red },
                { week: "Week 6", label: "Strategic", color: COLORS.red },
              ].map((item, index) => (
                <Box
                  key={index}
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
                    bgcolor:
                      item.label !== "Committed"
                        ? `${item.color}10`
                        : "transparent",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      color: item.color,
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {item.week}
                  </Box>
                  <Box
                    component="span"
                    sx={{ color: "#8E9CB1", fontSize: "12px", fontWeight: 400 }}
                  >
                    {item.label}
                  </Box>
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
                { label: "Complete", value: "Complete" },
                { label: "At Risk", value: "At Risk" },
              ].map((filter) => (
                <Box
                  key={filter.value}
                  onClick={() => {
                    setRagFilter(filter.value);
                    setActivitiesPage(1);
                  }}
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
                    border: `1px solid ${
                      ragFilter === filter.value ? COLORS.blue : COLORS.border
                    }`,
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

            {/* Activities Table */}
            <>
              <Box
                sx={{
                  overflowX: "auto",
                  mb: 2,
                  "&::-webkit-scrollbar": {
                    height: 6,
                  },
                  "&::-webkit-scrollbar-track": {
                    bgcolor: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: COLORS.border,
                    borderRadius: 3,
                  },
                }}
              >
                <Box
                  sx={{
                    minWidth: 1100,
                    bgcolor: COLORS.bgSecondary,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {/* Table Header */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "4px 100px 1fr 95px 95px 70px 95px 60px 60px 75px 120px",
                      bgcolor: COLORS.bgTertiary,
                      borderBottom: `1px solid ${COLORS.border}`,
                      px: 2,
                      py: 1.5,
                      gap: 1,
                    }}
                  >
                    <Box /> {/* Space for status indicator */}
                    {[
                      "Activity ID",
                      "Activity Name",
                      "Start Date",
                      "End Date",
                      "Duration",
                      "RAG Zone",
                      "Actions",
                      "Assignee",
                      "Status",
                      "Owner",
                    ].map((header, idx) => (
                      <Typography
                        key={header}
                        sx={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: COLORS.textSecondary,
                          textTransform: "uppercase",
                          textAlign: [2, 3, 4, 5, 7, 8, 9].includes(idx)
                            ? "center"
                            : "left",
                        }}
                      >
                        {header}
                      </Typography>
                    ))}
                  </Box>
                  {!lookaheadData?.activities ||
                  lookaheadData.activities.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: "center" }}>
                      <Typography
                        sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                      >
                        No activities data available
                      </Typography>
                    </Box>
                  ) : (
                    (() => {
                      const filteredActivities = lookaheadData.activities
                        .filter(
                          (activity) =>
                            ragFilter === "all" ||
                            activity.activityStatus === ragFilter,
                        )
                        .sort((a, b) => {
                          const colorA = getRAGColor(a.startDate, a.finishDate);
                          const colorB = getRAGColor(b.startDate, b.finishDate);
                          return (
                            getRAGPriority(colorA) - getRAGPriority(colorB)
                          );
                        });
                      const startIndex =
                        (activitiesPage - 1) * activitiesPerPage;
                      const paginatedActivities = filteredActivities.slice(
                        startIndex,
                        startIndex + activitiesPerPage,
                      );

                      return paginatedActivities.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: "center" }}>
                          <Typography
                            sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                          >
                            No activities match the selected filter
                          </Typography>
                        </Box>
                      ) : (
                        paginatedActivities.map((activity, index) => {
                          const getStatusColor = (status: string) => {
                            switch (status) {
                              case "Ready":
                                return {
                                  bg: "rgba(34, 197, 94, 0.15)",
                                  text: COLORS.green,
                                };
                              case "At Risk":
                                return {
                                  bg: "rgba(245, 158, 11, 0.15)",
                                  text: COLORS.amber,
                                };
                              case "Blocked":
                                return {
                                  bg: "rgba(239, 68, 68, 0.15)",
                                  text: COLORS.red,
                                };
                              case "Complete":
                                return {
                                  bg: "rgba(59, 130, 246, 0.15)",
                                  text: COLORS.blue,
                                };
                              default:
                                return {
                                  bg: "rgba(142, 156, 177, 0.15)",
                                  text: COLORS.textSecondary,
                                };
                            }
                          };
                          const getIndicatorColor = (status: string) => {
                            switch (status) {
                              case "Ready":
                                return COLORS.green;
                              case "At Risk":
                                return COLORS.amber;
                              case "Blocked":
                                return COLORS.red;
                              case "Complete":
                                return COLORS.blue;
                              default:
                                return COLORS.textMuted;
                            }
                          };
                          const calculateRagZone = (
                            startDate: string,
                            finishDate: string,
                            activityStatus?: string,
                          ) => {
                            // Check if completed (status or "A" suffix in dates)
                            const isCompleted =
                              activityStatus === "Complete" ||
                              activityStatus === "Completed" ||
                              startDate?.includes(" A") ||
                              finishDate?.includes(" A");

                            if (isCompleted) {
                              return { zone: "Complete", color: COLORS.blue };
                            }

                            if (!startDate)
                              return { zone: "N/A", color: COLORS.textMuted };

                            const start = parseDate(startDate);
                            const finish = parseDate(finishDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            if (!start)
                              return { zone: "N/A", color: COLORS.textMuted };

                            const msPerDay = 1000 * 60 * 60 * 24;
                            const daysUntilStart = Math.ceil(
                              (start.getTime() - today.getTime()) / msPerDay,
                            );
                            const weeksUntilStart = Math.ceil(
                              daysUntilStart / 7,
                            );

                            // Already started
                            if (daysUntilStart < 0) {
                              // Check if overdue (finish date passed)
                              if (finish && finish < today) {
                                return { zone: "Overdue", color: COLORS.red };
                              }
                              return {
                                zone: "In Progress",
                                color: COLORS.green,
                              };
                            }

                            // Future activities
                            if (weeksUntilStart <= 2) {
                              return { zone: "Weeks 1-2", color: COLORS.green };
                            } else if (weeksUntilStart <= 4) {
                              return { zone: "Weeks 3-4", color: COLORS.amber };
                            } else if (weeksUntilStart <= 6) {
                              return { zone: "Weeks 5-6", color: COLORS.red };
                            } else {
                              return {
                                zone: `${weeksUntilStart} Weeks`,
                                color: COLORS.textMuted,
                              };
                            }
                          };
                          const statusColors = getStatusColor(
                            activity.activityStatus || "Ready",
                          );
                          const indicatorColor = getIndicatorColor(
                            activity.activityStatus || "Ready",
                          );
                          const ragZone = calculateRagZone(
                            activity.startDate,
                            activity.finishDate,
                            activity.activityStatus,
                          );
                          const ownerName = user?.name || "Unknown";
                          const ownerInitials = ownerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);

                          const formatDate = (dateStr: string) => {
                            if (!dateStr) return "-";

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

                            const cleanDate = dateStr
                              .replace(/\s*[A*]$/, "")
                              .trim();
                            const match = cleanDate.match(
                              /(\d{2})-([A-Za-z]{3})-(\d{2})/,
                            );

                            if (match) {
                              const day = parseInt(match[1]);
                              const month = months[match[2]];
                              let year = parseInt(match[3]);
                              year = year < 50 ? 2000 + year : 1900 + year;
                              return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            }

                            const date = new Date(dateStr);
                            if (isNaN(date.getTime())) return "-";
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            return `${year}-${month}-${day}`;
                          };

                          const actionsForThisActivity = getActionsForActivity(
                            activity.activityId,
                          );
                          const isExpanded =
                            expandedActivityId === activity.activityId;

                          return (
                            <Box key={activity.activityId || index}>
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "4px 100px 1fr 95px 95px 70px 95px 60px 60px 75px 120px",
                                  px: 2,
                                  py: 1.5,
                                  borderBottom: isExpanded
                                    ? "none"
                                    : `1px solid ${COLORS.border}`,
                                  alignItems: "center",
                                  gap: 1,
                                  "&:last-child": {
                                    borderBottom: isExpanded ? "none" : "none",
                                  },
                                  "&:hover": {
                                    bgcolor: COLORS.whiteHoverLight,
                                  },
                                  position: "relative",
                                  cursor:
                                    actionsForThisActivity.length > 0
                                      ? "pointer"
                                      : "default",
                                }}
                                onClick={() => {
                                  if (actionsForThisActivity.length > 0) {
                                    setExpandedActivityId(
                                      isExpanded ? null : activity.activityId,
                                    );
                                  }
                                }}
                              >
                                {/* Status Indicator (based on activityStatus) */}
                                <Box
                                  sx={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: "2px",
                                    bgcolor: indicatorColor,
                                    borderRadius: 0,
                                  }}
                                />
                                <Box /> {/* Spacer for indicator column */}
                                {/* Activity ID */}
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: COLORS.blue,
                                    fontWeight: 500,
                                  }}
                                >
                                  {activity.activityId}
                                </Typography>
                                {/* Activity Name */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 0.5,
                                  }}
                                >
                                  {actionsForThisActivity.length > 0 &&
                                    (isExpanded ? (
                                      <ArrowDownIcon
                                        sx={{
                                          fontSize: 16,
                                          color: COLORS.textSecondary,
                                          mt: 0.2,
                                          flexShrink: 0,
                                        }}
                                      />
                                    ) : (
                                      <ArrowRightIcon
                                        sx={{
                                          fontSize: 16,
                                          color: COLORS.textSecondary,
                                          mt: 0.2,
                                          flexShrink: 0,
                                        }}
                                      />
                                    ))}
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      color: COLORS.textPrimary,
                                      wordBreak: "break-word",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {activity.activityName}
                                  </Typography>
                                </Box>
                                {/* Start Date */}
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: COLORS.textSecondary,
                                    textAlign: "center",
                                  }}
                                >
                                  {formatDate(activity.startDate)}
                                </Typography>
                                {/* End Date */}
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: COLORS.textSecondary,
                                    textAlign: "center",
                                  }}
                                >
                                  {formatDate(activity.finishDate)}
                                </Typography>
                                {/* Duration */}
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: COLORS.textSecondary,
                                    textAlign: "center",
                                  }}
                                >
                                  {activity.duration || "-"}
                                </Typography>
                                {/* RAG Zone badge */}
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.75,
                                    px: 1,
                                    py: 0.4,
                                    borderRadius: "14px",
                                    border: `1px solid ${ragZone.color}40`,
                                    bgcolor: `${ragZone.color}15`,
                                    width: "100%",
                                    maxWidth: "fit-content",
                                    mx: "auto",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      bgcolor: ragZone.color,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: "10px",
                                      fontWeight: 500,
                                      color: ragZone.color,
                                    }}
                                  >
                                    {ragZone.zone}
                                  </Typography>
                                </Box>
                                {/* Actions */}
                                {(() => {
                                  const actionsForActivity =
                                    getActionsForActivity(activity.activityId);
                                  const actionsCount =
                                    actionsForActivity.length;
                                  return actionsCount > 0 ? (
                                    <Typography
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedActivityId(
                                          expandedActivityId ===
                                            activity.activityId
                                            ? null
                                            : activity.activityId,
                                        );
                                      }}
                                      sx={{
                                        fontSize: "12px",
                                        color: COLORS.blue,
                                        cursor: "pointer",
                                        "&:hover": {
                                          textDecoration: "underline",
                                        },
                                      }}
                                    >
                                      {actionsCount} action
                                      {actionsCount !== 1 ? "s" : ""}
                                    </Typography>
                                  ) : (
                                    <Typography
                                      sx={{
                                        fontSize: "12px",
                                        color: COLORS.textSecondary,
                                      }}
                                    >
                                      -
                                    </Typography>
                                  );
                                })()}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {(() => {
                                    if (actionsForThisActivity.length > 0) {
                                      const latestAction =
                                        actionsForThisActivity[0];
                                      const assigneeName =
                                        latestAction.assignee?.name ||
                                        "Assigned";
                                      const assigneeInitials = assigneeName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2);
                                      return (
                                        <Box
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedActivityId(
                                              isExpanded
                                                ? null
                                                : activity.activityId,
                                            );
                                          }}
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            cursor: "pointer",
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: "6px",
                                            "&:hover": {
                                              bgcolor: COLORS.bgTertiary,
                                            },
                                          }}
                                        >
                                          <Avatar
                                            sx={{
                                              width: 20,
                                              height: 20,
                                              fontSize: "9px",
                                              fontWeight: 600,
                                              bgcolor: COLORS.green,
                                            }}
                                          >
                                            {assigneeInitials}
                                          </Avatar>
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: COLORS.textPrimary,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              maxWidth: "60px",
                                            }}
                                          >
                                            {assigneeName.split(" ")[0]}
                                          </Typography>
                                        </Box>
                                      );
                                    }
                                    // Enable assign if status is Ready
                                    const canAssign =
                                      (activity.activityStatus === "Ready" ||
                                        !activity.activityStatus) &&
                                      !weeklyControlData?.isProjectEnded;

                                    return (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (canAssign) {
                                            handleOpenAssignModal({
                                              activityId: activity.activityId,
                                              activityName:
                                                activity.activityName,
                                              startDate: toDateInputFormat(
                                                activity.startDate,
                                              ),
                                              finishDate: toDateInputFormat(
                                                activity.finishDate,
                                              ),
                                            });
                                          }
                                        }}
                                        disabled={!canAssign}
                                        title={
                                          !canAssign
                                            ? "Only Ready activities can be assigned"
                                            : "Assign action"
                                        }
                                        sx={{
                                          fontSize: "10px",
                                          fontWeight: 500,
                                          color: canAssign
                                            ? COLORS.blue
                                            : COLORS.textMuted,
                                          textTransform: "none",
                                          bgcolor: canAssign
                                            ? COLORS.blueBgLight
                                            : "transparent",
                                          border: `1px solid ${canAssign ? COLORS.blue : COLORS.textMuted}30`,
                                          borderRadius: "6px",
                                          px: 1.5,
                                          py: 0.3,
                                          minWidth: "auto",
                                          cursor: canAssign
                                            ? "pointer"
                                            : "not-allowed",
                                          opacity: canAssign ? 1 : 0.5,
                                          "&:hover": {
                                            bgcolor: canAssign
                                              ? COLORS.blueBgMedium
                                              : "transparent",
                                          },
                                          "&.Mui-disabled": {
                                            color: COLORS.textMuted,
                                          },
                                        }}
                                      >
                                        Assign
                                      </Button>
                                    );
                                  })()}
                                </Box>
                                {/* Status */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: "14px",
                                      bgcolor: statusColors.bg,
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        color: statusColors.text,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {activity.activityStatus || "Ready"}
                                    </Typography>
                                  </Box>
                                </Box>
                                {/* Owner */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.75,
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
                                    {ownerInitials}
                                  </Avatar>
                                  <Typography
                                    sx={{
                                      fontSize: "11px",
                                      color: COLORS.textPrimary,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {ownerName}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Expanded section for linked actions */}
                              {isExpanded &&
                                actionsForThisActivity.length > 0 && (
                                  <Box
                                    sx={{
                                      bgcolor: COLORS.bgTertiary,
                                      borderBottom: `1px solid ${COLORS.border}`,
                                      px: 3,
                                      py: 2,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr 1fr",
                                        gap: 4,
                                      }}
                                    >
                                      {/* Linked Actions */}
                                      <Box>
                                        <Typography
                                          sx={{
                                            fontSize: "10px",
                                            fontWeight: 600,
                                            color: COLORS.textMuted,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                            mb: 1.5,
                                          }}
                                        >
                                          Linked Actions
                                        </Typography>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 0.75,
                                          }}
                                        >
                                          {actionsForThisActivity.map(
                                            (action) => (
                                              <Box
                                                key={action._id}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedActionId(
                                                    action._id,
                                                  );
                                                  setActiveTab(3);
                                                  setExpandedActivityId(null);
                                                }}
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1,
                                                  cursor: "pointer",
                                                  "&:hover": {
                                                    "& .action-title": {
                                                      textDecoration:
                                                        "underline",
                                                    },
                                                  },
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    color: COLORS.blue,
                                                    fontSize: "11px",
                                                  }}
                                                >
                                                  ›
                                                </Box>
                                                <Typography
                                                  className="action-title"
                                                  sx={{
                                                    fontSize: "12px",
                                                    color: COLORS.textPrimary,
                                                  }}
                                                >
                                                  {action.title}
                                                </Typography>
                                                {action.status ===
                                                "Completed" ? (
                                                  <Typography
                                                    sx={{
                                                      fontSize: "10px",
                                                      color: COLORS.green,
                                                      ml: 0.5,
                                                    }}
                                                  >
                                                    (Complete)
                                                  </Typography>
                                                ) : action.dueDate &&
                                                  new Date(action.dueDate) <
                                                    new Date(
                                                      new Date().setHours(
                                                        0,
                                                        0,
                                                        0,
                                                        0,
                                                      ),
                                                    ) ? (
                                                  <Typography
                                                    sx={{
                                                      fontSize: "10px",
                                                      color: COLORS.red,
                                                      ml: 0.5,
                                                    }}
                                                  >
                                                    (Overdue)
                                                  </Typography>
                                                ) : null}
                                              </Box>
                                            ),
                                          )}
                                        </Box>
                                      </Box>

                                      {/* Reassign */}
                                      <Box>
                                        <Typography
                                          sx={{
                                            fontSize: "10px",
                                            fontWeight: 600,
                                            color: COLORS.textMuted,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                            mb: 1.5,
                                          }}
                                        >
                                          Reassign
                                        </Typography>
                                        {actionsForThisActivity.length > 0 ? (
                                          <Box
                                            sx={{
                                              display: "flex",
                                              flexDirection: "column",
                                              gap: 1,
                                            }}
                                          >
                                            {actionsForThisActivity.map(
                                              (action) => (
                                                <Box
                                                  key={action._id}
                                                  sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                  }}
                                                >
                                                  <Button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleOpenReassign(
                                                        action,
                                                      );
                                                    }}
                                                    disabled={
                                                      action.status ===
                                                      "Completed"
                                                    }
                                                    sx={{
                                                      fontSize: "10px",
                                                      fontWeight: 500,
                                                      color: COLORS.amber,
                                                      textTransform: "none",
                                                      bgcolor:
                                                        "rgba(245, 158, 11, 0.15)",
                                                      border: `1px solid ${COLORS.amber}30`,
                                                      borderRadius: "6px",
                                                      px: 1.5,
                                                      py: 0.3,
                                                      minWidth: "auto",
                                                      "&:hover": {
                                                        bgcolor:
                                                          "rgba(245, 158, 11, 0.25)",
                                                      },
                                                      "&.Mui-disabled": {
                                                        color: COLORS.textMuted,
                                                        bgcolor:
                                                          COLORS.bgTertiary,
                                                        borderColor:
                                                          COLORS.border,
                                                      },
                                                    }}
                                                  >
                                                    Reassign
                                                  </Button>
                                                </Box>
                                              ),
                                            )}
                                          </Box>
                                        ) : (
                                          <Typography
                                            sx={{
                                              fontSize: "12px",
                                              color: COLORS.textSecondary,
                                            }}
                                          >
                                            -
                                          </Typography>
                                        )}
                                      </Box>

                                      {/* Notes */}
                                      <Box>
                                        <Typography
                                          sx={{
                                            fontSize: "10px",
                                            fontWeight: 600,
                                            color: COLORS.textMuted,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                            mb: 1.5,
                                          }}
                                        >
                                          Notes
                                        </Typography>
                                        <Typography
                                          sx={{
                                            fontSize: "12px",
                                            color: COLORS.textSecondary,
                                          }}
                                        >
                                          -
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                )}
                            </Box>
                          );
                        })
                      );
                    })()
                  )}
                </Box>
              </Box>

              {/* Pagination */}
              {lookaheadData?.activities &&
                lookaheadData.activities.length > 0 &&
                (() => {
                  const filteredActivities = lookaheadData.activities
                    .filter(
                      (activity) =>
                        ragFilter === "all" ||
                        activity.activityStatus === ragFilter,
                    )
                    .sort((a, b) => {
                      const colorA = getRAGColor(a.startDate, a.finishDate);
                      const colorB = getRAGColor(b.startDate, b.finishDate);
                      return getRAGPriority(colorA) - getRAGPriority(colorB);
                    });
                  const totalPages = Math.ceil(
                    filteredActivities.length / activitiesPerPage,
                  );
                  const startIndex = (activitiesPage - 1) * activitiesPerPage;
                  const endIndex = Math.min(
                    startIndex + activitiesPerPage,
                    filteredActivities.length,
                  );

                  return totalPages > 1 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: { xs: 2, sm: 0 },
                        mb: 3,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: "13px", color: COLORS.textSecondary }}
                      >
                        Showing {startIndex + 1}-{endIndex} of{" "}
                        {filteredActivities.length} activities
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          overflowX: "auto",
                          maxWidth: "100%",
                          pb: { xs: 1, sm: 0 },
                          "&::-webkit-scrollbar": { display: "none" },
                        }}
                      >
                        <Button
                          onClick={() =>
                            setActivitiesPage((p) => Math.max(1, p - 1))
                          }
                          disabled={activitiesPage === 1}
                          sx={{
                            minWidth: "auto",
                            px: 2,
                            py: 0.75,
                            fontSize: "13px",
                            flexShrink: 0,
                            color:
                              activitiesPage === 1
                                ? COLORS.textMuted
                                : COLORS.textPrimary,
                            bgcolor: COLORS.bgSecondary,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "8px",
                            textTransform: "none",
                            "&:hover": { bgcolor: COLORS.whiteHoverLight },
                            "&.Mui-disabled": {
                              bgcolor: COLORS.bgSecondary,
                              color: COLORS.textMuted,
                            },
                          }}
                        >
                          Previous
                        </Button>
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (activitiesPage <= 3) {
                              pageNum = i + 1;
                            } else if (activitiesPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = activitiesPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                onClick={() => setActivitiesPage(pageNum)}
                                sx={{
                                  minWidth: "36px",
                                  px: 1,
                                  py: 0.75,
                                  fontSize: "13px",
                                  flexShrink: 0,
                                  color:
                                    activitiesPage === pageNum
                                      ? COLORS.blue
                                      : COLORS.textPrimary,
                                  bgcolor:
                                    activitiesPage === pageNum
                                      ? COLORS.blueBgMedium
                                      : COLORS.bgSecondary,
                                  border: `1px solid ${activitiesPage === pageNum ? COLORS.blue : COLORS.border}`,
                                  borderRadius: "8px",
                                  textTransform: "none",
                                  "&:hover": {
                                    bgcolor:
                                      activitiesPage === pageNum
                                        ? COLORS.blueBgMedium
                                        : COLORS.whiteHoverLight,
                                  },
                                }}
                              >
                                {pageNum}
                              </Button>
                            );
                          },
                        )}
                        <Button
                          onClick={() =>
                            setActivitiesPage((p) =>
                              Math.min(totalPages, p + 1),
                            )
                          }
                          disabled={activitiesPage === totalPages}
                          sx={{
                            minWidth: "auto",
                            px: 2,
                            py: 0.75,
                            fontSize: "13px",
                            flexShrink: 0,
                            color:
                              activitiesPage === totalPages
                                ? COLORS.textMuted
                                : COLORS.textPrimary,
                            bgcolor: COLORS.bgSecondary,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "8px",
                            textTransform: "none",
                            "&:hover": { bgcolor: COLORS.whiteHoverLight },
                            "&.Mui-disabled": {
                              bgcolor: COLORS.bgSecondary,
                              color: COLORS.textMuted,
                            },
                          }}
                        >
                          Next
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        sx={{ fontSize: "13px", color: COLORS.textSecondary }}
                      >
                        Showing {filteredActivities.length} activities
                      </Typography>
                    </Box>
                  );
                })()}
            </>

            {(() => {
              const activities = lookaheadData?.activities || [];
              let readyCount = 0;
              let atRiskCount = 0;
              let blockedCount = 0;
              let completeCount = 0;

              activities.forEach((activity) => {
                switch (activity.activityStatus) {
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
                    completeCount++;
                    break;
                  default:
                    readyCount++;
                }
              });

              return (
                <AdminActivitiesSummary
                  totalActivities={activities.length}
                  readyCount={readyCount}
                  atRiskCount={atRiskCount}
                  blockedCount={blockedCount}
                  completeCount={completeCount}
                  lastUpdated={
                    new Date().toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }) +
                    ", " +
                    new Date().toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                />
              );
            })()}
          </Box>
        )}

        {activeTab === 3 && (
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
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Total
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.total}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Open
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.blue,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.open}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  In Progress
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.amber,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.inProgress}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Closed
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.green,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.closed}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Overdue Actions
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.red,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.overdue}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                overflow: "auto",
                mb: 3,
              }}
            >
              <Box sx={{ minWidth: "fit-content" }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "80px minmax(200px, 1fr) 120px 85px 140px 100px 75px 85px 70px",
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${COLORS.border}`,
                    minWidth: 1050,
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
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                    >
                      No actions available
                    </Typography>
                  </Box>
                ) : (
                  projectActions.map((action, index) => {
                    const isSelected = selectedActionId === action._id;
                    const getInitials = (name: string) => {
                      if (!name) return "??";
                      const parts = name.trim().split(" ");
                      if (parts.length >= 2) {
                        return (
                          parts[0][0] + parts[parts.length - 1][0]
                        ).toUpperCase();
                      }
                      return name.substring(0, 2).toUpperCase();
                    };
                    return (
                      <Box
                        key={action._id}
                        id={`action-row-${action._id}`}
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "80px minmax(200px, 1fr) 120px 85px 140px 100px 75px 85px 70px",
                          gap: 1.5,
                          px: 2,
                          py: 2,
                          borderBottom:
                            index < projectActions.length - 1
                              ? `1px solid ${COLORS.border}`
                              : "none",
                          alignItems: "center",
                          minWidth: 1050,
                          bgcolor: isSelected
                            ? `${COLORS.blue}15`
                            : "transparent",
                          borderLeft: isSelected
                            ? `3px solid ${COLORS.blue}`
                            : "none",
                          "&:hover": {
                            bgcolor: isSelected
                              ? `${COLORS.blue}20`
                              : COLORS.bgTertiary,
                          },
                        }}
                      >
                        <Box sx={{ textAlign: "center", minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: COLORS.blue,
                              fontSize: "12px",
                              fontWeight: 400,
                            }}
                          >
                            {action._id.slice(-6).toUpperCase()}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center", minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: COLORS.textPrimary,
                              fontSize: "13px",
                              fontWeight: 400,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {action.title}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            sx={{
                              color: COLORS.blue,
                              fontSize: "12px",
                              fontWeight: 400,
                            }}
                          >
                            {action.linkedActivity?.activityId || "-"}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Box
                            sx={{
                              bgcolor:
                                action.type === "Optional"
                                  ? `${COLORS.green}25`
                                  : `${COLORS.red}25`,
                              color:
                                action.type === "Optional"
                                  ? COLORS.green
                                  : COLORS.red,
                              px: 2,
                              py: 0.5,
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 500,
                            }}
                          >
                            {action.type || "Required"}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: "10px",
                              fontWeight: 600,
                              bgcolor: COLORS.blue,
                            }}
                          >
                            {action.assignee?.name
                              ? getInitials(action.assignee.name)
                              : "NA"}
                          </Avatar>
                          <Typography
                            sx={{
                              color: COLORS.border,
                              fontSize: "12px",
                              fontWeight: 400,
                            }}
                          >
                            {action.assignee?.name || "Unassigned"}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            sx={{
                              color: COLORS.border,
                              fontSize: "12px",
                              fontWeight: 400,
                            }}
                          >
                            {action.dueDate
                              ? new Date(action.dueDate).toLocaleDateString(
                                  "en-CA",
                                )
                              : "-"}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          {(() => {
                            const isFromClosedWeek =
                              isActionFromClosedWeek(action);
                            const isOverdue =
                              action.status !== "Completed" &&
                              !isFromClosedWeek &&
                              action.dueDate &&
                              new Date(action.dueDate) <
                                new Date(new Date().setHours(0, 0, 0, 0));

                            // Determine display status
                            let displayStatus = action.status;
                            let bgColor = `${COLORS.blue}25`;
                            let textColor = COLORS.blue;

                            if (
                              isFromClosedWeek &&
                              action.status !== "Completed"
                            ) {
                              displayStatus = "PM Override";
                              bgColor = `${COLORS.amber}25`;
                              textColor = COLORS.amber;
                            } else if (isOverdue) {
                              displayStatus = "Overdue";
                              bgColor = `${COLORS.red}25`;
                              textColor = COLORS.red;
                            } else if (action.status === "Open") {
                              bgColor = `${COLORS.blue}25`;
                              textColor = COLORS.blue;
                            } else if (action.status === "In Progress") {
                              bgColor = `${COLORS.amber}25`;
                              textColor = COLORS.amber;
                            } else if (action.status === "Completed") {
                              bgColor = `${COLORS.green}25`;
                              textColor = COLORS.green;
                            }

                            return (
                              <Box
                                sx={{
                                  bgcolor: bgColor,
                                  color: textColor,
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: "5px",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {displayStatus}
                              </Box>
                            );
                          })()}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
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
                            {action.priority}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1.5,
                          }}
                        >
                          <Box
                            component="img"
                            src={editIcon}
                            onClick={() => {
                              if (cycleStage !== "execution") {
                                setToastMessage(
                                  "Execution has not started yet. Please start execution first.",
                                );
                                setToastOpen(true);
                                return;
                              }
                              if (action.status === "Completed") return;
                              if (isActionFromClosedWeek(action)) {
                                setToastMessage(
                                  "Cannot edit action from a closed week.",
                                );
                                setToastOpen(true);
                                return;
                              }
                              handleEditClick(
                                {
                                  id: action._id.slice(-6).toUpperCase(),
                                  title: action.title,
                                  description:
                                    (
                                      action as unknown as {
                                        description?: string;
                                      }
                                    ).description || "",
                                  linkedActivity:
                                    action.linkedActivity?.activityId || "",
                                  type: action.type,
                                  assignee: {
                                    initials: action.assignee?.name
                                      ? getInitials(action.assignee.name)
                                      : "NA",
                                    name: action.assignee?.name || "Unassigned",
                                  },
                                  assigneeId:
                                    (
                                      action.assignee as unknown as {
                                        _id?: string;
                                      }
                                    )?._id || "",
                                  dueDate: action.dueDate
                                    ? new Date(action.dueDate)
                                        .toISOString()
                                        .split("T")[0]
                                    : "",
                                  status: action.status,
                                  priority: action.priority,
                                },
                                index,
                                action._id,
                              );
                            }}
                            title={
                              action.status === "Completed"
                                ? "Cannot edit completed action"
                                : isActionFromClosedWeek(action)
                                  ? "Cannot edit action from closed week"
                                  : "Edit action"
                            }
                            sx={{
                              width: 16,
                              height: 16,
                              cursor:
                                action.status === "Completed" ||
                                isActionFromClosedWeek(action)
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                action.status === "Completed" ||
                                isActionFromClosedWeek(action)
                                  ? 0.3
                                  : 0.7,
                              "&:hover": {
                                opacity:
                                  action.status === "Completed" ||
                                  isActionFromClosedWeek(action)
                                    ? 0.3
                                    : 1,
                              },
                            }}
                          />
                          <Box
                            component="img"
                            src={viewIcon}
                            onClick={() => {
                              if (cycleStage !== "execution") {
                                setToastMessage(
                                  "Execution has not started yet. Please start execution first.",
                                );
                                setToastOpen(true);
                                return;
                              }
                              if (isActionFromClosedWeek(action)) {
                                setToastMessage(
                                  "Cannot complete action from a closed week.",
                                );
                                setToastOpen(true);
                                return;
                              }
                              const assigneeId = String(
                                (action.assignee as unknown as { _id?: string })
                                  ?._id || "",
                              );
                              const userId = String(user?.id || "");
                              const isAssignee =
                                assigneeId === userId && assigneeId !== "";

                              if (action.status !== "Completed" && isAssignee) {
                                handleOpenCompleteConfirm({
                                  _id: action._id,
                                  title: action.title,
                                });
                              }
                            }}
                            title={
                              action.status === "Completed"
                                ? "Already completed"
                                : isActionFromClosedWeek(action)
                                  ? "Cannot complete action from closed week"
                                  : String(
                                        (
                                          action.assignee as unknown as {
                                            _id?: string;
                                          }
                                        )?._id || "",
                                      ) !== String(user?.id || "")
                                    ? "Only the assignee can complete this action"
                                    : "Mark as complete"
                            }
                            sx={{
                              width: 16,
                              height: 16,
                              cursor:
                                action.status === "Completed" ||
                                isActionFromClosedWeek(action) ||
                                String(
                                  (
                                    action.assignee as unknown as {
                                      _id?: string;
                                    }
                                  )?._id || "",
                                ) !== String(user?.id || "")
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                action.status === "Completed"
                                  ? 1
                                  : isActionFromClosedWeek(action) ||
                                      String(
                                        (
                                          action.assignee as unknown as {
                                            _id?: string;
                                          }
                                        )?._id || "",
                                      ) !== String(user?.id || "")
                                    ? 0.3
                                    : 0.7,
                              filter:
                                action.status === "Completed"
                                  ? "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(5323%) hue-rotate(107deg) brightness(92%) contrast(88%)"
                                  : "none",
                              "&:hover": {
                                opacity:
                                  action.status === "Completed" ||
                                  isActionFromClosedWeek(action) ||
                                  String(
                                    (
                                      action.assignee as unknown as {
                                        _id?: string;
                                      }
                                    )?._id || "",
                                  ) !== String(user?.id || "")
                                    ? action.status === "Completed"
                                      ? 1
                                      : 0.3
                                    : 1,
                                filter:
                                  action.status !== "Completed" &&
                                  String(
                                    (
                                      action.assignee as unknown as {
                                        _id?: string;
                                      }
                                    )?._id || "",
                                  ) === String(user?.id || "")
                                    ? "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(5323%) hue-rotate(107deg) brightness(92%) contrast(88%)"
                                    : action.status === "Completed"
                                      ? "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(5323%) hue-rotate(107deg) brightness(92%) contrast(88%)"
                                      : "none",
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 2.5,
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "12px",
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                How actions impact the cycle:
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                Closing all{" "}
                <Box
                  component="span"
                  sx={{ color: COLORS.red, fontWeight: 500 }}
                >
                  Required
                </Box>{" "}
                actions for{" "}
                <Box
                  component="span"
                  sx={{ color: COLORS.green, fontWeight: 500 }}
                >
                  Green
                </Box>{" "}
                activities triggers the transition to{" "}
                <Box
                  component="span"
                  sx={{
                    color: COLORS.blue,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Close-Out Eligible
                </Box>
                . Only then can exports be generated and the week closed.
              </Typography>
            </Box>
          </Box>
        )}

        {activeTab === 4 && (
          <>
            {/* Week Info Header */}
            {weeklyControlData?.weekInfo && (
              <Box
                sx={{
                  bgcolor: "rgba(59, 130, 246, 0.1)",
                  border: `1px solid ${COLORS.blue}`,
                  borderRadius: "12px",
                  p: 2,
                  mb: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {/* <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      bgcolor: COLORS.blue,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{ color: "#fff", fontSize: "16px", fontWeight: 700 }}
                    >
                      W{weeklyControlData.weekInfo.weekNumber}-{weeklyControlData.weekInfo.weekNumberEnd || weeklyControlData.weekInfo.weekNumber + 1}
                    </Typography>
                  </Box> */}
                  <Box>
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      Weeks {weeklyControlData.weekInfo.weekNumber}-
                      {weeklyControlData.weekInfo.weekNumberEnd ||
                        weeklyControlData.weekInfo.weekNumber + 1}{" "}
                      Data
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                    >
                      {weeklyControlData.weekInfo.dateRange} •{" "}
                      {weeklyControlData.weekInfo.totalActivities} activities
                      these weeks
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    sx={{ color: COLORS.textSecondary, fontSize: "11px" }}
                  >
                    Progress
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.green,
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {weeksStatus?.closedWeeksCount || 0}/
                    {weeksStatus?.totalWeeks || 0} weeks closed
                  </Typography>
                </Box>
              </Box>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(4, 1fr)",
                  md: "repeat(7, 1fr)",
                },
                gap: 2,
                mb: 3,
              }}
            >
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Cycle Status
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {getCycleStatusText()}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  In Lookahead
                </Typography>
                <Typography
                  sx={{ color: COLORS.blue, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlData?.stats.inLookahead || 0}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Ready
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.green,
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  {weeklyControlData?.stats.green || 0}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Blocked
                </Typography>
                <Typography
                  sx={{ color: COLORS.red, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlData?.stats.blocked || 0}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Open Actions
                </Typography>
                <Typography
                  sx={{ color: COLORS.blue, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlData?.stats.openActions || 0}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Overdue
                </Typography>
                <Typography
                  sx={{ color: COLORS.red, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlData?.stats.overdue || 0}
                </Typography>
              </Box>
              <Box
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
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Ready to Close
                </Typography>
                <Typography
                  sx={{ color: COLORS.red, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlData?.stats.readyToClose || "No"}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 3,
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  RAG Distribution
                </Typography>
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
                      const ragData = weeklyControlData?.ragDistribution || {
                        green: 0,
                        amber: 0,
                        red: 0,
                      };
                      const data = [
                        {
                          value: ragData.green,
                          color: "#22C55E",
                          tooltip:
                            "Completed or On Track - Activity is completed or in progress",
                        },
                        {
                          value: ragData.amber,
                          color: "#F59E0B",
                          tooltip:
                            "Needs Attention - Activity starting in 3-4 weeks",
                        },
                        {
                          value: ragData.red,
                          color: "#EF4444",
                          tooltip:
                            "Overdue or At Risk - Activity is overdue or starting in 5-6 weeks",
                        },
                      ].filter((d) => d.value > 0);
                      const total = data.reduce((sum, d) => sum + d.value, 0);
                      if (total === 0) return null;
                      const strokeWidth = 28;
                      const radius = (180 - strokeWidth) / 2;
                      const center = 90;
                      let currentAngle = -90;

                      // If only one segment (100%), draw a full circle
                      if (data.length === 1) {
                        return (
                          <Tooltip
                            title={data[0].tooltip}
                            placement="top"
                            arrow
                            slotProps={{
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
                            }}
                          >
                            <circle
                              cx={center}
                              cy={center}
                              r={radius}
                              fill="none"
                              stroke={data[0].color}
                              strokeWidth={strokeWidth}
                              style={{ cursor: "pointer" }}
                            />
                          </Tooltip>
                        );
                      }

                      return data.map((segment, i) => {
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
                            slotProps={{
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
                            }}
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
                {/* Legend with percentages */}
                {(() => {
                  const ragData = weeklyControlData?.ragDistribution || {
                    green: 0,
                    amber: 0,
                    red: 0,
                  };
                  const total = ragData.green + ragData.amber + ragData.red;
                  if (total === 0) return null;
                  const greenPct = Math.round((ragData.green / total) * 100);
                  const amberPct = Math.round((ragData.amber / total) * 100);
                  const redPct = Math.round((ragData.red / total) * 100);
                  const tooltipStyles = {
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
                  return (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 3,
                        mt: 2,
                      }}
                    >
                      <Tooltip
                        title="Completed or On Track - Activity is completed or in progress"
                        placement="bottom"
                        arrow
                        slotProps={tooltipStyles}
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
                              bgcolor: "#22C55E",
                            }}
                          />
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "13px",
                            }}
                          >
                            Green ({greenPct}%)
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip
                        title="Needs Attention - Activity starting in 3-4 weeks"
                        placement="bottom"
                        arrow
                        slotProps={tooltipStyles}
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
                              bgcolor: "#F59E0B",
                            }}
                          />
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "13px",
                            }}
                          >
                            Amber ({amberPct}%)
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip
                        title="Overdue or At Risk - Activity is overdue or starting in 5-6 weeks"
                        placement="bottom"
                        arrow
                        slotProps={tooltipStyles}
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
                              bgcolor: "#EF4444",
                            }}
                          />
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "13px",
                            }}
                          >
                            Red ({redPct}%)
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  );
                })()}
              </Box>

              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 3,
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  Actions by Status
                </Typography>
                {(() => {
                  const actionsData = weeklyControlData?.actionsByStatus || {
                    open: 0,
                    inProgress: 0,
                    closed: 0,
                    overdue: 0,
                  };
                  const totalActions =
                    actionsData.open +
                    actionsData.inProgress +
                    actionsData.closed +
                    actionsData.overdue;

                  // Show empty state message if no actions
                  if (totalActions === 0) {
                    return (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 200,
                          color: COLORS.textMuted,
                          fontSize: "13px",
                          textAlign: "center",
                          px: 2,
                        }}
                      >
                        No actions assigned for this week yet.
                        <br />
                        Assign actions to activities to track progress.
                      </Box>
                    );
                  }

                  const maxValue = Math.max(
                    actionsData.open,
                    actionsData.inProgress,
                    actionsData.closed,
                    actionsData.overdue,
                    1,
                  );
                  // Calculate nice Y-axis steps with unique integer values
                  const yAxisMax = Math.max(Math.ceil(maxValue * 1.2), 4); // At least 4 for nice steps
                  const stepCount = Math.min(yAxisMax, 5); // Max 5 steps
                  const stepSize = Math.ceil(yAxisMax / stepCount);
                  const actualMax = stepSize * stepCount;
                  const yAxisSteps: number[] = [];
                  for (let i = stepCount; i >= 0; i--) {
                    yAxisSteps.push(i * stepSize);
                  }
                  return (
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
                            {[
                              {
                                label: "Open",
                                value: actionsData.open,
                                color: COLORS.blue,
                                tooltip:
                                  "Open - Actions that are newly created and need to be addressed",
                              },
                              {
                                label: "Ready",
                                value: actionsData.inProgress,
                                color: COLORS.amber,
                                tooltip:
                                  "Ready - Actions that are currently in progress",
                              },
                              {
                                label: "Completed",
                                value: actionsData.closed,
                                color: COLORS.green,
                                tooltip:
                                  "Completed - Actions that have been successfully completed",
                              },
                              {
                                label: "Overdue",
                                value: actionsData.overdue,
                                color: COLORS.red,
                                tooltip:
                                  "Overdue - Actions that are past their due date and need immediate attention",
                              },
                            ].map((bar, i) => (
                              <Tooltip
                                key={i}
                                title={bar.tooltip}
                                placement="top"
                                arrow
                                slotProps={{
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
                                }}
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
                          {[
                            {
                              label: "Open",
                              tooltip:
                                "Open - Actions that are newly created and need to be addressed",
                            },
                            {
                              label: "Ready",
                              tooltip:
                                "Ready - Actions that are currently in progress",
                            },
                            {
                              label: "Completed",
                              tooltip:
                                "Completed - Actions that have been successfully completed",
                            },
                            {
                              label: "Overdue",
                              tooltip:
                                "Overdue - Actions that are past their due date and need immediate attention",
                            },
                          ].map((item) => (
                            <Tooltip
                              key={item.label}
                              title={item.tooltip}
                              placement="bottom"
                              arrow
                              slotProps={{
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
                              }}
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
                                {item.label}
                              </Typography>
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <BlockedActivitiesTable
                activities={
                  weeklyControlData?.blockedRiskActivities.map((a) => ({
                    activityId: a.activityId,
                    activityName: a.activityName,
                    ragStatus: a.ragStatus,
                    activityStatus: a.activityStatus || "At Risk",
                    owner: a.owner || "-",
                    blocker: a.blocker || "",
                    isBlocked: a.isBlocked,
                    linkedAction: a.linkedAction || null,
                  })) || []
                }
                weeklyPlanPreview={weeklyControlData?.weeklyPlanPreview || []}
                plannerToDo={weeklyControlData?.plannerToDo || []}
                onAssignClick={(activity) => {
                  handleOpenAssignModal({
                    activityId: activity.activityId,
                    activityName: activity.activityName,
                    startDate: "",
                    finishDate: "",
                  });
                }}
                onUnblockClick={async (activityId) => {
                  const progId =
                    weeklyControlData?.programmeId || uploadedProgramme?._id;
                  if (!progId) {
                    console.error("No programme ID available");
                    return;
                  }
                  try {
                    await programmeAPI.updateActivity(progId, activityId, {
                      isBlocked: false,
                      activityStatus: "Ready",
                    });
                    // Refresh both Weekly Control and Activities & Lookahead data
                    const weekNum =
                      lockedViewWeek ?? weeklyControlData?.weekInfo?.weekNumber;
                    await Promise.all([
                      fetchWeeklyControlData(progId, weekNum),
                      refetchProgramme(),
                    ]);
                  } catch (error) {
                    console.error("Error unblocking activity:", error);
                  }
                }}
                onActionClick={() => setActiveTab(3)}
                isProjectEnded={weeklyControlData?.isProjectEnded}
              />
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 3,
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "14px",
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                Cycle Control
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "13px",
                  fontWeight: 400,
                  mb: 2,
                }}
              >
                {uploadedProgramme?.cycleStatus === "Closed" || isWeekClosed
                  ? "This week is closed and locked. No changes allowed."
                  : uploadedProgramme?.cycleStatus === "Close-Out Eligible"
                    ? "Week is ready for close-out. Generate exports and close the week."
                    : cycleStage === "draft"
                      ? "Programme uploaded. Review activities and open the planning meeting."
                      : cycleStage === "meetingOpen"
                        ? "Meeting is open. Start execution when ready."
                        : "Execution in progress. Monitor activities and actions."}
              </Typography>
              {/* Closed Stage - Show locked message */}
              {uploadedProgramme?.cycleStatus === "Closed" || isWeekClosed ? (
                <Box
                  sx={{
                    bgcolor: "rgba(107, 114, 128, 0.1)",
                    border: `1px solid ${COLORS.textMuted}`,
                    borderRadius: "8px",
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Box
                    component="img"
                    src={lockIcon}
                    sx={{ width: 20, height: 20, opacity: 0.6 }}
                  />
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Proejct locked.
                  </Typography>
                </Box>
              ) : uploadedProgramme?.cycleStatus === "Close-Out Eligible" ? (
                <Box>
                  <Box
                    sx={{
                      bgcolor: "rgba(59, 130, 246, 0.1)",
                      border: `1px solid ${COLORS.blue}`,
                      borderRadius: "8px",
                      px: 2,
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color: COLORS.blue,
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        Close-Out Eligible (Stage 4)
                      </Typography>
                      <Typography
                        sx={{
                          color: COLORS.textSecondary,
                          fontSize: "12px",
                        }}
                      >
                        Ready to close and lock the week.
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      onClick={handleFinalClose}
                      sx={{
                        bgcolor: COLORS.green,
                        color: "#fff",
                        textTransform: "none",
                        px: 3,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": { bgcolor: "#16a34a" },
                      }}
                    >
                      Close & Lock Week
                    </Button>
                  </Box>
                </Box>
              ) : cycleStage === "execution" ? (
                <Box>
                  {weeklyActionStats.open === 0 ? (
                    /* Ready for close-out - all actions completed */
                    <>
                      <Box
                        sx={{
                          bgcolor: "rgba(34, 197, 94, 0.1)",
                          border: `1px solid ${COLORS.green}`,
                          borderRadius: "8px",
                          px: 2,
                          py: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Typography
                            sx={{ color: COLORS.green, fontSize: "18px" }}
                          >
                            ✓
                          </Typography>
                          <Box>
                            <Typography
                              sx={{
                                color: COLORS.green,
                                fontSize: "13px",
                                fontWeight: 500,
                              }}
                            >
                              Current Week ready for close-out
                            </Typography>
                            <Typography
                              sx={{
                                color: COLORS.textSecondary,
                                fontSize: "11px",
                              }}
                            >
                              {weeksStatus?.closedWeeksCount || 0}/
                              {weeksStatus?.totalWeeks || 0} weeks completed (
                              {weeksStatus?.progress || 0}%)
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Button
                        onClick={() => {
                          const weekToClose = weeksStatus?.weeks.find(
                            (w) => w.canClose,
                          )?.weekNumber;
                          if (weekToClose) handleCloseSpecificWeek(weekToClose);
                        }}
                        disabled={
                          closingWeek !== null ||
                          !weeksStatus?.weeks.find((w) => w.canClose) ||
                          weeklyControlData?.isProjectEnded
                        }
                        sx={{
                          bgcolor: COLORS.green,
                          color: "#fff",
                          textTransform: "none",
                          px: 3,
                          py: 1,
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 500,
                          "&:hover": { bgcolor: "#16a34a" },
                          "&.Mui-disabled": {
                            bgcolor: "#3a3a3a",
                            color: "#666",
                          },
                        }}
                      >
                        {closingWeek !== null ? (
                          <CircularProgress size={18} sx={{ color: "#fff" }} />
                        ) : weeklyControlData?.isProjectEnded ? (
                          "Project Ended"
                        ) : (
                          "Close Current Week"
                        )}
                      </Button>
                      {/* Show reason why button is disabled - use the currently displayed week */}
                      {!weeksStatus?.weeks.find((w) => w.canClose) &&
                        !weeklyControlData?.isProjectEnded && (() => {
                          // Find the week matching the currently displayed week number
                          const displayedWeekNumber = weeklyControlData?.weekInfo?.weekNumber;
                          const currentWeek = weeksStatus?.weeks.find(
                            (w) => w.weekNumber === displayedWeekNumber && !w.isClosed && w.canCloseReason
                          ) || weeksStatus?.weeks.find(
                            (w) => !w.isClosed && w.canCloseReason
                          );
                          if (currentWeek?.canCloseReason) {
                            return (
                              <Typography
                                sx={{
                                  color: COLORS.red,
                                  fontSize: "11px",
                                  mt: 1,
                                  textAlign: "left",
                                }}
                              >
                                {currentWeek.canCloseReason}
                              </Typography>
                            );
                          }
                          return null;
                        })()}
                    </>
                  ) : (
                    /* Open actions remaining */
                    <>
                      <Box
                        sx={{
                          bgcolor: "#2D2A24",
                          border: `1px solid ${COLORS.amber}`,
                          borderRadius: "8px",
                          px: 2,
                          py: 1.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          mb: 2,
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <circle
                            cx="10"
                            cy="10"
                            r="8.5"
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M10 5.5V10L13 12"
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <Typography
                          sx={{
                            color: COLORS.amber,
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {weeklyActionStats.open} open action(s) need to be
                          completed before closing.
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "flex-start",
                        }}
                      >
                        <Button
                          onClick={() => setActiveTab(3)}
                          sx={{
                            bgcolor: COLORS.blue,
                            color: "#fff",
                            textTransform: "none",
                            px: 2,
                            py: 1,
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 500,
                            "&:hover": { bgcolor: COLORS.blueHover },
                          }}
                        >
                          Go to Actions
                        </Button>
                        <Button
                          onClick={() => setShowOverrideForm(!showOverrideForm)}
                          sx={{
                            bgcolor: "transparent",
                            color: COLORS.amber,
                            border: `1px solid ${COLORS.amber}`,
                            textTransform: "none",
                            px: 2,
                            py: 1,
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 500,
                            "&:hover": { bgcolor: "rgba(245, 158, 11, 0.1)" },
                          }}
                        >
                          PM Override
                        </Button>
                      </Box>
                      {showOverrideForm && (
                        <Box
                          sx={{
                            mt: 2,
                            bgcolor: "#2D2A24",
                            border: `1px solid ${COLORS.amber}`,
                            borderRadius: "8px",
                            p: 2,
                          }}
                        >
                          <Typography
                            sx={{
                              color: COLORS.amber,
                              fontSize: "14px",
                              fontWeight: 600,
                              mb: 1,
                            }}
                          >
                            PM Override — Force Close Weeks
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "13px",
                              mb: 2,
                            }}
                          >
                            Enter a mandatory reason (min 10 characters) to
                            close these weeks despite incomplete actions.
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Enter justification for override..."
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            sx={{
                              mb: 2,
                              "& .MuiOutlinedInput-root": {
                                bgcolor: COLORS.bgSecondary,
                                borderRadius: "8px",
                                "& fieldset": { borderColor: COLORS.border },
                                "&:hover fieldset": {
                                  borderColor: COLORS.amber,
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: COLORS.amber,
                                },
                              },
                              "& .MuiInputBase-input": {
                                color: COLORS.textPrimary,
                                fontSize: "14px",
                              },
                            }}
                          />
                          <Button
                            onClick={handleOverrideClose}
                            disabled={
                              overrideReason.length < 10 ||
                              weeklyControlData?.isProjectEnded
                            }
                            sx={{
                              bgcolor: COLORS.amber,
                              color: "#fff",
                              textTransform: "none",
                              px: 3,
                              py: 1,
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: 500,
                              "&:hover": { bgcolor: "#d97706" },
                              "&.Mui-disabled": {
                                bgcolor: COLORS.bgTertiary,
                                color: COLORS.textMuted,
                              },
                            }}
                          >
                            {weeklyControlData?.isProjectEnded
                              ? "Project Ended"
                              : "Force Close Weeks"}
                          </Button>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              ) : (
                <Button
                  onClick={handleCycleAction}
                  disabled={weeklyControlData?.isProjectEnded}
                  title={
                    weeklyControlData?.isProjectEnded
                      ? "Project has ended - read only"
                      : ""
                  }
                  sx={{
                    bgcolor: COLORS.blue,
                    color: "#fff",
                    textTransform: "none",
                    px: 2.5,
                    py: 1,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    "&:hover": { bgcolor: COLORS.blueHover },
                    "&.Mui-disabled": {
                      bgcolor: "#3a3a3a",
                      color: "#666",
                    },
                  }}
                >
                  {weeklyControlData?.isProjectEnded
                    ? "Project Ended"
                    : getCycleButtonText()}
                </Button>
              )}
            </Box>

            {/* {weeksStatus && !weeksStatus.isFullyClosed && (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 3,
                  mt: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Week Progress
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                    >
                      Overall:
                    </Typography>
                    <Typography
                      sx={{
                        color: COLORS.green,
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {weeksStatus.closedWeeksCount}/{weeksStatus.totalWeeks}{" "}
                      weeks ({weeksStatus.progress}%)
                    </Typography>
                  </Box>
                </Box>

                {weeksStatus.weeks
                  .filter((w) => w.canClose)
                  .slice(0, 1)
                  .map((week) => (
                    <Box
                      key={week.weekNumber}
                      sx={{
                        bgcolor: "rgba(59, 130, 246, 0.1)",
                        border: `1px solid ${COLORS.blue}`,
                        borderRadius: "8px",
                        p: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            bgcolor: COLORS.blue,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              color: "#fff",
                              fontSize: "13px",
                              fontWeight: 600,
                            }}
                          >
                            W{week.weekNumber}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              color: COLORS.textPrimary,
                              fontSize: "14px",
                              fontWeight: 600,
                            }}
                          >
                            Week {week.weekNumber}
                            <Box
                              component="span"
                              sx={{
                                color: COLORS.blue,
                                ml: 1,
                                fontSize: "12px",
                                fontWeight: 400,
                              }}
                            >
                              (Ready to Close)
                            </Box>
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "12px",
                            }}
                          >
                            {week.stats.totalActivities} activities •
                            <Box component="span" sx={{ color: COLORS.green }}>
                              {" "}
                              {week.stats.green} green
                            </Box>
                            {week.stats.amber > 0 && (
                              <Box
                                component="span"
                                sx={{ color: COLORS.amber }}
                              >
                                {" "}
                                • {week.stats.amber} amber
                              </Box>
                            )}
                            {week.stats.red > 0 && (
                              <Box component="span" sx={{ color: COLORS.red }}>
                                {" "}
                                • {week.stats.red} red
                              </Box>
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        onClick={() => handleCloseSpecificWeek(week.weekNumber)}
                        disabled={closingWeek === week.weekNumber}
                        sx={{
                          bgcolor: COLORS.green,
                          color: "#fff",
                          textTransform: "none",
                          px: 3,
                          py: 1,
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 500,
                          "&:hover": { bgcolor: "#16a34a" },
                        }}
                      >
                        {closingWeek === week.weekNumber ? (
                          <CircularProgress size={18} sx={{ color: "#fff" }} />
                        ) : (
                          `Close Weeks ${week.weekNumber}-${week.weekNumber + 1}`
                        )}
                      </Button>
                    </Box>
                  ))}

                {weeksStatus.weeks.filter((w) => w.canClose).length === 0 && (
                  <Box
                    sx={{
                      bgcolor: COLORS.bgTertiary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      p: 2,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
                    >
                      No weeks available to close yet. Complete activities to
                      enable week closure.
                    </Typography>
                  </Box>
                )}

                {weeksStatus.closedWeeksCount > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        mb: 1,
                      }}
                    >
                      Closed Weeks:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {weeksStatus.weeks
                        .filter((w) => w.isClosed)
                        .map((week) => (
                          <Box
                            key={week.weekNumber}
                            sx={{
                              bgcolor: `${COLORS.green}20`,
                              color: COLORS.green,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            Week {week.weekNumber} ✓
                          </Box>
                        ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )} */}

            {/* All weeks closed message */}
            {weeksStatus?.isFullyClosed && (
              <Box
                sx={{
                  bgcolor: "rgba(34, 197, 94, 0.1)",
                  border: `1px solid ${COLORS.green}`,
                  borderRadius: "12px",
                  p: 3,
                  mt: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  component="img"
                  src={lockIcon}
                  sx={{
                    width: 24,
                    height: 24,
                    filter:
                      "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(535%) hue-rotate(93deg)",
                  }}
                />
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.green,
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    All {weeksStatus.totalWeeks} weeks completed!
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                  >
                    Programme is fully closed.
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        )}

        {activeTab === 5 && (
          <Box>
            {isWeekClosed ? (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  component="img"
                  src={lockIcon}
                  sx={{
                    width: 48,
                    height: 48,
                    mb: 2,
                    opacity: 0.7,
                  }}
                />
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "20px",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Project Closed & Locked
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    mb:
                      savedOverrideReason || uploadedProgramme?.overrideReason
                        ? 1
                        : 0,
                  }}
                >
                  This project has been closed. No further changes allowed.
                </Typography>
                {(savedOverrideReason || uploadedProgramme?.overrideReason) && (
                  <Typography
                    sx={{
                      color: COLORS.amber,
                      fontSize: "14px",
                    }}
                  >
                    Override reason:{" "}
                    {savedOverrideReason || uploadedProgramme?.overrideReason}
                  </Typography>
                )}
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    bgcolor: COLORS.bgSecondary,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "12px",
                    p: 3,
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 600,
                      mb: 2,
                    }}
                  >
                    Closure Readiness Checklist
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {[
                      {
                        key: "plannerReview",
                        label: "Planner review complete",
                        extra: null,
                      },
                      {
                        key: "todoGenerated",
                        label: "Planner to-do list generated",
                        extra: null,
                      },
                      {
                        key: "overdueAcknowledged",
                        label: "Overdue actions acknowledged",
                        extra:
                          exportCounts.overdueActions > 0
                            ? `(${exportCounts.overdueActions} overdue)`
                            : null,
                        extraColor: COLORS.red,
                      },
                      {
                        key: "blockedAcknowledged",
                        label: "Blocked activities acknowledged",
                        extra:
                          exportCounts.blockedActivities > 0
                            ? `(${exportCounts.blockedActivities} blocked)`
                            : null,
                        extraColor: COLORS.red,
                      },
                    ].map((item) => (
                      <Box
                        key={item.key}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: closureChecklist[
                              item.key as keyof typeof closureChecklist
                            ]
                              ? "2px solid #fff"
                              : "2px solid #94A3B8",
                            bgcolor: closureChecklist[
                              item.key as keyof typeof closureChecklist
                            ]
                              ? COLORS.blue
                              : "transparent",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            fontWeight: 400,
                          }}
                        >
                          {item.label}
                          {item.extra && (
                            <Box
                              component="span"
                              sx={{ color: item.extraColor, ml: 0.5 }}
                            >
                              {item.extra}
                            </Box>
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 3,
                    mb: 3,
                  }}
                >
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
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        Weekly Plan
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: exportGatingStatus.isGated
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(34, 197, 94, 0.15)",
                          color: exportGatingStatus.isGated
                            ? COLORS.red
                            : COLORS.green,
                          px: 1.5,
                          height: 20,
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textAlign: "center",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {exportGatingStatus.isGated ? "Gated" : "Ready"}
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        mb: 0.5,
                      }}
                    >
                      Actions + Activities (Completed/Blocked)
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "12px", mb: 2 }}
                    >
                      {exportCounts.weeklyPlanTotal}{" "}
                      {exportCounts.weeklyPlanTotal === 1
                        ? "item"
                        : "items"}{" "}
                      to export
                    </Typography>
                    <Tooltip
                      title={
                        exportGatingStatus.isGated
                          ? `Exports are gated. The WeekCycle must be in Execution state. Current cycle is in ${exportGatingStatus.cycleStatus}.`
                          : exportCounts.weeklyPlanTotal === 0
                            ? "No items to export"
                            : ""
                      }
                      placement="top"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: COLORS.bgSecondary,
                            color: COLORS.textPrimary,
                            border: `1px solid ${COLORS.border}`,
                            fontSize: "12px",
                            maxWidth: 300,
                            p: 1,
                          },
                        },
                        arrow: { sx: { color: COLORS.bgSecondary } },
                      }}
                    >
                      <span style={{ width: "100%" }}>
                        <Button
                          fullWidth
                          onClick={handleExportWeeklyPlan}
                          disabled={
                            isExporting === "weekly" ||
                            exportCounts.weeklyPlanTotal === 0 ||
                            exportGatingStatus.isGated
                          }
                          startIcon={
                            isExporting === "weekly" ? (
                              <CircularProgress
                                size={14}
                                sx={{ color: "inherit" }}
                              />
                            ) : null
                          }
                          sx={{
                            bgcolor: exportGatingStatus.isGated
                              ? COLORS.disabledBlue
                              : COLORS.green,
                            color: "#fff",
                            textTransform: "none",
                            py: 1.25,
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 500,
                            "&:hover": {
                              bgcolor: exportGatingStatus.isGated
                                ? COLORS.disabledBlue
                                : "#16a34a",
                            },
                            "&:disabled": {
                              bgcolor: COLORS.disabledBlue,
                              color: "#fff",
                            },
                          }}
                        >
                          {isExporting === "weekly"
                            ? "Exporting..."
                            : "Download Weekly Plan"}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>

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
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        Planner To-Do
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: exportGatingStatus.isGated
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(34, 197, 94, 0.15)",
                          color: exportGatingStatus.isGated
                            ? COLORS.red
                            : COLORS.green,
                          px: 1.5,
                          height: 20,
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textAlign: "center",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {exportGatingStatus.isGated ? "Gated" : "Ready"}
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        mb: 0.5,
                      }}
                    >
                      Outstanding actions and planner follow-on items.
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "12px", mb: 2 }}
                    >
                      {exportCounts.outstandingActions} outstanding{" "}
                      {exportCounts.outstandingActions === 1 ? "item" : "items"}
                    </Typography>
                    <Tooltip
                      title={
                        exportGatingStatus.isGated
                          ? `Exports are gated. The WeekCycle must be in Execution state. Current cycle is in ${exportGatingStatus.cycleStatus}.`
                          : exportCounts.outstandingActions === 0
                            ? "No outstanding items to download"
                            : ""
                      }
                      placement="top"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: COLORS.bgSecondary,
                            color: COLORS.textPrimary,
                            border: `1px solid ${COLORS.border}`,
                            fontSize: "12px",
                            maxWidth: 300,
                            p: 1,
                          },
                        },
                        arrow: { sx: { color: COLORS.bgSecondary } },
                      }}
                    >
                      <span style={{ width: "100%" }}>
                        <Button
                          fullWidth
                          onClick={handleExportPlannerTodo}
                          disabled={
                            isExporting === "todo" ||
                            exportCounts.outstandingActions === 0 ||
                            exportGatingStatus.isGated
                          }
                          startIcon={
                            isExporting === "todo" ? (
                              <CircularProgress
                                size={14}
                                sx={{ color: "inherit" }}
                              />
                            ) : null
                          }
                          sx={{
                            bgcolor: exportGatingStatus.isGated
                              ? COLORS.disabledBlue
                              : COLORS.blue,
                            color: "#fff",
                            textTransform: "none",
                            py: 1.25,
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 500,
                            "&:hover": {
                              bgcolor: exportGatingStatus.isGated
                                ? COLORS.disabledBlue
                                : "#2563eb",
                            },
                            "&:disabled": {
                              bgcolor: COLORS.disabledBlue,
                              color: "#fff",
                            },
                          }}
                        >
                          {isExporting === "todo"
                            ? "Exporting..."
                            : "Download Planner To-Do"}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>

                {exportGatingStatus.isGated && (
                  <Box
                    sx={{
                      bgcolor: "#2D2A24",
                      border: `1px solid ${COLORS.amber}`,
                      borderRadius: "12px",
                      p: 2.5,
                      mb: 3,
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.amber,
                        fontSize: "14px",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      Exports are gated
                    </Typography>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        mb: weeklyActionStats.open > 0 ? 2 : 0,
                      }}
                    >
                      The WeekCycle must be in execution state. Current cycle is
                      in {exportGatingStatus.cycleStatus}. Close all required
                      actions for green activities to unlock exports.
                    </Typography>

                    {/* Show PM Override option if there are open actions */}
                    {weeklyActionStats.open > 0 &&
                      uploadedProgramme?.cycleStatus === "Execution" && (
                        <>
                          <Box
                            sx={{
                              bgcolor: COLORS.bgSecondary,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: "8px",
                              px: 2,
                              py: 1.5,
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              mb: 2,
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <circle
                                cx="10"
                                cy="10"
                                r="8.5"
                                stroke="#F59E0B"
                                strokeWidth="1.5"
                              />
                              <path
                                d="M10 5.5V10L13 12"
                                stroke="#F59E0B"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <Typography
                              sx={{
                                color: COLORS.amber,
                                fontSize: "13px",
                                fontWeight: 500,
                              }}
                            >
                              {weeklyActionStats.open} open action(s) need to be
                              completed before closing.
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              alignItems: "flex-start",
                            }}
                          >
                            <Button
                              onClick={() => setActiveTab(3)}
                              sx={{
                                bgcolor: COLORS.blue,
                                color: "#fff",
                                textTransform: "none",
                                px: 2,
                                py: 1,
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 500,
                                "&:hover": { bgcolor: COLORS.blueHover },
                              }}
                            >
                              Go to Actions
                            </Button>
                            <Button
                              onClick={() =>
                                setShowOverrideForm(!showOverrideForm)
                              }
                              sx={{
                                bgcolor: "transparent",
                                color: COLORS.amber,
                                border: `1px solid ${COLORS.amber}`,
                                textTransform: "none",
                                px: 2,
                                py: 1,
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 500,
                                "&:hover": {
                                  bgcolor: "rgba(245, 158, 11, 0.1)",
                                },
                              }}
                            >
                              PM Override
                            </Button>
                          </Box>
                          {showOverrideForm && (
                            <Box
                              sx={{
                                mt: 2,
                                bgcolor: COLORS.bgSecondary,
                                border: `1px solid ${COLORS.amber}`,
                                borderRadius: "8px",
                                p: 2,
                              }}
                            >
                              <Typography
                                sx={{
                                  color: COLORS.amber,
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  mb: 1,
                                }}
                              >
                                PM Override — Force Close Week
                              </Typography>
                              <Typography
                                sx={{
                                  color: COLORS.textSecondary,
                                  fontSize: "13px",
                                  mb: 2,
                                }}
                              >
                                Enter a mandatory reason (min 10 characters) to
                                close the week despite incomplete actions.
                              </Typography>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Enter justification for override..."
                                value={overrideReason}
                                onChange={(e) =>
                                  setOverrideReason(e.target.value)
                                }
                                sx={{
                                  mb: 2,
                                  "& .MuiOutlinedInput-root": {
                                    bgcolor: COLORS.bgSecondary,
                                    borderRadius: "8px",
                                    "& fieldset": {
                                      borderColor: COLORS.border,
                                    },
                                    "&:hover fieldset": {
                                      borderColor: COLORS.amber,
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor: COLORS.amber,
                                    },
                                  },
                                  "& .MuiInputBase-input": {
                                    color: COLORS.textPrimary,
                                    fontSize: "14px",
                                  },
                                }}
                              />
                              <Button
                                onClick={handleOverrideCloseForExport}
                                disabled={
                                  overrideReason.length < 10 ||
                                  weeklyControlData?.isProjectEnded ||
                                  closingWeek !== null
                                }
                                sx={{
                                  bgcolor: COLORS.amber,
                                  color: "#fff",
                                  textTransform: "none",
                                  px: 3,
                                  py: 1,
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  fontWeight: 500,
                                  "&:hover": { bgcolor: "#d97706" },
                                  "&.Mui-disabled": {
                                    bgcolor: COLORS.bgTertiary,
                                    color: COLORS.textMuted,
                                  },
                                }}
                              >
                                {closingWeek !== null ? (
                                  <CircularProgress
                                    size={18}
                                    sx={{ color: "#fff" }}
                                  />
                                ) : weeklyControlData?.isProjectEnded ? (
                                  "Project Ended"
                                ) : (
                                  "Force Close Week"
                                )}
                              </Button>
                            </Box>
                          )}
                        </>
                      )}
                  </Box>
                )}

                {/* <Box
                  sx={{
                    bgcolor: COLORS.bgSecondary,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "12px",
                    p: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      Week-by-Week Closure
                    </Typography>
                    {weeksStatus && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                        >
                          Progress:
                        </Typography>
                        <Typography
                          sx={{
                            color: COLORS.green,
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {weeksStatus.closedWeeksCount}/
                          {weeksStatus.totalWeeks} weeks ({weeksStatus.progress}
                          %)
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {weeksStatus?.isFullyClosed ? (
                    <Box
                      sx={{
                        bgcolor: "rgba(34, 197, 94, 0.1)",
                        border: `1px solid ${COLORS.green}`,
                        borderRadius: "8px",
                        p: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box
                          component="img"
                          src={lockIcon}
                          sx={{
                            width: 20,
                            height: 20,
                            filter:
                              "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(535%) hue-rotate(93deg)",
                          }}
                        />
                        <Typography
                          sx={{
                            color: COLORS.green,
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          All weeks completed! Programme is fully closed.
                        </Typography>
                      </Box>
                    </Box>
                  ) : weeksStatus ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      {weeksStatus.weeks.map((week) => (
                        <Box
                          key={week.weekNumber}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            bgcolor: week.isClosed
                              ? "rgba(34, 197, 94, 0.1)"
                              : week.status === "current"
                                ? "rgba(59, 130, 246, 0.1)"
                                : COLORS.bgTertiary,
                            border: `1px solid ${
                              week.isClosed
                                ? COLORS.green
                                : week.status === "current"
                                  ? COLORS.blue
                                  : COLORS.border
                            }`,
                            borderRadius: "8px",
                            p: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                bgcolor: week.isClosed
                                  ? COLORS.green
                                  : week.status === "current"
                                    ? COLORS.blue
                                    : COLORS.bgSecondary,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `1px solid ${
                                  week.isClosed
                                    ? COLORS.green
                                    : week.status === "current"
                                      ? COLORS.blue
                                      : COLORS.border
                                }`,
                              }}
                            >
                              <Typography
                                sx={{
                                  color:
                                    week.isClosed || week.status === "current"
                                      ? "#fff"
                                      : COLORS.textSecondary,
                                  fontSize: "11px",
                                  fontWeight: 600,
                                }}
                              >
                                W{week.weekNumber}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography
                                sx={{
                                  color: COLORS.textPrimary,
                                  fontSize: "13px",
                                  fontWeight: 500,
                                }}
                              >
                                Week {week.weekNumber}
                                {week.status === "current" && (
                                  <Box
                                    component="span"
                                    sx={{
                                      color: COLORS.blue,
                                      ml: 1,
                                      fontSize: "11px",
                                    }}
                                  >
                                    (Current)
                                  </Box>
                                )}
                              </Typography>
                              <Typography
                                sx={{
                                  color: COLORS.textMuted,
                                  fontSize: "11px",
                                  mb: 0.5,
                                }}
                              >
                                {week.startDate && new Date(week.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                {" - "}
                                {week.endDate && new Date(week.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </Typography>
                              <Typography
                                sx={{
                                  color: COLORS.textSecondary,
                                  fontSize: "11px",
                                }}
                              >
                                {week.stats.totalActivities} activities •
                                <Box
                                  component="span"
                                  sx={{ color: COLORS.green }}
                                >
                                  {" "}
                                  {week.stats.green} green
                                </Box>
                                {week.stats.amber > 0 && (
                                  <Box
                                    component="span"
                                    sx={{ color: COLORS.amber }}
                                  >
                                    {" "}
                                    • {week.stats.amber} amber
                                  </Box>
                                )}
                                {week.stats.red > 0 && (
                                  <Box
                                    component="span"
                                    sx={{ color: COLORS.red }}
                                  >
                                    {" "}
                                    • {week.stats.red} red
                                  </Box>
                                )}
                              </Typography>
                            </Box>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {week.isClosed ? (
                              <Box
                                sx={{
                                  bgcolor: `${COLORS.green}20`,
                                  color: COLORS.green,
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                }}
                              >
                                Closed
                              </Box>
                            ) : week.canClose ? (
                              <Button
                                onClick={() =>
                                  handleCloseSpecificWeek(week.weekNumber)
                                }
                                disabled={closingWeek === week.weekNumber}
                                size="small"
                                sx={{
                                  bgcolor: COLORS.green,
                                  color: "#fff",
                                  textTransform: "none",
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  minWidth: "auto",
                                  "&:hover": { bgcolor: "#16a34a" },
                                }}
                              >
                                {closingWeek === week.weekNumber ? (
                                  <CircularProgress
                                    size={14}
                                    sx={{ color: "#fff" }}
                                  />
                                ) : (
                                  "Close Weeks"
                                )}
                              </Button>
                            ) : (
                              <Box
                                sx={{
                                  color: COLORS.textMuted,
                                  fontSize: "11px",
                                }}
                              >
                                {week.status === "upcoming"
                                  ? "Upcoming"
                                  : "Close previous weeks first"}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 3 }}
                    >
                      <CircularProgress size={24} sx={{ color: COLORS.blue }} />
                    </Box>
                  )}
                </Box> */}
              </>
            )}
          </Box>
        )}

        <Dialog
          open={editModalOpen}
          onClose={handleEditClose}
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
                Edit Action
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                {editingAction?.id}
              </Typography>
            </Box>
            <IconButton
              onClick={handleEditClose}
              sx={{ color: COLORS.textMuted, p: 0.5 }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Project - Dropdown (disabled) */}
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
                  Project <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <Select
                  fullWidth
                  value={project?._id || ""}
                  disabled
                  IconComponent={ArrowDownIcon}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.border,
                    },
                    "& .MuiSelect-select": {
                      color: COLORS.textSecondary,
                      fontSize: "14px",
                      py: 1.2,
                    },
                    "& .MuiSvgIcon-root": { color: COLORS.textSecondary },
                    "&.Mui-disabled": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                    },
                  }}
                >
                  <MenuItem value={project?._id || ""}>
                    {project?.name || "Unknown Project"}
                  </MenuItem>
                </Select>
              </Box>

              {/* Linked Activity - Dropdown */}
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
                  Linked Activity <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <Select
                  fullWidth
                  value={editingAction?.linkedActivity || ""}
                  onChange={(e) =>
                    handleEditChange("linkedActivity", e.target.value)
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
                      color: editingAction?.linkedActivity
                        ? COLORS.textPrimary
                        : COLORS.textMuted,
                      fontSize: "14px",
                      py: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
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
                          maxHeight: 250,
                          "& .MuiMenuItem-root": {
                            color: COLORS.textPrimary,
                            fontSize: "13px",
                            whiteSpace: "normal",
                            wordWrap: "break-word",
                            lineHeight: 1.4,
                            py: 1,
                            "&:hover": { bgcolor: COLORS.bgTertiary },
                            "&.Mui-selected": {
                              bgcolor: COLORS.blueBgMedium,
                              "&:hover": { bgcolor: COLORS.blueBgHover },
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    {lookaheadData?.activities?.length
                      ? "Select activity..."
                      : "No activities available"}
                  </MenuItem>
                  {lookaheadData?.activities?.map((activity) => (
                    <MenuItem
                      key={activity.activityId}
                      value={activity.activityId}
                    >
                      {activity.activityId} - {activity.activityName}
                    </MenuItem>
                  ))}
                </Select>
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
                  Title <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  value={editingAction?.title || ""}
                  onChange={(e) => handleEditChange("title", e.target.value)}
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
                    },
                  }}
                />
              </Box>

              {/* Description */}
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
                  Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={editingAction?.description || ""}
                  onChange={(e) =>
                    handleEditChange("description", e.target.value)
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
                    },
                  }}
                />
              </Box>

              {/* Type | Priority row */}
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
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
                    Type <span style={{ color: COLORS.red }}>*</span>
                  </Typography>
                  <Select
                    fullWidth
                    value={editingAction?.type || ""}
                    onChange={(e) => handleEditChange("type", e.target.value)}
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
                    Priority <span style={{ color: COLORS.red }}>*</span>
                  </Typography>
                  <Select
                    fullWidth
                    value={editingAction?.priority || ""}
                    onChange={(e) =>
                      handleEditChange("priority", e.target.value)
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
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
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
                    value={editingAction?.assigneeId || ""}
                    onChange={(e) => {
                      const selectedUser = users.find(
                        (u) => u._id === e.target.value,
                      );
                      if (editingAction && selectedUser) {
                        const names = selectedUser.name.split(" ");
                        const initials = names
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);
                        setEditingAction({
                          ...editingAction,
                          assigneeId: e.target.value,
                          assignee: { initials, name: selectedUser.name },
                        });
                      }
                    }}
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
                        color: editingAction?.assigneeId
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
                      {users.length === 0
                        ? "No users available"
                        : "Select assignee..."}
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name}
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
                    value={editingAction?.dueDate || ""}
                    onChange={(e) =>
                      handleEditChange("dueDate", e.target.value)
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
                        color: editingAction?.dueDate
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

              {/* Status row (half width) */}
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
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
                    Status
                  </Typography>
                  <Select
                    fullWidth
                    value={editingAction?.status || ""}
                    onChange={(e) => handleEditChange("status", e.target.value)}
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
                    <MenuItem value="Open">Open</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </Box>
                <Box />
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
              onClick={handleEditClose}
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
              onClick={handleEditUpdate}
              disabled={editSaveLoading}
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
              {editSaveLoading ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                "Update"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Complete Action Confirmation Modal */}
        <Dialog
          open={completeConfirmOpen}
          onClose={handleCloseCompleteConfirm}
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
                }}
              >
                <Box
                  component="img"
                  src={viewIcon}
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
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "13px",
                    mt: 0.5,
                  }}
                >
                  {actionToComplete?.title}
                </Typography>
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
              onClick={handleCloseCompleteConfirm}
              sx={{
                color: COLORS.textSecondary,
                bgcolor: COLORS.bgPrimary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                textTransform: "none",
                px: 3,
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
              onClick={handleConfirmComplete}
              disabled={completeLoading}
              sx={{
                color: COLORS.white,
                bgcolor: COLORS.green,
                borderRadius: "8px",
                textTransform: "none",
                px: 3,
                py: 1,
                fontSize: "14px",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: "#16a34a",
                },
                "&:disabled": {
                  bgcolor: COLORS.green,
                  opacity: 0.7,
                },
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

        <Dialog
          open={assignModalOpen}
          onClose={handleCloseAssignModal}
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
              onClick={handleCloseAssignModal}
              sx={{ color: COLORS.textMuted, p: 0.5 }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 2 }}>
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
                  }}
                >
                  Activity Name
                </Typography>
                <Box
                  sx={{
                    bgcolor: COLORS.bgTertiary,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    px: 1.5,
                    py: 1,
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "13px",
                    }}
                  >
                    {assigningActivity?.activityName || "-"}
                  </Typography>
                </Box>
              </Box>

              {/* Action Title */}
              <Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Action Title <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="Enter action title"
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& fieldset": {
                        borderColor: COLORS.border,
                      },
                      "&:hover fieldset": {
                        borderColor: COLORS.blue,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: COLORS.blue,
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: COLORS.textPrimary,
                      fontSize: "13px",
                      py: 1,
                    },
                  }}
                />
              </Box>

              {/* Type and Priority Row */}
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.5,
                    }}
                  >
                    Type
                  </Typography>
                  <Select
                    fullWidth
                    value={assignType}
                    onChange={(e) =>
                      setAssignType(e.target.value as "Required" | "Optional")
                    }
                    sx={{
                      mb: 2,
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.blue,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.blue,
                      },
                      "& .MuiSelect-select": {
                        color: COLORS.textPrimary,
                        fontSize: "13px",
                        py: 1,
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
                    }}
                  >
                    Priority
                  </Typography>
                  <Select
                    fullWidth
                    value={assignPriority}
                    onChange={(e) =>
                      setAssignPriority(
                        e.target.value as "Low" | "Medium" | "High",
                      )
                    }
                    sx={{
                      mb: 2,
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.blue,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.blue,
                      },
                      "& .MuiSelect-select": {
                        color: COLORS.textPrimary,
                        fontSize: "13px",
                        py: 1,
                      },
                    }}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </Box>
              </Box>

              {/* Assignee and Due Date Row */}
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.5,
                    }}
                  >
                    Assignee <span style={{ color: COLORS.red }}>*</span>
                  </Typography>
                  <Select
                    fullWidth
                    value={assignAssignee}
                    onChange={(e) => setAssignAssignee(e.target.value)}
                    displayEmpty
                    sx={{
                      mb: 2,
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.blue,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.blue,
                      },
                      "& .MuiSelect-select": {
                        color: assignAssignee
                          ? COLORS.textPrimary
                          : COLORS.textMuted,
                        fontSize: "13px",
                        py: 1,
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select assignee
                    </MenuItem>
                    {users.map(
                      (u: { _id: string; name: string; email: string }) => (
                        <MenuItem key={u._id} value={u._id}>
                          {u.name}
                        </MenuItem>
                      ),
                    )}
                  </Select>
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
                    Due Date <span style={{ color: COLORS.red }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    slotProps={{
                      htmlInput: {
                        min: assigningActivity?.startDate,
                        max: assigningActivity?.finishDate,
                      },
                    }}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        bgcolor: COLORS.bgPrimary,
                        borderRadius: "8px",
                        "& fieldset": {
                          borderColor: COLORS.border,
                        },
                        "&:hover fieldset": {
                          borderColor: COLORS.blue,
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: COLORS.blue,
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: COLORS.textPrimary,
                        fontSize: "13px",
                        py: 1,
                        "&::-webkit-calendar-picker-indicator": {
                          filter: "invert(1)",
                          cursor: "pointer",
                          opacity: 0.7,
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
              onClick={handleCloseAssignModal}
              sx={{
                color: COLORS.textSecondary,
                bgcolor: COLORS.bgTertiary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                px: 3,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": {
                  bgcolor: COLORS.bgPrimary,
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignSave}
              disabled={assignLoading}
              sx={{
                color: COLORS.white,
                bgcolor: COLORS.blue,
                borderRadius: "8px",
                px: 3,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": {
                  bgcolor: COLORS.blueHover,
                },
                "&.Mui-disabled": {
                  bgcolor: COLORS.bgTertiary,
                  color: COLORS.textMuted,
                },
              }}
            >
              {assignLoading ? (
                <CircularProgress size={20} sx={{ color: COLORS.white }} />
              ) : (
                "Assign"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reassign Modal */}
        <Dialog
          open={reassignModalOpen}
          onClose={handleCloseReassign}
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
                Reassign Action
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
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
            <Box sx={{ mb: 2 }}>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                Current Assignee
              </Typography>
              <Box
                sx={{
                  bgcolor: COLORS.bgTertiary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "13px",
                  }}
                >
                  {reassigningAction?.currentAssigneeName || "Unassigned"}
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
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.border,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.blue,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.blue,
                  },
                  "& .MuiSelect-select": {
                    color: reassignAssignee
                      ? COLORS.textPrimary
                      : COLORS.textMuted,
                    fontSize: "13px",
                    py: 1,
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select new assignee
                </MenuItem>
                {users
                  .filter(
                    (u: { _id: string }) =>
                      u._id !== reassigningAction?.currentAssignee,
                  )
                  .map((u: { _id: string; name: string; email: string }) => (
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
                bgcolor: COLORS.bgTertiary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                px: 3,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": {
                  bgcolor: COLORS.bgPrimary,
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignSave}
              disabled={reassignLoading}
              sx={{
                color: COLORS.white,
                bgcolor: COLORS.amber,
                borderRadius: "8px",
                px: 3,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#d97706",
                },
                "&.Mui-disabled": {
                  bgcolor: COLORS.bgTertiary,
                  color: COLORS.textMuted,
                },
              }}
            >
              {reassignLoading ? (
                <CircularProgress size={20} sx={{ color: COLORS.white }} />
              ) : (
                "Reassign"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast notification for execution not started */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={4000}
          onClose={() => setToastOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setToastOpen(false)}
            severity="warning"
            sx={{
              bgcolor: COLORS.amber,
              color: "#000",
              fontWeight: 500,
              "& .MuiAlert-icon": {
                color: "#000",
              },
            }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </PlannerLayout>
  );
};

export default PlannerProjectWorkspace;
