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
} from "@mui/icons-material";
import editIcon from "../../assets/tabler_edit.png";
import viewIcon from "../../assets/Frame.png";
import lockIcon from "../../assets/lock.png";
import uploadIcon from "../../assets/sidebar/upload.png";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
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
import BlockedActivitiesTable from "../../components/BlockedActivitiesTable";
import AdminActivitiesSummary from "../../components/AdminActivitiesSummary";
import ActivitiesTable from "../../components/ActivitiesTable";
import type { Activity } from "../../components/ActivitiesTable";
import ActionDetailsDialog from "../../components/ActionDetailsDialog";

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
  "Open Meeting",
  "Upload a program",
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

const getRAGZonePriority = (zone: string): number => {
  if (zone === "Overdue") return 0;
  if (zone === "Completed") return 1;
  if (zone === "In Progress") return 2;
  if (zone === "Weeks 1-2") return 3;
  if (zone === "Weeks 3-4") return 4;
  if (zone === "Weeks 5-6") return 5;
  return 6;
};

const getWeekDateRangeFromToday = (): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const startDate = new Date(today);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 13);

  const formatDateShort = (date: Date) =>
    `${date.getDate()} ${months[date.getMonth()]}`;

  return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
};

/* "Aug 19, 2026 03:00 PM" — used by the Edit dialog's update history. */
const formatAuditStamp = (value?: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} ${timePart}`;
};

const toDateInputFormat = (dateStr: string): string => {
  if (!dateStr) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

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

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
};

/* Shared height for the PM Override reason field and its Override button, so
   the two line up despite the theme's Button padding. */
const OVERRIDE_ROW_HEIGHT = 40;
/* One override card: 32 padding + 21 title + 4 + 18 meta + 12 + 40 reason row
   + 2 border. Title and meta are clamped to one line so this stays exact. */
const OVERRIDE_CARD_HEIGHT = 129;
const OVERRIDE_LIST_GAP = 16;
/* Show two cards, then scroll for the rest. */
const OVERRIDE_LIST_MAX_HEIGHT = OVERRIDE_CARD_HEIGHT * 2 + OVERRIDE_LIST_GAP;

/* An action can be force-closed only while it is still open. */
const isOverridableAction = (action: { status: string }) =>
  action.status !== "Completed" &&
  action.status !== "Cancelled" &&
  action.status !== "PM Override";

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
  updatedAt?: string;
  overrideReason?: string;
}

const AdminProjectWorkspace = () => {
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
    if (tabParam === "open-meeting") return 6;
    return 1;
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [meetingOpenLocal, setMeetingOpenLocal] = useState(false);
  const [closedWeekAck, setClosedWeekAck] = useState<number | null>(null);
  const [programmeAnchor, setProgrammeAnchor] = useState<string | null>(null);
  const [weekNum, setWeekNum] = useState(1);
  const [ragFilter, setRagFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState<number | null>(null);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [uploaderName, setUploaderName] = useState("");
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
    plannerReview: false,
    todoGenerated: false,
    overdueAcknowledged: false,
    blockedAcknowledged: false,
  });
  // Per-action PM Override (B4): one reason per action, never a bulk close.
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReasons, setOverrideReasons] = useState<
    Record<string, string>
  >({});
  const [overridingActionId, setOverridingActionId] = useState<string | null>(
    null,
  );
  const [isWeekClosed, setIsWeekClosed] = useState(false);
  const [savedOverrideReason, setSavedOverrideReason] = useState("");
  const [lockedViewWeek, setLockedViewWeek] = useState<number | null>(null);
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

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningActivity, setAssigningActivity] = useState<{
    activityId: string;
    activityName: string;
    startDate: string;
    finishDate: string;
    ownerName?: string;
  } | null>(null);
  const [assignFormData, setAssignFormData] = useState({
    title: "",
    description: "",
    type: "Required",
    priority: "Medium",
    assignee: "",
    dueDate: "",
    status: "Open",
  });
  const [assignSaveLoading, setAssignSaveLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Read-only action record, opened from a linked action in the table.
  const [actionDetailId, setActionDetailId] = useState<string | null>(null);
  const [assignChoiceOpen, setAssignChoiceOpen] = useState(false);
  const [assignChoiceActivity, setAssignChoiceActivity] = useState<{
    activityId: string;
    activityName: string;
    startDate: string;
    finishDate: string;
    ownerName?: string;
  } | null>(null);
  const [noActionLoading, setNoActionLoading] = useState(false);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [markingCloseOut, setMarkingCloseOut] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "warning">(
    "warning",
  );
  const [reassigningAction, setReassigningAction] = useState<{
    _id: string;
    title: string;
    currentAssignee?: string;
    currentAssigneeName?: string;
  } | null>(null);
  const [reassignAssignee, setReassignAssignee] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState("");

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

  const [programmeHistory, setProgrammeHistory] = useState<
    Array<{
      _id: string;
      name: string;
      cycleStatus: string;
      createdAt: string;
      totalActivities?: number;
      overrideReason?: string;
    }>
  >([]);

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
      ownerName?: string;
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
  const [projectActions, setProjectActions] = useState<
    Array<{
      _id: string;
      title: string;
      linkedActivity: { activityId: string; activityName: string };
      type: string;
      status: string;
      priority: string;
      assignee?: { _id?: string; name: string };
      dueDate: string;
      createdAt?: string;
      updatedAt?: string;
      overrideReason?: string;
      completionNote?: string;
    }>
  >([]);
  /* The column only earns its width once something has actually been
     completed, so it stays hidden on a list of purely open actions. */
  const showCompletionReason = projectActions.some(
    (action) => action.status === "Completed",
  );
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [actionToComplete, setActionToComplete] = useState<{
    _id: string;
    title: string;
  } | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeNote, setCompleteNote] = useState("");
  const [users, setUsers] = useState<
    Array<{ _id: string; name: string; email: string; role: string }>
  >([]);

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
    else if (tabParam === "open-meeting") setActiveTab(6);
  }, [location.search]);

  useEffect(() => {
    if (!projectId) return;
    const opened =
      localStorage.getItem(`plansure_meeting_open_${projectId}`) === "true";
    setMeetingOpenLocal(opened);
    if (opened) setCurrentStep((step) => (step < 1 ? 1 : step));
    const pendingClose = localStorage.getItem(
      `plansure_week_closed_ack_${projectId}`,
    );
    setClosedWeekAck(pendingClose ? Number(pendingClose) : null);
    const storedWeekNum = localStorage.getItem(
      `plansure_week_num_${projectId}`,
    );
    setWeekNum(storedWeekNum ? Number(storedWeekNum) : 1);
  }, [projectId]);

  const handleAckClosedWeek = async () => {
    if (projectId) {
      localStorage.removeItem(`plansure_week_closed_ack_${projectId}`);
    }
    setClosedWeekAck(null);
    const nextWeek = weekNum + 1;
    setWeekNum(nextWeek);
    if (projectId) {
      localStorage.removeItem(`plansure_meeting_open_${projectId}`);
      localStorage.setItem(`plansure_awaiting_upload_${projectId}`, "true");
      localStorage.setItem(`plansure_week_num_${projectId}`, String(nextWeek));
    }
    setMeetingOpenLocal(false);
    setCurrentStep(0);
    setCycleStage("draft");
    setLockedViewWeek(null);
    setUploadedProgramme(null);
    setLookaheadData(null);
    setWeeklyControlData(null);
    setProgrammeAnchor(null);
    setProjectActions([]);
    setActiveTab(6);
  };

  const [weeklyControlData, setWeeklyControlData] = useState<{
    stats: {
      cycleStatus: string;
      inLookahead: number;
      ready: number;
      complete: number;
      blocked: number;
      openActions: number;
      overdue: number;
      readyToClose: string;
    };
    ragDistribution: {
      green: number;
      amber: number;
      red: number;
      grey?: number;
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
    requiredActionsByStatus: {
      open: number;
      inProgress: number;
    };
    unassignedInWeek?: number;
    blockedRiskActivities: Array<{
      activityId: string;
      activityName: string;
      ragStatus: string;
      activityStatus?: string;
      isBlocked?: boolean;
      owner: string;
      blocker: string;
      linkedAction: { actionId: string; title?: string; status: string } | null;
      startDate?: string;
      finishDate?: string;
    }>;
    activityCounts?: {
      completed: number;
      noAction: number;
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
            (user: { role: string; status: string }) =>
              (user.role === "planner" || user.role === "user") &&
              user.status === "active",
          );
          setUsers(activeUsers);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  const refetchProgramme = async () => {
    if (!projectId) return;
    if (
      localStorage.getItem(`plansure_awaiting_upload_${projectId}`) === "true"
    ) {
      setUploadedProgramme(null);
      setLookaheadData(null);
      setWeeklyControlData(null);
      return;
    }
    try {
      const response = await programmeAPI.getByProject(projectId);
      if (response.success && response.programme) {
        const programme = response.programme;
        setProgrammeAnchor(programme.lookaheadStartDate || null);
        setUploaderName(programme.uploadedBy?.name || "");
        const activities = programme.extractedData?.activities || [];
        const summary = programme.extractedData?.summary || {
          total: 0,
          inLookahead: 0,
          green: 0,
          amber: 0,
          red: 0,
          blocked: 0,
        };

        const programmeStatus = programme.cycleStatus || "Uploaded";
        setUploadedProgramme({
          _id: programme._id,
          name: programme.name,
          totalActivities:
            programme.extractedData?.totalActivities || activities.length,
          cycleStatus: programmeStatus,
          isLocked: programme.isLocked || false,
          overrideReason: programme.overrideReason || "",
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
          weekZones: lookaheadData?.weekZones || [],
        });
      }
    } catch (error) {
      console.error("Failed to refetch programme:", error);
    }
  };

  useEffect(() => {
    const fetchProgramme = async () => {
      if (!projectId) return;
      if (
        localStorage.getItem(`plansure_awaiting_upload_${projectId}`) === "true"
      ) {
        setIsLoadingProgramme(false);
        return;
      }
      try {
        const response = await programmeAPI.getByProject(projectId);
        if (response.success && response.programme) {
          const programme = response.programme;
          setProgrammeAnchor(programme.lookaheadStartDate || null);
          // Also set here: this is the load path that populates the workspace,
          // and without it the Owner column fell back to "Unknown".
          setUploaderName(programme.uploadedBy?.name || "");
          const activities = programme.extractedData?.activities || [];
          const summary = programme.extractedData?.summary || {
            total: 0,
            inLookahead: 0,
            green: 0,
            amber: 0,
            red: 0,
            blocked: 0,
          };

          const programmeStatus = programme.cycleStatus || "Uploaded";
          setUploadedProgramme({
            _id: programme._id,
            name: programme.name,
            totalActivities:
              programme.extractedData?.totalActivities || activities.length,
            cycleStatus: programmeStatus,
            isLocked: programme.isLocked || false,
            overrideReason: programme.overrideReason || "",
            summary: {
              green: summary.green || 0,
              amber: summary.amber || 0,
              red: summary.red || 0,
              inLookahead: summary.inLookahead || activities.length,
            },
          });

          if (programmeStatus === "Meeting Open") {
            setCycleStage("meetingOpen");
            setCurrentStep(2);
          } else if (programmeStatus === "Execution") {
            setCycleStage("execution");
            setCurrentStep(3);
          } else if (programmeStatus === "Close-Out Eligible") {
            setCycleStage("execution");
            setCurrentStep(4);
          } else if (programmeStatus === "Closed") {
            setCycleStage("execution");
            setCurrentStep(5);
            setIsWeekClosed(true);
            if (programme.overrideReason) {
              setSavedOverrideReason(programme.overrideReason);
            }
          } else {
            setCycleStage("draft");
            setCurrentStep(1);
          }

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

  useEffect(() => {
    if (uploadedProgramme?._id && weeksStatus) {
      if (lockedViewWeek !== null) {
        fetchWeeklyControlData(uploadedProgramme._id, lockedViewWeek);
        return;
      }
      const closableWeek = weeksStatus.weeks.find((w) => w.canClose);
      const firstUnclosedWeek = weeksStatus.weeks.find((w) => !w.isClosed);
      const weekNumber =
        closableWeek?.weekNumber || firstUnclosedWeek?.weekNumber || 1;
      fetchWeeklyControlData(uploadedProgramme._id, weekNumber);
    }
  }, [weeksStatus?.closedWeeksCount, uploadedProgramme?._id, lockedViewWeek]);

  const weekPendingClose = weeksStatus?.weeks.find(
    (w) => w.canClose,
  )?.weekNumber;

  const handleCloseSpecificWeek = async (
    weekNumber: number,
    closeType: string = "Normal Close",
  ) => {
    if (!uploadedProgramme?._id) return;
    setClosingWeek(weekNumber);
    try {
      const response1: {
        success: boolean;
        isFullyClosed: boolean;
        isLastWeek?: boolean;
      } = await programmeAPI.closeWeek(
        uploadedProgramme._id,
        weekNumber,
        closeType,
        // Week-level force-close is gone: overrides are now per-action, so a
        // week closes normally once each blocking action is done or overridden.
        undefined,
      );

      const response2: {
        success: boolean;
        isFullyClosed: boolean;
        isLastWeek?: boolean;
      } = { success: false, isFullyClosed: false };

      if (response1.success) {
        const updatedWeeksStatus = await programmeAPI.getWeeksStatus(
          uploadedProgramme._id,
        );

        if (updatedWeeksStatus.success) {
          setWeeksStatus(updatedWeeksStatus);

          const nextClosableWeek = updatedWeeksStatus.weeks.find(
            (w: { canClose: boolean }) => w.canClose,
          );
          const nextWeekNumber =
            nextClosableWeek?.weekNumber ||
            updatedWeeksStatus.currentWeekNumber;
          await fetchWeeklyControlData(uploadedProgramme._id, nextWeekNumber);
          await refetchProgramme();
        }

        if (projectId) {
          localStorage.setItem(
            `plansure_week_closed_ack_${projectId}`,
            String(weekNum),
          );
        }
        setClosedWeekAck(weekNum);

        if (response1.isLastWeek || response2.isLastWeek) {
          setCycleStage("execution");
          setCurrentStep(4);
          setUploadedProgramme((prev) =>
            prev ? { ...prev, cycleStatus: "Close-Out Eligible" } : null,
          );
        } else if (response1.isFullyClosed || response2.isFullyClosed) {
          setIsWeekClosed(true);
          setCurrentStep(5);
          setUploadedProgramme((prev) =>
            prev ? { ...prev, cycleStatus: "Closed", isLocked: true } : null,
          );
        } else {
          setCycleStage("draft");
          setCurrentStep(0);
          setUploadedProgramme((prev) =>
            prev ? { ...prev, cycleStatus: "Draft" } : null,
          );
        }
      }
    } catch (error: unknown) {
      console.error("Failed to close week:", error);
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
      };
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to close week. Please try again.";
      setToastMessage(msg);
      setToastOpen(true);
    } finally {
      setClosingWeek(null);
    }
  };

  useEffect(() => {
    const fetchProgrammeHistory = async () => {
      if (!projectId) return;
      try {
        const response = await programmeAPI.getProjectHistory(projectId);
        if (response.success && response.history) {
          setProgrammeHistory(
            response.history.map(
              (p: {
                _id: string;
                name: string;
                cycleStatus: string;
                createdAt: string;
                extractedData?: { totalActivities?: number };
                overrideReason?: string;
              }) => ({
                _id: p._id,
                name: p.name,
                cycleStatus: p.cycleStatus,
                createdAt: p.createdAt,
                totalActivities: p.extractedData?.totalActivities || 0,
                overrideReason: p.overrideReason,
              }),
            ),
          );
        }
      } catch (error) {
        console.error("Failed to fetch programme history:", error);
      }
    };
    fetchProgrammeHistory();
  }, [projectId, uploadedProgramme?.cycleStatus]);

  const getActionsForActivity = (activityId: string) => {
    return projectActions.filter(
      (action) => action.linkedActivity?.activityId === activityId,
    );
  };

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
      null as (typeof closedWeeks)[0] | null,
    );

    if (!mostRecentClosure?.closedAt) return false;

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
            setMeetingOpenLocal(true);
            if (projectId) {
              localStorage.setItem(
                `plansure_meeting_open_${projectId}`,
                "true",
              );
            }
          } else if (cycleStage === "meetingOpen") {
            setCycleStage("execution");
          }
          setCurrentStep(nextStep);
          setUploadedProgramme({
            ...uploadedProgramme,
            cycleStatus: nextStatus,
          });

          const weeksResponse = await programmeAPI.getWeeksStatus(
            uploadedProgramme._id,
          );
          if (weeksResponse) {
            setWeeksStatus(weeksResponse);
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

  /* Actions still open in this week — the candidates for a PM Override. */
  const overridableActions = projectActions.filter(isOverridableAction);

  /* Force-close ONE action, with its own mandatory reason. Replaces the old
     bulk "Force Close Weeks" behaviour the MS-05 review rejected (B4). */
  const handleOverrideSingleAction = async (actionId: string) => {
    const reason = (overrideReasons[actionId] || "").trim();
    if (reason.length < 10 || overridingActionId) return;

    setOverridingActionId(actionId);
    try {
      const response = await actionAPI.override(actionId, reason);

      if (response?.success) {
        const actionsRes = await actionAPI.getAll({
          programmeId: uploadedProgramme?._id,
        });
        if (actionsRes.success) {
          const refreshed = actionsRes.actions || [];
          setProjectActions(refreshed);
          // That was the last one — close rather than show an empty list.
          if (!refreshed.some(isOverridableAction)) {
            setOverrideModalOpen(false);
          }
        }
        if (uploadedProgramme?._id) {
          await Promise.all([
            refreshWeeksStatus(),
            fetchWeeklyControlData(
              uploadedProgramme._id,
              weeklyControlData?.weekInfo?.weekNumber,
            ),
          ]);
        }
        setOverrideReasons((prev) => {
          const next = { ...prev };
          delete next[actionId];
          return next;
        });
        setToastSeverity("success");
        setToastMessage("Action closed via PM Override.");
        setToastOpen(true);
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        "Could not override this action. Please try again.";
      setToastSeverity("warning");
      setToastMessage(message);
      setToastOpen(true);
    } finally {
      setOverridingActionId(null);
    }
  };

  /* Stage 3 -> Stage 4. This is a deliberate governance decision by the PM,
     so it gets its own control rather than riding on the Weekly Plan download. */
  const handleMarkCloseOutEligible = async () => {
    if (!uploadedProgramme?._id || markingCloseOut) return;

    setMarkingCloseOut(true);
    try {
      const statusRes = await programmeAPI.updateCycleStatus(
        uploadedProgramme._id,
        "Close-Out Eligible",
      );

      if (statusRes?.success) {
        setUploadedProgramme((prev) =>
          prev ? { ...prev, cycleStatus: "Close-Out Eligible" } : prev,
        );
        setCurrentStep(4);
        await Promise.all([
          refreshWeeksStatus(),
          fetchWeeklyControlData(
            uploadedProgramme._id,
            weeklyControlData?.weekInfo?.weekNumber,
          ),
        ]);
        setToastSeverity("success");
        setToastMessage("Week marked Close-Out Eligible.");
        setToastOpen(true);
      }
    } catch (error: unknown) {
      // The server re-checks eligibility and can refuse; surface its reason.
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        "Could not mark the week Close-Out Eligible. Please try again.";
      setToastSeverity("warning");
      setToastMessage(message);
      setToastOpen(true);
    } finally {
      setMarkingCloseOut(false);
    }
  };

  const handleFinalClose = async () => {
    if (!uploadedProgramme?._id) return;
    const weekToClose =
      lockedViewWeek ??
      weeksStatus?.weeks.find((w) => !w.isClosed)?.weekNumber ??
      weeksStatus?.currentWeekNumber ??
      1;
    await handleCloseSpecificWeek(weekToClose, "Normal Close");
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

  const isMeetingOpen =
    meetingOpenLocal ||
    (!!uploadedProgramme &&
      ["Meeting Open", "Execution", "Close-Out Eligible", "Closed"].includes(
        uploadedProgramme.cycleStatus || "",
      ));

  const handleOpenMeeting = async () => {
    setMeetingOpenLocal(true);
    if (projectId) {
      localStorage.setItem(`plansure_meeting_open_${projectId}`, "true");
    }
    setCurrentStep((step) => (step < 1 ? 1 : step));
    if (uploadedProgramme?._id && cycleStage === "draft") {
      await handleCycleAction();
    }
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

    // The server enforces this too, but catching it here avoids a round trip.
    if (
      editingAction.status === "PM Override" &&
      (editingAction.overrideReason || "").trim().length < 10
    ) {
      setToastSeverity("warning");
      setToastMessage(
        "A reason of at least 10 characters is required to PM Override an action.",
      );
      setToastOpen(true);
      return;
    }

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
        overrideReason: editingAction.overrideReason,
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
        if (uploadedProgramme?._id) {
          try {
            const weekNumber = weeklyControlData?.weekInfo?.weekNumber;
            await fetchWeeklyControlData(uploadedProgramme._id, weekNumber);
          } catch (refetchError) {
            console.error(
              "Failed to refetch weekly control data:",
              refetchError,
            );
          }
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
    if (!editingAction) return;

    // Moving off PM Override clears the evidence too — leaving stale text in a
    // disabled field would re-appear next time the action is opened.
    if (field === "status" && value !== "PM Override") {
      setEditingAction({ ...editingAction, status: value, overrideReason: "" });
      return;
    }

    setEditingAction({ ...editingAction, [field]: value });
  };

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
      status: "Open",
    });
    setAssignError("");
  };

  const handleAssignSave = async () => {
    if (!assigningActivity || !uploadedProgramme?._id) return;

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
        programmeId: uploadedProgramme._id,
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
        status: assignFormData.status,
      });

      if (response.success) {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const closableWeek = weeksStatus?.weeks?.find(
          (w: { canClose: boolean }) => w.canClose,
        );
        const weekNumber =
          closableWeek?.weekNumber || weeksStatus?.currentWeekNumber;

        await fetchWeeklyControlData(uploadedProgramme._id, weekNumber);
        await refreshWeeksStatus();

        const [actionsRes] = await Promise.all([
          actionAPI.getAll({ programmeId: uploadedProgramme._id }),
          refetchProgramme(),
        ]);

        if (actionsRes.success) {
          setProjectActions(actionsRes.actions || []);
        }

        handleAssignClose();
      }
    } catch (error: unknown) {
      console.error("Failed to create action:", error);
      const err = error as any;
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

  const openAssignChoice = (a: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    ownerName?: string;
  }) => {
    setAssignChoiceActivity({
      activityId: a.id,
      activityName: a.name,
      startDate: toDateInputFormat(a.startDate),
      finishDate: toDateInputFormat(a.endDate),
      ownerName: a.ownerName,
    });
    setAssignError("");
    setAssignChoiceOpen(true);
  };

  const handleAssignChoiceClose = () => {
    setAssignChoiceOpen(false);
    setAssignChoiceActivity(null);
  };

  const handleChooseActionRequired = () => {
    if (!assignChoiceActivity) return;
    setAssigningActivity(assignChoiceActivity);
    setAssignFormData({
      title: "",
      description: "",
      type: "Required",
      priority: "Medium",
      assignee: "",
      dueDate: new Date().toLocaleDateString("en-CA"),
      status: "Open",
    });
    setAssignChoiceOpen(false);
    setAssignModalOpen(true);
  };

  const refreshWeeksStatus = async () => {
    if (!uploadedProgramme?._id) return;
    const res = await programmeAPI.getWeeksStatus(uploadedProgramme._id);
    if (res?.success) setWeeksStatus(res);
  };

  const handleChooseNoAction = async () => {
    if (!assignChoiceActivity || !uploadedProgramme?._id) return;
    setNoActionLoading(true);
    try {
      await programmeAPI.updateActivity(
        uploadedProgramme._id,
        assignChoiceActivity.activityId,
        { assignmentState: "NoAction" },
      );
      const noActionWeek =
        lockedViewWeek ?? weeklyControlData?.weekInfo?.weekNumber;
      await Promise.all([
        refetchProgramme(),
        fetchWeeklyControlData(uploadedProgramme._id, noActionWeek),
        refreshWeeksStatus(),
      ]);
      setToastMessage("Activity marked as Ready (No Action).");
      setToastSeverity("success");
      setToastOpen(true);
      handleAssignChoiceClose();
    } catch (error) {
      console.error("Failed to mark activity as No Action:", error);
      setAssignError("Failed to update activity. Please try again.");
    } finally {
      setNoActionLoading(false);
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
        const actionsRes = await actionAPI.getAll({
          programmeId: uploadedProgramme?._id,
        });
        if (actionsRes.success) {
          setProjectActions(actionsRes.actions || []);
        }
        handleCloseReassign();
      }
    } catch (error: unknown) {
      console.error("Failed to reassign action:", error);
      const err = error as any;
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reassign action. Please try again.";
      setReassignError(errorMessage);
    } finally {
      setReassignLoading(false);
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
    setCompleteNote("");
  };

  const handleConfirmComplete = async () => {
    if (!actionToComplete) return;

    setCompleteLoading(true);
    try {
      const response = await actionAPI.complete(
        actionToComplete._id,
        completeNote,
      );
      if (response.success) {
        if (projectId) {
          const actionsRes = await actionAPI.getAll({
            programmeId: uploadedProgramme?._id,
          });
          if (actionsRes.success) {
            setProjectActions(actionsRes.actions || []);
          }
        }
        if (uploadedProgramme?._id) {
          const closableWeek = weeksStatus?.weeks?.find(
            (w: { canClose: boolean }) => w.canClose,
          );
          const weekNumber =
            closableWeek?.weekNumber || weeksStatus?.currentWeekNumber;
          await fetchWeeklyControlData(uploadedProgramme._id, weekNumber);
          await refreshWeeksStatus();
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
          ready: 0,
          complete: 0,
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
        requiredActionsByStatus: response.requiredActionsByStatus || {
          open: 0,
          inProgress: 0,
        },
        unassignedInWeek: response.unassignedInWeek || 0,
        blockedRiskActivities: response.blockedRiskActivities || [],
        activityCounts: response.activityCounts || {
          completed: 0,
          blocked: 0,
          atRisk: 0,
        },
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

  useEffect(() => {
    if (weeklyControlData && uploadedProgramme) {
      const cycleStatus = uploadedProgramme.cycleStatus || "Draft";
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

      const greenActivitiesReady =
        weeklyControlData.ragDistribution?.green || 0;

      const completedActions = weeklyControlData.actionsByStatus?.closed || 0;

      const pmOverrideActions =
        weeklyControlData.actionsByStatus?.pmOverride || 0;

      const overdueActions = weeklyControlData.actionsByStatus?.overdue || 0;

      // Force-closed actions still belong on the Planner To-Do: the work was
      // not done, so the Planner must reflect it in the programme update.
      const outstandingActions =
        (weeklyControlData.weeklyActionsByStatus?.open || 0) +
        (weeklyControlData.weeklyActionsByStatus?.inProgress || 0) +
        (weeklyControlData.weeklyActionsByStatus?.overdue || 0) +
        pmOverrideActions;

      const blockedActivities =
        weeklyControlData.blockedRiskActivities?.length || 0;

      const completedActivitiesCount =
        weeklyControlData.activityCounts?.completed || 0;
      const noActionActivitiesCount =
        weeklyControlData.activityCounts?.noAction || 0;
      const blockedActivitiesCount =
        weeklyControlData.activityCounts?.blocked || 0;
      const atRiskActivitiesCount =
        weeklyControlData.activityCounts?.atRisk || 0;

      const weeklyPlanTotal =
        (weeklyControlData.weeklyActionsByStatus?.closed || 0) +
        (weeklyControlData.weeklyActionsByStatus?.overdue || 0) +
        pmOverrideActions +
        completedActivitiesCount +
        noActionActivitiesCount +
        blockedActivitiesCount +
        atRiskActivitiesCount;

      setExportCounts({
        greenActivitiesReady,
        weeklyPlanTotal,
        outstandingActions,
        overdueActions,
        blockedActivities,
        completedActions,
        pmOverrideActions,
      });

      const cycleUnderway = [
        "Meeting Open",
        "Execution",
        "Close-Out Eligible",
        "Closed",
      ].includes(cycleStatus);

      setClosureChecklist({
        plannerReview: cycleUnderway,
        // The To-Do is a formal output of the cycle, produced whether or not
        // there are outstanding actions — an empty list still counts.
        todoGenerated: cycleUnderway,
        overdueAcknowledged: overdueActions === 0,
        blockedAcknowledged: blockedActivities === 0,
      });
    }
  }, [weeklyControlData, uploadedProgramme]);

  const handleExportWeeklyPlan = async () => {
    if (!uploadedProgramme) return;

    try {
      setIsExporting("weekly");
      const closableWeek = weeksStatus?.weeks.find((w) => w.canClose);
      const weekNumber =
        lockedViewWeek ??
        closableWeek?.weekNumber ??
        weeksStatus?.currentWeekNumber;
      const response = await exportAPI.generateWeeklyPlan(
        uploadedProgramme._id,
      );
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
      const closableWeek = weeksStatus?.weeks.find((w) => w.canClose);
      const weekNumber =
        lockedViewWeek ??
        closableWeek?.weekNumber ??
        weeksStatus?.currentWeekNumber;
      const response = await exportAPI.generatePlannerTodo(
        uploadedProgramme._id,
      );
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
        if (projectId) {
          localStorage.removeItem(`plansure_awaiting_upload_${projectId}`);
        }
        const programme = response.programme;
        setProgrammeAnchor(programme.lookaheadStartDate || null);
        // Carried through from the upload response, otherwise the Owner column
        // reads "Unknown" until the page is reloaded.
        setUploaderName(programme.uploadedBy?.name || "");
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

        setUploadedProgramme(programme);
        setUploadedFile(null);

        if (programme._id && isMeetingOpen) {
          try {
            await programmeAPI.updateCycleStatus(programme._id, "Meeting Open");
            setUploadedProgramme((prev) =>
              prev ? { ...prev, cycleStatus: "Meeting Open" } : prev,
            );
            setCycleStage("meetingOpen");
            setCurrentStep(2);
          } catch (e) {
            console.error(
              "Failed to advance cycle to Meeting Open after upload",
              e,
            );
          }
        }

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

        await fetchWeeklyControlData(programme._id, 1);
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

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const actionStats = {
    total: projectActions.length,
    open: projectActions.filter(
      (a) => a.status === "Open" && !isActionFromClosedWeek(a),
    ).length,
    inProgress: projectActions.filter(
      (a) => a.status === "In Progress" && !isActionFromClosedWeek(a),
    ).length,
    // PM Override is terminal: it counts as closed and can never be overdue,
    // so Total still reconciles with Open + In Progress + Closed + Overdue.
    closed: projectActions.filter(
      (a) => a.status === "Completed" || a.status === "PM Override",
    ).length,
    overdue: projectActions.filter(
      (a) =>
        a.dueDate &&
        new Date(a.dueDate) < startOfToday &&
        a.status !== "Completed" &&
        a.status !== "Cancelled" &&
        a.status !== "PM Override" &&
        !isActionFromClosedWeek(a),
    ).length,
  };

  const weeklyActionStats = {
    total:
      (weeklyControlData?.weeklyActionsByStatus?.open || 0) +
      (weeklyControlData?.weeklyActionsByStatus?.inProgress || 0) +
      (weeklyControlData?.weeklyActionsByStatus?.closed || 0),
    open: weeklyControlData?.weeklyActionsByStatus?.open || 0,
    inProgress: weeklyControlData?.weeklyActionsByStatus?.inProgress || 0,
    closed: weeklyControlData?.weeklyActionsByStatus?.closed || 0,
    overdue: weeklyControlData?.weeklyActionsByStatus?.overdue || 0,
    openRequired:
      (weeklyControlData?.requiredActionsByStatus?.open || 0) +
      (weeklyControlData?.requiredActionsByStatus?.inProgress || 0),
  };

  /* The activity's owner, looked up from the lookahead. Used read-only by the
     Assign and Edit dialogs; lists that carry no owner resolve through here. */
  const ownerNameForActivity = (activityId?: string) =>
    lookaheadData?.activities?.find((a) => a.activityId === activityId)
      ?.ownerName || uploaderName;

  const editingActionOwnerName = ownerNameForActivity(
    editingAction?.linkedActivity,
  );

  const handleStepClick = (_stepNumber: number) => {};

  if (isLoading) {
    return (
      <AdminLayout
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
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout
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
            onClick={() => navigate("/admin/projects")}
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
      </AdminLayout>
    );
  }

  const planner =
    project.team?.find((t) => t.role === "Planner")?.user?.name ||
    project.createdBy?.name ||
    defaultDashboardData.planner;

  const programmeEnded = (() => {
    const acts = lookaheadData?.activities || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let latestFinish: Date | null = null;
    for (const a of acts) {
      const f = parseDate(a.finishDate || "");
      if (f && (!latestFinish || f > latestFinish)) latestFinish = f;
    }
    return latestFinish !== null && latestFinish < today;
  })();

  return (
    <AdminLayout
      title="Project Workspace"
      subtitle="Manage weekly control cycle"
    >
      <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
        <ProjectHeader
          breadcrumb={{
            label: "Projects",
            onClick: () => navigate("/admin/projects"),
          }}
          projectName={project.name}
          phase={project.phase}
          week={`Week ${weekNum}`}
          weekDates={`${weekNum - 1} closed`}
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
              if (uploadedProgramme?._id) {
                switch (newValue) {
                  case 6:
                  case 0:
                  case 1:
                  case 2:
                    refetchProgramme();
                    break;
                  case 3:
                    refetchProgramme();
                    break;
                  case 4:
                    {
                      const closableWeek = weeksStatus?.weeks.find(
                        (w) => w.canClose,
                      );
                      const firstUnclosedWeek = weeksStatus?.weeks.find(
                        (w) => !w.isClosed,
                      );
                      const weekNum =
                        closableWeek?.weekNumber ||
                        firstUnclosedWeek?.weekNumber ||
                        1;
                      fetchWeeklyControlData(uploadedProgramme._id, weekNum);
                    }
                    break;
                  case 5:
                    refetchProgramme();
                    break;
                }
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
            <Tab label="Overview" value={0} />
            <Tab label="Open Meeting" value={6} />
            <Tab label="Programme Upload" value={1} />
            <Tab label="Activities & Lookahead" value={2} />
            <Tab label="Actions" value={3} />
            <Tab label="Weekly Control" value={4} />
            <Tab label="Closure & Export" value={5} />
          </Tabs>
        </Box>

        {activeTab === 0 &&
          (() => {
            const ovToday = new Date();
            ovToday.setHours(0, 0, 0, 0);
            const ovSixWeekEnd = new Date(ovToday);
            ovSixWeekEnd.setDate(ovToday.getDate() + 42);
            const ovActivities = (lookaheadData?.activities || []).filter(
              (a) => {
                const start = parseDate(a.startDate);
                if (!start) return false;
                return start >= ovToday && start < ovSixWeekEnd;
              },
            );
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
              </>
            );
          })()}

        {activeTab === 6 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                  : cycleStage === "execution"
                    ? "Execution in progress. Manage the cycle from the Weekly Control tab."
                    : cycleStage === "meetingOpen"
                      ? "Programme uploaded. Start execution to begin the weekly cycle."
                      : isMeetingOpen
                        ? "Planning meeting is open. Upload the programme to continue."
                        : "Open the planning meeting to begin. You can upload the programme once the meeting is open."}
              </Typography>
              {uploadedProgramme?.cycleStatus === "Closed" ||
              isWeekClosed ? null : (
                <Button
                  onClick={
                    cycleStage === "execution"
                      ? () => setActiveTab(4)
                      : cycleStage === "meetingOpen"
                        ? async () => {
                            await handleCycleAction();
                            setActiveTab(4);
                          }
                        : isMeetingOpen
                          ? () => setActiveTab(1)
                          : handleOpenMeeting
                  }
                  disabled={weeklyControlData?.isProjectEnded}
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
                  {cycleStage === "execution"
                    ? "Go to Weekly Control"
                    : cycleStage === "meetingOpen"
                      ? "Start Execution"
                      : isMeetingOpen
                        ? "Go to Programme Upload"
                        : "Open Meeting"}
                </Button>
              )}
            </Box>
          </Box>
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
                  {(() => {
                    const activities = lookaheadData?.activities || [];

                    const parseDateStr = (dateStr: string): Date | null => {
                      if (!dateStr) return null;
                      const date = new Date(dateStr);
                      return isNaN(date.getTime()) ? null : date;
                    };

                    const todayDate = new Date();
                    todayDate.setHours(0, 0, 0, 0);
                    const sixWeekEnd = new Date(todayDate);
                    sixWeekEnd.setDate(todayDate.getDate() + 42);

                    const activitiesIn6Weeks = activities.filter((a) => {
                      if (
                        a.activityStatus === "Blocked" ||
                        a.ragStatus === "Blocked" ||
                        a.ragStatus === "Red" ||
                        a.activityStatus === "Completed" ||
                        a.activityStatus === "Complete" ||
                        a.ragStatus === "Blue"
                      ) {
                        return true;
                      }
                      const activityStart = parseDateStr(a.startDate || "");
                      if (!activityStart) return false;
                      const activityFinish = parseDateStr(a.finishDate || "");
                      const activityEnd = activityFinish ?? activityStart;
                      return (
                        activityEnd >= todayDate && activityStart < sixWeekEnd
                      );
                    });

                    const readyCount = activitiesIn6Weeks.filter(
                      (a) => a.activityStatus === "Ready",
                    ).length;
                    const atRiskCount = activitiesIn6Weeks.filter(
                      (a) => a.activityStatus === "At Risk",
                    ).length;
                    const completeCount = activitiesIn6Weeks.filter(
                      (a) =>
                        a.activityStatus === "Complete" ||
                        a.activityStatus === "Completed" ||
                        a.ragStatus === "Blue",
                    ).length;
                    const blockedCount = activitiesIn6Weeks.filter(
                      (a) =>
                        a.activityStatus === "Blocked" ||
                        a.ragStatus === "Blocked" ||
                        a.ragStatus === "Red",
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
                              color: COLORS.textPrimary,
                              fontSize: "24px",
                              fontWeight: 700,
                            }}
                          >
                            {activities.length}
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "12px",
                            }}
                          >
                            Total Activities
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
                            Completed
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
                  <Tooltip
                    title={
                      programmeEnded
                        ? "Upload a new programme for this project"
                        : "Reupload is available once the last activity's finish date has passed"
                    }
                  >
                    <span>
                      <Button
                        disabled={!programmeEnded}
                        onClick={() => {
                          setUploadedProgramme(null);
                          setUploadedFile(null);
                          setUploadError("");
                        }}
                        sx={{
                          bgcolor: "transparent",
                          color: COLORS.textPrimary,
                          border: `1px solid ${COLORS.border}`,
                          textTransform: "none",
                          px: 3,
                          py: 1,
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: 500,
                          "&:hover": {
                            bgcolor: COLORS.bgTertiary,
                          },
                          "&.Mui-disabled": {
                            color: COLORS.textMuted,
                            borderColor: COLORS.border,
                            opacity: 0.5,
                          },
                        }}
                      >
                        Reupload Programme
                      </Button>
                    </span>
                  </Tooltip>
                  {/* <Button
                    onClick={() => {
                      if (uploadedProgramme?._id) {
                        window.open(
                          `${import.meta.env.VITE_API_URL}/programmes/${uploadedProgramme._id}/pdf`,
                          "_blank"
                        );
                      }
                    }}
                    sx={{
                      bgcolor: COLORS.bgTertiary,
                      color: COLORS.textPrimary,
                      border: `1px solid ${COLORS.border}`,
                      textTransform: "none",
                      px: 3,
                      py: 1,
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: COLORS.border,
                      },
                    }}
                  >
                    View PDF
                  </Button> */}
                  {/* {(uploadedProgramme?.cycleStatus === "Closed" ||
                    isWeekClosed) && (
                    <Button
                      onClick={() => {
                        setUploadedProgramme(null);
                        setUploadedFile(null);
                        setIsWeekClosed(false);
                        setCycleStage("draft");
                        setCurrentStep(1);
                      }}
                      sx={{
                        bgcolor: COLORS.green,
                        color: "#fff",
                        textTransform: "none",
                        px: 3,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 500,
                        "&:hover": {
                          bgcolor: "#16A34A",
                        },
                      }}
                    >
                      Start New Week
                    </Button>
                  )} */}
                </Box>

                {/* Week Closed Notice */}
                {(uploadedProgramme?.cycleStatus === "Closed" ||
                  isWeekClosed) && (
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      bgcolor: "rgba(107, 114, 128, 0.1)",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
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
                      sx={{ color: COLORS.textMuted, fontSize: "13px" }}
                    >
                      This week is closed. Click "Start New Week" to upload a
                      new programme for the next cycle.
                    </Typography>
                  </Box>
                )}
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
                  onClick={
                    isMeetingOpen ? handleBrowseClick : () => setActiveTab(6)
                  }
                  disabled={!isMeetingOpen}
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
                    ":disabled": {
                      bgcolor: COLORS.textMuted,
                      color: COLORS.bgSecondary,
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

            {/* Programme History Section */}
            {programmeHistory.length > 0 && (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 3,
                  mt: 3,
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "16px",
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  Programme History
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {programmeHistory.map((prog) => (
                    <Box
                      key={prog._id}
                      sx={{
                        bgcolor: COLORS.bgTertiary,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "8px",
                        p: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          {prog.name}
                        </Typography>
                        <Typography
                          sx={{
                            color: COLORS.textMuted,
                            fontSize: "12px",
                          }}
                        >
                          {prog.totalActivities || 0} activities • Closed on{" "}
                          {new Date(prog.createdAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </Typography>
                        {prog.overrideReason && (
                          <Typography
                            sx={{
                              color: COLORS.amber,
                              fontSize: "11px",
                              mt: 0.5,
                            }}
                          >
                            Override: {prog.overrideReason}
                          </Typography>
                        )}
                      </Box>
                      <Box
                        sx={{
                          bgcolor: "rgba(107, 114, 128, 0.2)",
                          color: COLORS.textMuted,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Box
                          component="img"
                          src={lockIcon}
                          sx={{ width: 12, height: 12, opacity: 0.6 }}
                        />
                        Closed
                      </Box>
                    </Box>
                  ))}
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
              {/* All Weeks Button */}
              <Box
                onClick={() => {
                  setWeekFilter(null);
                  setActivitiesPage(1);
                }}
                sx={{
                  minWidth: 70,
                  height: 58,
                  border: `2px solid ${weekFilter === null ? COLORS.blue : COLORS.border}`,
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor:
                    weekFilter === null ? COLORS.blueBgMedium : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: COLORS.blue,
                    bgcolor: COLORS.blueBgLight,
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    color:
                      weekFilter === null ? COLORS.blue : COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  All
                </Box>
              </Box>
              {[
                {
                  week: "Weeks 1-2",
                  label: "Committed",
                  color: COLORS.green,
                  weekNum: 1,
                },
                {
                  week: "Weeks 3-4",
                  label: "Readiness",
                  color: COLORS.amber,
                  weekNum: 3,
                },
                {
                  week: "Weeks 5-6",
                  label: "Strategic",
                  color: COLORS.red,
                  weekNum: 5,
                },
              ].map((item, index) => (
                <Box
                  key={index}
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
                    transition: "all 0.2s ease",
                    bgcolor:
                      weekFilter === item.weekNum
                        ? `${item.color}30`
                        : item.label !== "Committed"
                          ? `${item.color}10`
                          : "transparent",
                    boxShadow:
                      weekFilter === item.weekNum
                        ? `0 0 0 2px ${item.color}`
                        : "none",
                    "&:hover": {
                      bgcolor: `${item.color}20`,
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      color: item.color,
                      fontSize: "12px",
                      fontWeight: weekFilter === item.weekNum ? 700 : 500,
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
                { label: "Completed", value: "Completed" },
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

            {(() => {
              const allActivities = lookaheadData?.activities || [];

              const today = programmeAnchor
                ? new Date(programmeAnchor)
                : project?.startDate
                  ? new Date(project.startDate)
                  : new Date();
              today.setHours(0, 0, 0, 0);
              const sixWeekEnd = new Date(today);
              sixWeekEnd.setDate(today.getDate() + 42);

              const getActivityWeek = (startDate: string): number | null => {
                const activityStart = parseDate(startDate);
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

                  const startForAnchor = parseDate(activity.startDate);
                  if (startForAnchor && startForAnchor < today) return false;

                  if (weekFilter === null) return true;

                  const activityStart = parseDate(activity.startDate);
                  if (!activityStart) return true;
                  if (activityStart < today || activityStart >= sixWeekEnd)
                    return false;
                  const activityWeek = getActivityWeek(activity.startDate);
                  return (
                    activityWeek !== null &&
                    (activityWeek === weekFilter ||
                      activityWeek === weekFilter + 1)
                  );
                })
                .sort((a, b) => {
                  const getZone = (activity: typeof a) => {
                    const start = parseDate(activity.startDate);
                    const todayDate = programmeAnchor
                      ? new Date(programmeAnchor)
                      : project?.startDate
                        ? new Date(project.startDate)
                        : new Date();
                    todayDate.setHours(0, 0, 0, 0);
                    if (
                      activity.activityStatus === "Complete" ||
                      activity.activityStatus === "Completed" ||
                      activity.startDate?.includes(" A") ||
                      activity.finishDate?.includes(" A")
                    ) {
                      return "Completed";
                    }
                    if (activity.activityStatus === "Blocked") return "Overdue";
                    if (!start) return "Unknown";
                    const msPerDay = 1000 * 60 * 60 * 24;
                    const daysFromToday = Math.floor(
                      (start.getTime() - todayDate.getTime()) / msPerDay,
                    );
                    const weekNum = Math.floor(daysFromToday / 7) + 1;
                    if (weekNum <= 2) return "Weeks 1-2";
                    if (weekNum <= 4) return "Weeks 3-4";
                    if (weekNum <= 6) return "Weeks 5-6";
                    if (weekNum <= 0) return "Overdue";
                    return "Beyond";
                  };
                  return (
                    getRAGZonePriority(getZone(a)) -
                    getRAGZonePriority(getZone(b))
                  );
                });

              const startOfToday = new Date();
              startOfToday.setHours(0, 0, 0, 0);
              const zoneAnchor = programmeAnchor
                ? new Date(programmeAnchor)
                : project?.startDate
                  ? new Date(project.startDate)
                  : new Date(startOfToday);
              zoneAnchor.setHours(0, 0, 0, 0);

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
                if (activityStatus === "Blocked") {
                  return { zone: "Overdue", color: "red" };
                }
                if (!startDate) return { zone: "N/A", color: "muted" };
                const start = parseDate(startDate);
                if (!start) return { zone: "N/A", color: "muted" };
                const msPerDay = 1000 * 60 * 60 * 24;
                const daysFromToday = Math.floor(
                  (start.getTime() - zoneAnchor.getTime()) / msPerDay,
                );
                const weekNum = Math.floor(daysFromToday / 7) + 1;
                if (weekNum <= 2) return { zone: "Weeks 1-2", color: "green" };
                if (weekNum <= 4) return { zone: "Weeks 3-4", color: "amber" };
                if (weekNum <= 6) return { zone: "Weeks 5-6", color: "red" };
                if (weekNum <= 0) return { zone: "Overdue", color: "red" };
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
                    return "amber";
                  case "Action Overdue":
                    return "red";
                  case "Unassigned":
                  case "Not Ready":
                    return "grey";
                  default:
                    return "grey";
                }
              };

              const ownerName = uploaderName || "Unknown";
              const ownerInitials = ownerName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              const withinLookahead = filtered.filter(
                (activity) =>
                  !ragZoneFor(
                    activity.startDate,
                    activity.finishDate,
                    activity.activityStatus,
                  ).beyond,
              );

              const mapped: Activity[] = withinLookahead.map((activity) => {
                const rag = ragZoneFor(
                  activity.startDate,
                  activity.finishDate,
                  activity.activityStatus,
                );
                const linked = getActionsForActivity(activity.activityId);
                const displayStatus =
                  activity.activityStatus === "Complete"
                    ? "Completed"
                    : activity.activityStatus || "Unassigned";
                const openLinked = linked.filter(
                  (a) => a.status !== "Completed" && a.status !== "Cancelled",
                );
                const isPMOverrideComplete =
                  openLinked.length > 0 &&
                  openLinked.every((a) => isActionFromClosedWeek(a));
                const effectiveStatus = isPMOverrideComplete
                  ? "Completed"
                  : displayStatus;
                return {
                  id: activity.activityId,
                  name: activity.activityName,
                  startDate: activity.startDate,
                  endDate: activity.finishDate,
                  duration: activity.duration || "",
                  ragZone: rag.zone,
                  ragColor: rag.color,
                  actions: linked.length,
                  status: effectiveStatus,
                  statusType: statusTypeFor(effectiveStatus),
                  isPMOverrideComplete,
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
                    isFromClosedWeek: isActionFromClosedWeek(a),
                  })),
                };
              });

              const totalPages = Math.ceil(mapped.length / activitiesPerPage);
              const startIndex = (activitiesPage - 1) * activitiesPerPage;
              const pageItems = mapped.slice(
                startIndex,
                startIndex + activitiesPerPage,
              );

              return (
                <Box sx={{ mb: 3 }}>
                  <ActivitiesTable
                    activities={pageItems}
                    onAssignClick={(a) =>
                      openAssignChoice({
                        id: a.id,
                        name: a.name,
                        startDate: a.startDate,
                        endDate: a.endDate,
                        ownerName: a.owner?.name,
                      })
                    }
                    onAddActionClick={(a) => {
                      const startDateFormatted = toDateInputFormat(a.startDate);
                      setAssigningActivity({
                        activityId: a.id,
                        activityName: a.name,
                        startDate: startDateFormatted,
                        finishDate: toDateInputFormat(a.endDate),
                        ownerName: a.owner?.name,
                      });
                      setAssignFormData({
                        title: "",
                        description: "",
                        type: "Required",
                        priority: "Medium",
                        assignee: "",
                        dueDate: new Date().toLocaleDateString("en-CA"),
                        status: "Open",
                      });
                      setAssignModalOpen(true);
                    }}
                    onActionClick={(action) => setActionDetailId(action._id)}
                    onReassignClick={(a) => {
                      const action = projectActions.find(
                        (ac) => ac._id === a._id,
                      );
                      handleOpenReassign({
                        _id: a._id,
                        title: a.title,
                        assignee: action?.assignee,
                      });
                    }}
                    currentPage={activitiesPage}
                    totalPages={totalPages}
                    totalActivities={mapped.length}
                    onPageChange={setActivitiesPage}
                    activitiesPerPage={activitiesPerPage}
                    isProjectEnded={weeklyControlData?.isProjectEnded}
                  />
                </Box>
              );
            })()}

            {(() => {
              const allActivities = lookaheadData?.activities || [];

              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const sixWeekEnd = new Date(today);
              sixWeekEnd.setDate(today.getDate() + 42);

              const getActivityWeekForSummary = (
                startDate: string,
              ): number | null => {
                const activityStart = parseDate(startDate);
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

              const activities = allActivities.filter((activity) => {
                const matchesStatus =
                  ragFilter === "all" || activity.activityStatus === ragFilter;
                if (!matchesStatus) return false;

                const activityStart = parseDate(activity.startDate);
                if (!activityStart) return true;

                if (activityStart < today || activityStart >= sixWeekEnd)
                  return false;

                if (weekFilter !== null) {
                  const activityWeek = getActivityWeekForSummary(
                    activity.startDate,
                  );
                  if (activityWeek === null) return false;
                  return (
                    activityWeek === weekFilter ||
                    activityWeek === weekFilter + 1
                  );
                }

                return true;
              });

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
                  case "Completed":
                    completeCount++;
                    break;
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
                    gridTemplateColumns: showCompletionReason
                      ? "80px minmax(180px, 1fr) 120px 85px 140px 100px 85px 95px 180px 70px"
                      : "80px minmax(180px, 1fr) 120px 85px 140px 100px 85px 95px 70px",
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${COLORS.border}`,
                    minWidth: showCompletionReason ? 1230 : 1070,
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
                    ...(showCompletionReason ? ["COMPLETION REASON"] : []),
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
                          gridTemplateColumns: showCompletionReason
                            ? "80px minmax(180px, 1fr) 120px 85px 140px 100px 85px 95px 180px 70px"
                            : "80px minmax(180px, 1fr) 120px 85px 140px 100px 85px 95px 70px",
                          gap: 1.5,
                          px: 2,
                          py: 2,
                          borderBottom:
                            index < projectActions.length - 1
                              ? `1px solid ${COLORS.border}`
                              : "none",
                          alignItems: "center",
                          minWidth: showCompletionReason ? 1230 : 1070,
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
                            // PM Override is terminal, so it can never be overdue.
                            const isOverdue =
                              action.status !== "Completed" &&
                              action.status !== "Cancelled" &&
                              action.status !== "PM Override" &&
                              !isFromClosedWeek &&
                              action.dueDate &&
                              new Date(action.dueDate) <
                                new Date(new Date().setHours(0, 0, 0, 0));

                            let displayStatus = action.status;
                            let bgColor = `${COLORS.blue}25`;
                            let textColor = COLORS.blue;

                            if (action.status === "PM Override") {
                              bgColor = `${COLORS.amber}25`;
                              textColor = COLORS.amber;
                            } else if (
                              isFromClosedWeek &&
                              action.status !== "Completed" &&
                              action.type !== "Optional"
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
                        {showCompletionReason && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              sx={{
                                color: action.completionNote
                                  ? COLORS.textSecondary
                                  : COLORS.textMuted,
                                fontSize: "13px",
                                textAlign: "center",
                                maxWidth: "100%",
                                // Wraps onto as many lines as the note needs
                                // rather than truncating it out of sight.
                                whiteSpace: "normal",
                                overflowWrap: "anywhere",
                                lineHeight: 1.4,
                              }}
                            >
                              {action.completionNote || "-"}
                            </Typography>
                          </Box>
                        )}
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
                                  createdAt: action.createdAt,
                                  updatedAt: action.updatedAt,
                                  overrideReason: action.overrideReason,
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
                              const canComplete =
                                user?.role === "admin" || isAssignee;

                              if (
                                action.status !== "Completed" &&
                                canComplete
                              ) {
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
                                      ) !== String(user?.id || "") &&
                                      user?.role !== "admin"
                                    ? "Only the assignee can complete this action"
                                    : "Mark as complete"
                            }
                            sx={{
                              width: 16,
                              height: 16,
                              cursor:
                                action.status === "Completed" ||
                                isActionFromClosedWeek(action) ||
                                (String(
                                  (
                                    action.assignee as unknown as {
                                      _id?: string;
                                    }
                                  )?._id || "",
                                ) !== String(user?.id || "") &&
                                  user?.role !== "admin")
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                action.status === "Completed"
                                  ? 1
                                  : isActionFromClosedWeek(action) ||
                                      (String(
                                        (
                                          action.assignee as unknown as {
                                            _id?: string;
                                          }
                                        )?._id || "",
                                      ) !== String(user?.id || "") &&
                                        user?.role !== "admin")
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
                                  (String(
                                    (
                                      action.assignee as unknown as {
                                        _id?: string;
                                      }
                                    )?._id || "",
                                  ) !== String(user?.id || "") &&
                                    user?.role !== "admin")
                                    ? action.status === "Completed"
                                      ? 1
                                      : 0.3
                                    : 1,
                                filter:
                                  action.status !== "Completed" &&
                                  (String(
                                    (
                                      action.assignee as unknown as {
                                        _id?: string;
                                      }
                                    )?._id || "",
                                  ) === String(user?.id || "") ||
                                    user?.role === "admin")
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
                      {/* Follows the header's week counter so it advances when
                          a week completes. A locked historical view keeps its
                          own real week number. */}
                      Week {lockedViewWeek ?? weekNum} Data
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                    >
                      {weeklyControlData.weekInfo.dateRange ||
                        getWeekDateRangeFromToday()}{" "}
                      • {weeklyControlData.weekInfo.totalActivities} activities
                      this week
                    </Typography>
                  </Box>
                </Box>
                {/* Progress indicator - kept for future use
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
                */}
              </Box>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(4, 1fr)",
                  lg: "repeat(8, 1fr)",
                },
                gap: { xs: 1, sm: 1.5 },
                mb: 3,
              }}
            >
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: { xs: "8px", sm: "12px" },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: { xs: "10px", sm: "12px" },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Cycle Status
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: { xs: "12px", sm: "16px" },
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
                  borderRadius: { xs: "8px", sm: "12px" },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: { xs: "10px", sm: "12px" },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  In Lookahead
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.blue,
                    fontSize: { xs: "16px", sm: "20px" },
                    fontWeight: 700,
                  }}
                >
                  {weeklyControlData?.stats.inLookahead || 0}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: { xs: "8px", sm: "12px" },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: { xs: "10px", sm: "12px" },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Ready
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.green,
                    fontSize: { xs: "16px", sm: "20px" },
                    fontWeight: 700,
                  }}
                >
                  {weeklyControlData?.stats.ready || 0}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: { xs: "8px", sm: "12px" },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: { xs: "10px", sm: "12px" },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Completed
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.blue,
                    fontSize: { xs: "16px", sm: "20px" },
                    fontWeight: 700,
                  }}
                >
                  {weeklyControlData?.stats.complete || 0}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: { xs: "8px", sm: "12px" },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: { xs: "10px", sm: "12px" },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Blocked
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.red,
                    fontSize: { xs: "16px", sm: "20px" },
                    fontWeight: 700,
                  }}
                >
                  {weeklyControlData?.stats.blocked || 0}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: { xs: "8px", sm: "12px" },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: { xs: "10px", sm: "12px" },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Open Actions
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.blue,
                    fontSize: { xs: "16px", sm: "20px" },
                    fontWeight: 700,
                  }}
                >
                  {weeklyControlData?.stats.openActions || 0}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: { xs: "8px", sm: "12px" },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: { xs: "10px", sm: "12px" },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Overdue
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.red,
                    fontSize: { xs: "16px", sm: "20px" },
                    fontWeight: 700,
                  }}
                >
                  {weeklyControlData?.stats.overdue || 0}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: { xs: "8px", sm: "12px" },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: { xs: "10px", sm: "12px" },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Ready to Close
                </Typography>
                <Typography
                  sx={{
                    color:
                      weeklyControlData?.stats.readyToClose === "Yes"
                        ? COLORS.green
                        : COLORS.red,
                    fontSize: { xs: "16px", sm: "20px" },
                    fontWeight: 700,
                  }}
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
                        grey: 0,
                      };
                      const data = [
                        {
                          value: ragData.green,
                          color: "#22C55E",
                          tooltip:
                            "Ready - Activities that are ready to proceed",
                        },
                        {
                          value: ragData.amber,
                          color: "#F59E0B",
                          tooltip:
                            "At Risk - Activities that are at risk or overdue",
                        },
                        {
                          value: ragData.red,
                          color: "#EF4444",
                          tooltip: "Blocked - Activities that are blocked",
                        },
                      ].filter((d) => d.value > 0);
                      if (data.length === 0 && (ragData.grey ?? 0) > 0) {
                        data.push({
                          value: ragData.grey ?? 0,
                          color: "#6B7280",
                          tooltip:
                            "Unassigned - Activities awaiting triage (no action assigned yet)",
                        });
                      }
                      const total = data.reduce((sum, d) => sum + d.value, 0);
                      if (total === 0) return null;
                      const strokeWidth = 28;
                      const radius = (180 - strokeWidth) / 2;
                      const center = 90;
                      let currentAngle = -90;

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
                    grey: 0,
                  };
                  const grey = ragData.grey ?? 0;
                  const total = ragData.green + ragData.amber + ragData.red;
                  if (total + grey === 0) return null;
                  const greenPct =
                    total > 0 ? Math.round((ragData.green / total) * 100) : 0;
                  const amberPct =
                    total > 0 ? Math.round((ragData.amber / total) * 100) : 0;
                  const redPct =
                    total > 0 ? Math.round((ragData.red / total) * 100) : 0;
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
                        title="Ready - Activities that are ready to proceed"
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
                        title="At Risk - Activities that are at risk or overdue"
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
                        title="Blocked - Activities that are blocked"
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
                  const yAxisMax = Math.max(Math.ceil(maxValue * 1.2), 4);
                  const stepCount = Math.min(yAxisMax, 5);
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
                    startDate: a.startDate,
                    finishDate: a.finishDate,
                  })) || []
                }
                weeklyPlanPreview={weeklyControlData?.weeklyPlanPreview || []}
                plannerToDo={weeklyControlData?.plannerToDo || []}
                onAssignClick={(activity) =>
                  openAssignChoice({
                    id: activity.activityId,
                    name: activity.activityName,
                    startDate: activity.startDate || "",
                    endDate: activity.finishDate || "",
                    ownerName: ownerNameForActivity(activity.activityId),
                  })
                }
                onUnblockClick={async (activityId) => {
                  const progId =
                    weeklyControlData?.programmeId || uploadedProgramme?._id;
                  if (!progId) {
                    console.error("No programme ID available");
                    return;
                  }
                  try {
                    await programmeAPI.updateActivity(progId, activityId, {
                      overdueAcknowledged: true,
                    });
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
                onActionIdClick={() => setActiveTab(3)}
                onReassignClick={(action) => {
                  const assigneeUser = users.find(
                    (u) => u._id === action.currentAssignee,
                  );
                  setReassigningAction({
                    _id: action._id || "",
                    title: action.title,
                    currentAssignee: action.currentAssignee,
                    currentAssigneeName: assigneeUser?.name || "Unknown",
                  });
                  setReassignAssignee("");
                  setReassignError("");
                  setReassignModalOpen(true);
                }}
                isProjectEnded={weeklyControlData?.isProjectEnded}
                cycleStatus={weeklyControlData?.stats?.cycleStatus}
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
                    Project locked.
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
                        Close-Out Eligible
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
                  {(weeklyControlData?.unassignedInWeek || 0) > 0 ? (
                    /* Weekly closure condition #1: every activity must be
                       assigned before the week can be closed. */
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
                            d="M10 6V10.5"
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <circle cx="10" cy="13.5" r="0.75" fill="#F59E0B" />
                        </svg>
                        <Typography
                          sx={{
                            color: COLORS.amber,
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {weeklyControlData?.unassignedInWeek} activit
                          {weeklyControlData?.unassignedInWeek === 1
                            ? "y"
                            : "ies"}{" "}
                          in this week{" "}
                          {weeklyControlData?.unassignedInWeek === 1
                            ? "is"
                            : "are"}{" "}
                          still unassigned. Assign every activity before
                          closing.
                        </Typography>
                      </Box>
                      <Button
                        onClick={() => setActiveTab(2)}
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
                        Go to Activities
                      </Button>
                    </>
                  ) : weeklyActionStats.openRequired === 0 ? (
                    /* Ready for close-out - all Required actions completed */
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

                      {/* Stage 3 -> Stage 4 is an explicit PM decision taken in
                          Closure & Export; this just points there. */}
                      {!weeklyControlData?.isProjectEnded && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            mb: 2,
                            borderRadius: "8px",
                            border: `1px solid ${COLORS.borderDark}`,
                            bgcolor: COLORS.bgPrimary,
                          }}
                        >
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "12px",
                            }}
                          >
                            Mark the week Close-Out Eligible in{" "}
                            <Box
                              component="span"
                              onClick={() => setActiveTab(5)}
                              sx={{
                                color: COLORS.blue,
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              Closure &amp; Export
                            </Box>{" "}
                            to enable closing.
                          </Typography>
                        </Box>
                      )}

                      <Button
                        onClick={() => {
                          if (weekPendingClose)
                            handleCloseSpecificWeek(weekPendingClose);
                        }}
                        disabled={
                          closingWeek !== null ||
                          !weekPendingClose ||
                          uploadedProgramme?.cycleStatus !==
                            "Close-Out Eligible" ||
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
                      {!weeksStatus?.weeks.find((w) => w.canClose) &&
                        !weeklyControlData?.isProjectEnded &&
                        (() => {
                          const displayedWeekNumber =
                            weeklyControlData?.weekInfo?.weekNumber;
                          const currentWeek =
                            weeksStatus?.weeks.find(
                              (w) =>
                                w.weekNumber === displayedWeekNumber &&
                                !w.isClosed &&
                                w.canCloseReason,
                            ) ||
                            weeksStatus?.weeks.find(
                              (w) => !w.isClosed && w.canCloseReason,
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
                          {weeklyActionStats.openRequired} open required
                          action(s) need to be completed before closing.
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
                        {(() => {
                          const currentUnclosed = weeksStatus?.weeks?.find(
                            (w) => !w.isClosed,
                          );
                          const canCloseByDate = true;
                          const disabledReason =
                            currentUnclosed?.canCloseReason ||
                            "This 2-week period has not ended yet";
                          return (
                            <Tooltip
                              title={!canCloseByDate ? disabledReason : ""}
                              placement="top"
                              arrow
                            >
                              <span>
                                <Button
                                  onClick={() => setOverrideModalOpen(true)}
                                  disabled={!canCloseByDate}
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
                                    "&.Mui-disabled": {
                                      color: COLORS.textMuted,
                                      borderColor: COLORS.border,
                                    },
                                  }}
                                >
                                  PM Override
                                </Button>
                              </span>
                            </Tooltip>
                          );
                        })()}
                      </Box>
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

                {/* Stage 3 -> Stage 4. An explicit governance decision by the
                    PM, no longer a side effect of the Weekly Plan download. */}
                <Box
                  sx={{
                    bgcolor: COLORS.bgSecondary,
                    border: `1px solid ${
                      uploadedProgramme?.cycleStatus === "Close-Out Eligible"
                        ? COLORS.blue
                        : COLORS.border
                    }`,
                    borderRadius: "12px",
                    p: 3,
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "16px",
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    Close-Out
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "13px",
                      mb: 2,
                    }}
                  >
                    {uploadedProgramme?.cycleStatus === "Close-Out Eligible"
                      ? "This week is Close-Out Eligible. It can now be closed and locked from Weekly Control."
                      : weeklyActionStats.openRequired > 0
                        ? `${weeklyActionStats.openRequired} required action(s) still open. Complete them to mark this week Close-Out Eligible.`
                        : "Mark the week Close-Out Eligible to enable closing."}
                  </Typography>

                  {uploadedProgramme?.cycleStatus === "Close-Out Eligible" ? (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        bgcolor: "rgba(59, 130, 246, 0.1)",
                        border: `1px solid ${COLORS.blue}`,
                        borderRadius: "8px",
                        px: 2,
                        py: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.blue,
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        ✓ Close-Out Eligible
                      </Typography>
                    </Box>
                  ) : (
                    <Button
                      onClick={handleMarkCloseOutEligible}
                      disabled={
                        markingCloseOut ||
                        weeklyActionStats.openRequired > 0 ||
                        weeklyControlData?.isProjectEnded
                      }
                      startIcon={
                        markingCloseOut ? (
                          <CircularProgress
                            size={14}
                            sx={{ color: "inherit" }}
                          />
                        ) : null
                      }
                      sx={{
                        bgcolor: COLORS.blue,
                        color: "#fff",
                        textTransform: "none",
                        px: 3,
                        py: 1.25,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": { bgcolor: COLORS.blueHover },
                        "&.Mui-disabled": {
                          bgcolor: COLORS.disabledBlue,
                          color: "#fff",
                        },
                      }}
                    >
                      {markingCloseOut
                        ? "Marking..."
                        : "Mark Close-Out Eligible"}
                    </Button>
                  )}
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
                            : weeklyActionStats.openRequired > 0
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(34, 197, 94, 0.15)",
                          color: exportGatingStatus.isGated
                            ? COLORS.red
                            : weeklyActionStats.openRequired > 0
                              ? COLORS.amber
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
                        {exportGatingStatus.isGated
                          ? "Gated"
                          : weeklyActionStats.openRequired > 0
                            ? "Pending"
                            : "Ready"}
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
                      {exportCounts.weeklyPlanTotal === 1 ? "item" : "items"} to
                      export
                    </Typography>
                    <Tooltip
                      title={
                        exportGatingStatus.isGated
                          ? `Exports are gated. The WeekCycle must be in Execution state. Current cycle is in ${exportGatingStatus.cycleStatus}.`
                          : weeklyActionStats.openRequired > 0
                            ? `${weeklyActionStats.openRequired} required action(s) pending. Complete all required actions to download Weekly Plan.`
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
                            exportGatingStatus.isGated ||
                            weeklyActionStats.openRequired > 0
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
                            bgcolor:
                              exportGatingStatus.isGated ||
                              weeklyActionStats.openRequired > 0
                                ? COLORS.disabledBlue
                                : COLORS.green,
                            color: "#fff",
                            textTransform: "none",
                            py: 1.25,
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 500,
                            "&:hover": {
                              bgcolor:
                                exportGatingStatus.isGated ||
                                weeklyActionStats.openRequired > 0
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
                            isExporting === "todo" || exportGatingStatus.isGated
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
                        mb: weeklyActionStats.openRequired > 0 ? 2 : 0,
                      }}
                    >
                      The WeekCycle must be in execution state. Current cycle is
                      in {exportGatingStatus.cycleStatus}. Close all required
                      actions for green activities to unlock exports.
                    </Typography>

                    {/* Show PM Override option if there are open required actions */}
                    {weeklyActionStats.openRequired > 0 &&
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
                              {weeklyActionStats.openRequired} open required
                              action(s) need to be completed before closing.
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
                            {(() => {
                              const currentUnclosed = weeksStatus?.weeks?.find(
                                (w) => !w.isClosed,
                              );
                              const canCloseByDate = true;
                              const disabledReason =
                                currentUnclosed?.canCloseReason ||
                                "This 2-week period has not ended yet";
                              return (
                                <Tooltip
                                  title={!canCloseByDate ? disabledReason : ""}
                                  placement="top"
                                  arrow
                                >
                                  <span>
                                    <Button
                                      onClick={() => setOverrideModalOpen(true)}
                                      disabled={!canCloseByDate}
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
                                        "&.Mui-disabled": {
                                          color: COLORS.textMuted,
                                          borderColor: COLORS.border,
                                        },
                                      }}
                                    >
                                      PM Override
                                    </Button>
                                  </span>
                                </Tooltip>
                              );
                            })()}
                          </Box>
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
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: COLORS.bgPrimary,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "8px",
                          mt: 0.5,
                          maxHeight: 260,
                          "& .MuiMenuItem-root": {
                            color: COLORS.textPrimary,
                            fontSize: "14px",
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
                    <MenuItem value="PM Override">PM Override</MenuItem>
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
                    Owner
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
                        color: editingActionOwnerName
                          ? COLORS.textPrimary
                          : COLORS.textMuted,
                        fontSize: "14px",
                      }}
                    >
                      {editingActionOwnerName || "Unassigned"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Evidence / correspondence. Only meaningful for a PM Override,
                  so it stays disabled until that status is selected. */}
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
                  Evidence / Correspondence
                  {editingAction?.status === "PM Override" && (
                    <span style={{ color: COLORS.red }}> *</span>
                  )}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  disabled={editingAction?.status !== "PM Override"}
                  value={editingAction?.overrideReason || ""}
                  onChange={(e) =>
                    handleEditChange("overrideReason", e.target.value)
                  }
                  placeholder={
                    editingAction?.status === "PM Override"
                      ? "Why is this action being force-closed? (min 10 characters)"
                      : "Available when status is set to PM Override"
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& fieldset": { borderColor: COLORS.border },
                      "&:hover fieldset": { borderColor: COLORS.border },
                      "&.Mui-focused fieldset": {
                        borderColor: COLORS.amber,
                        borderWidth: 1,
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: COLORS.textPrimary,
                      fontSize: "13px",
                      "&::placeholder": {
                        color: COLORS.textMuted,
                        opacity: 1,
                      },
                    },
                    "& .Mui-disabled": {
                      WebkitTextFillColor: `${COLORS.textMuted} !important`,
                    },
                  }}
                />
              </Box>
              {/* Update history — when the action was raised, and when it was
                  last changed. "Last updated" is hidden until it differs from
                  creation, so an untouched action does not show the same
                  timestamp twice. */}
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
                  Update History
                </Typography>
                <Box
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    border: `1px solid ${COLORS.border}`,
                    px: 1.5,
                    py: 1.2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Typography
                      sx={{
                        color: COLORS.textMuted,
                        fontSize: "13px",
                        minWidth: 92,
                      }}
                    >
                      Created
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textPrimary, fontSize: "13px" }}
                    >
                      {formatAuditStamp(editingAction?.createdAt) || "-"}
                    </Typography>
                  </Box>
                  {editingAction?.updatedAt &&
                    editingAction.updatedAt !== editingAction.createdAt && (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Typography
                          sx={{
                            color: COLORS.textMuted,
                            fontSize: "13px",
                            minWidth: 92,
                          }}
                        >
                          Last updated
                        </Typography>
                        <Typography
                          sx={{ color: COLORS.textPrimary, fontSize: "13px" }}
                        >
                          {formatAuditStamp(editingAction.updatedAt)}
                        </Typography>
                      </Box>
                    )}
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

        {/* Week Closed -> Move to Next Week (persistent acknowledgement) */}
        <Dialog
          open={closedWeekAck !== null}
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
          <DialogContent sx={{ p: 4, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <Typography sx={{ color: COLORS.green, fontSize: "28px" }}>
                ✓
              </Typography>
            </Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "18px",
                fontWeight: 600,
                mb: 1,
              }}
            >
              Week {closedWeekAck} Closed
            </Typography>
            {(() => {
              const isLast =
                closedWeekAck !== null &&
                weeksStatus?.totalWeeks != null &&
                closedWeekAck >= weeksStatus.totalWeeks;
              return (
                <>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "14px",
                      mb: 3,
                    }}
                  >
                    Week {closedWeekAck} is closed and locked.{" "}
                    {isLast
                      ? "The programme is now fully closed."
                      : "Move to the next week to continue."}
                  </Typography>
                  <Button
                    onClick={handleAckClosedWeek}
                    fullWidth
                    sx={{
                      bgcolor: COLORS.blue,
                      color: "#fff",
                      textTransform: "none",
                      py: 1.25,
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 500,
                      "&:hover": { bgcolor: COLORS.blueHover },
                    }}
                  >
                    {isLast
                      ? "Done"
                      : `Move to Week ${(closedWeekAck ?? 0) + 1}`}
                  </Button>
                </>
              );
            })()}
          </DialogContent>
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
            <Box>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                Reason{" "}
                <Box component="span" sx={{ color: COLORS.textMuted }}>
                  (optional)
                </Box>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="How was this resolved?"
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
                  "& .MuiInputBase-input": {
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    "&::placeholder": {
                      color: COLORS.textMuted,
                      opacity: 1,
                    },
                  },
                }}
              />
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

        {/* Assign Choice Modal (No Action / Action Required) */}
        <Dialog
          open={assignChoiceOpen}
          onClose={handleAssignChoiceClose}
          maxWidth="xs"
          fullWidth
          slotProps={{
            backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.8)" } },
            paper: {
              sx: {
                bgcolor: COLORS.bgPrimary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
              },
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "18px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Assign Activity
            </Typography>
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "13px", mb: 2.5 }}
            >
              {assignChoiceActivity?.activityName || "this activity"}
            </Typography>

            {assignError && (
              <Typography sx={{ color: COLORS.red, fontSize: "13px", mb: 1.5 }}>
                {assignError}
              </Typography>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Button
                onClick={handleChooseNoAction}
                disabled={noActionLoading}
                sx={{
                  textTransform: "none",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  p: 2,
                  borderRadius: "8px",
                  border: `1px solid ${COLORS.green}55`,
                  bgcolor: `${COLORS.green}10`,
                  color: COLORS.textPrimary,
                  "&:hover": { bgcolor: `${COLORS.green}20` },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: COLORS.green,
                    }}
                  >
                    {noActionLoading ? "Saving..." : "No Action"}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "12px", color: COLORS.textSecondary }}
                  >
                    Mark as Ready (Green). No action needed for this activity.
                  </Typography>
                </Box>
              </Button>

              <Button
                onClick={handleChooseActionRequired}
                disabled={noActionLoading}
                sx={{
                  textTransform: "none",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  p: 2,
                  borderRadius: "8px",
                  border: `1px solid ${COLORS.amber}55`,
                  bgcolor: `${COLORS.amber}10`,
                  color: COLORS.textPrimary,
                  "&:hover": { bgcolor: `${COLORS.amber}20` },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: COLORS.amber,
                    }}
                  >
                    Action Required
                  </Typography>
                  <Typography
                    sx={{ fontSize: "12px", color: COLORS.textSecondary }}
                  >
                    Assign an action. Activity becomes At Risk (Amber).
                  </Typography>
                </Box>
              </Button>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
              <Button
                onClick={handleAssignChoiceClose}
                disabled={noActionLoading}
                sx={{
                  textTransform: "none",
                  color: COLORS.textSecondary,
                  fontSize: "13px",
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Dialog>

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
                  onChange={(e) => handleAssignChange("title", e.target.value)}
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

              {/* Description — already sent to the API, but had no input, so
                  every action was saved with an empty description. */}
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
                  placeholder="What needs doing, and why..."
                  value={assignFormData.description}
                  onChange={(e) =>
                    handleAssignChange("description", e.target.value)
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
                    "& .MuiInputBase-input": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
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
                    Type
                  </Typography>
                  <Select
                    fullWidth
                    value={assignFormData.type}
                    onChange={(e) => handleAssignChange("type", e.target.value)}
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
                      {users.length === 0
                        ? "No users available"
                        : "Select assignee..."}
                    </MenuItem>
                    {users.map((u) => (
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
              {/* Status | Owner row. Owner is the activity's accountable
                  person and is saved onto the activity, not the action. */}
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
                    value={assignFormData.status}
                    onChange={(e) =>
                      handleAssignChange("status", e.target.value)
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
                      "& .MuiSvgIcon-root": { color: COLORS.textMuted },
                    }}
                    MenuProps={{
                      slotProps: {
                        paper: {
                          sx: {
                            bgcolor: COLORS.bgPrimary,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "8px",
                            mt: 0.5,
                            maxHeight: 260,
                            "& .MuiMenuItem-root": {
                              color: COLORS.textPrimary,
                              fontSize: "14px",
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
                    <MenuItem value="Open">Open</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
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
                    Owner
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
                        color: assigningActivity?.ownerName
                          ? COLORS.textPrimary
                          : COLORS.textMuted,
                        fontSize: "14px",
                      }}
                    >
                      {assigningActivity?.ownerName || "Unassigned"}
                    </Typography>
                  </Box>
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

        {/* Reassign Modal */}
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
                "&:disabled": {
                  bgcolor: COLORS.amber,
                  opacity: 0.7,
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

        {/* PM Override — force-close individual actions, each with its own
            mandatory reason. Never closes actions in bulk (MS-05 B4). */}
        <Dialog
          open={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                bgcolor: COLORS.bgSecondary,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundImage: "none",
              },
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography
              sx={{
                color: COLORS.amber,
                fontSize: "18px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              PM Override
            </Typography>
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "13px", mb: 3 }}
            >
              Force-close an individual action that cannot be completed. Each
              override needs its own justification (min 10 characters) and is
              recorded against your name in the audit log.
            </Typography>

            {overridableActions.length === 0 ? (
              <Box
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  p: 3,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
                  No open actions to override.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: `${OVERRIDE_LIST_GAP}px`,
                  maxHeight: OVERRIDE_LIST_MAX_HEIGHT,
                  overflowY: "auto",
                }}
              >
                {overridableActions.map((action) => {
                  const reason = overrideReasons[action._id] || "";
                  const busy = overridingActionId === action._id;
                  return (
                    <Box
                      key={action._id}
                      sx={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "8px",
                        bgcolor: COLORS.bgPrimary,
                        p: 2,
                        height: OVERRIDE_CARD_HEIGHT,
                        boxSizing: "border-box",
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          title={action.title}
                          sx={{
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            fontWeight: 600,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {action.title}
                        </Typography>
                        <Box
                          sx={{
                            flexShrink: 0,
                            bgcolor: COLORS.bgTertiary,
                            color: COLORS.textSecondary,
                            borderRadius: "12px",
                            px: 1.5,
                            py: 0.25,
                            fontSize: "11px",
                            fontWeight: 500,
                            height: "fit-content",
                          }}
                        >
                          {action.type} · {action.status}
                        </Box>
                      </Box>
                      <Typography
                        sx={{
                          color: COLORS.textMuted,
                          fontSize: "12px",
                          mb: 1.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {action.linkedActivity?.activityName || "—"}
                        {action.assignee?.name
                          ? ` · ${action.assignee.name}`
                          : ""}
                        {action.dueDate
                          ? ` · due ${new Date(
                              action.dueDate,
                            ).toLocaleDateString("en-GB")}`
                          : ""}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Reason for overriding this action..."
                          value={reason}
                          onChange={(e) =>
                            setOverrideReasons((prev) => ({
                              ...prev,
                              [action._id]: e.target.value,
                            }))
                          }
                          disabled={busy}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: COLORS.bgSecondary,
                              borderRadius: "8px",
                              height: OVERRIDE_ROW_HEIGHT,
                              "& fieldset": { borderColor: COLORS.border },
                              "&:hover fieldset": { borderColor: COLORS.amber },
                              "&.Mui-focused fieldset": {
                                borderColor: COLORS.amber,
                              },
                            },
                            "& .MuiInputBase-input": {
                              color: COLORS.textPrimary,
                              fontSize: "13px",
                            },
                          }}
                        />
                        <Button
                          onClick={() => handleOverrideSingleAction(action._id)}
                          disabled={reason.trim().length < 10 || busy}
                          sx={{
                            flexShrink: 0,
                            bgcolor: COLORS.amber,
                            color: "#fff",
                            textTransform: "none",
                            // The theme forces 12px vertical padding on every
                            // Button, which would overshoot the input.
                            px: 2.5,
                            py: 0,
                            height: OVERRIDE_ROW_HEIGHT,
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
                          {busy ? (
                            <CircularProgress
                              size={16}
                              sx={{ color: "inherit" }}
                            />
                          ) : (
                            "Override"
                          )}
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                onClick={() => setOverrideModalOpen(false)}
                sx={{
                  color: COLORS.textSecondary,
                  textTransform: "none",
                  fontSize: "13px",
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </Dialog>

        <ActionDetailsDialog
          open={actionDetailId !== null}
          actionId={actionDetailId}
          onClose={() => setActionDetailId(null)}
        />

        {/* Toast notification for execution not started */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={4000}
          onClose={() => {
            setToastOpen(false);
            setToastSeverity("warning");
          }}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => {
              setToastOpen(false);
              setToastSeverity("warning");
            }}
            severity={toastSeverity}
            sx={{
              bgcolor:
                toastSeverity === "success" ? COLORS.green : COLORS.amber,
              color: toastSeverity === "success" ? "#fff" : "#000",
              fontWeight: 500,
              "& .MuiAlert-icon": {
                color: toastSeverity === "success" ? "#fff" : "#000",
              },
            }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
};

export default AdminProjectWorkspace;
