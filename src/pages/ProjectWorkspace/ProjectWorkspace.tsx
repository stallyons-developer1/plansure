import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowRight as ArrowRightIcon,
  ChevronRight,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { COLORS } from "../../constants/colors";
import { projectAPI, programmeAPI, actionAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface ProjectData {
  _id: string;
  name: string;
  phase: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdBy?: { name: string; email: string };
}

interface Activity {
  activityId: string;
  activityName: string;
  duration: string;
  startDate: string;
  finishDate: string;
  status: string;
  ragStatus: string;
  activityStatus: string;
  weekZone: string | null;
}

const StepIndicator = ({
  number,
  label,
  isActive,
  isCompleted,
}: {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minWidth: { xs: 70, sm: 90, md: "auto" },
    }}
  >
    <Box
      sx={{
        width: { xs: 32, sm: 36, md: 38 },
        height: { xs: 32, sm: 36, md: 38 },
        borderRadius: "50%",
        bgcolor: isActive || isCompleted ? COLORS.blue : "transparent",
        border: isActive || isCompleted ? "none" : `2px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isActive || isCompleted ? "#fff" : COLORS.border,
        fontWeight: 500,
        fontSize: { xs: "13px", sm: "14px", md: "15px" },
        transition: "all 0.2s ease",
      }}
    >
      {number}
    </Box>
    <Typography
      sx={{
        color: isActive || isCompleted ? COLORS.textPrimary : COLORS.border,
        fontSize: { xs: "11px", sm: "12px", md: "14px" },
        fontWeight: 400,
        mt: { xs: 0.5, sm: 0.75, md: 1 },
        mb: 0,
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Typography>
  </Box>
);

const RAGDonutChart = ({
  data,
}: {
  data: { green: number; amber: number; red: number };
}) => {
  const total = data.green + data.amber + data.red;
  const size = 240;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const createArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  if (total === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
          No activities data available
        </Typography>
      </Box>
    );
  }

  const segments = [
    { value: data.red, color: "#EF4444" },
    { value: data.green, color: "#22C55E" },
    { value: data.amber, color: "#F59E0B" },
  ];

  let currentAngle = 0;
  const arcs = segments.map((segment) => {
    const startAngle = currentAngle;
    const sweepAngle = (segment.value / total) * 360;
    const endAngle = startAngle + sweepAngle;
    currentAngle = endAngle;
    return { ...segment, path: createArc(startAngle, endAngle) };
  });

  return (
    <Box>
      <Box sx={{ position: "relative", width: size, height: size, mx: "auto" }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {arcs.map((arc, index) => (
            <path
              key={index}
              d={arc.path}
              fill="transparent"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          ))}
        </svg>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          mt: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "#22C55E",
            }}
          />
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
            Green:&nbsp;&nbsp;{data.green}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "#F59E0B",
            }}
          />
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
            Amber:&nbsp;&nbsp;{data.amber}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "#EF4444",
            }}
          />
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
            Red:&nbsp;&nbsp;{data.red}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const StatCard = ({
  label,
  value,
  subLabel,
  valueColor = COLORS.textPrimary,
}: {
  label: string;
  value: number | string;
  subLabel?: string;
  valueColor?: string;
}) => (
  <Card
    sx={{
      bgcolor: COLORS.bgSecondary,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 2,
      height: 80,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      p: 1.5,
    }}
  >
    <Typography
      sx={{
        color: "#94A3B8",
        fontSize: "12px",
        fontWeight: 500,
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        color: valueColor,
        fontSize: "24px",
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {value}
    </Typography>
    {subLabel && (
      <Typography
        sx={{
          color: "#94A3B8",
          fontSize: "12px",
          fontWeight: 500,
          mt: 0.25,
        }}
      >
        {subLabel}
      </Typography>
    )}
  </Card>
);

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

  const cleanDate = dateStr.replace(/\s*[A*]$/, "").trim();
  const match = cleanDate.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);

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
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateRagZone = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return { zone: "Week 1-2", color: COLORS.green };

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

  const parseDate = (dateStr: string): Date | null => {
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

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) return { zone: "Weeks 1-2", color: COLORS.green };

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);

  if (diffWeeks <= 0) return { zone: "< 1 Week", color: COLORS.green };
  if (diffWeeks <= 2) return { zone: "Weeks 1-2", color: COLORS.green };
  if (diffWeeks <= 4) return { zone: "Weeks 3-4", color: COLORS.amber };
  if (diffWeeks <= 6) return { zone: "Weeks 5-6", color: COLORS.red };
  return { zone: `${diffWeeks} Weeks`, color: COLORS.red };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Ready":
      return { bg: "rgba(34, 197, 94, 0.15)", text: COLORS.green };
    case "At Risk":
      return { bg: "rgba(245, 158, 11, 0.15)", text: COLORS.amber };
    case "Blocked":
      return { bg: "rgba(239, 68, 68, 0.15)", text: COLORS.red };
    case "Complete":
    case "Completed":
      return { bg: "rgba(59, 130, 246, 0.15)", text: COLORS.blue };
    default:
      return { bg: "rgba(142, 156, 177, 0.15)", text: COLORS.textSecondary };
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
    case "Completed":
      return COLORS.blue;
    default:
      return COLORS.textMuted;
  }
};

const ProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [currentStep] = useState(1);
  const [ragFilter, setRagFilter] = useState("all");
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(
    null,
  );

  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    inLookahead: 0,
    green: 0,
    amber: 0,
    red: 0,
    blocked: 0,
  });
  const [projectActions, setProjectActions] = useState<
    Array<{
      _id: string;
      title: string;
      linkedActivity: { activityId: string; activityName: string };
      status: string;
    }>
  >([]);

  const steps = [
    "Draft",
    "Meeting Open",
    "Execution",
    "Close-Out Eligible",
    "Closed",
  ];

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
    const fetchProgramme = async () => {
      if (!projectId) return;
      try {
        const response = await programmeAPI.getByProject(projectId);
        if (response.success && response.programme) {
          const programme = response.programme;
          const activitiesData = programme.extractedData?.activities || [];
          const summaryData = programme.extractedData?.summary || {
            total: 0,
            inLookahead: 0,
            green: 0,
            amber: 0,
            red: 0,
            blocked: 0,
          };

          setActivities(activitiesData);
          setSummary(summaryData);

          try {
            const actionsRes = await actionAPI.getByProgramme(programme._id);
            if (actionsRes.success) {
              setProjectActions(actionsRes.actions || []);
            }
          } catch (err) {
            console.error("Failed to fetch actions:", err);
          }
        }
      } catch (error) {
        console.error("Failed to fetch programme:", error);
      }
    };
    fetchProgramme();
  }, [projectId]);

  const getActionsForActivity = (activityId: string) => {
    return projectActions.filter(
      (action) => action.linkedActivity?.activityId === activityId,
    );
  };

  const filteredActivities = activities.filter((activity) => {
    if (ragFilter === "all") return true;
    return activity.activityStatus === ragFilter;
  });

  const greenCount = activities.filter(
    (a) => a.activityStatus === "Complete" || a.activityStatus === "Ready",
  ).length;
  const amberCount = activities.filter(
    (a) => a.activityStatus === "At Risk",
  ).length;
  const redCount = activities.filter(
    (a) => a.activityStatus === "Blocked",
  ).length;

  const ownerName = user?.name || "User";
  const ownerInitials = ownerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isLoading) {
    return (
      <DashboardLayout
        title="Project Workspace"
        subtitle="Manage weekly control cycle"
      >
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
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout
        title="Project Workspace"
        subtitle="Manage weekly control cycle"
      >
        <Typography sx={{ color: COLORS.textPrimary }}>
          Project not found
        </Typography>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Project Workspace"
      subtitle="Manage weekly control cycle"
    >
      <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            minHeight: { xs: "auto", md: 210 },
            p: { xs: 2, sm: 2.5, md: 3 },
            mb: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: { xs: 2.5, md: 0 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "flex-start" },
              gap: { xs: 1.5, md: 2 },
              mb: 0,
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 0.75,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.border,
                    fontSize: { xs: "11px", sm: "12px" },
                    fontWeight: 400,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => navigate("/dashboard/projects")}
                >
                  Projects
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.textLight,
                    fontSize: { xs: "11px", sm: "12px" },
                    fontWeight: 400,
                  }}
                >
                  &nbsp;/ {project.name}
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: { xs: "20px", sm: "24px", md: "26px" },
                  fontWeight: 700,
                  mb: 0.5,
                  lineHeight: 1.2,
                }}
              >
                {project.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.border,
                    fontSize: { xs: "12px", sm: "14px" },
                    fontWeight: 400,
                  }}
                >
                  Phase:
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.textLight,
                    fontSize: { xs: "12px", sm: "14px" },
                    fontWeight: 400,
                  }}
                >
                  &nbsp;{project.phase}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2 },
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: { xs: "11px", sm: "12px" },
                    fontWeight: 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  Week 1 (Current Week)
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgTertiary,
                  color: COLORS.textSecondary,
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 0.75, sm: 1 },
                  borderRadius: "10px",
                  fontSize: { xs: "11px", sm: "13px" },
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {steps[currentStep - 1]}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: { xs: "flex-start", lg: "center" },
              maxWidth: "100%",
              width: "100%",
              overflowX: "auto",
              overflowY: "hidden",
              pb: 1,
              px: { xs: 1, sm: 0 },
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {steps.map((step, index) => (
              <Box
                key={step}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  minWidth: "fit-content",
                }}
              >
                <StepIndicator
                  number={index + 1}
                  label={step}
                  isActive={index + 1 === currentStep}
                  isCompleted={index + 1 < currentStep}
                />
                {index < steps.length - 1 && (
                  <Box
                    sx={{
                      width: { xs: 40, sm: 55, md: 75 },
                      height: 2,
                      bgcolor:
                        index + 1 < currentStep ? COLORS.blue : COLORS.border,
                      mx: { xs: "16px", sm: "28px", md: "46px" },
                      mt: { xs: "15px", sm: "17px", md: "19px" },
                      transition: "all 0.2s ease",
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Card>

        <Box
          sx={{
            mb: 3,
            borderBottom: `2px solid ${COLORS.border}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: "auto",
              mb: "-2px",
              "& .MuiTabs-indicator": {
                bgcolor: COLORS.blue,
                height: "2px",
                bottom: 0,
              },
              "& .MuiTab-root": {
                color: COLORS.textMuted,
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
                minHeight: "auto",
                py: 1.5,
                px: 0,
                mr: 4,
                "&.Mui-selected": {
                  color: COLORS.blue,
                },
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Activities & Lookahead" />
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
                value={summary.inLookahead || activities.length}
              />
              <StatCard
                label={`${greenCount} Green & Ready`}
                value={greenCount}
                subLabel={`of ${activities.length} total`}
                valueColor={COLORS.green}
              />
              <StatCard
                label="Open Actions"
                value={0}
                valueColor={COLORS.amber}
              />
              <StatCard
                label="Overdue Actions"
                value={0}
                valueColor={COLORS.red}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                gap: 3,
              }}
            >
              <Card
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 2,
                  p: 3,
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "15px",
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  RAG Distribution
                </Typography>
                <RAGDonutChart
                  data={{
                    green: summary.green || greenCount,
                    amber: summary.amber || amberCount,
                    red: summary.red || redCount,
                  }}
                />
              </Card>

              <Card
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 2,
                  p: { xs: 2, sm: 3 },
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "16px",
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  Recent Cycle History
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 4,
                  }}
                >
                  <Typography
                    sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                  >
                    No cycle history available
                  </Typography>
                </Box>
              </Card>
            </Box>
          </>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Week Zones */}
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
                  <Typography
                    sx={{
                      color: item.color,
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {item.week}
                  </Typography>
                  <Typography
                    sx={{ color: "#8E9CB1", fontSize: "12px", fontWeight: 400 }}
                  >
                    {item.label}
                  </Typography>
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
                  onClick={() => setRagFilter(filter.value)}
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
                    border: `1px solid ${ragFilter === filter.value ? COLORS.blue : COLORS.border}`,
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

            {/* Activities Table - Same as Admin */}
            <Box
              sx={{
                overflowX: "auto",
                mb: 2,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
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
                  <Box />
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
                        textAlign: [2, 3, 4, 5, 6, 7, 8].includes(idx)
                          ? "center"
                          : "left",
                      }}
                    >
                      {header}
                    </Typography>
                  ))}
                </Box>

                {/* Table Body */}
                {filteredActivities.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                    >
                      {activities.length === 0
                        ? "No activities data available"
                        : "No activities match the selected filter"}
                    </Typography>
                  </Box>
                ) : (
                  filteredActivities.map((activity, index) => {
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
                            "&:hover": { bgcolor: COLORS.whiteHoverLight },
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
                          {/* Status Indicator */}
                          <Box
                            sx={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: "2px",
                              bgcolor: indicatorColor,
                            }}
                          />
                          <Box />

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
                              {activity.activityName || activity.activityId}
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

                          {/* RAG Zone */}
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
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ragZone.zone}
                            </Typography>
                          </Box>

                          {/* Actions */}
                          {actionsForThisActivity.length > 0 ? (
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: COLORS.blue,
                                textAlign: "center",
                              }}
                            >
                              {actionsForThisActivity.length} action
                              {actionsForThisActivity.length !== 1 ? "s" : ""}
                            </Typography>
                          ) : (
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: COLORS.textSecondary,
                                textAlign: "center",
                              }}
                            >
                              -
                            </Typography>
                          )}

                          {/* Status */}
                          <Box
                            sx={{ display: "flex", justifyContent: "center" }}
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
                                {activity.activityStatus === "Complete" ? "Completed" : (activity.activityStatus || "Ready")}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Owner */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              justifyContent: "center",
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 26,
                                height: 26,
                                bgcolor: COLORS.blue,
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              {ownerInitials}
                            </Avatar>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: COLORS.textSecondary,
                              }}
                            >
                              {ownerName.split(" ")[0]}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Expanded section for linked actions */}
                        {isExpanded && actionsForThisActivity.length > 0 && (
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
                                  {actionsForThisActivity.map((action) => (
                                    <Box
                                      key={action._id}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                      }}
                                    >
                                      <ChevronRight
                                        sx={{
                                          fontSize: 16,
                                          color: COLORS.blue,
                                        }}
                                      />
                                      <Typography
                                        sx={{
                                          fontSize: "12px",
                                          color: COLORS.textPrimary,
                                        }}
                                      >
                                        {action.title}
                                      </Typography>
                                    </Box>
                                  ))}
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
                )}
              </Box>
            </Box>

            {/* Summary */}
            {activities.length > 0 && (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
                >
                  Total: {activities.length} activities
                </Typography>
                <Box sx={{ display: "flex", gap: 3 }}>
                  <Typography sx={{ color: COLORS.green, fontSize: "13px" }}>
                    Green: {summary.green || greenCount}
                  </Typography>
                  <Typography sx={{ color: COLORS.amber, fontSize: "13px" }}>
                    Amber: {summary.amber || amberCount}
                  </Typography>
                  <Typography sx={{ color: COLORS.red, fontSize: "13px" }}>
                    Red: {summary.red || redCount}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
