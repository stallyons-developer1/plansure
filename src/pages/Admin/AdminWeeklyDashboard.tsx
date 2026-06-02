import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { KeyboardArrowDown as ArrowDownIcon } from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import { dashboardAPI, projectAPI, programmeAPI, actionAPI } from "../../services/api";
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
    readyForClose: boolean;
  };
  ragDistribution: { green: number; amber: number; red: number };
  actionsByStatus: { open: number; closed: number; overdue: number };
  blockedActivities: Array<{
    id: string;
    name: string;
    rag: "Red" | "Amber";
    owner: string;
    blocker: string;
    linkedAction: string;
    status: "Open" | "Overdue";
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
  activitiesByWeek?: ActivityByWeek[];
  actionOwnership?: ActionOwnership[];
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

const AdminWeeklyDashboard = () => {
  const amberColor = "#F59E0B";
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState<WeeklyData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [programmeId, setProgrammeId] = useState<string>("");
  const [_weeksStatus, setWeeksStatus] = useState<WeekStatus[]>([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(1);
  const [activitiesByWeekData, setActivitiesByWeekData] = useState<ActivityByWeek[]>([]);
  const [actionOwnershipData, setActionOwnershipData] = useState<ActionOwnership[]>([]);

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
          // Find the first open week (current closable week)
          const openWeek = response.weeks.find((w: WeekStatus) => w.status === "open");
          if (openWeek) {
            setCurrentWeekNumber(openWeek.weekNumber);
          } else {
            // All weeks closed, show the last week
            const lastWeek = response.weeks[response.weeks.length - 1];
            setCurrentWeekNumber(lastWeek?.weekNumber || 1);
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
        const response = await dashboardAPI.getWeeklyDashboard(selectedProjectId);
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
        const response = await programmeAPI.getWeeklyControl(programmeId, currentWeekNumber);
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

  // Fetch actions for ownership chart
  useEffect(() => {
    const fetchActionsData = async () => {
      if (!programmeId) return;

      try {
        const response = await actionAPI.getByProgramme(programmeId);
        if (response.success && response.actions) {
          // Group actions by discipline/owner and status
          const ownershipMap: { [key: string]: { open: number; closed: number; overdue: number } } = {};
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          response.actions.forEach((action: { assignee?: { name?: string }; status?: string; dueDate?: string }) => {
            const discipline = action.assignee?.name || "Unassigned";
            if (!ownershipMap[discipline]) {
              ownershipMap[discipline] = { open: 0, closed: 0, overdue: 0 };
            }

            if (action.status === "Closed" || action.status === "Completed") {
              ownershipMap[discipline].closed++;
            } else {
              const dueDate = action.dueDate ? new Date(action.dueDate) : null;
              if (dueDate && dueDate < today) {
                ownershipMap[discipline].overdue++;
              } else {
                ownershipMap[discipline].open++;
              }
            }
          });

          const ownershipArray = Object.entries(ownershipMap)
            .map(([discipline, counts]) => ({
              discipline,
              ...counts,
            }))
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
              ACTIVE WEEK
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
              WEEKLY RAG
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
            Execution
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
                width: "65%",
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
            This week's scope
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
                bgcolor: data?.stats?.readyForClose ? COLORS.green : COLORS.red,
              }}
            />
            <Typography
              sx={{
                color: data?.stats?.readyForClose ? COLORS.green : COLORS.red,
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
          <Box sx={{ height: { xs: 220, sm: 280 }, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activitiesByWeekData}
                barCategoryGap="15%"
                barGap={0}
              >
                <CartesianGrid
                  strokeDasharray="0"
                  stroke={COLORS.borderDark}
                  horizontal={true}
                  vertical={true}
                  verticalCoordinatesGenerator={(props) => {
                    const { offset, width } = props;
                    const barCount = 6;
                    const chartWidth = width - offset.left - offset.right;
                    const step = chartWidth / barCount;
                    const lines = [];
                    for (let i = 0; i <= barCount; i++) {
                      lines.push(offset.left + i * step);
                    }
                    return lines;
                  }}
                  horizontalCoordinatesGenerator={(props) => {
                    const { offset, height } = props;
                    const lineCount = 10;
                    const chartHeight = height - offset.top - offset.bottom;
                    const step = chartHeight / lineCount;
                    const lines = [];
                    for (let i = 0; i <= lineCount; i++) {
                      lines.push(offset.top + i * step);
                    }
                    return lines;
                  }}
                />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                  domain={[0, 50]}
                  ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]}
                  interval={0}
                />
                <Bar dataKey="green" stackId="a" fill={COLORS.green} />
                <Bar dataKey="amber" stackId="a" fill={COLORS.amber} />
                <Bar dataKey="red" stackId="a" fill={COLORS.red} />
              </BarChart>
            </ResponsiveContainer>
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
          <Box sx={{ height: { xs: 220, sm: 280 } }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Open", value: data?.actionsByStatus?.open || 0 },
                  { name: "Closed", value: data?.actionsByStatus?.closed || 0 },
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
                  horizontalCoordinatesGenerator={(props) => {
                    const { offset, height } = props;
                    const lineCount = 6;
                    const chartHeight = height - offset.top - offset.bottom;
                    const step = chartHeight / lineCount;
                    const lines = [];
                    for (let i = 0; i <= lineCount; i++) {
                      lines.push(offset.top + i * step);
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
                  domain={[0, 30]}
                  ticks={[0, 5, 10, 15, 20, 25, 30]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill={COLORS.amber} />
                  <Cell fill={COLORS.green} />
                  <Cell fill={COLORS.red} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
            Action Ownership by Discipline
          </Typography>
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
                data={actionOwnershipData.length > 0 ? actionOwnershipData : [
                  { discipline: "No Data", open: 0, closed: 0, overdue: 0 },
                ]}
                layout="vertical"
                barCategoryGap="15%"
              >
                <CartesianGrid
                  strokeDasharray="0"
                  stroke={COLORS.borderDark}
                  horizontal={true}
                  vertical={true}
                  horizontalCoordinatesGenerator={(props) => {
                    const { offset, height } = props;
                    const barCount = 5;
                    const chartHeight = height - offset.top - offset.bottom;
                    const step = chartHeight / barCount;
                    const lines = [];
                    for (let i = 0; i <= barCount; i++) {
                      lines.push(offset.top + i * step);
                    }
                    return lines;
                  }}
                  verticalCoordinatesGenerator={(props) => {
                    const { offset, width } = props;
                    const lineCount = 7;
                    const chartWidth = width - offset.left - offset.right;
                    const step = chartWidth / lineCount;
                    const lines = [];
                    for (let i = 0; i <= lineCount; i++) {
                      lines.push(offset.left + i * step);
                    }
                    return lines;
                  }}
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                  domain={[0, 14]}
                  ticks={[0, 2, 4, 6, 8, 10, 12, 14]}
                />
                <YAxis
                  type="category"
                  dataKey="discipline"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                  width={80}
                />
                <Bar dataKey="open" stackId="a" fill={COLORS.amber} />
                <Bar dataKey="closed" stackId="a" fill={COLORS.green} />
                <Bar dataKey="overdue" stackId="a" fill={COLORS.red} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: { xs: 2, sm: 3 } }}>
        <BlockedActivitiesTable
          activities={data?.blockedActivities?.map(a => ({
            activityId: a.id,
            activityName: a.name,
            ragStatus: a.rag,
            activityStatus: a.status,
            owner: a.owner,
            blocker: a.blocker,
            linkedAction: a.linkedAction ? { actionId: a.linkedAction, title: a.linkedAction, status: a.status } : null,
          }))}
          weeklyPlanPreview={data?.weeklyPlanPreview}
          plannerToDo={data?.plannerToDo}
        />
      </Box>

      <Box sx={{ mt: { xs: 2, sm: 3 } }}>
        <ClosureOverridePanel />
      </Box>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminWeeklyDashboard;
