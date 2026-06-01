import { useState, useEffect } from "react";
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  KeyboardArrowDown as ArrowDownIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import PlannerLayout from "../../layouts/PlannerLayout";
import ActivitiesLookahead from "../../components/ActivitiesLookahead";
import type { Activity } from "../../components/ActivitiesTable";
import { COLORS } from "../../constants/colors";
import { projectAPI, programmeAPI, userAPI, actionAPI } from "../../services/api";

interface Project {
  _id: string;
  name: string;
  phase: string;
  status: string;
}

interface WeekData {
  week: number;
  dateRange: string;
  color: "green" | "amber" | "red";
  isCurrent: boolean;
}

interface ProgrammeActivity {
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
  owner?: string;
  ownerName?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Action {
  _id: string;
  title: string;
  status: string;
  dueDate?: string;
  assignee?: { _id?: string; name?: string };
  linkedActivity?: { activityId?: string; activityName?: string };
}

// Helper to generate owner avatar color based on name
const getOwnerColor = (name: string): string => {
  const colors = ["#22C55E", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899"];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Helper to get initials from name
const getInitials = (name: string): string => {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper to format date for display (handles DD-MMM-YY and ISO formats)
const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return "";

  const months: { [key: string]: number } = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  // Clean suffix like " A" or " *" (indicates actual/completed)
  const cleanDate = dateStr.replace(/\s*[A*]$/, "").trim();

  // Handle DD-MMM-YY format (e.g., "10-May-26")
  const ddMmmYyMatch = cleanDate.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);
  if (ddMmmYyMatch) {
    const day = parseInt(ddMmmYyMatch[1]);
    const month = months[ddMmmYyMatch[2]];
    let year = parseInt(ddMmmYyMatch[3]);
    year = year < 50 ? 2000 + year : 1900 + year;
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return cleanDate;
  }

  // Handle ISO datetime format (e.g., "2026-05-10T00:00:00.000Z")
  const isoMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Fallback: try native Date parsing with UTC methods to avoid timezone shift
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fall through to return original string
  }

  return dateStr;
};

// Helper to determine status badge color based on activity status
const getStatusType = (activityStatus: string): string => {
  switch (activityStatus?.toLowerCase()) {
    case "blocked":
      return "red";
    case "at risk":
      return "amber";
    case "ready":
    default:
      return "green";
  }
};

// Helper to get display status
const getDisplayStatus = (activityStatus: string): string => {
  if (activityStatus === "Blocked") return "Blocked";
  if (activityStatus === "At Risk") return "At Risk";
  return "Ready";
};

// Helper to parse date strings
const parseDate = (dateStr: string): Date | null => {
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

// Helper to calculate RAG zone based on dates
const calculateRagZone = (
  startDate: string,
  finishDate: string,
  activityStatus?: string
): { zone: string; color: "green" | "amber" | "red" | "muted" } => {
  // Check if completed
  const isCompleted =
    activityStatus === "Complete" ||
    activityStatus === "Completed" ||
    startDate?.includes(" A") ||
    finishDate?.includes(" A");

  if (isCompleted) {
    return { zone: "Complete", color: "green" };
  }

  if (!startDate) return { zone: "N/A", color: "muted" };

  const start = parseDate(startDate);
  const finish = parseDate(finishDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!start) return { zone: "N/A", color: "muted" };

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / msPerDay);
  const weeksUntilStart = Math.ceil(daysUntilStart / 7);

  // Already started
  if (daysUntilStart < 0) {
    // Check if overdue (finish date passed)
    if (finish && finish < today) {
      return { zone: "Overdue", color: "red" };
    }
    return { zone: "In Progress", color: "green" };
  }

  // Future activities - classify by weeks
  if (weeksUntilStart <= 2) {
    return { zone: "Weeks 1-2", color: "green" };
  } else if (weeksUntilStart <= 4) {
    return { zone: "Weeks 3-4", color: "amber" };
  } else if (weeksUntilStart <= 6) {
    return { zone: "Weeks 5-6", color: "red" };
  } else {
    // More than 6 weeks out - show muted/gray color
    return { zone: `${weeksUntilStart} Weeks`, color: "muted" };
  }
};

const PlannerActivities = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [programmeId, setProgrammeId] = useState<string>("");
  const [programmeActions, setProgrammeActions] = useState<Action[]>([]);

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningActivity, setAssigningActivity] = useState<Activity | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [assignFormData, setAssignFormData] = useState({
    title: "",
    type: "Required",
    priority: "Medium",
    assignee: "",
    dueDate: "",
  });
  const [assignSaveLoading, setAssignSaveLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch users for assign dropdown (only active planners)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userAPI.getAll({ status: "active" });
        if (res.success) {
          // Filter to only show active planners
          const activePlanners = (res.users || []).filter(
            (user: User) => user.role === "planner" && user.status === "active"
          );
          setUsers(activePlanners);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch actions when programmeId changes
  useEffect(() => {
    const fetchActions = async () => {
      if (!programmeId) {
        setProgrammeActions([]);
        return;
      }

      try {
        const response = await actionAPI.getByProgramme(programmeId);
        if (response.success && response.actions) {
          setProgrammeActions(response.actions);
        }
      } catch (error) {
        console.error("Error fetching actions:", error);
        setProgrammeActions([]);
      }
    };

    fetchActions();
  }, [programmeId]);

  // Helper to get actions for a specific activity
  const getActionsForActivity = (activityId: string): Action[] => {
    return programmeActions.filter(
      (action) => action.linkedActivity?.activityId === activityId
    );
  };

  // Update activities with linked actions when programmeActions changes
  useEffect(() => {
    if (activities.length > 0 && programmeActions.length > 0) {
      setActivities((prevActivities) =>
        prevActivities.map((activity) => ({
          ...activity,
          linkedActionsData: getActionsForActivity(activity.id).map((a) => ({
            _id: a._id,
            title: a.title,
            status: a.status,
            dueDate: a.dueDate,
            assignee: a.assignee,
          })),
        }))
      );
    }
  }, [programmeActions]);

  // Fetch programme data when project changes
  useEffect(() => {
    const fetchProgrammeData = async () => {
      if (!selectedProjectId) {
        setActivities([]);
        setWeeks([]);
        setProgrammeId("");
        return;
      }

      try {
        setIsLoadingActivities(true);
        const response = await programmeAPI.getByProject(selectedProjectId);

        if (response.success && response.programme) {
          const programme = response.programme;
          setProgrammeId(programme._id);
          const programmeActivities: ProgrammeActivity[] =
            programme.extractedData?.activities || [];

          // Get the uploader name from the programme
          const uploaderName = programme.uploadedBy?.name || "Planner";

          // Transform activities to match the Activity interface
          const transformedActivities: Activity[] = programmeActivities.map(
            (a, index) => {
              // Calculate RAG zone based on dates (always returns green, amber, or red)
              const ragZoneData = calculateRagZone(
                a.startDate || "",
                a.finishDate || "",
                a.activityStatus
              );

              return {
                id: a.activityId || `ACT-${String(index + 1).padStart(3, "0")}`,
                name: a.activityName || "",
                startDate: formatDateForDisplay(a.startDate || ""),
                endDate: formatDateForDisplay(a.finishDate || ""),
                duration: a.duration || "",
                ragZone: ragZoneData.zone,
                ragColor: ragZoneData.color,
                actions: a.actionsCount || 0,
                status: getDisplayStatus(a.activityStatus || ""),
                statusType: getStatusType(a.activityStatus || ""),
                owner: {
                  initials: getInitials(uploaderName),
                  name: uploaderName,
                  color: getOwnerColor(uploaderName),
                },
              };
            }
          );

          setActivities(transformedActivities);

          // Generate week zones from programme's earliest activity start date
          if (programmeActivities.length > 0) {
            // Find earliest activity start date
            let earliestDate: Date | null = null;
            for (const a of programmeActivities) {
              if (a.startDate) {
                const parsed = parseDate(a.startDate);
                if (parsed && (!earliestDate || parsed < earliestDate)) {
                  earliestDate = parsed;
                }
              }
            }

            if (earliestDate !== null) {
              // Get Monday of the week containing the earliest date
              const progStartDate = earliestDate as Date;
              const dayOfWeek = progStartDate.getDay();
              const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
              const programmeStartMonday = new Date(progStartDate);
              programmeStartMonday.setDate(progStartDate.getDate() + diffToMonday);
              programmeStartMonday.setHours(0, 0, 0, 0);

              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const generatedWeeks: WeekData[] = [];
              for (let i = 0; i < 6; i++) {
                const weekStart = new Date(programmeStartMonday);
                weekStart.setDate(programmeStartMonday.getDate() + i * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                // Check if today falls within this week
                const isCurrent = today >= weekStart && today <= weekEnd;

                const formatDate = (d: Date) =>
                  `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en-US", { month: "short" })}`;

                generatedWeeks.push({
                  week: i + 1,
                  dateRange: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
                  color: i < 2 ? "green" : i < 4 ? "amber" : "red",
                  isCurrent,
                });
              }
              setWeeks(generatedWeeks);
            }
          }

          // Set last updated timestamp
          const now = new Date();
          setLastUpdated(
            now.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }) +
              ", " +
              now.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
          );
        } else {
          // No programme found for this project
          setActivities([]);
          setWeeks([]);
          setProgrammeId("");
        }
      } catch (error) {
        console.error("Error fetching programme data:", error);
        setActivities([]);
        setWeeks([]);
        setProgrammeId("");
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchProgrammeData();
  }, [selectedProjectId]);

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProjectId(event.target.value);
  };

  const handleAssignClick = (activity: Activity) => {
    setAssigningActivity(activity);
    setAssignFormData({
      title: "",
      type: "Required",
      priority: "Medium",
      assignee: "",
      dueDate: activity.startDate || "",
    });
    setAssignError("");
    setAssignModalOpen(true);
  };

  const handleAssignClose = () => {
    setAssignModalOpen(false);
    setAssigningActivity(null);
    setAssignFormData({
      title: "",
      type: "Required",
      priority: "Medium",
      assignee: "",
      dueDate: "",
    });
    setAssignError("");
  };

  const handleAssignChange = (field: string, value: string) => {
    setAssignFormData({ ...assignFormData, [field]: value });
  };

  const handleAssignSave = async () => {
    if (!assigningActivity || !programmeId) return;

    setAssignError("");

    if (!assignFormData.title || !assignFormData.assignee || !assignFormData.dueDate) {
      setAssignError("Please fill in all required fields (Title, Assignee, Due Date)");
      return;
    }

    setAssignSaveLoading(true);
    try {
      const response = await actionAPI.create({
        programmeId,
        linkedActivity: {
          activityId: assigningActivity.id,
          activityName: assigningActivity.name,
        },
        title: assignFormData.title,
        type: assignFormData.type,
        priority: assignFormData.priority,
        assignee: assignFormData.assignee,
        dueDate: assignFormData.dueDate,
      });

      if (response.success) {
        handleAssignClose();
        // Refresh actions data to show the new assignment
        const actionsResponse = await actionAPI.getByProgramme(programmeId);
        if (actionsResponse.success && actionsResponse.actions) {
          setProgrammeActions(actionsResponse.actions);
        }
        // Refresh the activities data
        const progResponse = await programmeAPI.getByProject(selectedProjectId);
        if (progResponse.success && progResponse.programme) {
          const programmeActivities: ProgrammeActivity[] =
            progResponse.programme.extractedData?.activities || [];
          const uploaderName = progResponse.programme.uploadedBy?.name || "Planner";
          const freshActions = actionsResponse?.actions || [];
          const transformedActivities: Activity[] = programmeActivities.map(
            (a, index) => {
              // Calculate RAG zone based on dates (always returns green, amber, or red)
              const ragZoneData = calculateRagZone(
                a.startDate || "",
                a.finishDate || "",
                a.activityStatus
              );

              const activityId = a.activityId || `ACT-${String(index + 1).padStart(3, "0")}`;
              const linkedActions = freshActions.filter(
                (action: Action) => action.linkedActivity?.activityId === activityId
              );

              return {
                id: activityId,
                name: a.activityName || "",
                startDate: formatDateForDisplay(a.startDate || ""),
                endDate: formatDateForDisplay(a.finishDate || ""),
                duration: a.duration || "",
                ragZone: ragZoneData.zone,
                ragColor: ragZoneData.color,
                actions: a.actionsCount || 0,
                status: getDisplayStatus(a.activityStatus || ""),
                statusType: getStatusType(a.activityStatus || ""),
                owner: {
                  initials: getInitials(uploaderName),
                  name: uploaderName,
                  color: getOwnerColor(uploaderName),
                },
                linkedActionsData: linkedActions.map((act: Action) => ({
                  _id: act._id,
                  title: act.title,
                  status: act.status,
                  dueDate: act.dueDate,
                  assignee: act.assignee,
                })),
              };
            }
          );
          setActivities(transformedActivities);
        }
      }
    } catch (error: unknown) {
      console.error("Failed to create action:", error);
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.error || err?.message || "Failed to create action. Please try again.";
      setAssignError(errorMessage);
    } finally {
      setAssignSaveLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <PlannerLayout
        title="Activities & Lookahead"
        subtitle="Manage project activities and lookahead planning"
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      </PlannerLayout>
    );
  }

  return (
    <PlannerLayout
      title="Activities & Lookahead"
      subtitle="Manage project activities and lookahead planning"
      headerAction={projectDropdown}
    >
      {isLoadingActivities ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
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
      ) : activities.length === 0 ? (
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
            Upload a programme PDF to see activities.
          </Typography>
        </Box>
      ) : (
        <ActivitiesLookahead
          activities={activities}
          weeks={weeks}
          lastUpdated={lastUpdated}
          onAssignClick={handleAssignClick}
        />
      )}

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
              {assigningActivity?.id}
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
                  {assigningActivity?.name || "Unknown Activity"}
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

            {/* Type | Priority row */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
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
                    "& .MuiSvgIcon-root": {
                      color: COLORS.textSecondary,
                    },
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
                  <MenuItem value="Informational">Informational</MenuItem>
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
                  onChange={(e) => handleAssignChange("priority", e.target.value)}
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
                    "& .MuiSvgIcon-root": {
                      color: COLORS.textSecondary,
                    },
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
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
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
                  onChange={(e) => handleAssignChange("assignee", e.target.value)}
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
                    "& .MuiSvgIcon-root": {
                      color: COLORS.textSecondary,
                    },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: COLORS.bgSecondary,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "8px",
                          maxHeight: 300,
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
                    Select assignee...
                  </MenuItem>
                  {users
                    .filter((u) => u.status === "active")
                    .map((u) => (
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
                  onChange={(e) => handleAssignChange("dueDate", e.target.value)}
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
              px: 2,
              py: 1,
              fontSize: "14px",
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
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              minWidth: 80,
              "&:hover": {
                bgcolor: COLORS.blueHover,
              },
              "&.Mui-disabled": {
                bgcolor: COLORS.blueDisabled,
                color: "rgba(255, 255, 255, 0.5)",
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
    </PlannerLayout>
  );
};

export default PlannerActivities;
