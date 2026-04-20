import { Box, Card, Typography, Tabs, Tab } from "@mui/material";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { COLORS } from "../../constants/colors";
import ActivitiesTable, {
  activitiesData,
} from "../../components/ActivitiesTable";
import ActivitiesSummary from "../../components/ActivitiesSummary";

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
  onClick,
}: {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
    }}
    onClick={onClick}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        bgcolor: isActive || isCompleted ? COLORS.blue : "transparent",
        border: isActive || isCompleted ? "none" : `2px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isActive || isCompleted ? "#fff" : COLORS.border,
        fontWeight: 500,
        fontSize: "15px",
        transition: "all 0.2s ease",
        "&:hover": {
          opacity: 0.8,
        },
      }}
    >
      {number}
    </Box>
    <Typography
      sx={{
        color: isActive || isCompleted ? COLORS.textPrimary : COLORS.border,
        fontSize: "14px",
        fontWeight: 400,
        mt: 1,
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

const ProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [ragFilter, setRagFilter] = useState("all");

  const project = projectsData[projectId || "1"];

  const filteredActivities = activitiesData.filter((activity) => {
    if (ragFilter === "all") return true;
    return activity.ragColor === ragFilter;
  });

  const greenCount = activitiesData.filter(
    (a) => a.ragColor === "green",
  ).length;
  const amberCount = activitiesData.filter(
    (a) => a.ragColor === "amber",
  ).length;
  const redCount = activitiesData.filter((a) => a.ragColor === "red").length;
  const blockedCount = activitiesData.filter(
    (a) => a.status === "Blocked",
  ).length;

  const steps = [
    "Draft",
    "Meeting Open",
    "Execution",
    "Close-Out Eligible",
    "Closed",
  ];

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber === currentStep && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

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
            height: 210,
            p: { xs: 2.5, sm: 3 },
            mb: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "flex-start" },
              gap: 2,
              mb: 0,
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.75 }}>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
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
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  &nbsp;/ {project.name}
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "26px",
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
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                >
                  Phase:
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.textLight,
                    fontSize: "14px",
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
                flexDirection: { xs: "row", md: "row" },
                alignItems: { xs: "flex-start", md: "center" },
                gap: 2,
              }}
            >
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  {project.week} ({project.weekDates})
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color: COLORS.border,
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    Planner:
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      color: COLORS.textLight,
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    &nbsp;{project.planner}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgTertiary,
                  color: COLORS.textSecondary,
                  px: 2.5,
                  py: 1,
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
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
              justifyContent: "center",
              maxWidth: "100%",
              width: "100%",
              overflowX: "auto",
              overflowY: "hidden",
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
                  onClick={() => handleStepClick(index + 1)}
                />
                {index < steps.length - 1 && (
                  <Box
                    sx={{
                      width: 75,
                      height: 2,
                      bgcolor:
                        index + 1 < currentStep ? COLORS.blue : COLORS.border,
                      mx: "46px",
                      mt: "19px",
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
                    fontSize: "15px",
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {project.cycleHistory.map((cycle, index) => (
                    <Box
                      key={index}
                      sx={{
                        bgcolor: "#161F32",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "7px",
                        minHeight: 57,
                        px: { xs: 1.5, sm: 2.5 },
                        py: { xs: 1.5, sm: 0 },
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                        alignItems: "center",
                        gap: { xs: 1.5, sm: 0 },
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: 500,
                            mb: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {cycle.week}
                        </Typography>
                        <Typography
                          sx={{
                            color: "#94A3B8",
                            fontSize: "12px",
                            fontWeight: 400,
                          }}
                        >
                          {cycle.dates}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: { xs: "flex-start", sm: "center" },
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor:
                              cycle.statusType === "green"
                                ? `${COLORS.green}15`
                                : `${COLORS.amber}15`,
                            border: `1px solid ${
                              cycle.statusType === "green"
                                ? COLORS.green
                                : COLORS.amber
                            }`,
                            color:
                              cycle.statusType === "green"
                                ? COLORS.green
                                : COLORS.amber,
                            px: { xs: 1.5, sm: 2.5 },
                            py: 0.75,
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {cycle.status}
                        </Box>
                      </Box>
                      <Typography
                        sx={{
                          color: "#94A3B8",
                          fontSize: "12px",
                          fontWeight: 400,
                          textAlign: { xs: "left", sm: "right" },
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
          <Box>
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
                {
                  week: "Week 1",
                  label: "Committed",
                  color: COLORS.green,
                  hasBg: false,
                },
                {
                  week: "Week 2",
                  label: "Committed",
                  color: COLORS.green,
                  hasBg: false,
                },
                {
                  week: "Week 3",
                  label: "Readiness",
                  color: COLORS.amber,
                  hasBg: true,
                },
                {
                  week: "Week 4",
                  label: "Readiness",
                  color: COLORS.amber,
                  hasBg: true,
                },
                {
                  week: "Week 5",
                  label: "Strategic",
                  color: COLORS.red,
                  hasBg: true,
                },
                {
                  week: "Week 6",
                  label: "Strategic",
                  color: COLORS.red,
                  hasBg: true,
                },
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
                    bgcolor: item.hasBg ? `${item.color}10` : "transparent",
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

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              {[
                { label: "All", value: "all" },
                { label: "Green", value: "green" },
                { label: "Amber", value: "amber" },
                { label: "Red", value: "red" },
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
                    bgcolor:
                      ragFilter === filter.value
                        ? COLORS.blueBgMedium
                        : "transparent",
                    color:
                      ragFilter === filter.value
                        ? COLORS.blue
                        : COLORS.textSecondary,
                    border: `1px solid ${
                      ragFilter === filter.value ? COLORS.blue : COLORS.border
                    }`,
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

            <ActivitiesTable activities={filteredActivities} />

            <ActivitiesSummary
              totalActivities={activitiesData.length}
              greenCount={greenCount}
              amberCount={amberCount}
              redCount={redCount}
              blockedCount={blockedCount}
              lastUpdated="25 Mar 2026, 09:15"
            />
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
