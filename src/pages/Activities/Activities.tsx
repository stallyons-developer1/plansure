import { useState, useEffect } from "react";
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { KeyboardArrowDown as ArrowDownIcon } from "@mui/icons-material";
import DashboardLayout from "../../layouts/DashboardLayout";
import ActivitiesLookahead from "../../components/ActivitiesLookahead";
import type { Activity } from "../../components/ActivitiesTable";
import { COLORS } from "../../constants/colors";
import { projectAPI, programmeAPI, actionAPI } from "../../services/api";

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

  const cleanDate = dateStr.replace(/\s*[A*]$/, "").trim();

  const ddMmmYyMatch = cleanDate.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);
  if (ddMmmYyMatch) {
    const day = parseInt(ddMmmYyMatch[1]);
    const month = months[ddMmmYyMatch[2]];
    let year = parseInt(ddMmmYyMatch[3]);
    year = year < 50 ? 2000 + year : 1900 + year;
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return cleanDate;
  }

  const isoMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

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
    case "complete":
    case "completed":
      return "blue";
    case "blocked":
      return "red";
    case "at risk":
      return "amber";
    case "action open":
      return "blue";
    case "action overdue":
      return "red";
    case "ready":
    default:
      return "green";
  }
};

// Helper to get display status
const getDisplayStatus = (activityStatus: string): string => {
  if (activityStatus === "Complete" || activityStatus === "Completed") return "Completed";
  if (activityStatus === "Blocked") return "Blocked";
  if (activityStatus === "At Risk") return "At Risk";
  if (activityStatus === "Action Open") return "Action Open";
  if (activityStatus === "Action Overdue") return "Action Overdue";
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

// Helper to calculate RAG zone based on dates (calculated from today)
const calculateRagZone = (
  startDate: string,
  finishDate: string,
  activityStatus?: string
): { zone: string; color: "green" | "amber" | "red" | "muted" | "blue" } => {
  const isCompleted =
    activityStatus === "Complete" ||
    activityStatus === "Completed" ||
    startDate?.includes(" A") ||
    finishDate?.includes(" A");

  if (isCompleted) {
    return { zone: "Completed", color: "blue" };
  }

  if (!startDate) return { zone: "N/A", color: "muted" };

  const start = parseDate(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!start) return { zone: "N/A", color: "muted" };

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysFromToday = Math.floor((start.getTime() - today.getTime()) / msPerDay);
  const weeksUntilStart = Math.floor(daysFromToday / 7) + 1;
  if (weeksUntilStart <= 2) {
    return { zone: "Weeks 1-2", color: "green" };
  } else if (weeksUntilStart <= 4) {
    return { zone: "Weeks 3-4", color: "amber" };
  } else if (weeksUntilStart <= 6) {
    return { zone: "Weeks 5-6", color: "red" };
  } else {
    return { zone: `${weeksUntilStart} Weeks`, color: "muted" };
  }
};

const Activities = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [programmeId, setProgrammeId] = useState<string>("");
  const [programmeActions, setProgrammeActions] = useState<Action[]>([]);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const res = await projectAPI.getAll();
        if (res.success) {
          const projectsList = res.projects || [];
          setProjects(projectsList);
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

  // Fetch actions when programmeId changes (read-only display)
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

  // Attach linked actions to activities for display
  useEffect(() => {
    if (activities.length > 0 && programmeActions.length > 0) {
      setActivities((prevActivities) =>
        prevActivities.map((activity) => ({
          ...activity,
          linkedActionsData: programmeActions
            .filter((a) => a.linkedActivity?.activityId === activity.id)
            .map((a) => ({
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

          const uploaderName = programme.uploadedBy?.name || "Planner";

          const transformedActivities: Activity[] = programmeActivities.map(
            (a, index) => {
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

          // Generate week zones from today (6-week lookahead)
          if (programmeActivities.length > 0) {
            const todayForWeeks = new Date();
            todayForWeeks.setHours(0, 0, 0, 0);

            const generatedWeeks: WeekData[] = [];
            for (let i = 0; i < 6; i++) {
              const weekStartDate = new Date(todayForWeeks);
              weekStartDate.setDate(todayForWeeks.getDate() + i * 7);
              const weekEnd = new Date(weekStartDate);
              weekEnd.setDate(weekStartDate.getDate() + 6);

              const formatDate = (d: Date) =>
                `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en-US", { month: "short" })}`;

              generatedWeeks.push({
                week: i + 1,
                dateRange: `${formatDate(weekStartDate)} - ${formatDate(weekEnd)}`,
                color: i < 2 ? "green" : i < 4 ? "amber" : "red",
                isCurrent: i === 0,
              });
            }
            setWeeks(generatedWeeks);
          }

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
          "& .MuiOutlinedInput-notchedOutline": { border: "none" },
          "& .MuiSelect-icon": { color: COLORS.textSecondary },
          "&:hover": { bgcolor: COLORS.bgTertiary },
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
                  "&:hover": { bgcolor: COLORS.bgTertiary },
                  "&.Mui-selected": {
                    bgcolor: COLORS.blueBgMedium,
                    "&:hover": { bgcolor: COLORS.blueBgMedium },
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
    <DashboardLayout
      title="Activities & Lookahead"
      subtitle="View project activities and lookahead planning"
      headerAction={projectDropdown}
    >

      {isLoading || isLoadingActivities ? (
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
            No projects assigned to you yet.
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
        </Box>
      ) : (
        <ActivitiesLookahead
          activities={activities}
          weeks={weeks}
          lastUpdated={lastUpdated}
        />
      )}
    </DashboardLayout>
  );
};

export default Activities;
