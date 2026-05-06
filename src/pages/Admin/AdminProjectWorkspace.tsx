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
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import ProjectHeader from "../../components/ProjectHeader";
import {
  projectAPI,
  programmeAPI,
  actionAPI,
  userAPI,
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

// Default values for dashboard display (will be dynamic later)
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

// Parse date string (handles DD-Mon-YY format like "09-Jun-22 A")
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

  // Remove suffixes like " A" or "*"
  const cleanDate = dateStr.replace(/\s*[A*]$/, "").trim();
  const match = cleanDate.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);

  if (match) {
    const day = parseInt(match[1]);
    const month = months[match[2]];
    let year = parseInt(match[3]);
    year = year < 50 ? 2000 + year : 1900 + year;
    return new Date(year, month, day);
  }

  // Fallback to standard Date parsing
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// Calculate RAG zone color from dates
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

// Sort priority: Green (1) -> Amber (2) -> Red (3)
const getRAGPriority = (color: string): number => {
  if (color === "green") return 1;
  if (color === "amber") return 2;
  return 3;
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
}

const AdminProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(1); // Default to Programme Upload tab
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

  // Programme upload states
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

  // Programme history state
  const [programmeHistory, setProgrammeHistory] = useState<Array<{
    _id: string;
    name: string;
    cycleStatus: string;
    createdAt: string;
    totalActivities?: number;
    overrideReason?: string;
  }>>([]);

  // Lookahead data states
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

  // Scroll to selected action when switching to Actions tab
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

  // Weekly control data state
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
      overdue: number;
    };
    blockedRiskActivities: Array<{
      activityId: string;
      activityName: string;
      ragStatus: string;
      owner: string;
      blocker: string;
      linkedAction: { actionId: string; status: string } | null;
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
    }>;
    plannerToDo: Array<{
      activityId: string;
      activityName: string;
      ragStatus: string;
      owner: string;
      todoItem: string;
      priority: string;
      dueDate: string;
    }>;
  } | null>(null);
  const [, setIsLoadingWeeklyControl] = useState(false);

  // Fetch project on mount
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

  // Fetch users for assignee dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userAPI.getAll({ status: "active" });
        if (response.success) {
          // Filter out admins, only keep active planners and users
          const activeUsers = (response.users || []).filter(
            (user: { role: string; status: string }) =>
              user.role !== "admin" && user.status === "active",
          );
          setUsers(activeUsers);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch existing programme for this project
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

          // Initialize cycle stage and step from backend status
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
            // Uploaded or Draft
            setCycleStage("draft");
            setCurrentStep(1);
          }

          // Set lookahead data directly from programme data
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

          // Fetch weekly control data
          await fetchWeeklyControlData(programme._id);
        }
      } catch (error) {
        console.error("Failed to fetch programme:", error);
      } finally {
        setIsLoadingProgramme(false);
      }
    };
    fetchProgramme();
  }, [projectId]);

  // Fetch actions for this project's programme
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

  // Fetch programme history for this project
  useEffect(() => {
    const fetchProgrammeHistory = async () => {
      if (!projectId) return;
      try {
        const response = await programmeAPI.getProjectHistory(projectId);
        if (response.success && response.history) {
          setProgrammeHistory(response.history.map((p: { _id: string; name: string; cycleStatus: string; createdAt: string; extractedData?: { totalActivities?: number }; overrideReason?: string }) => ({
            _id: p._id,
            name: p.name,
            cycleStatus: p.cycleStatus,
            createdAt: p.createdAt,
            totalActivities: p.extractedData?.totalActivities || 0,
            overrideReason: p.overrideReason,
          })));
        }
      } catch (error) {
        console.error("Failed to fetch programme history:", error);
      }
    };
    fetchProgrammeHistory();
  }, [projectId, uploadedProgramme?.cycleStatus]);

  // Helper function to get actions count for an activity
  const getActionsForActivity = (activityId: string) => {
    return projectActions.filter(
      (action) => action.linkedActivity?.activityId === activityId,
    );
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
        const response = await programmeAPI.updateCycleStatus(uploadedProgramme._id, nextStatus);
        if (response.success) {
          // Update local state after successful API call
          if (cycleStage === "draft") {
            setCycleStage("meetingOpen");
          } else if (cycleStage === "meetingOpen") {
            setCycleStage("execution");
          }
          setCurrentStep(nextStep);
          // Update uploadedProgramme state too
          setUploadedProgramme({
            ...uploadedProgramme,
            cycleStatus: nextStatus,
          });
        }
      }
    } catch (error) {
      console.error("Failed to update cycle status:", error);
    }
  };

  // Mark as Close-Out Eligible (Stage 4) - allows exports to be generated
  const handleMarkCloseOutEligible = async () => {
    if (!uploadedProgramme?._id) return;

    try {
      const response = await programmeAPI.updateCycleStatus(uploadedProgramme._id, "Close-Out Eligible");
      if (response.success) {
        setCurrentStep(4);
        setUploadedProgramme({
          ...uploadedProgramme,
          cycleStatus: "Close-Out Eligible",
        });
      }
    } catch (error) {
      console.error("Failed to mark as Close-Out Eligible:", error);
    }
  };

  // Final close (Stage 5) - locks the week permanently
  const handleFinalClose = async () => {
    if (!uploadedProgramme?._id) return;

    try {
      const response = await programmeAPI.updateCycleStatus(uploadedProgramme._id, "Closed");
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

  // PM Override close with mandatory reason
  const handleOverrideClose = async () => {
    if (!uploadedProgramme?._id || overrideReason.length < 10) return;

    try {
      const response = await programmeAPI.pmOverride(uploadedProgramme._id, overrideReason);
      if (response.success) {
        setCurrentStep(5);
        setSavedOverrideReason(overrideReason);
        setIsWeekClosed(true);
        setShowOverrideForm(false);
        setOverrideReason("");
        // Update uploadedProgramme state
        setUploadedProgramme({
          ...uploadedProgramme,
          cycleStatus: "Closed",
          isLocked: true,
        });
      }
    } catch (error) {
      console.error("Failed to close week with override:", error);
    }
  };

  const getCycleButtonText = () => {
    if (cycleStage === "draft") return "Open Meeting";
    if (cycleStage === "meetingOpen") return "Start Execution";
    return "In Execution";
  };

  const getCycleStatusText = () => {
    // Use backend status if available
    if (uploadedProgramme?.cycleStatus) {
      return uploadedProgramme.cycleStatus;
    }
    // Fallback to local state
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
      // Get activity name from lookahead data
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
        // Refresh project actions
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
        // Refresh project actions
        if (projectId) {
          const actionsRes = await actionAPI.getAll({
            programmeId: uploadedProgramme?._id,
          });
          if (actionsRes.success) {
            setProjectActions(actionsRes.actions || []);
          }
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

  const fetchWeeklyControlData = async (programmeId: string) => {
    setIsLoadingWeeklyControl(true);
    try {
      const response = await programmeAPI.getWeeklyControl(programmeId);
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
        blockedRiskActivities: response.blockedRiskActivities || [],
        weeklyPlanPreview: response.weeklyPlanPreview || [],
        plannerToDo: response.plannerToDo || [],
      });
    } catch (error) {
      console.error("Failed to fetch weekly control data:", error);
    } finally {
      setIsLoadingWeeklyControl(false);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!uploadedFile || !project) return;

    setIsUploading(true);
    setUploadError("");

    try {
      // Use file name without extension as programme name
      const programmeName = uploadedFile.name.replace(/\.pdf$/i, "");
      const response = await programmeAPI.upload(
        uploadedFile,
        programmeName,
        projectId,
      );

      if (response.success) {
        const programme = response.programme;
        // Upload response returns activities directly, not in extractedData
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
        setUploadedFile(null); // Clear the file after successful upload

        // Set lookahead data directly from programme response
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

        // Fetch weekly control data
        await fetchWeeklyControlData(programme._id);
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

  const actionStats = {
    total: projectActions.length,
    open: projectActions.filter((a) => a.status === "Open").length,
    inProgress: projectActions.filter((a) => a.status === "In Progress").length,
    closed: projectActions.filter((a) => a.status === "Completed").length,
    overdue: projectActions.filter(
      (a) => new Date(a.dueDate) < new Date() && a.status !== "Completed",
    ).length,
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber === currentStep && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Loading state
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

  // Project not found
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

  // Get planner from team if available
  const planner =
    project.team?.find((t) => t.role === "Planner")?.user?.name ||
    project.createdBy?.name ||
    defaultDashboardData.planner;

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
          week={defaultDashboardData.week}
          weekDates={defaultDashboardData.weekDates}
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
                setSelectedActionId(null); // Clear selection when leaving Actions tab
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
              // Loading skeleton
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
              // Success state - programme uploaded
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
                  {(uploadedProgramme?.cycleStatus === "Closed" || isWeekClosed) && (
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
                  )}
                </Box>

                {/* Week Closed Notice */}
                {(uploadedProgramme?.cycleStatus === "Closed" || isWeekClosed) && (
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
                    <Typography sx={{ color: COLORS.textMuted, fontSize: "13px" }}>
                      This week is closed. Click "Start New Week" to upload a new programme for the next cycle.
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
                          {new Date(prog.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
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
                        "4px 100px 1fr 95px 95px 70px 95px 60px 75px 120px",
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
                          textAlign: [2, 3, 4, 5, 8].includes(idx)
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
                          // Left indicator based on activityStatus
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
                          // Calculate RAG zone from start and end date
                          const calculateRagZone = (
                            startDate: string,
                            endDate: string,
                          ) => {
                            if (!startDate || !endDate)
                              return { zone: "Week 1", color: COLORS.green };

                            const start = parseDate(startDate);
                            const end = parseDate(endDate);

                            if (!start || !end)
                              return { zone: "Week 1", color: COLORS.green };

                            const diffTime = end.getTime() - start.getTime();
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24),
                            );
                            const diffWeeks = Math.ceil(diffDays / 7);

                            if (diffWeeks <= 0) {
                              return { zone: "< 1 Week", color: COLORS.green };
                            } else if (diffWeeks <= 2) {
                              return { zone: "Weeks 1-2", color: COLORS.green };
                            } else if (diffWeeks <= 4) {
                              return { zone: "Weeks 3-4", color: COLORS.amber };
                            } else if (diffWeeks <= 6) {
                              return { zone: "Weeks 5-6", color: COLORS.red };
                            } else {
                              return {
                                zone: `${diffWeeks} Weeks`,
                                color: COLORS.red,
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
                          );
                          const ownerName = user?.name || "Unknown";
                          const ownerInitials = ownerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);

                          // Format date as YYYY-MM-DD
                          const formatDate = (dateStr: string) => {
                            if (!dateStr) return "-";

                            // Handle DD-Mon-YY format (e.g., "24-Nov-21 A")
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

                            // Remove suffixes like " A" or "*"
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

                            // Fallback to standard Date parsing
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
                                    "4px 100px 1fr 95px 95px 70px 95px 60px 75px 120px",
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
                                                  setActiveTab(3); // Switch to Actions tab
                                                  setExpandedActivityId(null); // Close expanded section
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
                                                  "Completed" && (
                                                  <Typography
                                                    sx={{
                                                      fontSize: "10px",
                                                      color: COLORS.green,
                                                      ml: 0.5,
                                                    }}
                                                  >
                                                    (Complete)
                                                  </Typography>
                                                )}
                                              </Box>
                                            ),
                                          )}
                                        </Box>
                                      </Box>

                                      {/* Dependencies */}
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
                                          Dependencies
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

            {/* Activities Summary */}
            {(() => {
              // Calculate status counts based on activityStatus
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
                    readyCount++; // Default to Ready
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
                          <Box
                            sx={{
                              bgcolor:
                                action.status === "Open"
                                  ? `${COLORS.blue}25`
                                  : action.status === "In Progress"
                                    ? `${COLORS.amber}25`
                                    : `${COLORS.green}25`,
                              color:
                                action.status === "Open"
                                  ? COLORS.blue
                                  : action.status === "In Progress"
                                    ? COLORS.amber
                                    : COLORS.green,
                              px: 2,
                              py: 0.5,
                              borderRadius: "5px",
                              fontSize: "12px",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {action.status}
                          </Box>
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
                            onClick={() =>
                              action.status !== "Completed" &&
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
                              )
                            }
                            sx={{
                              width: 16,
                              height: 16,
                              cursor:
                                action.status === "Completed"
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                action.status === "Completed" ? 0.3 : 0.7,
                              "&:hover": {
                                opacity:
                                  action.status === "Completed" ? 0.3 : 1,
                              },
                            }}
                          />
                          <Box
                            component="img"
                            src={viewIcon}
                            onClick={() =>
                              action.status !== "Completed"
                                ? handleOpenCompleteConfirm({
                                    _id: action._id,
                                    title: action.title,
                                  })
                                : null
                            }
                            sx={{
                              width: 16,
                              height: 16,
                              cursor:
                                action.status === "Completed"
                                  ? "default"
                                  : "pointer",
                              opacity: action.status === "Completed" ? 1 : 0.7,
                              filter:
                                action.status === "Completed"
                                  ? "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(5323%) hue-rotate(107deg) brightness(92%) contrast(88%)"
                                  : "none",
                              "&:hover": {
                                opacity: 1,
                                filter:
                                  action.status !== "Completed"
                                    ? "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(5323%) hue-rotate(107deg) brightness(92%) contrast(88%)"
                                    : "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(5323%) hue-rotate(107deg) brightness(92%) contrast(88%)",
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
          <Box>
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
                        { value: ragData.green, color: "#22C55E" },
                        { value: ragData.amber, color: "#F59E0B" },
                        { value: ragData.red, color: "#EF4444" },
                      ].filter((d) => d.value > 0);
                      const total = data.reduce((sum, d) => sum + d.value, 0);
                      if (total === 0) return null;
                      const strokeWidth = 28;
                      const radius = (180 - strokeWidth) / 2;
                      const center = 90;
                      let currentAngle = -90;

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
                          <path
                            key={i}
                            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={strokeWidth}
                          />
                        );
                      });
                    })()}
                  </svg>
                </Box>
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
                  const maxValue = Math.max(
                    actionsData.open,
                    actionsData.inProgress,
                    actionsData.closed,
                    actionsData.overdue,
                    1,
                  );
                  const yAxisMax = Math.ceil(maxValue / 2) * 2; // Round up to nearest even number
                  const yAxisSteps = [
                    yAxisMax,
                    Math.round((yAxisMax * 5) / 6),
                    Math.round((yAxisMax * 4) / 6),
                    Math.round((yAxisMax * 3) / 6),
                    Math.round((yAxisMax * 2) / 6),
                    Math.round((yAxisMax * 1) / 6),
                    0,
                  ];
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
                        {yAxisSteps.map((val) => (
                          <Typography
                            key={val}
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
                          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                            <Box
                              key={i}
                              sx={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: `${(i / 6) * 100}%`,
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
                              justifyContent: "space-around",
                              px: 2,
                            }}
                          >
                            {[
                              {
                                label: "In Lookahead",
                                value: actionsData.open,
                                color: COLORS.blue,
                              },
                              {
                                label: "Ready",
                                value: actionsData.inProgress,
                                color: COLORS.amber,
                              },
                              {
                                label: "Completed",
                                value: actionsData.closed,
                                color: COLORS.green,
                              },
                              {
                                label: "Overdue",
                                value: actionsData.overdue,
                                color: COLORS.red,
                              },
                            ].map((bar, i) => (
                              <Box
                                key={i}
                                sx={{
                                  width: 60,
                                  height:
                                    bar.value > 0
                                      ? `${(bar.value / yAxisMax) * 100}%`
                                      : 0,
                                  bgcolor: bar.color,
                                  borderRadius: "4px 4px 0 0",
                                  minHeight: bar.value > 0 ? 8 : 0,
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-around",
                            pt: 1,
                            borderTop: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {[
                            "In Lookahead",
                            "Ready",
                            "Completed",
                            "Overdue",
                          ].map((label) => (
                            <Typography
                              key={label}
                              sx={{
                                color: COLORS.textMuted,
                                fontSize: "10px",
                                width: 60,
                                textAlign: "center",
                              }}
                            >
                              {label}
                            </Typography>
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
                    id: a.activityId,
                    name: a.activityName,
                    rag:
                      a.ragStatus === "Red"
                        ? ("Red" as const)
                        : ("Amber" as const),
                    owner: a.owner || "",
                    blocker: a.blocker || "",
                    linkedAction: a.linkedAction?.actionId || "",
                    status:
                      a.linkedAction?.status === "Overdue"
                        ? ("Overdue" as const)
                        : ("Open" as const),
                  })) || []
                }
                weeklyPlanPreview={weeklyControlData?.weeklyPlanPreview || []}
                plannerToDo={weeklyControlData?.plannerToDo || []}
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
              {(uploadedProgramme?.cycleStatus === "Closed" || isWeekClosed) ? (
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
                    Week locked. View history in Closure & Export tab.
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
                    <Typography sx={{ color: COLORS.blue, fontSize: "18px" }}>📋</Typography>
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
                        Export documents can be generated. Ready to close and lock the week.
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      onClick={() => setActiveTab(5)}
                      sx={{
                        bgcolor: "transparent",
                        color: COLORS.blue,
                        border: `1px solid ${COLORS.blue}`,
                        textTransform: "none",
                        px: 2,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" },
                      }}
                    >
                      Go to Exports
                    </Button>
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
                  {actionStats.open === 0 ? (
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
                          gap: 1.5,
                          mb: 2,
                        }}
                      >
                        <Typography sx={{ color: COLORS.green, fontSize: "18px" }}>✓</Typography>
                        <Typography
                          sx={{
                            color: COLORS.green,
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          All actions completed. Ready for close-out.
                        </Typography>
                      </Box>
                      <Button
                        onClick={handleMarkCloseOutEligible}
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
                        Mark Ready for Close-Out
                      </Button>
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
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
                          {actionStats.open} open action(s) need to be completed before closing.
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
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
                            PM Override — Force Close Week
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "13px",
                              mb: 2,
                            }}
                          >
                            Enter a mandatory reason (min 10 characters) to close this week despite incomplete actions.
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
                                "&:hover fieldset": { borderColor: COLORS.amber },
                                "&.Mui-focused fieldset": { borderColor: COLORS.amber },
                              },
                              "& .MuiInputBase-input": {
                                color: COLORS.textPrimary,
                                fontSize: "14px",
                              },
                            }}
                          />
                          <Button
                            onClick={handleOverrideClose}
                        disabled={overrideReason.length < 10}
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
                          "&.Mui-disabled": { bgcolor: COLORS.bgTertiary, color: COLORS.textMuted },
                        }}
                      >
                            Force Close Week
                          </Button>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              ) : (
                <Button
                  onClick={handleCycleAction}
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
                  }}
                >
                  {getCycleButtonText()}
                </Button>
              )}
            </Box>
          </Box>
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
                  Week Closed & Locked
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    mb: (savedOverrideReason || uploadedProgramme?.overrideReason) ? 1 : 0,
                  }}
                >
                  This week has been closed. No further changes allowed.
                </Typography>
                {(savedOverrideReason || uploadedProgramme?.overrideReason) && (
                  <Typography
                    sx={{
                      color: COLORS.amber,
                      fontSize: "14px",
                    }}
                  >
                    Override reason: {savedOverrideReason || uploadedProgramme?.overrideReason}
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
                        extra: "(1 overdue)",
                        extraColor: COLORS.red,
                      },
                      {
                        key: "blockedAcknowledged",
                        label: "Blocked activities acknowledged",
                        extra: "(1 blocked)",
                        extraColor: COLORS.red,
                      },
                    ].map((item) => (
                      <Box
                        key={item.key}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setClosureChecklist((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof prev],
                          }))
                        }
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
                          bgcolor: "#2D2A3D",
                          color: COLORS.red,
                          width: 46,
                          height: 20,
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        Gated
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        mb: 0.5,
                      }}
                    >
                      Green activities with zero open required actions.
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "12px", mb: 2 }}
                    >
                      1 activity qualify
                    </Typography>
                    <Button
                      fullWidth
                      sx={{
                        bgcolor: COLORS.disabledBlue,
                        color: "#fff",
                        textTransform: "none",
                        py: 1.25,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      Download Weekly Plan
                    </Button>
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
                          bgcolor: "#2D2A3D",
                          color: COLORS.red,
                          width: 46,
                          height: 20,
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        Gated
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
                      12 outstanding items
                    </Typography>
                    <Button
                      fullWidth
                      sx={{
                        bgcolor: COLORS.disabledBlue,
                        color: "#fff",
                        textTransform: "none",
                        py: 1.25,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      Download Planner To - Do
                    </Button>
                  </Box>
                </Box>

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
                    sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                  >
                    The WeekCycle must be in Close-Out Eligible state. Close all
                    required actions for green activities to unlock exports.
                  </Typography>
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
                    Close Week
                  </Typography>

                  {(uploadedProgramme?.cycleStatus === "Closed" || isWeekClosed) ? (
                    <Box
                      sx={{
                        bgcolor: "rgba(107, 114, 128, 0.1)",
                        border: `1px solid ${COLORS.textMuted}`,
                        borderRadius: "8px",
                        p: 2,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          component="img"
                          src={lockIcon}
                          sx={{ width: 20, height: 20, opacity: 0.6 }}
                        />
                        <Typography sx={{ color: COLORS.textMuted, fontSize: "13px" }}>
                          This week is closed and locked. No further changes allowed.
                        </Typography>
                      </Box>
                      {(savedOverrideReason || uploadedProgramme?.overrideReason) && (
                        <Typography
                          sx={{
                            color: COLORS.amber,
                            fontSize: "12px",
                            mt: 1.5,
                            pl: 4.5,
                          }}
                        >
                          Override reason: {savedOverrideReason || uploadedProgramme?.overrideReason}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                  <>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      mb: 2,
                    }}
                  >
                    {uploadedProgramme?.cycleStatus === "Close-Out Eligible"
                      ? "Week is ready to be closed. Click 'Close Week' to finalize."
                      : "Complete all actions and mark as Close-Out Eligible first, or use PM Override to force close."}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <Button
                      onClick={handleFinalClose}
                      disabled={uploadedProgramme?.cycleStatus !== "Close-Out Eligible"}
                      sx={{
                        bgcolor: "transparent",
                        border: `1px solid ${COLORS.green}`,
                        color: COLORS.green,
                        textTransform: "none",
                        px: 2.5,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": { bgcolor: `${COLORS.green}10` },
                        "&.Mui-disabled": {
                          borderColor: COLORS.border,
                          color: COLORS.textMuted,
                        },
                      }}
                    >
                      Close Week
                    </Button>
                    <Button
                      onClick={() => setShowOverrideForm(!showOverrideForm)}
                      disabled={uploadedProgramme?.cycleStatus === "Closed" || isWeekClosed}
                      sx={{
                        bgcolor: COLORS.red,
                        color: "#fff",
                        textTransform: "none",
                        px: 2.5,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": { bgcolor: "#DC2626" },
                        "&.Mui-disabled": {
                          bgcolor: COLORS.bgTertiary,
                          color: COLORS.textMuted,
                        },
                      }}
                    >
                      PM Override Close
                    </Button>
                  </Box>

                  {showOverrideForm && (
                    <Box
                      sx={{
                        bgcolor: "#2D2A24",
                        border: `1px solid ${COLORS.amber}`,
                        borderRadius: "12px",
                        p: 2.5,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.amber,
                          fontSize: "13px",
                          fontWeight: 500,
                          mb: 2,
                        }}
                      >
                        PM Override — Mandatory Justification
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Enter the reason for override closure (required)..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        sx={{
                          mb: 2,
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
                          "& .MuiOutlinedInput-input": {
                            color: COLORS.textPrimary,
                            fontSize: "13px",
                            "&::placeholder": {
                              color: COLORS.textMuted,
                              opacity: 1,
                            },
                          },
                        }}
                      />
                      <Button
                        disabled={overrideReason.length < 10}
                        onClick={handleOverrideClose}
                        sx={{
                          bgcolor: COLORS.amber,
                          color: "#fff",
                          textTransform: "none",
                          px: 2.5,
                          py: 1,
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 500,
                          mb: 1,
                          "&:hover": { bgcolor: "#D97706" },
                          "&:disabled": { bgcolor: COLORS.amber, opacity: 0.5 },
                        }}
                      >
                        Confirm Override Close
                      </Button>
                      <Typography
                        sx={{ color: COLORS.textMuted, fontSize: "11px" }}
                      >
                        Minimum 10 characters required. This will be recorded in
                        the audit trail.
                      </Typography>
                    </Box>
                  )}
                  </>
                  )}
                </Box>
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
      </Box>
    </AdminLayout>
  );
};

export default AdminProjectWorkspace;
