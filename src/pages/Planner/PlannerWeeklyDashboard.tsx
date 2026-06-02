import { Box, Typography } from "@mui/material";
import PlannerLayout from "../../layouts/PlannerLayout";
import { COLORS } from "../../constants/colors";
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

const PlannerWeeklyDashboard = () => {
  const amberColor = "#F59E0B";

  return (
    <PlannerLayout
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
              Crossrail Phase 2
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
              Week 24{" "}
              <Typography
                component="span"
                sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
              >
                (17-23 Mar 2026)
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
                bgcolor: "rgba(59, 130, 246, 0.15)",
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: COLORS.blue,
                }}
              />
              <Typography
                sx={{
                  color: COLORS.blue,
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Execution
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
                bgcolor: "rgba(245, 158, 11, 0.15)",
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: amberColor,
                }}
              />
              <Typography
                sx={{
                  color: amberColor,
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Amber
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
              17 Mar 2026
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
              23 Mar 2026
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
              Kamran R.
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
            50
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
            24
          </Typography>
          <Typography
            sx={{
              color: COLORS.green,
              fontSize: "12px",
            }}
          >
            48% on track
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
            8
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
            14
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
            3
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
              color: COLORS.red,
              fontSize: "32px",
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            No
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: COLORS.red,
              }}
            />
            <Typography
              sx={{
                color: COLORS.red,
                fontSize: "12px",
              }}
            >
              Blockers remain
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
                    { name: "Green", value: 48, color: COLORS.green },
                    { name: "Amber", value: 32, color: COLORS.amber },
                    { name: "Red", value: 20, color: COLORS.red },
                  ]}
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
                  <Cell fill={COLORS.green} />
                  <Cell fill={COLORS.amber} />
                  <Cell fill={COLORS.red} />
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
                  { name: "Open", value: 14 },
                  { name: "Closed", value: 28 },
                  { name: "Overdue", value: 3 },
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
    </PlannerLayout>
  );
};

export default PlannerWeeklyDashboard;
