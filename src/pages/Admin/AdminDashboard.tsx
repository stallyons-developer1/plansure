import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  Button,
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
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { dashboardAPI, projectAPI } from "../../services/api";
import uploadIcon from "../../assets/sidebar/upload.png";
import dashboardIcon from "../../assets/sidebar/dashboard.png";
import actionIcon from "../../assets/sidebar/action.png";
import projectsIcon from "../../assets/sidebar/projects.png";
import activitiesPngIcon from "../../assets/activities.png";
import WeeklyReadinessSnapshot from "../../components/WeeklyReadinessSnapshot";
import RecentActivity from "../../components/RecentActivity";
import type { ActivityItem } from "../../components/RecentActivity";

interface Project {
  _id: string;
  name: string;
  phase: string;
  status: string;
}

const blueFilter =
  "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)";
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.email?.split("@")[0] || "Admin";

  const [_loading, setLoading] = useState(true);
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
          // Select first project by default
          if (projectsList.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projectsList[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setProjectsLoading(false);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Only fetch when a project is selected
      if (!selectedProjectId) {
        return;
      }

      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedProjectId]);

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProjectId(event.target.value);
  };

  const getSelectedProjectName = () => {
    const project = projects.find((p) => p._id === selectedProjectId);
    return project?.name || "Select Project";
  };

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
        return COLORS.textSecondary;
    }
  };

  const getPhaseBreakdown = () => {
    if (!stats?.projects.byPhase) return "No active projects";
    const phases = Object.entries(stats.projects.byPhase);
    if (phases.length === 0) return "No active projects";
    return phases
      .map(([phase, count]) => `${count} ${phase.toLowerCase()}`)
      .join(", ");
  };

  if (projectsLoading) {
    return (
      <AdminLayout
        title="Dashboard"
        subtitle="Admin overview and quick actions"
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

  // Show empty state when no projects exist
  if (projects.length === 0) {
    return (
      <AdminLayout
        title="Dashboard"
        subtitle="Admin overview and quick actions"
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
              mb: 3,
              maxWidth: 400,
            }}
          >
            Create a new project and upload a programme to see your dashboard
            data
          </Typography>
          <Button
            onClick={() =>
              navigate("/admin/projects", { state: { openCreateModal: true } })
            }
            sx={{
              bgcolor: COLORS.blue,
              color: "#fff",
              textTransform: "none",
              px: 4,
              py: 1.5,
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor: "#2563eb",
              },
            }}
          >
            Create Project
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Admin overview and quick actions"
      headerAction={
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
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      }
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
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", lg: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontWeight: 700,
                mb: 1,
                fontSize: "20px",
              }}
            >
              Welcome back,{" "}
              {userName.charAt(0).toUpperCase() + userName.slice(1)}
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
              {stats?.cycle.programmeName && (
                <>
                  <Typography
                    sx={{
                      color: COLORS.blue,
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
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
              )}
              {!stats?.cycle.programmeName && (
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
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Button
              onClick={() => navigate("/admin/programs-upload")}
              startIcon={
                <Box
                  component="img"
                  src={uploadIcon}
                  sx={{
                    width: 18,
                    height: 18,
                    filter: "brightness(0) invert(1)",
                  }}
                />
              }
              sx={{
                bgcolor: COLORS.blue,
                color: COLORS.white,
                textTransform: "none",
                px: 2.5,
                py: 1,
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: COLORS.blueHover,
                },
              }}
            >
              Upload Programme
            </Button>
            <Button
              onClick={() => navigate("/admin/weekly-dashboard")}
              startIcon={
                <Box
                  component="img"
                  src={dashboardIcon}
                  sx={{
                    width: 16,
                    height: 16,
                    filter: "brightness(0) invert(1)",
                  }}
                />
              }
              sx={{
                bgcolor: "transparent",
                color: COLORS.textPrimary,
                textTransform: "none",
                px: 2.5,
                py: 1,
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                border: `1px solid ${COLORS.border}`,
                "&:hover": {
                  bgcolor: COLORS.bgTertiary,
                },
              }}
            >
              Weekly Dashboard
            </Button>
          </Box>
        </Box>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
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
                Active Projects
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
                {stats?.projects.total || 0}
              </Typography>
              <Typography
                sx={{ color: COLORS.white, fontSize: "12px", fontWeight: 400 }}
              >
                {getPhaseBreakdown()}
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: COLORS.blueBgMedium,
                borderRadius: "4px",
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={projectsIcon}
                sx={{ width: 20, height: 20, filter: blueFilter }}
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
                  ? `Day ${stats.cycle.dayInfo.currentDay} of ${stats.cycle.dayInfo.totalDays} · ${stats.cycle.dayInfo.daysRemaining} days remaining`
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
                  sx={{
                    color: COLORS.green,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
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
                  sx={{
                    color: COLORS.amber,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
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
                  sx={{ color: COLORS.red, fontSize: "12px", fontWeight: 400 }}
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
                  sx={{ color: COLORS.red, fontSize: "12px", fontWeight: 400 }}
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
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
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
          mb: 3,
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

      {/* <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            color: COLORS.textPrimary,
            fontSize: "14px",
            fontWeight: 600,
            mb: 2,
          }}
        >
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          <Card
            onClick={() => navigate("/admin/programs-upload")}
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 2.5,
              cursor: "pointer",
              "&:hover": { bgcolor: COLORS.bgTertiary },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "4px",
                bgcolor: "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <Box
                component="img"
                src={uploadIcon}
                sx={{ width: 18, height: 18, filter: blueFilter }}
              />
            </Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Upload Programme
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Import a new PDF programme schedule for parsing and analysis
            </Typography>
          </Card>

          <Card
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 2.5,
              cursor: "pointer",
              "&:hover": { bgcolor: COLORS.bgTertiary },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "4px",
                bgcolor: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <MeetingIcon sx={{ color: COLORS.amber, fontSize: 20 }} />
            </Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Open Meeting
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Start or join a weekly review meeting and record actions
            </Typography>
          </Card>

          <Card
            onClick={() => navigate("/admin/projects")}
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 2.5,
              cursor: "pointer",
              "&:hover": { bgcolor: COLORS.bgTertiary },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "4px",
                bgcolor: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <Box
                component="img"
                src={activitiesIcon}
                sx={{ width: 14, height: 18, filter: greenFilter }}
              />
            </Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              View Lookahead
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Review the 4-week lookahead with RAG status and activity details
            </Typography>
          </Card>

          <Card
            onClick={() => navigate("/admin/export")}
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 2.5,
              cursor: "pointer",
              "&:hover": { bgcolor: COLORS.bgTertiary },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "4px",
                bgcolor: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <ExportIcon sx={{ color: COLORS.red, fontSize: 20 }} />
            </Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Generate Export
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Create PDF or Excel governance reports for stakeholder
              distribution
            </Typography>
          </Card>
        </Box>
      </Box> */}
    </AdminLayout>
  );
};

export default AdminDashboard;
