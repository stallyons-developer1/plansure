import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { dashboardAPI } from "../../services/api";
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import {
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Remove as RemoveIcon,
  WarningAmberOutlined as WarningAmberOutlinedIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import checkIcon from "../../assets/sidebar/check2.png";

interface MetricCardProps {
  title: string;
  score: number;
  weight: number;
  color: string;
}

const MetricCard = ({ title, score, weight, color }: MetricCardProps) => (
  <Box
    sx={{
      bgcolor: COLORS.bgPrimary,
      border: `2px solid ${COLORS.borderDark}`,
      borderRadius: "12px",
      p: 2,
      minWidth: { xs: "160px", sm: "200px" },
      flex: 1,
    }}
  >
    <Typography
      sx={{
        color: COLORS.textSecondary,
        fontSize: { xs: "12px", sm: "12px" },
        fontWeight: 400,
        mb: 0.5,
      }}
    >
      {title}
    </Typography>
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        mb: 1.5,
      }}
    >
      <Typography
        sx={{
          color: COLORS.textPrimary,
          fontSize: { xs: "24px", sm: "24px" },
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {score}
      </Typography>
      <Typography
        sx={{
          color: COLORS.textSecondary,
          fontSize: { xs: "12px", sm: "12px" },
          fontWeight: 400,
        }}
      >
        Weight {weight}%
      </Typography>
    </Box>
    <Box
      sx={{
        display: "flex",
        height: 5,
        borderRadius: "5px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: `${score}%`,
          height: "100%",
          bgcolor: color,
        }}
      />
      <Box
        sx={{
          width: `${100 - score}%`,
          height: "100%",
          bgcolor: COLORS.borderDark,
        }}
      />
    </Box>
  </Box>
);

const CircularGauge = ({
  score,
  status,
}: {
  score: number;
  status: string;
}) => {
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const startAngle = 225;
  const totalAngle = 270;

  const polarToCartesian = (angle: number) => {
    const radians = (angle - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(radians),
      y: center + radius * Math.sin(radians),
    };
  };

  const createArc = (start: number, end: number) => {
    const startPoint = polarToCartesian(start);
    const endPoint = polarToCartesian(end % 360);
    const arcSpan = end - start;
    const largeArcFlag = arcSpan > 180 ? 1 : 0;
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`;
  };

  const progressEndAngle = startAngle + (score / 100) * totalAngle;
  const backgroundEndAngle = startAngle + totalAngle;

  const statusColor =
    status === "GREEN"
      ? COLORS.green
      : status === "AMBER"
        ? COLORS.amber
        : COLORS.red;

  return (
    <Box
      sx={{
        position: "relative",
        width: { xs: 140, sm: 160 },
        height: { xs: 140, sm: 160 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        <path
          d={createArc(startAngle, backgroundEndAngle)}
          fill="none"
          stroke={COLORS.borderDark}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={createArc(startAngle, progressEndAngle)}
          fill="none"
          stroke={statusColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            color: COLORS.textPrimary,
            fontSize: { xs: "36px", sm: "44px" },
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {score}
        </Typography>
        <Typography
          sx={{
            color: COLORS.textMuted,
            fontSize: { xs: "14px", sm: "16px" },
            fontWeight: 400,
          }}
        >
          /100
        </Typography>
        <Typography
          sx={{
            color: statusColor,
            fontSize: { xs: "12px", sm: "14px" },
            fontWeight: 600,
            mt: 0.5,
          }}
        >
          {status}
        </Typography>
      </Box>
    </Box>
  );
};

interface StatsCardProps {
  label: string;
  value: string;
  suffix?: string;
}

const StatsCard = ({ label, value, suffix }: StatsCardProps) => {
  // Determine color based on label and value
  const getValueColor = () => {
    if (label === "Total Weeks") return COLORS.white;
    if (label === "Overdue Trend") {
      if (value === "Up") return COLORS.red;      // Bad - overdue increasing
      if (value === "Down") return COLORS.green;  // Good - overdue decreasing
      return COLORS.amber;                         // Stable
    }
    return COLORS.green;
  };

  return (
    <Box
      sx={{
        bgcolor: COLORS.bgCard,
        border: `2px solid ${COLORS.borderDark}`,
        borderRadius: "12px",
        p: 2.5,
        flex: 1,
        minWidth: { xs: "140px", sm: "160px" },
      }}
    >
      <Typography
        sx={{
          color: COLORS.textSecondary,
          fontSize: "14px",
          fontWeight: 400,
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
        <Typography
          sx={{
            color: getValueColor(),
            fontSize: "32px",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
        {suffix && (
          <Typography
            sx={{
              color: COLORS.textSecondary,
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            {suffix}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

interface GovernanceData {
  hasData?: boolean;
  message?: string;
  score: number;
  status: string;
  metrics: {
    weeksClosedOnTime: { score: number; weight: number; color: string };
    overdueActionRate: { score: number; weight: number; color: string };
    actionClosureSpeed: { score: number; weight: number; color: string };
    readinessTrendStability: { score: number; weight: number; color: string };
    pmOverrideFrequency: { score: number; weight: number; color: string };
  };
  stats: {
    totalWeeks: number;
    avgReadiness: string;
    totalActionsRaised: number;
    totalClosed: number;
    overdueTrend: string;
    recurringBlockers: number;
  };
  weeklyReadinessData: { week: string; value: number }[];
  actionsData: { week: string; raised: number; closed: number }[];
  ragTrendData: { week: string; green: number; amber: number; red: number }[];
  constraintData: {
    type: string;
    frequency: number;
    trend: string;
    lastSeen: string;
  }[];
  historicalWeeks: {
    week: number;
    date: string;
    status: string;
    icon: string;
    score?: number;
    stats?: {
      totalActivities: number;
      green: number;
      amber: number;
      red: number;
      actionsCompleted: number;
      actionsTotal: number;
    };
    closeType?: string;
    notes?: string;
  }[];
}

const CustomLegend = ({
  items,
}: {
  items: { label: string; color: string }[];
}) => (
  <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 2 }}>
    {items.map((item) => (
      <Box
        key={item.label}
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "2px",
            bgcolor: item.color,
          }}
        />
        <Typography sx={{ color: COLORS.textSecondary, fontSize: "13px" }}>
          {item.label}
        </Typography>
      </Box>
    ))}
  </Box>
);

const TrendBadge = ({ trend }: { trend: string }) => {
  const config = {
    up: {
      icon: <ArrowUpIcon sx={{ fontSize: 16 }} />,
      color: "#EF4444",
      bgColor: "rgba(127, 29, 29, 0.5)",
      label: "Up",
    },
    stable: {
      icon: <RemoveIcon sx={{ fontSize: 16 }} />,
      color: "#F59E0B",
      bgColor: "rgba(120, 80, 10, 0.5)",
      label: "Stable",
    },
    down: {
      icon: <ArrowDownIcon sx={{ fontSize: 16 }} />,
      color: "#22C55E",
      bgColor: "rgba(20, 83, 45, 0.5)",
      label: "Down",
    },
  };
  const { icon, color, bgColor, label } = config[trend as keyof typeof config] || config.stable;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        bgcolor: bgColor,
        color: color,
        px: 1.5,
        py: 0.5,
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: 500,
        width: "fit-content",
      }}
    >
      {icon}
      {label}
    </Box>
  );
};

const AdminGovernanceDashboard = () => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [governanceData, setGovernanceData] = useState<GovernanceData | null>(
    null
  );

  useEffect(() => {
    const fetchGovernanceData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getGovernance();
        if (response.governance) {
          setGovernanceData(response.governance);
          // Set the first historical week as selected if available
          if (response.governance.historicalWeeks?.length > 0) {
            setSelectedWeek(response.governance.historicalWeeks[0].week);
          }
        }
      } catch (error) {
        console.error("Error fetching governance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGovernanceData();
  }, []);

  const getMetricColor = (color: string) => {
    switch (color) {
      case "green":
        return COLORS.green;
      case "amber":
        return COLORS.amber;
      case "red":
        return COLORS.red;
      default:
        return COLORS.textMuted;
    }
  };

  const metrics =
    governanceData?.hasData && governanceData?.metrics
      ? [
          {
            title: "Weeks Closed On Time",
            score: governanceData.metrics.weeksClosedOnTime.score,
            weight: governanceData.metrics.weeksClosedOnTime.weight,
            color: getMetricColor(governanceData.metrics.weeksClosedOnTime.color),
          },
          {
            title: "Overdue Action Rate",
            score: governanceData.metrics.overdueActionRate.score,
            weight: governanceData.metrics.overdueActionRate.weight,
            color: getMetricColor(governanceData.metrics.overdueActionRate.color),
          },
          {
            title: "Action Closure Speed",
            score: governanceData.metrics.actionClosureSpeed.score,
            weight: governanceData.metrics.actionClosureSpeed.weight,
            color: getMetricColor(governanceData.metrics.actionClosureSpeed.color),
          },
          {
            title: "Readiness Trend Stability",
            score: governanceData.metrics.readinessTrendStability.score,
            weight: governanceData.metrics.readinessTrendStability.weight,
            color: getMetricColor(
              governanceData.metrics.readinessTrendStability.color
            ),
          },
          {
            title: "PM Override Frequency",
            score: governanceData.metrics.pmOverrideFrequency.score,
            weight: governanceData.metrics.pmOverrideFrequency.weight,
            color: getMetricColor(
              governanceData.metrics.pmOverrideFrequency.color
            ),
          },
        ]
      : [];

  const weeklyReadinessData = governanceData?.weeklyReadinessData || [];
  const actionsData = governanceData?.actionsData || [];
  const ragTrendData = governanceData?.ragTrendData || [];
  const constraintData = governanceData?.constraintData || [];
  const historicalWeeks = governanceData?.historicalWeeks || [];

  const selectedWeekData = historicalWeeks.find((w) => w.week === selectedWeek);

  if (loading) {
    return (
      <AdminLayout
        title="Governance Dashboard"
        subtitle="Project governance performance and historical analysis"
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
          }}
        >
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      </AdminLayout>
    );
  }

  // Show "No Data" state when there's no governance data
  if (!governanceData || governanceData.hasData === false) {
    return (
      <AdminLayout
        title="Governance Dashboard"
        subtitle="Project governance performance and historical analysis"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "500px",
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: COLORS.bgTertiary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: "36px" }}>📊</Typography>
          </Box>
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: "20px",
              fontWeight: 600,
              mb: 1,
            }}
          >
            No Governance Data Available
          </Typography>
          <Typography
            sx={{
              color: COLORS.textSecondary,
              fontSize: "14px",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            {governanceData?.message ||
              "Upload a programme PDF to a project to start tracking governance metrics."}
          </Typography>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Governance Dashboard"
      subtitle="Project governance performance and historical analysis"
    >
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
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md: "1.5fr 1fr 1fr 1fr 1fr 1.5fr",
            },
            gap: 3,
            px: 5,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "12px",
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
                fontWeight: 600,
              }}
            >
              Crossrail Phase 2
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                mb: 0.75,
              }}
            >
              Phase
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Construction
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                mb: 0.75,
              }}
            >
              WEEKS RECORDED
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              24
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                mb: 0.75,
              }}
            >
              WEEKS CLOSED ON TIME
            </Typography>
            <Typography
              sx={{
                color: COLORS.green,
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              21
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                mb: 0.75,
              }}
            >
              PM OVERRIDES
            </Typography>
            <Typography
              sx={{
                color: COLORS.amber,
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              3
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                mb: 0.75,
                textAlign: { xs: "left", md: "right" },
              }}
            >
              CURRENT GOVERNANCE STATUS
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                justifyContent: { xs: "flex-start", md: "flex-end" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: COLORS.green,
                  }}
                />
                <Typography
                  sx={{
                    color: COLORS.green,
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  GREEN
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline" }}>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  78
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                >
                  /100
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box> */}

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
            color: COLORS.textMuted,
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            mb: 3,
          }}
        >
          GOVERNANCE SCORE
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: { xs: 4, md: 6 },
          }}
        >
          <CircularGauge
            score={governanceData?.score || 0}
            status={governanceData?.status || "GREEN"}
          />

          <Box
            sx={{
              display: "flex",
              flexWrap: { xs: "wrap", lg: "nowrap" },
              flex: 1,
              alignItems: "center",
              borderRadius: "6px",
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            {metrics.map((metric) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                score={metric.score}
                weight={metric.weight}
                color={metric.color}
              />
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mt: 3,
        }}
      >
        <StatsCard
          label="Total Weeks"
          value={String(governanceData?.stats.totalWeeks || 0)}
        />
        <StatsCard
          label="Avg Readiness"
          value={governanceData?.stats.avgReadiness || "0%"}
        />
        <StatsCard
          label="Total Actions Raised"
          value={String(governanceData?.stats.totalActionsRaised || 0)}
        />
        <StatsCard
          label="Total Closed"
          value={String(governanceData?.stats.totalClosed || 0)}
        />
        <StatsCard
          label="Overdue Trend"
          value={governanceData?.stats.overdueTrend || "Stable"}
        />
        <StatsCard
          label="Recurring Blockers"
          value={String(governanceData?.stats.recurringBlockers || 0)}
          suffix="types"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" },
          gap: 3,
          mt: 3,
          overflow: "hidden",
          maxWidth: "100%",
        }}
      >
        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 3,
            overflow: "hidden",
            minWidth: 0,
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
            WEEKLY READINESS TREND
          </Typography>
          <CustomLegend
            items={[{ label: "Readiness %", color: COLORS.green }]}
          />
          <Box
            sx={{
              overflowX: "auto",
              overflowY: "hidden",
              "&::-webkit-scrollbar": {
                height: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: COLORS.bgTertiary,
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: COLORS.borderDark,
                borderRadius: "3px",
              },
            }}
          >
            <Box
              sx={{
                width: weeklyReadinessData.length > 15 ? `${weeklyReadinessData.length * 45}px` : "100%",
                minWidth: "100%",
                height: 320,
              }}
            >
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart
                  data={weeklyReadinessData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="readinessGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={COLORS.green}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor={COLORS.green}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke={COLORS.borderDark}
                    vertical={false}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: COLORS.textSecondary,
                      fontSize: 11,
                    }}
                    height={30}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    axisLine={{ stroke: COLORS.borderDark }}
                    tickLine={false}
                    tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.bgTertiary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: COLORS.textPrimary }}
                    itemStyle={{ color: COLORS.green }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    fill="url(#readinessGradient)"
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    dot={{ fill: COLORS.green, strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: COLORS.green }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 3,
            overflow: "hidden",
            minWidth: 0,
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
            ACTIONS RAISED VS CLOSED
          </Typography>
          {actionsData.some((d) => d.raised > 0 || d.closed > 0) ? (
            <>
              <CustomLegend
                items={[
                  { label: "Raised", color: COLORS.blue },
                  { label: "Closed", color: COLORS.green },
                ]}
              />
              <Box
                sx={{
                  overflowX: "auto",
                  overflowY: "hidden",
                  width: "100%",
                  "&::-webkit-scrollbar": {
                    height: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: COLORS.bgTertiary,
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: COLORS.borderDark,
                    borderRadius: "3px",
                  },
                }}
              >
                <Box
                  sx={{
                    width: actionsData.length > 15 ? `${actionsData.length * 45}px` : "100%",
                    minWidth: "100%",
                    height: 320,
                  }}
                >
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={actionsData}
                      barGap={2}
                      barCategoryGap="35%"
                      margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="0"
                        stroke={COLORS.borderDark}
                        vertical={false}
                        horizontal={true}
                      />
                      <XAxis
                        dataKey="week"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: COLORS.textSecondary,
                          fontSize: 11,
                        }}
                        height={30}
                        interval={0}
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis
                        domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax / 2) * 2)]}
                        axisLine={{ stroke: COLORS.borderDark }}
                        tickLine={false}
                        tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                        width={30}
                        tickCount={6}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: COLORS.bgTertiary,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: COLORS.textPrimary }}
                        cursor={false}
                      />
                      <Bar
                        dataKey="raised"
                        fill={COLORS.blue}
                        radius={[8, 8, 0, 0]}
                        barSize={12}
                      />
                      <Bar
                        dataKey="closed"
                        fill={COLORS.green}
                        radius={[8, 8, 0, 0]}
                        barSize={12}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 320,
                color: COLORS.textMuted,
              }}
            >
              <Typography sx={{ fontSize: "14px", textAlign: "center" }}>
                No actions raised or closed yet.
              </Typography>
              <Typography sx={{ fontSize: "12px", mt: 1, textAlign: "center" }}>
                Create actions from the Weekly Control page to see data here.
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 3,
            overflow: "hidden",
            minWidth: 0,
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
            WEEKLY RAG TREND
          </Typography>
          <CustomLegend
            items={[
              { label: "Green", color: COLORS.green },
              { label: "Amber", color: COLORS.amber },
              { label: "Red", color: COLORS.red },
            ]}
          />
          <Box
            sx={{
              overflowX: "auto",
              overflowY: "hidden",
              width: "100%",
              "&::-webkit-scrollbar": {
                height: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: COLORS.bgTertiary,
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: COLORS.borderDark,
                borderRadius: "3px",
              },
            }}
          >
            <Box
              sx={{
                width: ragTrendData.length > 15 ? `${ragTrendData.length * 45}px` : "100%",
                minWidth: "100%",
                height: 320,
              }}
            >
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={ragTrendData}
                  margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke={COLORS.borderDark}
                    vertical={false}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: COLORS.textSecondary,
                      fontSize: 11,
                    }}
                    height={30}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, (dataMax: number) => {
                      const max = Math.max(10, dataMax);
                      return Math.ceil(max / 5) * 5;
                    }]}
                    tickCount={6}
                    axisLine={{ stroke: COLORS.borderDark }}
                    tickLine={false}
                    tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                    width={35}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.bgTertiary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: COLORS.textPrimary }}
                    cursor={false}
                  />
                  <Bar dataKey="green" stackId="a" fill={COLORS.green} radius={0} />
                  <Bar dataKey="amber" stackId="a" fill={COLORS.amber} radius={0} />
                  <Bar dataKey="red" stackId="a" fill={COLORS.red} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>
      </Box>

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
            color: COLORS.textSecondary,
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            mb: 3,
          }}
        >
          CONSTRAINT INTELLIGENCE
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2,
            pb: 2,
            borderBottom: `1px solid ${COLORS.borderDark}`,
          }}
        >
          <Typography
            sx={{ color: COLORS.textMuted, fontSize: "12px", fontWeight: 600 }}
          >
            CONSTRAINT TYPE
          </Typography>
          <Typography
            sx={{ color: COLORS.textMuted, fontSize: "12px", fontWeight: 600 }}
          >
            FREQUENCY
          </Typography>
          <Typography
            sx={{ color: COLORS.textMuted, fontSize: "12px", fontWeight: 600 }}
          >
            TREND
          </Typography>
          <Typography
            sx={{
              color: COLORS.textMuted,
              fontSize: "12px",
              fontWeight: 600,
              textAlign: "right",
            }}
          >
            LAST SEEN
          </Typography>
        </Box>

        {constraintData.map((item, index) => (
          <Box
            key={item.type}
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 2,
              py: 2,
              borderBottom:
                index < constraintData.length - 1
                  ? `1px solid ${COLORS.borderDark}`
                  : "none",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {item.type}
            </Typography>
            <Typography sx={{ color: COLORS.textPrimary, fontSize: "14px" }}>
              {item.frequency}
            </Typography>
            <TrendBadge trend={item.trend} />
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "14px",
                textAlign: "right",
              }}
            >
              {item.lastSeen}
            </Typography>
          </Box>
        ))}
      </Box>

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
            color: COLORS.textSecondary,
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            pb: 2,
            mx: -3,
            px: 3,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          HISTORICAL WEEK EXPLORER
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 0,
            alignItems: { xs: "stretch", md: "flex-start" },
            mx: -3,
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: "300px" },
              flexShrink: 0,
              borderRight: { xs: "none", md: `1px solid ${COLORS.border}` },
              maxHeight: "500px",
              overflowY: "auto",
              overflowX: "hidden",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: COLORS.bgTertiary,
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: COLORS.borderDark,
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: COLORS.textMuted,
              },
            }}
          >
            {historicalWeeks.map((week) => {
              const getStatusColors = (status: string) => {
                switch (status) {
                  case "Green":
                    return { bg: "rgba(34, 197, 94, 0.15)", color: COLORS.green };
                  case "Amber":
                    return { bg: "rgba(245, 158, 11, 0.15)", color: COLORS.amber };
                  case "Current":
                    return { bg: "rgba(59, 130, 246, 0.15)", color: COLORS.blue };
                  case "Upcoming":
                    return { bg: "rgba(107, 114, 128, 0.15)", color: COLORS.textMuted };
                  default:
                    return { bg: "rgba(107, 114, 128, 0.15)", color: COLORS.textMuted };
                }
              };

              const statusColors = getStatusColors(week.status);

              return (
                <Box
                  key={week.week}
                  onClick={() => setSelectedWeek(week.week)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 2,
                    pl: 3,
                    pr: 2,
                    borderBottom: `1px solid ${COLORS.border}`,
                    borderLeft:
                      selectedWeek === week.week
                        ? `3px solid ${COLORS.blue}`
                        : "3px solid transparent",
                    cursor: "pointer",
                    bgcolor: "transparent",
                    "&:hover": {
                      bgcolor: COLORS.bgTertiary,
                    },
                  }}
                >
                  {week.icon === "check" ? (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "rgba(34, 197, 94, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        component="img"
                        src={checkIcon}
                        sx={{ width: 15, height: 15 }}
                      />
                    </Box>
                  ) : week.icon === "current" ? (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "rgba(59, 130, 246, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: COLORS.blue,
                        }}
                      />
                    </Box>
                  ) : week.icon === "upcoming" ? (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "rgba(107, 114, 128, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: COLORS.textMuted,
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "rgba(245, 158, 11, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <WarningAmberOutlinedIcon
                        sx={{ color: COLORS.amber, fontSize: 20 }}
                      />
                    </Box>
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      Week {week.week}
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "12px" }}
                    >
                      {week.date}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: statusColors.bg,
                      color: statusColors.color,
                      px: 1.5,
                      py: 0.5,
                      mr: 2,
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {week.status}
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ flex: 1, p: 3 }}>
            {selectedWeekData ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "20px",
                      fontWeight: 600,
                    }}
                  >
                    Week {selectedWeek} Detail
                  </Typography>
                  <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
                    {selectedWeekData.date}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  {[
                    {
                      label: "Activities",
                      value: String(
                        selectedWeekData.stats?.totalActivities || 0
                      ),
                    },
                    {
                      label: "Actions Raised",
                      value: String(selectedWeekData.stats?.actionsTotal || 0),
                    },
                    {
                      label: "Actions Closed",
                      value: String(
                        selectedWeekData.stats?.actionsCompleted || 0
                      ),
                    },
                    {
                      label: "Readiness",
                      value: `${
                        selectedWeekData.stats?.totalActivities
                          ? Math.round(
                              ((selectedWeekData.stats?.green || 0) /
                                selectedWeekData.stats.totalActivities) *
                                100
                            )
                          : 0
                      }%`,
                    },
                  ].map((stat) => (
                    <Box
                      key={stat.label}
                      sx={{
                        bgcolor: COLORS.bgPrimary,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "8px",
                        p: 2,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.textSecondary,
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography
                        sx={{
                          color: COLORS.white,
                          fontSize: "24px",
                          fontWeight: 700,
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 1.5,
                    }}
                  >
                    RAG Breakdown
                  </Typography>
                  <Box sx={{ display: "flex", gap: 3, mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: COLORS.green,
                        }}
                      />
                      <Typography
                        sx={{ color: COLORS.textPrimary, fontSize: "13px" }}
                      >
                        Green: {selectedWeekData.stats?.green || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: COLORS.amber,
                        }}
                      />
                      <Typography
                        sx={{ color: COLORS.textPrimary, fontSize: "13px" }}
                      >
                        Amber: {selectedWeekData.stats?.amber || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: COLORS.red,
                        }}
                      />
                      <Typography
                        sx={{ color: COLORS.textPrimary, fontSize: "13px" }}
                      >
                        Red: {selectedWeekData.stats?.red || 0}
                      </Typography>
                    </Box>
                  </Box>
                  {(() => {
                    const total =
                      (selectedWeekData.stats?.green || 0) +
                      (selectedWeekData.stats?.amber || 0) +
                      (selectedWeekData.stats?.red || 0);
                    const greenPct =
                      total > 0
                        ? ((selectedWeekData.stats?.green || 0) / total) * 100
                        : 0;
                    const amberPct =
                      total > 0
                        ? ((selectedWeekData.stats?.amber || 0) / total) * 100
                        : 0;
                    const redPct =
                      total > 0
                        ? ((selectedWeekData.stats?.red || 0) / total) * 100
                        : 0;
                    return (
                      <Box
                        sx={{
                          display: "flex",
                          height: 8,
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{ width: `${greenPct}%`, bgcolor: COLORS.green }}
                        />
                        <Box
                          sx={{ width: `${amberPct}%`, bgcolor: COLORS.amber }}
                        />
                        <Box sx={{ width: `${redPct}%`, bgcolor: COLORS.red }} />
                      </Box>
                    );
                  })()}
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: COLORS.bgPrimary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      p: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.textMuted,
                        fontSize: "12px",
                        mb: 1.5,
                        fontWeight: 400,
                      }}
                    >
                      Closure Type
                    </Typography>
                    <Box
                      sx={{
                        bgcolor:
                          selectedWeekData.closeType === "Normal Close"
                            ? "rgba(34, 197, 94, 0.15)"
                            : selectedWeekData.closeType === "In Progress"
                              ? "rgba(59, 130, 246, 0.15)"
                              : selectedWeekData.closeType === "Upcoming"
                                ? "rgba(107, 114, 128, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                        color:
                          selectedWeekData.closeType === "Normal Close"
                            ? COLORS.green
                            : selectedWeekData.closeType === "In Progress"
                              ? COLORS.blue
                              : selectedWeekData.closeType === "Upcoming"
                                ? COLORS.textMuted
                                : COLORS.amber,
                        px: 2,
                        py: 0.75,
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 500,
                        display: "inline-block",
                      }}
                    >
                      {selectedWeekData.closeType || "Normal Close"}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: COLORS.bgPrimary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      p: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.textMuted,
                        fontSize: "12px",
                        mb: 1,
                        fontWeight: 400,
                      }}
                    >
                      {selectedWeekData.closeType === "PM Override"
                        ? "Override Notes"
                        : "Week Notes"}
                    </Typography>
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        lineHeight: 1.5,
                      }}
                    >
                      {selectedWeekData.notes ||
                        (selectedWeekData.closeType === "Normal Close"
                          ? "Week closed successfully with all activities on track."
                          : "No notes available.")}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "300px",
                }}
              >
                <Typography sx={{ color: COLORS.textMuted }}>
                  {historicalWeeks.length === 0
                    ? "No historical data available. Close a week cycle to see data here."
                    : "Select a week to view details"}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default AdminGovernanceDashboard;
