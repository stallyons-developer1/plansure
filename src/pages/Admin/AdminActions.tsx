import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  Drawer,
  CircularProgress,
  ListSubheader,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  SearchOutlined as SearchIcon,
  AccessTime as ClockIcon,
  CheckCircleOutlined as CheckCircleIcon,
  WarningAmber as WarningIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import actionIcon from "../../assets/sidebar/action.png";
import editIcon from "../../assets/tabler_edit.png";
import frameIcon from "../../assets/Frame.png";
import uploadIcon from "../../assets/sidebar/upload.png";
import {
  projectAPI,
  programmeAPI,
  userAPI,
  actionAPI,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Action {
  _id: string;
  title: string;
  description?: string;
  linkedActivity: {
    activityId: string;
    activityName: string;
  };
  type: string;
  assignee: {
    _id: string;
    name: string;
    email: string;
  } | null;
  dueDate: string;
  status: string;
  priority: string;
  programme?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
  };
}

interface Project {
  _id: string;
  name: string;
  programmes?: string[];
}

interface Activity {
  activityId: string;
  activityName: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Programme {
  _id: string;
  name: string;
  project: string;
  cycleStatus?: string;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const AdminActions = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("due_date");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [viewingAction, setViewingAction] = useState<Action | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [actionToComplete, setActionToComplete] = useState<Action | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [formData, setFormData] = useState({
    selectedProject: "",
    linkedActivity: "",
    title: "",
    description: "",
    type: "Required",
    priority: "Medium",
    status: "Open",
    assignee: "",
    dueDate: "",
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesPagination, setActivitiesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [users, setUsers] = useState<User[]>([]);

  const fetchActions = async (projectId?: string) => {
    try {
      const params: { programmeId?: string } = {};
      if (projectId) {
        const programme = programmes.find((p) => p.project === projectId);
        if (programme) {
          params.programmeId = programme._id;
        }
      }
      const response = await actionAPI.getAll(params);
      if (response.success) {
        setActions(response.actions || []);
      }
    } catch (error) {
      console.error("Failed to fetch actions:", error);
    }
  };

  const handleProjectFilterChange = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const getProgrammeIdForProject = (projectId: string): string | null => {
    const programme = programmes.find((p) => p.project === projectId);
    return programme?._id || null;
  };

  // Check if the current project's cycle is in execution mode
  const isExecutionMode = (): boolean => {
    if (!selectedProjectId) return false;
    const programme = programmes.find((p) => p.project === selectedProjectId);
    if (!programme?.cycleStatus) return false;
    return programme.cycleStatus === "Execution" || programme.cycleStatus === "Close-Out Eligible" || programme.cycleStatus === "Closed";
  };

  useEffect(() => {
    const fetchData = async () => {
      setActionsLoading(true);
      try {
        const [projectsRes, usersRes, , programmesRes] =
          await Promise.all([
            projectAPI.getAll(),
            userAPI.getAll({ status: "active" }),
            actionAPI.getAll(),
            programmeAPI.getAll(),
          ]);

        if (projectsRes.success && projectsRes.projects) {
          setProjects(projectsRes.projects);
          // Select first project by default
          if (projectsRes.projects.length > 0) {
            setSelectedProjectId(projectsRes.projects[0]._id);
          }
        }

        const activeUsers = (usersRes.users || []).filter(
          (user: User) => user.role === "planner" && user.status === "active",
        );
        setUsers(activeUsers);

        if (programmesRes.success) {
          setProgrammes(programmesRes.programmes || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setActionsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch actions when selected project changes
  useEffect(() => {
    if (programmes.length > 0) {
      fetchActions(selectedProjectId);
    }
  }, [selectedProjectId, programmes]);

  const fetchActivities = async (projectId: string, page: number = 1) => {
    if (!projectId) {
      setActivities([]);
      return;
    }

    setActivitiesLoading(true);
    try {
      const response = await programmeAPI.getActivitiesByProject(
        projectId,
        page,
        10,
      );
      if (response.success) {
        setActivities(response.activities || []);
        setActivitiesPagination({
          currentPage: response.pagination?.currentPage || 1,
          totalPages: response.pagination?.totalPages || 1,
          hasNextPage: response.pagination?.hasNextPage || false,
          hasPrevPage: response.pagination?.hasPrevPage || false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setFormData({
      ...formData,
      selectedProject: projectId,
      linkedActivity: "",
    });
    setActivities([]);
    setActivitiesPagination({
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });
    fetchActivities(projectId, 1);
  };

  const handlePageChange = (page: number) => {
    if (
      formData.selectedProject &&
      page >= 1 &&
      page <= activitiesPagination.totalPages
    ) {
      fetchActivities(formData.selectedProject, page);
    }
  };

  const filteredActions = actions.filter((action) => {
    const isOverdue =
      action.status !== "Completed" &&
      action.status !== "Cancelled" &&
      new Date(action.dueDate) < new Date();
    const displayStatus = isOverdue ? "overdue" : action.status.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      displayStatus === statusFilter.toLowerCase() ||
      (statusFilter.toLowerCase() === "closed" &&
        action.status === "Completed");
    const matchesType =
      typeFilter === "all" ||
      action.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.linkedActivity?.activityId
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  // Compute stats from the actions array (for the selected project)
  const computedStats = {
    total: actions.length,
    open: actions.filter((a) => {
      const isOverdue = a.status !== "Completed" && new Date(a.dueDate) < new Date();
      return (a.status === "Open" || a.status === "In Progress") && !isOverdue;
    }).length,
    closed: actions.filter((a) => a.status === "Completed").length,
    overdue: actions.filter((a) => {
      return a.status !== "Completed" && new Date(a.dueDate) < new Date();
    }).length,
  };

  const handleOpenCreateModal = () => {
    setEditingAction(null);
    setFormData({
      selectedProject: "",
      linkedActivity: "",
      title: "",
      description: "",
      type: "Required",
      priority: "Medium",
      status: "Open",
      assignee: "",
      dueDate: "",
    });
    setActivities([]);
    setActivitiesPagination({
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = async (action: Action) => {
    setEditingAction(action);
    const assigneeId = action.assignee?._id || "";
    const validAssignee = users.find((u) => u._id === assigneeId)
      ? assigneeId
      : "";

    const programme = programmes.find((p) => p._id === action.programme?._id);
    const projectId = programme?.project || "";

    setFormData({
      selectedProject: projectId,
      linkedActivity: action.linkedActivity?.activityId || "",
      title: action.title,
      description: action.description || "",
      type: action.type,
      priority: action.priority,
      status: action.status || "Open",
      assignee: validAssignee,
      dueDate: action.dueDate ? action.dueDate.split("T")[0] : "",
    });

    if (projectId) {
      setActivitiesLoading(true);
      try {
        const response = await programmeAPI.getActivitiesByProject(
          projectId,
          1,
          10,
        );
        if (response.success) {
          setActivities(response.activities || []);
          setActivitiesPagination({
            currentPage: response.pagination?.currentPage || 1,
            totalPages: response.pagination?.totalPages || 1,
            hasNextPage: response.pagination?.hasNextPage || false,
            hasPrevPage: response.pagination?.hasPrevPage || false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    } else {
      setActivities([]);
      setActivitiesPagination({
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    }

    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAction(null);
    setSaveError("");
    setFormData({
      selectedProject: "",
      linkedActivity: "",
      title: "",
      description: "",
      type: "Required",
      priority: "Medium",
      status: "Open",
      assignee: "",
      dueDate: "",
    });
    setActivities([]);
    setActivitiesPagination({
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });
  };

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setViewingAction(null);
  };

  const handleEditFromDrawer = () => {
    if (viewingAction) {
      handleCloseDetailDrawer();
      handleOpenEditModal(viewingAction);
    }
  };

  const handleCloseAction = async () => {
    if (viewingAction) {
      try {
        const response = await actionAPI.complete(viewingAction._id);
        if (response.success) {
          await fetchActions();
          handleCloseDetailDrawer();
        }
      } catch (error) {
        console.error("Failed to close action:", error);
        alert("Failed to close action. Please try again.");
      }
    }
  };

  const handleOpenCompleteConfirm = (action: Action) => {
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
        await fetchActions();
                handleCloseCompleteConfirm();
      }
    } catch (error) {
      console.error("Failed to complete action:", error);
      alert("Failed to complete action. Please try again.");
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleSaveAction = async () => {
    setSaveError("");

    if (
      !formData.title.trim() ||
      !formData.assignee ||
      !formData.dueDate ||
      !formData.selectedProject
    ) {
      setSaveError("Please fill in all required fields");
      return;
    }

    setSaveLoading(true);

    try {
      if (editingAction) {
        const programmeId = getProgrammeIdForProject(formData.selectedProject);

        if (!programmeId) {
          setSaveError(
            "No programme found for this project. Please upload a programme first.",
          );
          setSaveLoading(false);
          return;
        }

        if (!formData.linkedActivity) {
          setSaveError("Please select a linked activity");
          setSaveLoading(false);
          return;
        }

        const selectedActivity = activities.find(
          (a) => a.activityId === formData.linkedActivity,
        );
        const activityName =
          selectedActivity?.activityName ||
          editingAction.linkedActivity?.activityName ||
          "Unknown activity";

        const response = await actionAPI.update(editingAction._id, {
          programmeId,
          linkedActivity: {
            activityId: formData.linkedActivity,
            activityName: activityName,
          },
          title: formData.title,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          status: formData.status,
          assignee: formData.assignee,
          dueDate: formData.dueDate,
        });

        if (response.success) {
          await fetchActions();
                    handleCloseModal();
        }
      } else {
        const programmeId = getProgrammeIdForProject(formData.selectedProject);

        if (!programmeId) {
          setSaveError(
            "No programme found for this project. Please upload a programme first.",
          );
          setSaveLoading(false);
          return;
        }

        if (!formData.linkedActivity) {
          setSaveError("Please select a linked activity");
          setSaveLoading(false);
          return;
        }

        const selectedActivityForCreate = activities.find(
          (a) => a.activityId === formData.linkedActivity,
        );
        const activityNameForCreate =
          selectedActivityForCreate?.activityName || "Unknown activity";

        const response = await actionAPI.create({
          programmeId,
          linkedActivity: {
            activityId: formData.linkedActivity,
            activityName: activityNameForCreate,
          },
          title: formData.title,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          assignee: formData.assignee,
          dueDate: formData.dueDate,
        });

        if (response.success) {
          await fetchActions();
                    handleCloseModal();
        }
      }
    } catch (error: unknown) {
      console.error("Failed to save action:", error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMessage =
        axiosError?.response?.data?.message ||
        "Failed to save action. Please try again.";
      setSaveError(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Required":
        return COLORS.red;
      case "High":
        return COLORS.red;
      case "Medium":
        return COLORS.amber;
      case "Low":
        return COLORS.green;
      default:
        return COLORS.textMuted;
    }
  };

  const blueFilter =
    "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)";

  const projectDropdown = (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <Select
        value={selectedProjectId}
        onChange={(e) => handleProjectFilterChange(e.target.value)}
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

  return (
    <AdminLayout
      title="Actions"
      subtitle="Readiness actions management"
      headerAction={
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {projectDropdown}
          <Button
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
            sx={{
              bgcolor: COLORS.blue,
              color: COLORS.white,
              textTransform: "none",
              px: { xs: 1.5, sm: 2.5 },
              py: 1,
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              minWidth: { xs: "44px", sm: "auto" },
              justifyContent: "center",
              "&:hover": {
                bgcolor: COLORS.blueHover,
              },
              "& .MuiButton-startIcon": {
                mr: { xs: 0, sm: 1 },
                ml: { xs: 0, sm: 0 },
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Create Action
            </Box>
          </Button>
        </Box>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(4, 1fr)",
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
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 0.5,
              }}
            >
              Total Actions
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {computedStats.total}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: COLORS.blueBgMedium,
              borderRadius: "8px",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src={actionIcon}
              sx={{
                width: 20,
                height: 20,
                filter: blueFilter,
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
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 0.5,
              }}
            >
              Open
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {computedStats.open}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: COLORS.blueBgMedium,
              borderRadius: "8px",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ClockIcon sx={{ color: COLORS.blue, fontSize: 20 }} />
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 0.5,
              }}
            >
              Closed
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {computedStats.closed}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: "rgba(34, 197, 94, 0.15)",
              borderRadius: "8px",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleIcon sx={{ color: COLORS.green, fontSize: 20 }} />
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 0.5,
              }}
            >
              Overdue
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {computedStats.overdue}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: "rgba(239, 68, 68, 0.15)",
              borderRadius: "8px",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WarningIcon sx={{ color: COLORS.red, fontSize: 20 }} />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          p: 2,
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "stretch", lg: "center" },
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: COLORS.bgPrimary,
            borderRadius: "8px",
            p: 0.5,
          }}
        >
          {[
            { label: "All", value: "all" },
            { label: "Open", value: "open" },
            { label: "Closed", value: "closed" },
            { label: "Overdue", value: "overdue" },
          ].map((filter) => (
            <Box
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                bgcolor:
                  statusFilter === filter.value
                    ? COLORS.bgTertiary
                    : "transparent",
                color:
                  statusFilter === filter.value
                    ? COLORS.textPrimary
                    : COLORS.textSecondary,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor:
                    statusFilter === filter.value
                      ? COLORS.bgTertiary
                      : "rgba(255,255,255,0.05)",
                },
              }}
            >
              {filter.label}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: COLORS.bgPrimary,
            borderRadius: "8px",
            p: 0.5,
          }}
        >
          {[
            { label: "All Types", value: "all" },
            { label: "Required", value: "required" },
            { label: "Optional", value: "optional" },
          ].map((filter) => (
            <Box
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                bgcolor:
                  typeFilter === filter.value
                    ? COLORS.bgTertiary
                    : "transparent",
                color:
                  typeFilter === filter.value
                    ? COLORS.textPrimary
                    : COLORS.textSecondary,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor:
                    typeFilter === filter.value
                      ? COLORS.bgTertiary
                      : "rgba(255,255,255,0.05)",
                },
              }}
            >
              {filter.label}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flex: 1,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <TextField
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              flex: 1,
              width: { xs: "100%", sm: "auto" },
              "& .MuiOutlinedInput-root": {
                bgcolor: COLORS.bgPrimary,
                borderRadius: "8px",
                "& fieldset": { borderColor: COLORS.border },
                "&:hover fieldset": { borderColor: COLORS.border },
                "&.Mui-focused fieldset": { borderColor: COLORS.blue },
              },
              "& .MuiInputBase-input": {
                color: COLORS.textPrimary,
                fontSize: "13px",
                "&::placeholder": { color: COLORS.textMuted },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: COLORS.textMuted, fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            sx={{
              bgcolor: COLORS.blue,
              color: COLORS.white,
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
              minWidth: { xs: "100%", sm: "auto" },
              "&:hover": {
                bgcolor: COLORS.blueHover,
              },
            }}
          >
            Search
          </Button>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              IconComponent={ArrowDownIcon}
              sx={{
                bgcolor: COLORS.bgPrimary,
                borderRadius: "8px",
                color: COLORS.textSecondary,
                fontSize: "13px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.border,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.border,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.blue,
                },
                "& .MuiSvgIcon-root": { color: COLORS.textMuted },
              }}
            >
              <MenuItem value="due_date">Sort by Due Date</MenuItem>
              <MenuItem value="priority">Sort by Priority</MenuItem>
              <MenuItem value="status">Sort by Status</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: COLORS.bgPrimary,
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: COLORS.border,
              borderRadius: 4,
            },
          }}
        >
          <Box sx={{ minWidth: "max-content" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(90px, 0.8fr) minmax(180px, 2fr) minmax(120px, 1fr) minmax(80px, 0.7fr) minmax(130px, 1.2fr) minmax(100px, 1fr) minmax(70px, 0.7fr) minmax(80px, 0.8fr) minmax(70px, 0.6fr)",
                gap: 2,
                px: 3,
                py: 1.5,
                width: "100%",
                boxSizing: "border-box",
                borderBottom: `1px solid ${COLORS.border}`,
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
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {header}
                </Typography>
              ))}
            </Box>

            {actionsLoading ? (
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
            ) : filteredActions.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 8,
                }}
              >
                <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
                  No actions available
                </Typography>
              </Box>
            ) : null}
            {!actionsLoading &&
              filteredActions.map((action, index) => {
                const isOverdue =
                  action.status !== "Completed" &&
                  action.status !== "Cancelled" &&
                  new Date(action.dueDate) < new Date();
                const displayStatus = isOverdue ? "Overdue" : action.status;
                const statusColor = isOverdue
                  ? COLORS.red
                  : action.status === "Completed"
                    ? COLORS.green
                    : COLORS.blue;

                return (
                  <Box
                    key={`${action._id}-${index}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(90px, 0.8fr) minmax(180px, 2fr) minmax(120px, 1fr) minmax(80px, 0.7fr) minmax(130px, 1.2fr) minmax(100px, 1fr) minmax(70px, 0.7fr) minmax(80px, 0.8fr) minmax(70px, 0.6fr)",
                      gap: 2,
                      px: 3,
                      py: 2,
                      width: "100%",
                      boxSizing: "border-box",
                      borderBottom: `1px solid ${COLORS.border}`,
                      alignItems: "center",
                      "&:hover": { bgcolor: COLORS.bgTertiary },
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Typography sx={{ color: COLORS.blue, fontSize: "13px", textAlign: "center" }}>
                      {action._id.slice(-6).toUpperCase()}
                    </Typography>

                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                      }}
                    >
                      {action.title}
                    </Typography>

                    <Typography sx={{ color: COLORS.blue, fontSize: "13px", textAlign: "center" }}>
                      {action.linkedActivity?.activityId || "-"}
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Box
                        sx={{
                          bgcolor:
                            action.type === "Optional"
                              ? "rgba(34, 197, 94, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                          color:
                            action.type === "Optional"
                              ? COLORS.green
                              : COLORS.red,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 500,
                          textAlign: "center",
                          width: "fit-content",
                        }}
                      >
                        {action.type}
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          bgcolor: "#1E3A5F",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            color: COLORS.blue,
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          {action.assignee?.name
                            ? getInitials(action.assignee.name)
                            : "??"}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                      >
                        {action.assignee?.name || "Unassigned"}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "13px", textAlign: "center" }}
                    >
                      {action.dueDate
                        ? new Date(action.dueDate).toLocaleDateString()
                        : "-"}
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Box
                        sx={{
                          bgcolor: `${statusColor}20`,
                          color: statusColor,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 500,
                          textAlign: "center",
                          width: "fit-content",
                        }}
                      >
                        {displayStatus}
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Box
                        sx={{
                          bgcolor: `${getPriorityColor(action.priority)}20`,
                          color: getPriorityColor(action.priority),
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 500,
                          textAlign: "center",
                          width: "fit-content",
                        }}
                      >
                        {action.priority}
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <Box
                        component="img"
                        src={editIcon}
                        onClick={() => {
                          if (!isExecutionMode()) {
                            setToastMessage("Execution has not started yet. Please start execution first.");
                            setToastOpen(true);
                            return;
                          }
                          if (action.status === "Completed") return;
                          handleOpenEditModal(action);
                        }}
                        title={
                          !isExecutionMode()
                            ? "Execution has not started yet. Please start execution first."
                            : action.status === "Completed"
                              ? "Cannot edit completed action"
                              : "Edit action"
                        }
                        sx={{
                          width: 18,
                          height: 18,
                          cursor:
                            !isExecutionMode() || action.status === "Completed"
                              ? "not-allowed"
                              : "pointer",
                          opacity: !isExecutionMode() || action.status === "Completed" ? 0.3 : 0.6,
                          "&:hover": {
                            opacity: !isExecutionMode() || action.status === "Completed" ? 0.3 : 1,
                          },
                        }}
                      />
                      <Box
                        component="img"
                        src={frameIcon}
                        onClick={() => {
                          if (!isExecutionMode()) {
                            setToastMessage("Execution has not started yet. Please start execution first.");
                            setToastOpen(true);
                            return;
                          }
                          const assigneeId = String(action.assignee?._id || "");
                          const userId = String(user?.id || "");
                          const isAssignee =
                            assigneeId === userId && assigneeId !== "";
                          const canComplete =
                            user?.role === "admin" || isAssignee;

                          if (action.status !== "Completed" && canComplete) {
                            handleOpenCompleteConfirm(action);
                          }
                        }}
                        title={
                          !isExecutionMode()
                            ? "Execution has not started yet. Please start execution first."
                            : action.status === "Completed"
                              ? "Already completed"
                              : String(action.assignee?._id || "") !==
                                    String(user?.id || "") &&
                                  user?.role !== "admin"
                                ? "Only the assignee can complete this action"
                                : "Mark as complete"
                        }
                        sx={{
                          width: 18,
                          height: 18,
                          cursor:
                            !isExecutionMode() ||
                            action.status === "Completed" ||
                            (String(action.assignee?._id || "") !==
                              String(user?.id || "") &&
                              user?.role !== "admin")
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            !isExecutionMode()
                              ? 0.3
                              : action.status === "Completed"
                                ? 1
                                : String(action.assignee?._id || "") !==
                                      String(user?.id || "") &&
                                    user?.role !== "admin"
                                  ? 0.3
                                  : 0.6,
                          filter:
                            action.status === "Completed"
                              ? "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(5323%) hue-rotate(107deg) brightness(92%) contrast(88%)"
                              : "none",
                          "&:hover": {
                            opacity:
                              action.status === "Completed" ||
                              (String(action.assignee?._id || "") !==
                                String(user?.id || "") &&
                                user?.role !== "admin")
                                ? action.status === "Completed"
                                  ? 1
                                  : 0.3
                                : 1,
                            filter:
                              action.status !== "Completed" &&
                              (String(action.assignee?._id || "") ===
                                String(user?.id || "") ||
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
              })}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
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
              border: `1px solid ${COLORS.white}`,
              borderRadius: "12px",
              backgroundImage: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              maxWidth: 480,
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
            pt: 1,
            borderBottom: `1px solid ${COLORS.white}`,
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
              {editingAction ? "Edit Action" : "Create New Action"}
            </Typography>
            {editingAction && (
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                {editingAction._id.slice(-6).toUpperCase()}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleCloseModal}
            sx={{ color: COLORS.textMuted, mr: -1, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3 }}>
          {/* Error Message */}
          {saveError && (
            <Box
              sx={{
                bgcolor: "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${COLORS.red}`,
                borderRadius: "8px",
                p: 2,
                mb: 2,
              }}
            >
              <Typography sx={{ color: COLORS.red, fontSize: "14px" }}>
                {saveError}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Project Selection */}
            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                  mt: 2,
                }}
              >
                Project <span style={{ color: COLORS.red }}>*</span>
              </Typography>
              <Select
                fullWidth
                value={formData.selectedProject}
                onChange={(e) => handleProjectChange(e.target.value)}
                displayEmpty
                IconComponent={ArrowDownIcon}
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                    borderWidth: 1,
                  },
                  "& .MuiSelect-select": {
                    color: formData.selectedProject
                      ? COLORS.textPrimary
                      : COLORS.textMuted,
                    fontSize: "14px",
                    py: 1.2,
                  },
                  "& .MuiSvgIcon-root": {
                    color: COLORS.textSecondary,
                  },
                }}
                MenuProps={{
                  slotProps: {
                    paper: {
                      sx: {
                        bgcolor: COLORS.bgSecondary,
                        border: `1px solid ${COLORS.borderLight}`,
                        borderRadius: "8px",
                        mt: 0.5,
                        "& .MuiMenuItem-root": {
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          "&:hover": {
                            bgcolor: COLORS.bgTertiary,
                          },
                          "&.Mui-selected": {
                            bgcolor: COLORS.blueBgMedium,
                            "&:hover": {
                              bgcolor: COLORS.blueBgHover,
                            },
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select project...
                </MenuItem>
                {(projects || []).map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Linked Activity Selection */}
            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
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
                value={formData.linkedActivity}
                onChange={(e) =>
                  setFormData({ ...formData, linkedActivity: e.target.value })
                }
                displayEmpty
                disabled={!formData.selectedProject}
                IconComponent={ArrowDownIcon}
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                    borderWidth: 1,
                  },
                  "& .MuiSelect-select": {
                    color: formData.linkedActivity
                      ? COLORS.textPrimary
                      : COLORS.textMuted,
                    fontSize: "14px",
                    py: 1.2,
                  },
                  "& .MuiSvgIcon-root": {
                    color: COLORS.textSecondary,
                  },
                  "&.Mui-disabled": {
                    bgcolor: COLORS.bgTertiary,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.border,
                    },
                  },
                }}
                MenuProps={{
                  autoFocus: false,
                  disablePortal: true,
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  slotProps: {
                    paper: {
                      sx: {
                        bgcolor: COLORS.bgSecondary,
                        border: `1px solid ${COLORS.borderLight}`,
                        borderRadius: "8px",
                        mt: 0.5,
                        maxHeight: 250,
                        width: "20%",
                        "& .MuiMenuItem-root": {
                          color: COLORS.textPrimary,
                          fontSize: "13px",
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                          lineHeight: 1.4,
                          py: 1,
                          "&:hover": {
                            bgcolor: COLORS.bgTertiary,
                          },
                          "&.Mui-selected": {
                            bgcolor: COLORS.blueBgMedium,
                            "&:hover": {
                              bgcolor: COLORS.blueBgHover,
                            },
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  {!formData.selectedProject
                    ? "Select a project first..."
                    : activitiesLoading && activities.length === 0
                      ? "Loading activities..."
                      : (activities || []).length === 0
                        ? "No activities found"
                        : "Select activity..."}
                </MenuItem>
                {(activities || []).map((activity) => (
                  <MenuItem
                    key={activity.activityId}
                    value={activity.activityId}
                  >
                    {activity.activityId} - {activity.activityName}
                  </MenuItem>
                ))}
                {/* Pagination inside dropdown */}
                {formData.selectedProject &&
                  activitiesPagination.totalPages > 1 && (
                    <ListSubheader
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        py: 1,
                        px: 1,
                        borderTop: `1px solid ${COLORS.border}`,
                        mt: 1,
                        position: "sticky",
                        bottom: 0,
                        bgcolor: COLORS.bgSecondary,
                        lineHeight: "normal",
                      }}
                    >
                      <Box
                        component="span"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (
                            activitiesPagination.hasPrevPage &&
                            !activitiesLoading
                          ) {
                            handlePageChange(
                              activitiesPagination.currentPage - 1,
                            );
                          }
                        }}
                        sx={{
                          px: 1,
                          py: 0.5,
                          fontSize: "11px",
                          color: activitiesPagination.hasPrevPage
                            ? COLORS.blue
                            : COLORS.textMuted,
                          cursor: activitiesPagination.hasPrevPage
                            ? "pointer"
                            : "not-allowed",
                          borderRadius: "4px",
                          "&:hover": {
                            bgcolor: activitiesPagination.hasPrevPage
                              ? COLORS.bgTertiary
                              : "transparent",
                          },
                        }}
                      >
                        ← Prev
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                        }}
                      >
                        {Array.from(
                          {
                            length: Math.min(
                              5,
                              activitiesPagination.totalPages,
                            ),
                          },
                          (_, i) => {
                            let pageNum;
                            const totalPages = activitiesPagination.totalPages;
                            const currentPage =
                              activitiesPagination.currentPage;

                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Box
                                key={pageNum}
                                component="span"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!activitiesLoading) {
                                    handlePageChange(pageNum);
                                  }
                                }}
                                sx={{
                                  width: 22,
                                  height: 22,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight:
                                    pageNum === currentPage ? 600 : 400,
                                  cursor: activitiesLoading
                                    ? "not-allowed"
                                    : "pointer",
                                  bgcolor:
                                    pageNum === currentPage
                                      ? COLORS.blue
                                      : "transparent",
                                  color:
                                    pageNum === currentPage
                                      ? COLORS.white
                                      : COLORS.textSecondary,
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    bgcolor:
                                      pageNum === currentPage
                                        ? COLORS.blue
                                        : COLORS.bgTertiary,
                                  },
                                }}
                              >
                                {pageNum}
                              </Box>
                            );
                          },
                        )}
                      </Box>

                      <Box
                        component="span"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (
                            activitiesPagination.hasNextPage &&
                            !activitiesLoading
                          ) {
                            handlePageChange(
                              activitiesPagination.currentPage + 1,
                            );
                          }
                        }}
                        sx={{
                          px: 1,
                          py: 0.5,
                          fontSize: "11px",
                          color: activitiesPagination.hasNextPage
                            ? COLORS.blue
                            : COLORS.textMuted,
                          cursor: activitiesPagination.hasNextPage
                            ? "pointer"
                            : "not-allowed",
                          borderRadius: "4px",
                          "&:hover": {
                            bgcolor: activitiesPagination.hasNextPage
                              ? COLORS.bgTertiary
                              : "transparent",
                          },
                        }}
                      >
                        Next →
                      </Box>

                      {activitiesLoading && (
                        <CircularProgress
                          size={12}
                          sx={{ color: COLORS.blue, ml: 0.5 }}
                        />
                      )}
                    </ListSubheader>
                  )}
              </Select>
            </Box>

            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
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
                placeholder="Enter action title..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.white,
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

            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
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
                placeholder="Describe the action required..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
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

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: { xs: 0, sm: 2 },
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
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
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  IconComponent={ArrowDownIcon}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                    "& .MuiSelect-select": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      py: 1.2,
                    },
                    "& .MuiSvgIcon-root": {
                      color: COLORS.textSecondary,
                    },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: COLORS.bgSecondary,
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: "8px",
                          mt: 0.5,
                          "& .MuiMenuItem-root": {
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            "&:hover": {
                              bgcolor: COLORS.bgTertiary,
                            },
                            "&.Mui-selected": {
                              bgcolor: COLORS.blueBgMedium,
                              "&:hover": {
                                bgcolor: COLORS.blueBgHover,
                              },
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
                    color: COLORS.border,
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
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  IconComponent={ArrowDownIcon}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                    "& .MuiSelect-select": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      py: 1.2,
                    },
                    "& .MuiSvgIcon-root": {
                      color: COLORS.textSecondary,
                    },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: COLORS.bgSecondary,
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: "8px",
                          mt: 0.5,
                          "& .MuiMenuItem-root": {
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            "&:hover": {
                              bgcolor: COLORS.bgTertiary,
                            },
                            "&.Mui-selected": {
                              bgcolor: COLORS.blueBgMedium,
                              "&:hover": {
                                bgcolor: COLORS.blueBgHover,
                              },
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="Required">Required</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: { xs: 0, sm: 2 },
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
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
                  value={formData.assignee}
                  onChange={(e) =>
                    setFormData({ ...formData, assignee: e.target.value })
                  }
                  displayEmpty
                  IconComponent={ArrowDownIcon}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                    "& .MuiSelect-select": {
                      color: formData.assignee
                        ? COLORS.textPrimary
                        : COLORS.textMuted,
                      fontSize: "14px",
                      py: 1.2,
                    },
                    "& .MuiSvgIcon-root": {
                      color: COLORS.textSecondary,
                    },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: COLORS.bgSecondary,
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: "8px",
                          mt: 0.5,
                          "& .MuiMenuItem-root": {
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            "&:hover": {
                              bgcolor: COLORS.bgTertiary,
                            },
                            "&.Mui-selected": {
                              bgcolor: COLORS.blueBgMedium,
                              "&:hover": {
                                bgcolor: COLORS.blueBgHover,
                              },
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
                    color: COLORS.border,
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
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment
                          position="end"
                          sx={{ cursor: "pointer" }}
                          onClick={(e) => {
                            const input =
                              e.currentTarget.parentElement?.querySelector(
                                "input",
                              ) as HTMLInputElement;
                            if (input) {
                              input.showPicker?.();
                              input.focus();
                            }
                          }}
                        >
                          <CalendarIcon
                            sx={{ color: COLORS.textSecondary, fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& fieldset": {
                        borderColor: COLORS.white,
                      },
                      "&:hover fieldset": {
                        borderColor: COLORS.white,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: COLORS.white,
                        borderWidth: 1,
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: formData.dueDate
                        ? COLORS.textPrimary
                        : COLORS.textMuted,
                      fontSize: "14px",
                      py: 1.2,
                      clipPath: "inset(0 40px 0 0)",
                      "&::-webkit-date-and-time-value": {
                        textAlign: "left",
                      },
                      "&::-webkit-calendar-picker-indicator": {
                        display: "none",
                        WebkitAppearance: "none",
                      },
                      "&::-webkit-inner-spin-button": {
                        display: "none",
                      },
                      "&::-webkit-clear-button": {
                        display: "none",
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Status row - only show when editing */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: editingAction
                  ? { xs: "1fr", sm: "1fr 1fr" }
                  : "1fr",
                gap: { xs: 0, sm: 2 },
              }}
            >
              {editingAction && (
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.border,
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
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    IconComponent={ArrowDownIcon}
                    sx={{
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.white,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.white,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.white,
                        borderWidth: 1,
                      },
                      "& .MuiSelect-select": {
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        py: 1.2,
                      },
                      "& .MuiSvgIcon-root": {
                        color: COLORS.textSecondary,
                      },
                    }}
                    MenuProps={{
                      slotProps: {
                        paper: {
                          sx: {
                            bgcolor: COLORS.bgSecondary,
                            border: `1px solid ${COLORS.borderLight}`,
                            borderRadius: "8px",
                            mt: 0.5,
                            "& .MuiMenuItem-root": {
                              color: COLORS.textPrimary,
                              fontSize: "14px",
                              "&:hover": {
                                bgcolor: COLORS.bgTertiary,
                              },
                              "&.Mui-selected": {
                                bgcolor: COLORS.blueBgMedium,
                                "&:hover": {
                                  bgcolor: COLORS.blueBgHover,
                                },
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
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${COLORS.white}`,
            gap: 1.5,
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button
            onClick={handleCloseModal}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.bgPrimary,
              border: `1px solid ${COLORS.white}`,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 400,
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAction}
            disabled={saveLoading}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.blue,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                bgcolor: COLORS.blueHover,
              },
              "&:disabled": {
                bgcolor: COLORS.blue,
                opacity: 0.7,
              },
            }}
          >
            {saveLoading ? (
              <CircularProgress size={20} sx={{ color: COLORS.white }} />
            ) : editingAction ? (
              "Update"
            ) : (
              "Save Action"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={handleCloseDetailDrawer}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 400 },
              bgcolor: COLORS.bgSecondary,
              borderLeft: `1px solid ${COLORS.border}`,
            },
          },
        }}
      >
        {viewingAction && (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Box
              sx={{
                pt: 2.5,
                px: 2.5,
                pb: 1,
                borderBottom: `1px solid ${COLORS.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  sx={{ color: COLORS.blue, fontSize: "14px", fontWeight: 500 }}
                >
                  {viewingAction._id.slice(-6).toUpperCase()}
                </Typography>
                <Box
                  sx={{
                    bgcolor: COLORS.blueBgMedium,
                    color: COLORS.blue,
                    px: 1.5,
                    py: 0.25,
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {viewingAction.status}
                </Box>
              </Box>
              <IconButton
                onClick={handleCloseDetailDrawer}
                sx={{ color: COLORS.textMuted, p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", pb: 1, px: 2.5, pt: 1 }}>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "18px",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                {viewingAction.title}
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  mb: 1,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      mb: 1,
                    }}
                  >
                    TYPE
                  </Typography>
                  <Box
                    sx={{
                      bgcolor:
                        viewingAction.type === "Optional"
                          ? "rgba(34, 197, 94, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      color:
                        viewingAction.type === "Optional"
                          ? COLORS.green
                          : COLORS.red,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 500,
                      display: "inline-block",
                    }}
                  >
                    {viewingAction.type}
                  </Box>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      mb: 1,
                    }}
                  >
                    PRIORITY
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: `${getPriorityColor(viewingAction.priority)}20`,
                      color: getPriorityColor(viewingAction.priority),
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 500,
                      display: "inline-block",
                    }}
                  >
                    {viewingAction.priority}
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      mb: 1,
                    }}
                  >
                    ASSIGNEE
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
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
                          fontSize: "10px",
                          fontWeight: 600,
                        }}
                      >
                        {viewingAction.assignee?.name
                          ? getInitials(viewingAction.assignee.name)
                          : "??"}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                    >
                      {viewingAction.assignee?.name || "Unassigned"}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      mb: 1,
                    }}
                  >
                    DUE DATE
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {viewingAction.dueDate
                      ? new Date(viewingAction.dueDate).toLocaleDateString()
                      : "-"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 1,
                  }}
                >
                  LINKED ACTIVITY
                </Typography>
                <Box
                  sx={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: COLORS.bgPrimary,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.blue,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {viewingAction.linkedActivity?.activityId || "-"}
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "13px",
                      ml: 1,
                    }}
                  >
                    {viewingAction.linkedActivity?.activityName || ""}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 1,
                  }}
                >
                  DESCRIPTION
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  {viewingAction.description}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 2,
                  }}
                >
                  STATUS TIMELINE
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {/* Created event */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          bgcolor: COLORS.blue,
                          flexShrink: 0,
                          my: 1,
                        }}
                      />
                      {viewingAction.status === "Completed" && (
                        <Box
                          sx={{
                            width: "1px",
                            height: 30,
                            bgcolor: COLORS.bgTertiary,
                          }}
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        minHeight: 50,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "16px",
                          fontWeight: 500,
                          lineHeight: 1.3,
                        }}
                      >
                        Action Created
                      </Typography>
                      <Typography
                        sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                      >
                        {viewingAction.createdAt
                          ? new Date(
                              viewingAction.createdAt,
                            ).toLocaleDateString()
                          : "-"}{" "}
                        · {viewingAction.createdBy?.name || "System"}
                      </Typography>
                    </Box>
                  </Box>
                  {/* Completed event - only show if status is Completed */}
                  {viewingAction.status === "Completed" && (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            bgcolor: COLORS.green,
                            flexShrink: 0,
                            my: 1,
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          minHeight: 50,
                        }}
                      >
                        <Typography
                          sx={{
                            color: COLORS.textPrimary,
                            fontSize: "16px",
                            fontWeight: 500,
                            lineHeight: 1.3,
                          }}
                        >
                          Action Completed
                        </Typography>
                        <Typography
                          sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                        >
                          Closed
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 1.5,
                  }}
                >
                  EVEDENCE & ATTACHMENTS
                </Typography>
                <Box
                  sx={{
                    border: `2px dashed ${COLORS.bgTertiary}`,
                    borderRadius: "12px",
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: COLORS.textMuted,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={uploadIcon}
                    sx={{
                      width: 32,
                      height: 32,
                      mb: 1.5,
                      opacity: 0.5,
                    }}
                  />
                  <Typography
                    sx={{
                      color: COLORS.white,
                      fontSize: "14px",
                      mb: 0.5,
                    }}
                  >
                    Drop files here or click to upload
                  </Typography>
                  <Typography sx={{ color: COLORS.white, fontSize: "12px" }}>
                    PDF, Images, Documents up to 10MB
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                p: 2.5,
                borderTop: `1px solid ${COLORS.border}`,
                display: "flex",
                gap: 1.5,
              }}
            >
              <Button
                startIcon={<TimeIcon />}
                onClick={handleCloseAction}
                sx={{
                  flex: 1,
                  bgcolor: COLORS.green,
                  color: COLORS.white,
                  textTransform: "none",
                  py: 1.5,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: "#16a34a",
                  },
                }}
              >
                Close Action
              </Button>
              <Button
                onClick={handleEditFromDrawer}
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  color: COLORS.textPrimary,
                  border: `1px solid ${COLORS.border}`,
                  textTransform: "none",
                  px: 3,
                  py: 1.5,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: COLORS.bgTertiary,
                  },
                }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

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
                src={frameIcon}
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
    </AdminLayout>
  );
};

export default AdminActions;
