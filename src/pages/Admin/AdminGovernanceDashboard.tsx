import { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  LineChart,
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
  Legend,
} from "recharts";
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Remove as RemoveIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
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

const CircularGauge = ({ score }: { score: number }) => {
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
          stroke={COLORS.green}
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
            color: COLORS.green,
            fontSize: { xs: "12px", sm: "14px" },
            fontWeight: 600,
            mt: 0.5,
          }}
        >
          GREEN
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

const StatsCard = ({ label, value, suffix }: StatsCardProps) => (
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
          color: label === "Total Weeks" ? COLORS.white : COLORS.green,
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

const weeklyReadinessData = [
  { week: "W13", value: 70 },
  { week: "W14", value: 66 },
  { week: "W15", value: 68 },
  { week: "W16", value: 67 },
  { week: "W17", value: 64 },
  { week: "W18", value: 72 },
  { week: "W19", value: 74 },
  { week: "W20", value: 71 },
  { week: "W21", value: 68 },
  { week: "W22", value: 75 },
  { week: "W23", value: 78 },
  { week: "W24", value: 79 },
];

const actionsData = [
  { week: "W13", raised: 12, closed: 14 },
  { week: "W14", raised: 15, closed: 12 },
  { week: "W15", raised: 10, closed: 14 },
  { week: "W16", raised: 11, closed: 10 },
  { week: "W17", raised: 20, closed: 15 },
  { week: "W18", raised: 14, closed: 12 },
  { week: "W19", raised: 10, closed: 11 },
  { week: "W20", raised: 9, closed: 14 },
  { week: "W21", raised: 18, closed: 16 },
  { week: "W22", raised: 17, closed: 18 },
  { week: "W23", raised: 16, closed: 15 },
  { week: "W24", raised: 15, closed: 16 },
];

const ragTrendData = [
  { week: "W13", green: 25, amber: 8, red: 4 },
  { week: "W14", green: 22, amber: 10, red: 5 },
  { week: "W15", green: 20, amber: 8, red: 4 },
  { week: "W16", green: 24, amber: 9, red: 5 },
  { week: "W17", green: 21, amber: 10, red: 6 },
  { week: "W18", green: 28, amber: 10, red: 5 },
  { week: "W19", green: 26, amber: 9, red: 5 },
  { week: "W20", green: 25, amber: 10, red: 6 },
  { week: "W21", green: 30, amber: 12, red: 6 },
  { week: "W22", green: 32, amber: 10, red: 5 },
  { week: "W23", green: 33, amber: 11, red: 6 },
  { week: "W24", green: 34, amber: 10, red: 5 },
];

const constraintData = [
  { type: "Design Approval", frequency: 18, trend: "up", lastSeen: "Week 24" },
  {
    type: "Material Delivery",
    frequency: 12,
    trend: "stable",
    lastSeen: "Week 23",
  },
  { type: "Permit Delays", frequency: 6, trend: "down", lastSeen: "Week 20" },
  { type: "Site Access", frequency: 4, trend: "down", lastSeen: "Week 18" },
];

const historicalWeeks = [
  { week: 17, date: "01 Mar 2026", status: "Green", icon: "check" },
  { week: 18, date: "04 Mar 2026", status: "Green", icon: "check" },
  { week: 19, date: "14 Mar 2026", status: "Green", icon: "check" },
  { week: 20, date: "22 Mar 2026", status: "Amber", icon: "warning" },
  { week: 21, date: "25 Mar 2026", status: "Green", icon: "check" },
  { week: 22, date: "28 Mar 2026", status: "Green", icon: "check" },
  { week: 23, date: "29 Mar 2026", status: "Green", icon: "check" },
  { week: 24, date: "29 Mar 2026", status: "Amber", icon: "warning" },
];

const CustomLegend = ({
  items,
}: {
  items: { label: string; color: string }[];
}) => (
  <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 2 }}>
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
      color: "#EF4444",
      bgColor: "rgba(127, 29, 29, 0.5)",
      label: "Stable",
    },
    down: {
      icon: <ArrowDownIcon sx={{ fontSize: 16 }} />,
      color: "#22C55E",
      bgColor: "rgba(20, 83, 45, 0.5)",
      label: "Down",
    },
  };
  const { icon, color, bgColor, label } = config[trend as keyof typeof config];

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
  const [selectedWeek, setSelectedWeek] = useState(21);

  const metrics = [
    {
      title: "Weeks Closed On Time",
      score: 50,
      weight: 30,
      color: COLORS.green,
    },
    {
      title: "Overdue Action Rate",
      score: 72,
      weight: 25,
      color: COLORS.amber,
    },
    {
      title: "Action Closure Speed",
      score: 80,
      weight: 20,
      color: COLORS.green,
    },
    {
      title: "Readiness Trend Stability",
      score: 65,
      weight: 15,
      color: COLORS.amber,
    },
    {
      title: "PM Override Frequency",
      score: 85,
      weight: 10,
      color: COLORS.green,
    },
  ];

  return (
    <AdminLayout
      title="Governance Dashboard"
      subtitle="Project governance performance and historical analysis"
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
              md: "1.5fr 1fr 1fr 1fr 1fr 1.5fr",
            },
            gap: 3,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
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
              Crossrail Phase 2
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
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
                fontWeight: 500,
              }}
            >
              Construction
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
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
                fontWeight: 500,
              }}
            >
              24
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
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
                fontWeight: 500,
              }}
            >
              21
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
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
                fontWeight: 500,
              }}
            >
              3
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
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
          <CircularGauge score={78} />

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
        <StatsCard label="Total Weeks" value="24" />
        <StatsCard label="Avg Readiness" value="72%" />
        <StatsCard label="Total Actions Raised" value="342" />
        <StatsCard label="Total Closed" value="298" />
        <StatsCard label="Overdue Trend" value="Down" />
        <StatsCard label="Recurring Blockers" value="4" suffix="types" />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" },
          gap: 3,
          mt: 3,
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
            WEEKLY READINESS TREND
          </Typography>
          <CustomLegend
            items={[{ label: "Readiness %", color: COLORS.green }]}
          />
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
                  fontSize: 12,
                  angle: -45,
                  textAnchor: "end",
                }}
                height={50}
                interval={0}
              />
              <YAxis
                domain={[40, 100]}
                ticks={[40, 50, 60, 70, 80, 90, 100]}
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
            ACTIONS RAISED VS CLOSED
          </Typography>
          <CustomLegend
            items={[
              { label: "Raised", color: COLORS.blue },
              { label: "Closed", color: COLORS.green },
            ]}
          />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={actionsData}
              barGap={2}
              barCategoryGap="35%"
              margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
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
                  fontSize: 12,
                  angle: -45,
                  textAnchor: "end",
                }}
                height={50}
                interval={0}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                domain={[0, 20]}
                ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]}
                axisLine={{ stroke: COLORS.borderDark }}
                tickLine={false}
                tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                width={30}
                interval={0}
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
            WEEKLY RAG TREND
          </Typography>
          <CustomLegend
            items={[
              { label: "Green", color: COLORS.green },
              { label: "Amber", color: COLORS.amber },
              { label: "Red", color: COLORS.red },
            ]}
          />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={ragTrendData}
              margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
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
                  fontSize: 12,
                  angle: -45,
                  textAnchor: "end",
                }}
                height={50}
                interval={0}
              />
              <YAxis
                domain={[0, 50]}
                ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]}
                axisLine={{ stroke: COLORS.borderDark }}
                tickLine={false}
                tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                width={30}
                interval={0}
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
            gap: 3,
            alignItems: { xs: "stretch", md: "center" },
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: "280px" },
              flexShrink: 0,
              borderRight: { xs: "none", md: `1px solid ${COLORS.border}` },
            }}
          >
            {historicalWeeks.map((week) => (
              <Box
                key={week.week}
                onClick={() => setSelectedWeek(week.week)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  py: 2,
                  ml: -3.1,
                  pl: 2,
                  borderBottom: `1px solid ${COLORS.border}`,
                  borderLeft:
                    selectedWeek === week.week
                      ? `1px solid ${COLORS.blue}`
                      : "1px solid transparent",
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
                    bgcolor:
                      week.status === "Green"
                        ? "rgba(34, 197, 94, 0.15)"
                        : "rgba(245, 158, 11, 0.15)",
                    color:
                      week.status === "Green" ? COLORS.green : COLORS.amber,
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
            ))}
          </Box>

          <Box sx={{ flex: 1 }}>
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
                Week {selectedWeek} Detail
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
                { label: "Activities", value: "46" },
                { label: "Actions Raised", value: "18" },
                { label: "Actions Closed", value: "12" },
                { label: "Readiness", value: "68%" },
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
                    Green: 24
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
                    Amber: 12
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
                    Red: 4
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  height: 8,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <Box sx={{ width: "60%", bgcolor: COLORS.green }} />
                <Box sx={{ width: "30%", bgcolor: COLORS.amber }} />
                <Box sx={{ width: "10%", bgcolor: COLORS.red }} />
              </Box>
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
                    bgcolor: "rgba(245, 158, 11, 0.15)",
                    color: COLORS.amber,
                    px: 2,
                    py: 0.75,
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 500,
                    display: "inline-block",
                  }}
                >
                  PM Override
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
                  Override Notes
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  PM override: Material delivery delays forced partial week
                  closure. Approved by J. Smith.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default AdminGovernanceDashboard;
