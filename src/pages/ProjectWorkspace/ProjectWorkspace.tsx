import { Box, Card, Typography, Button, Tabs, Tab } from "@mui/material";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { COLORS } from "../../constants/colors";

const projectsData: Record<
  string,
  {
    id: number;
    name: string;
    phase: string;
    week: string;
    weekDates: string;
    planner: string;
    currentStep: number;
    activitiesInLookahead: number;
    greenReady: number;
    totalGreen: number;
    openActions: number;
    overdueActions: number;
    ragDistribution: { green: number; amber: number; red: number };
    cycleHistory: Array<{
      week: string;
      dates: string;
      status: string;
      statusType: "green" | "amber";
      score: number;
    }>;
  }
> = {
  "1": {
    id: 1,
    name: "Crossrail Phase 2",
    phase: "Construction",
    week: "Week 24",
    weekDates: "17 - 23 Mar 2026",
    planner: "Kamran R.",
    currentStep: 1,
    activitiesInLookahead: 12,
    greenReady: 1,
    totalGreen: 5,
    openActions: 12,
    overdueActions: 1,
    ragDistribution: { green: 5, amber: 4, red: 3 },
    cycleHistory: [
      {
        week: "Week 23",
        dates: "10 - 16 Mar 2026",
        status: "Normal Close",
        statusType: "green",
        score: 82,
      },
      {
        week: "Week 22",
        dates: "03 - 09 Mar 2026",
        status: "PM Override",
        statusType: "amber",
        score: 68,
      },
      {
        week: "Week 21",
        dates: "24 Feb - 02 Mar 2026",
        status: "Normal Close",
        statusType: "green",
        score: 75,
      },
    ],
  },
  "2": {
    id: 2,
    name: "HS2 Northern Section",
    phase: "Design",
    week: "Week 12",
    weekDates: "10 - 16 Mar 2026",
    planner: "Sarah M.",
    currentStep: 2,
    activitiesInLookahead: 8,
    greenReady: 3,
    totalGreen: 8,
    openActions: 6,
    overdueActions: 2,
    ragDistribution: { green: 3, amber: 5, red: 2 },
    cycleHistory: [
      {
        week: "Week 11",
        dates: "03 - 09 Mar 2026",
        status: "Normal Close",
        statusType: "green",
        score: 78,
      },
      {
        week: "Week 10",
        dates: "24 Feb - 02 Mar 2026",
        status: "Normal Close",
        statusType: "green",
        score: 85,
      },
      {
        week: "Week 9",
        dates: "17 - 23 Feb 2026",
        status: "PM Override",
        statusType: "amber",
        score: 62,
      },
    ],
  },
  "3": {
    id: 3,
    name: "Thames Tideway",
    phase: "Pre-construction",
    week: "Week 8",
    weekDates: "03 - 09 Mar 2026",
    planner: "James T.",
    currentStep: 1,
    activitiesInLookahead: 15,
    greenReady: 2,
    totalGreen: 6,
    openActions: 9,
    overdueActions: 0,
    ragDistribution: { green: 6, amber: 3, red: 2 },
    cycleHistory: [
      {
        week: "Week 7",
        dates: "24 Feb - 02 Mar 2026",
        status: "Normal Close",
        statusType: "green",
        score: 88,
      },
      {
        week: "Week 6",
        dates: "17 - 23 Feb 2026",
        status: "Normal Close",
        statusType: "green",
        score: 91,
      },
      {
        week: "Week 5",
        dates: "10 - 16 Feb 2026",
        status: "Normal Close",
        statusType: "green",
        score: 79,
      },
    ],
  },
};

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
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        bgcolor: isActive ? COLORS.green : "transparent",
        border: `2px solid ${isActive || isCompleted ? COLORS.green : COLORS.textMuted}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isActive ? COLORS.bgPrimary : COLORS.textMuted,
        fontWeight: 600,
        fontSize: "14px",
      }}
    >
      {number}
    </Box>
    <Typography
      sx={{
        color: isActive ? COLORS.textPrimary : COLORS.textMuted,
        fontSize: "12px",
        mt: 1,
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
  const radius = 70;
  const strokeWidth = 28;
  const gapAngle = 2;

  const createArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);
    const x1 = 100 + radius * Math.cos(start);
    const y1 = 100 + radius * Math.sin(start);
    const x2 = 100 + radius * Math.cos(end);
    const y2 = 100 + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const segments = [
    { value: data.green, color: COLORS.green },
    { value: data.amber, color: COLORS.amber },
    { value: data.red, color: COLORS.red },
  ];

  let currentAngle = 0;
  const arcs = segments.map((segment) => {
    const startAngle = currentAngle + gapAngle / 2;
    const sweepAngle = (segment.value / total) * 360 - gapAngle;
    const endAngle = startAngle + sweepAngle;
    currentAngle += (segment.value / total) * 360;
    return { ...segment, path: createArc(startAngle, endAngle) };
  });

  return (
    <Box>
      <Box sx={{ position: "relative", width: 200, height: 200, mx: "auto" }}>
        <svg viewBox="0 0 200 200">
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
          gap: 3,
          mt: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: COLORS.green,
            }}
          />
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "12px" }}>
            Green: {data.green}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: COLORS.amber,
            }}
          />
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "12px" }}>
            Amber: {data.amber}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: COLORS.red,
            }}
          />
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "12px" }}>
            Red: {data.red}
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
      p: 2,
      textAlign: "center",
    }}
  >
    <Typography
      sx={{
        color: COLORS.textSecondary,
        fontSize: "12px",
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        color: valueColor,
        fontSize: "28px",
        fontWeight: 700,
      }}
    >
      {value}
    </Typography>
    {subLabel && (
      <Typography
        sx={{
          color: COLORS.textSecondary,
          fontSize: "11px",
        }}
      >
        {subLabel}
      </Typography>
    )}
  </Card>
);

const ProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const project = projectsData[projectId || "1"];

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

  const steps = [
    "Draft",
    "Meeting Open",
    "Execution",
    "Close-Out Eligible",
    "Closed",
  ];

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
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "flex-start" },
              gap: { xs: 2, sm: 0 },
              mb: 2,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  mb: 0.5,
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={() => navigate("/dashboard/projects")}
              >
                Projects / {project.name}
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: { xs: "20px", sm: "24px" },
                  fontWeight: 700,
                  wordBreak: "break-word",
                }}
              >
                {project.name}
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "14px",
                }}
              >
                Phase: {project.phase}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: "left", sm: "right" }, flexShrink: 0 }}>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                }}
              >
                {project.week} ({project.weekDates})
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  mb: 1,
                }}
              >
                Planner:{" "}
                <span style={{ color: COLORS.blue }}>{project.planner}</span>
              </Typography>
              <Button
                variant="outlined"
                sx={{
                  color: COLORS.textSecondary,
                  borderColor: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 600,
                  px: 2,
                  py: 0.5,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: COLORS.textSecondary,
                    bgcolor: COLORS.bgTertiary,
                  },
                }}
              >
                DRAFT
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              maxWidth: "100%",
              width: "100%",
              mx: "auto",
              overflowX: "auto",
              overflowY: "hidden",
              pb: 1,
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
                  alignItems: "center",
                  flex: index < steps.length - 1 ? 1 : "none",
                  minWidth: "fit-content",
                }}
              >
                <StepIndicator
                  number={index + 1}
                  label={step}
                  isActive={index + 1 === project.currentStep}
                  isCompleted={index + 1 < project.currentStep}
                />
                {index < steps.length - 1 && (
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 20,
                      height: 2,
                      bgcolor:
                        index + 1 < project.currentStep
                          ? COLORS.green
                          : COLORS.textMuted,
                      mx: 1,
                      mt: -2.5,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Card>

        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              "& .MuiTabs-indicator": {
                bgcolor: COLORS.blue,
              },
              "& .MuiTab-root": {
                color: COLORS.textSecondary,
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
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
                value={project.activitiesInLookahead}
              />
              <StatCard
                label={`${project.activitiesInLookahead} Green & Ready`}
                value={project.greenReady}
                subLabel={`of ${project.totalGreen} green`}
                valueColor={COLORS.green}
              />
              <StatCard
                label="Open Actions"
                value={project.openActions}
                valueColor={COLORS.amber}
              />
              <StatCard
                label="Overdue Actions"
                value={project.overdueActions}
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
                    fontSize: "14px",
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  RAG Distribution
                </Typography>
                <RAGDonutChart data={project.ragDistribution} />
              </Card>

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
                    fontSize: "14px",
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  Recent Cycle History
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {project.cycleHistory.map((cycle, index) => (
                    <Box
                      key={index}
                      sx={{
                        bgcolor: COLORS.bgTertiary,
                        borderRadius: 2,
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 100 }}>
                        <Typography
                          sx={{
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          {cycle.week}
                        </Typography>
                        <Typography
                          sx={{
                            color: COLORS.textSecondary,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cycle.dates}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          bgcolor:
                            cycle.statusType === "green"
                              ? COLORS.green
                              : COLORS.amber,
                          color: COLORS.bgPrimary,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "11px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cycle.status}
                      </Box>
                      <Typography
                        sx={{
                          color: COLORS.textSecondary,
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Score: {cycle.score}/100
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Box>
          </>
        )}

        {activeTab === 1 && (
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
              }}
            >
              Activities & Lookahead
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "14px",
                mt: 1,
              }}
            >
              This section will show detailed activities and lookahead data.
            </Typography>
          </Card>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
