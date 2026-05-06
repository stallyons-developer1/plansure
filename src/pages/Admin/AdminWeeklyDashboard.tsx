import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import { dashboardAPI } from "../../services/api";
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

const activitiesByWeekData = [
  { week: "Wk 19", green: 30, amber: 10, red: 5 },
  { week: "Wk 20", green: 28, amber: 14, red: 5 },
  { week: "Wk 21", green: 26, amber: 15, red: 5 },
  { week: "Wk 22", green: 22, amber: 17, red: 7 },
  { week: "Wk 23", green: 25, amber: 14, red: 8 },
  { week: "Wk 24", green: 24, amber: 17, red: 9 },
];

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
  const [data, setData] = useState<WeeklyData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getWeeklyDashboard();
        if (response.success) {
          setData(response.weekly);
        }
      } catch (error) {
        console.error("Error fetching weekly dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate RAG percentages
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

  // Determine weekly RAG status
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

  // Get cycle status color
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
            GREEN ACTIVITIRES
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
                data={[
                  { discipline: "Civil", open: 8, closed: 5, overdue: 1 },
                  { discipline: "MEP", open: 3, closed: 7, overdue: 1 },
                  { discipline: "Structural", open: 3, closed: 5, overdue: 0 },
                  { discipline: "Signalling", open: 3, closed: 4, overdue: 1 },
                  { discipline: "Logistics", open: 1, closed: 4, overdue: 0 },
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
        <BlockedActivitiesTable />
      </Box>

      <Box sx={{ mt: { xs: 2, sm: 3 } }}>
        <ClosureOverridePanel />
      </Box>
    </AdminLayout>
  );
};

export default AdminWeeklyDashboard;
