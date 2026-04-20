import {
  Box,
  Card,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Link,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowRight,
  ChevronRight,
} from "@mui/icons-material";
import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { COLORS, getStatusColor } from "../../constants/colors";

const DonutChart = () => {
  const data = [
    {
      label: "Green — On Track",
      value: 24,
      percentage: 48,
      color: COLORS.green,
    },
    {
      label: "Amber — At Risk",
      value: 18,
      percentage: 36,
      color: COLORS.amber,
    },
    { label: "Red — Critical", value: 8, percentage: 16, color: COLORS.red },
  ];

  const radius = 40;
  const strokeWidth = 12;
  const gapAngle = 1.5;

  const createArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);
    const x1 = 50 + radius * Math.cos(start);
    const y1 = 50 + radius * Math.sin(start);
    const x2 = 50 + radius * Math.cos(end);
    const y2 = 50 + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  let currentAngle = 0;
  const arcs = data.map((item) => {
    const startAngle = currentAngle + gapAngle / 2;
    const sweepAngle = (item.percentage / 100) * 360 - gapAngle;
    const endAngle = startAngle + sweepAngle;
    currentAngle += (item.percentage / 100) * 360;
    return { ...item, path: createArc(startAngle, endAngle) };
  });

  return (
    <Box>
      <Box sx={{ position: "relative", width: 240, height: 240, mx: "auto" }}>
        <svg viewBox="0 0 100 100">
          {arcs.map((item, index) => (
            <path
              key={index}
              d={item.path}
              fill="transparent"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: "1.6rem",
              fontWeight: 700,
            }}
          >
            48%
          </Typography>
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.9rem" }}>
            On Track
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        {data.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: item.color,
                }}
              />
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "14px",
                  fontWeight: 400,
                }}
              >
                {item.label}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Typography
                sx={{
                  color: COLORS.white,
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {item.value}
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                {item.percentage}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const tasksData = [
  {
    id: "ACT-001",
    name: "Foundation pour - Block A",
    startDate: "2026-03-25",
    endDate: "2026-04-03",
    duration: "10d",
    status: "green",
    linkedActions: [
      "Confirm concrete delivery",
      "Safety briefing completed",
      "Formwork inspection sign-off",
    ],
    dependencies: "ACT-012 (Complete)",
  },
  {
    id: "ACT-002",
    name: "Steel erection - Level 2",
    startDate: "2026-03-27",
    endDate: "2026-04-05",
    duration: "8d",
    status: "green",
  },
  {
    id: "ACT-003",
    name: "Mechanical rough-in - Zone C",
    startDate: "2026-03-30",
    endDate: "2026-04-07",
    duration: "7d",
    status: "green",
  },
  {
    id: "ACT-004",
    name: "Waterproofing - Basement 1",
    startDate: "2026-04-01",
    endDate: "2026-04-08",
    duration: "6d",
    status: "amber",
    linkedActions: ["Material delivery confirmed", "Weather check completed"],
    dependencies: "ACT-003 (In Progress)",
  },
  {
    id: "ACT-005",
    name: "Curtain wall installation",
    startDate: "2026-04-06",
    endDate: "2026-04-17",
    duration: "12d",
    status: "amber",
    linkedActions: [
      "Crane scheduling confirmed",
      "Safety harness inspection",
      "Glass panels delivered",
    ],
    dependencies: "ACT-002 (Complete)",
  },
  {
    id: "ACT-006",
    name: "Electrical first fix - Floors 3-5",
    startDate: "2026-04-08",
    endDate: "2026-04-18",
    duration: "9d",
    status: "amber",
  },
  {
    id: "ACT-007",
    name: "Rooftop drainage - Phase 2",
    startDate: "2026-04-10",
    endDate: "2026-04-20",
    duration: "11d",
    status: "green",
  },
  {
    id: "ACT-008",
    name: "Fire safety installation",
    startDate: "2026-04-12",
    endDate: "2026-04-22",
    duration: "10d",
    status: "red",
  },
  {
    id: "ACT-009",
    name: "HVAC system testing",
    startDate: "2026-04-15",
    endDate: "2026-04-25",
    duration: "10d",
    status: "amber",
  },
  {
    id: "ACT-010",
    name: "Interior painting - Level 1",
    startDate: "2026-04-18",
    endDate: "2026-04-28",
    duration: "10d",
    status: "green",
  },
];

const TaskRow = ({ task }: { task: (typeof tasksData)[0] }) => {
  const [open, setOpen] = useState(task.id === "ACT-001");
  const statusColor = getStatusColor(task.status);

  return (
    <>
      <TableRow
        sx={{
          position: "relative",
          "&:hover": { bgcolor: COLORS.whiteHoverLight },
          bgcolor: open ? COLORS.blueBgLight : "transparent",
        }}
      >
        <TableCell
          sx={{
            color: COLORS.blue,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 2,
            position: "relative",
            pl: 3,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 1,
              bottom: 1,
              width: "4px",
              bgcolor: statusColor,
            }}
          />
          {task.id}
        </TableCell>
        <TableCell
          sx={{
            color: COLORS.textPrimary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {task.linkedActions && (
              <IconButton
                size="small"
                onClick={() => setOpen(!open)}
                sx={{ color: COLORS.textSecondary, p: 0.25, mr: 0.5 }}
              >
                {open ? (
                  <KeyboardArrowDown fontSize="small" />
                ) : (
                  <KeyboardArrowRight fontSize="small" />
                )}
              </IconButton>
            )}
            {task.name}
          </Box>
        </TableCell>
        <TableCell
          sx={{
            color: COLORS.textSecondary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 2,
          }}
        >
          {task.startDate}
        </TableCell>
        <TableCell
          sx={{
            color: COLORS.textSecondary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 2,
          }}
        >
          {task.endDate}
        </TableCell>
        <TableCell
          align="center"
          sx={{
            color: COLORS.textSecondary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 2,
          }}
        >
          {task.duration}
        </TableCell>
      </TableRow>

      {task.linkedActions && (
        <TableRow>
          <TableCell
            colSpan={5}
            sx={{
              py: 0,
              px: 0,
              borderBottom: open ? `1px solid ${COLORS.border}` : "none",
              bgcolor: COLORS.bgPrimary,
            }}
          >
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  py: 2,
                  pl: 4,
                  pr: 4,
                  display: "flex",
                  gap: 16,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      mb: 1.5,
                      letterSpacing: "0.05em",
                    }}
                  >
                    LINKED ACTIONS
                  </Typography>
                  {task.linkedActions.map((action, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.75,
                      }}
                    >
                      <ChevronRight
                        sx={{ color: COLORS.blue, fontSize: "1.1rem" }}
                      />
                      <Typography
                        sx={{ color: COLORS.textLight, fontSize: "0.875rem" }}
                      >
                        {action}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      mb: 1.5,
                      letterSpacing: "0.05em",
                    }}
                  >
                    DEPENDENCIES
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textLight, fontSize: "0.875rem" }}
                  >
                    {task.dependencies}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.email?.split("@")[0] || "User";

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Project overview and quick actions"
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{ color: COLORS.blue, fontWeight: 600, fontSize: "14px" }}
            >
              Crossrail Phase 2
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontWeight: 400,
                fontSize: "14px",
              }}
            >
              — Week 47 cycle is currently
            </Typography>
          </Box>
          <Chip
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: COLORS.amber,
                  ml: 1,
                }}
              />
            }
            label="In Progress"
            size="small"
            sx={{
              bgcolor: COLORS.bgTertiary,
              color: COLORS.amber,
              fontWeight: 600,
              fontSize: "0.875rem",
              height: 32,
              px: 1,
              borderRadius: "20px",
              "& .MuiChip-icon": {
                marginLeft: "8px",
                marginRight: "-4px",
              },
            }}
          />
        </Box>
        <Typography
          sx={{
            color: COLORS.textSecondary,
            fontSize: "12px",
            fontWeight: 400,
          }}
        >
          Cycle opened Mon 24 Mar - Review meeting scheduled Thu 27 Mar 14:00
        </Typography>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "400px 1fr" },
          gap: 3,
        }}
      >
        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textLight,
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Weekly Readiness Snapshot
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                Week 47 RAG distribution
              </Typography>
            </Box>
            <Chip
              label="50 activities"
              size="small"
              sx={{
                bgcolor: COLORS.bgPrimary,
                color: COLORS.white,
                fontWeight: 500,
                fontSize: "10px",
                minWidth: 69,
                height: 22,
                borderRadius: "6px",
              }}
            />
          </Box>
          <DonutChart />
        </Card>

        <Card
          sx={{
            bgcolor: COLORS.bgPrimary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 3,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textLight,
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Recent Tasks
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                Latest events across Crossrail Phase 2
              </Typography>
            </Box>
            <Link
              href="#"
              underline="none"
              sx={{
                color: COLORS.blue,
                fontSize: "12px",
                fontWeight: 500,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              View all
            </Link>
          </Box>

          <Box
            sx={{
              bgcolor: COLORS.bgTableInner,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <TableContainer
              sx={{
                maxHeight: 500,
                overflowY: "auto",
                "&::-webkit-scrollbar": { display: "none" },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "transparent" }}>
                    <TableCell
                      sx={{
                        color: COLORS.border,
                        fontSize: "12px",
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 1.5,
                        pl: 3,
                        letterSpacing: "0.05em",
                      }}
                    >
                      ACTIVITY ID
                    </TableCell>
                    <TableCell
                      sx={{
                        color: COLORS.border,
                        fontSize: "12px",
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 1.5,
                        letterSpacing: "0.05em",
                      }}
                    >
                      ACTIVITY NAME
                    </TableCell>
                    <TableCell
                      sx={{
                        color: COLORS.border,
                        fontSize: "12px",
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 1.5,
                        letterSpacing: "0.05em",
                      }}
                    >
                      STARTDATE
                    </TableCell>
                    <TableCell
                      sx={{
                        color: COLORS.border,
                        fontSize: "12px",
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 1.5,
                        letterSpacing: "0.05em",
                      }}
                    >
                      END DATE
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: COLORS.border,
                        fontSize: "12px",
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 1.5,
                        letterSpacing: "0.05em",
                      }}
                    >
                      DURATION
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasksData.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;
