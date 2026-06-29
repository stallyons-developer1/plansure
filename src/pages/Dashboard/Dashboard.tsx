import { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  CalendarTodayOutlined as CalendarIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import DashboardLayout from "../../layouts/DashboardLayout";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { dashboardAPI, projectAPI } from "../../services/api";
import actionIcon from "../../assets/sidebar/action.png";
import projectsIcon from "../../assets/sidebar/projects.png";
import activitiesPngIcon from "../../assets/activities.png";
import WeeklyReadinessSnapshot from "../../components/WeeklyReadinessSnapshot";
import RecentActivity from "../../components/RecentActivity";
import type { ActivityItem } from "../../components/RecentActivity";

const greenFilter =
  "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(632%) hue-rotate(93deg) brightness(92%) contrast(87%)";

interface DashboardStats {
  projects: {
    total: number;
    byPhase: Record<string, number>;
  };
  cycle: {
    current: string;
    status: string;
    dayInfo: {
      currentDay: number;
      totalDays: number;
      daysRemaining: number;
    } | null;
    programmeId: string;
    programmeName: string;
  };
  activities: {
    total: number;
    green: number;
    amber: number;
    red: number;
  };
  actions: {
    open: number;
    overdue: number;
    pending: number;
  };
}

interface RagDistribution {
  total: number;
  green: { count: number; percentage: number };
  amber: { count: number; percentage: number };
  red: { count: number; percentage: number };
}

interface Project {
  _id: string;
  name: string;
  phase: string;
  status: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.email?.split("@")[0] || "User";

  const [projectsLoading, setProjectsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ragDistribution, setRagDistribution] =
    useState<RagDistribution | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
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
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedProjectId) {
        return;
      }

      try {
        const [statsRes, ragRes, activityRes] = await Promise.all([
          dashboardAPI.getStats(selectedProjectId),
          dashboardAPI.getRagDistribution(selectedProjectId),
          dashboardAPI.getRecentActivity(6, selectedProjectId),
        ]);

        if (statsRes.success) {
          setStats(statsRes.stats);
        }
        if (ragRes.success) {
          setRagDistribution(ragRes.distribution);
        }
        if (activityRes.success) {
          setRecentActivities(activityRes.activities || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [selectedProjectId]);

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProjectId(event.target.value);
  };

  const getSelectedProjectName = () => {
    const project = projects.find((p) => p._id === selectedProjectId);
    return project?.name || "All Projects";
  };

  const getCycleStatusColor = (status: string) => {
    switch (status) {
      case "In Review":
        return COLORS.amber;
      case "Approved":
      case "Uploaded":
        return COLORS.green;
      case "Closed":
        return COLORS.blue;
      default:
        return COLORS.textSecondary;
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

  if (projectsLoading) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Project overview and status"
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
      </DashboardLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Project overview and status"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            textAlign: "center",
          }}
        >
          <Box
            component="img"
            src={projectsIcon}
            sx={{
              width: 80,
              height: 80,
              opacity: 0.5,
              mb: 3,
              filter:
                "brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg)",
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
            No Projects Available
          </Typography>
          <Typography
            sx={{
              color: COLORS.textSecondary,
              fontSize: "14px",
              maxWidth: 400,
            }}
          >
            You have not been assigned to any projects yet. Once a planner
            assigns you an action, the project will appear here.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Project overview and status"
      headerAction={projectDropdown}
    >
      <Card
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 3,
          p: 3,
          mb: 3,
        }}
      >
        <Typography
          sx={{
            color: COLORS.textPrimary,
            fontWeight: 700,
            mb: 1,
            fontSize: "20px",
          }}
        >
          Welcome back, {userName.charAt(0).toUpperCase() + userName.slice(1)}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
            flexWrap: "wrap",
          }}
        >
          {stats?.cycle.programmeName ? (
            <>
              <Typography
                sx={{ color: COLORS.blue, fontWeight: 600, fontSize: "14px" }}
              >
                {stats.cycle.programmeName}
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontWeight: 400,
                  fontSize: "14px",
                }}
              >
                — {stats.cycle.current} cycle is currently
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: COLORS.bgTertiary,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: getCycleStatusColor(stats.cycle.status),
                  }}
                />
                <Typography
                  sx={{
                    color: getCycleStatusColor(stats.cycle.status),
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  {stats.cycle.status}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontWeight: 400,
                fontSize: "14px",
              }}
            >
              No active programmes
            </Typography>
          )}
        </Box>
        {stats?.cycle.dayInfo && (
          <Typography
            sx={{
              color: COLORS.textSecondary,
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            Day {stats.cycle.dayInfo.currentDay} of{" "}
            {stats.cycle.dayInfo.totalDays} ·{" "}
            {stats.cycle.dayInfo.daysRemaining} days remaining
          </Typography>
        )}
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 0.5,
                }}
              >
                Current 2-Week Cycle
              </Typography>
              <Typography
                sx={{
                  color: COLORS.amber,
                  fontSize: "32px",
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                {stats?.cycle.current || "N/A"}
              </Typography>
              <Typography
                sx={{ color: COLORS.white, fontSize: "12px", fontWeight: 400 }}
              >
                {stats?.cycle.dayInfo
                  ? `${stats.cycle.dayInfo.daysRemaining} days remaining`
                  : "No active cycle"}
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: "rgba(245, 158, 11, 0.1)",
                borderRadius: "4px",
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarIcon sx={{ color: COLORS.amber, fontSize: 20 }} />
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
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
                Total Activities
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "32px",
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                {stats?.activities.total || 0}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "12px",
                }}
              >
                <Typography
                  component="span"
                  sx={{ color: COLORS.green, fontSize: "12px" }}
                >
                  {stats?.activities.green || 0} on track
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                >
                  ·
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.amber, fontSize: "12px" }}
                >
                  {stats?.activities.amber || 0} at risk
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                >
                  ·
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.red, fontSize: "12px" }}
                >
                  {stats?.activities.red || 0} critical
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                bgcolor: "rgba(34, 197, 94, 0.15)",
                borderRadius: "4px",
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={activitiesPngIcon}
                sx={{ width: 18, height: 22, filter: greenFilter }}
              />
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 0.5,
                }}
              >
                Open Actions
              </Typography>
              <Typography
                sx={{
                  color: COLORS.red,
                  fontSize: "32px",
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                {stats?.actions.open || 0}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "12px",
                }}
              >
                <Typography
                  component="span"
                  sx={{ color: COLORS.red, fontSize: "12px" }}
                >
                  {stats?.actions.overdue || 0} overdue
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                >
                  ·
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                >
                  {stats?.actions.pending || 0} pending
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                bgcolor: "rgba(239, 68, 68, 0.15)",
                borderRadius: "4px",
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={actionIcon}
                sx={{
                  width: 18,
                  height: 18,
                  filter:
                    "brightness(0) saturate(100%) invert(45%) sepia(78%) saturate(1846%) hue-rotate(331deg) brightness(99%) contrast(93%)",
                }}
              />
            </Box>
          </Box>
        </Card>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "400px 1fr" },
          gap: 3,
        }}
      >
        <WeeklyReadinessSnapshot
          weekLabel={stats?.cycle.current || "Current Week"}
          totalActivities={ragDistribution?.total || 0}
          distribution={ragDistribution || undefined}
        />
        <RecentActivity
          activities={recentActivities}
          projectName={getSelectedProjectName()}
        />
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;
