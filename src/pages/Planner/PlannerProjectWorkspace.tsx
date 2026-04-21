import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import editIcon from "../../assets/tabler_edit.png";
import viewIcon from "../../assets/Frame.png";
import lockIcon from "../../assets/lock.png";
import uploadIcon from "../../assets/sidebar/upload.png";
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PlannerLayout from "../../layouts/PlannerLayout";
import { COLORS } from "../../constants/colors";
import ProjectHeader from "../../components/ProjectHeader";
import StatCard from "../../components/StatCard";
import RAGDonutChart from "../../components/RAGDonutChart";
import RecentCycleHistory from "../../components/RecentCycleHistory";
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

const steps = [
  "Draft",
  "Meeting Open",
  "Execution",
  "Close-Out Eligible",
  "Closed",
];

interface ActionItem {
  id: string;
  title: string;
  linkedActivity: string;
  type: string;
  assignee: { initials: string; name: string };
  dueDate: string;
  status: string;
  priority: string;
}

const initialActionsData: ActionItem[] = [
  {
    id: "ACT-001",
    title: "Obtain design approval for Section C",
    linkedActivity: "ACT-005",
    type: "Required",
    assignee: { initials: "JP", name: "James P." },
    dueDate: "2026-04-03",
    status: "Open",
    priority: "Required",
  },
  {
    id: "ACN-004",
    title: "Complete safety induction for subco.",
    linkedActivity: "ACT-003",
    type: "Required",
    assignee: { initials: "AB", name: "Ahmed B." },
    dueDate: "2026-03-29",
    status: "Open",
    priority: "Medium",
  },
  {
    id: "ACN-005",
    title: "Review and approve MEP coordinatio",
    linkedActivity: "ACT-006",
    type: "Required",
    assignee: { initials: "DK", name: "David K." },
    dueDate: "2026-04-02",
    status: "Open",
    priority: "Medium",
  },
  {
    id: "ACN-006",
    title: "Review and approve MEP coordinatio",
    linkedActivity: "ACT-006",
    type: "Required",
    assignee: { initials: "DK", name: "David K." },
    dueDate: "2026-04-02",
    status: "Open",
    priority: "Medium",
  },
];

const weeklyControlStats = {
  cycleStatus: "Meeting Open",
  inLookahead: 12,
  green: 5,
  blocked: 1,
  openActions: 12,
  overdue: 1,
  readyToClose: "No",
};

const blockedActivities = [
  {
    id: "ACT-1042",
    name: "Platform slab pour – Zone B",
    rag: "Red",
    owner: "Civil",
    blocker: "Concrete supply delay",
    linkedAction: "ACN-0087",
    status: "Open",
  },
  {
    id: "ACT-1058",
    name: "Tunnel ventilation duct install",
    rag: "Red",
    owner: "MEP",
    blocker: "Design approval pending",
    linkedAction: "ACN-0091",
    status: "Open",
  },
  {
    id: "ACT-1063",
    name: "Signal cable routing – Shaft 3",
    rag: "Amber",
    owner: "Signalling",
    blocker: "Access restriction until Wed",
    linkedAction: "ACN-0094",
    status: "Open",
  },
  {
    id: "ACT-1071",
    name: "Steelwork erection – Bay 7",
    rag: "Red",
    owner: "Structural",
    blocker: "Crane unavailable (breakdown)",
    linkedAction: "ACN-0096",
    status: "Overdue",
  },
  {
    id: "ACT-1079",
    name: "Fire stopping – Level 2 east",
    rag: "Amber",
    owner: "MEP",
    blocker: "Material on-site delayed to Thu",
    linkedAction: "ACN-0098",
    status: "Open",
  },
  {
    id: "ACT-1085",
    name: "Track slab alignment – Platform 3",
    rag: "Red",
    owner: "Civil",
    blocker: "Survey data incomplete",
    linkedAction: "ACN-0101",
    status: "Overdue",
  },
];

const PlannerProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [ragFilter, setRagFilter] = useState("all");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionsData, setActionsData] =
    useState<ActionItem[]>(initialActionsData);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [weeklyControlTab, setWeeklyControlTab] = useState(0);
  const [cycleStage, setCycleStage] = useState<
    "draft" | "meetingOpen" | "execution"
  >("draft");
  const [closureChecklist, setClosureChecklist] = useState({
    plannerReview: true,
    todoGenerated: false,
    overdueAcknowledged: false,
    blockedAcknowledged: false,
  });
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isWeekClosed, setIsWeekClosed] = useState(false);
  const [savedOverrideReason, setSavedOverrideReason] = useState("");

  const handleCycleAction = () => {
    if (cycleStage === "draft") {
      setCycleStage("meetingOpen");
      setCurrentStep(2);
    } else if (cycleStage === "meetingOpen") {
      setCycleStage("execution");
      setCurrentStep(3);
    }
  };

  const handleOverrideClose = () => {
    if (overrideReason.length >= 10) {
      setCurrentStep(5);
      setCycleStage("execution");
      setSavedOverrideReason(overrideReason);
      setIsWeekClosed(true);
      setShowOverrideForm(false);
      setOverrideReason("");
    }
  };

  const getCycleButtonText = () => {
    if (cycleStage === "draft") return "Open Meeting";
    if (cycleStage === "meetingOpen") return "Start Execution";
    return "In Execution";
  };

  const getCycleStatusText = () => {
    if (cycleStage === "draft") return "Draft";
    if (cycleStage === "meetingOpen") return "Meeting Open";
    return "Execution";
  };

  const handleEditClick = (action: ActionItem, index: number) => {
    setEditingAction({ ...action });
    setEditingIndex(index);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditingAction(null);
    setEditingIndex(null);
  };

  const handleEditUpdate = () => {
    if (editingAction && editingIndex !== null) {
      const updatedActions = [...actionsData];
      updatedActions[editingIndex] = editingAction;
      setActionsData(updatedActions);
      handleEditClose();
    }
  };

  const handleEditChange = (field: keyof ActionItem, value: string) => {
    if (editingAction) {
      if (field === "assignee") {
        const names = value.split(" ");
        const initials = names
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        setEditingAction({
          ...editingAction,
          assignee: { initials, name: value },
        });
      } else {
        setEditingAction({ ...editingAction, [field]: value });
      }
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type === "application/pdf" && file.size <= 50 * 1024 * 1024) {
      setUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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

  const actionStats = {
    total: actionsData.length,
    open: actionsData.filter((a) => a.status === "Open").length,
    inProgress: actionsData.filter((a) => a.status === "In Progress").length,
    closed: actionsData.filter((a) => a.status === "Closed").length,
    overdue: actionsData.filter(
      (a) => new Date(a.dueDate) < new Date() && a.status !== "Closed",
    ).length,
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber === currentStep && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (!project) {
    return (
      <PlannerLayout
        title="Project Workspace"
        subtitle="Manage weekly control cycle"
      >
        <Box sx={{ color: COLORS.textPrimary }}>Project not found</Box>
      </PlannerLayout>
    );
  }

  return (
    <PlannerLayout
      title="Project Workspace"
      subtitle="Manage weekly control cycle"
    >
      <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
        <ProjectHeader
          breadcrumb={{
            label: "Projects",
            onClick: () => navigate("/planner/projects"),
          }}
          projectName={project.name}
          phase={project.phase}
          week={project.week}
          weekDates={project.weekDates}
          planner={project.planner}
          currentStep={currentStep}
          steps={steps}
          onStepClick={handleStepClick}
          onMeetingOpen={() => {
            setCurrentStep(1);
            setActiveTab(0);
          }}
        />

        <Box
          sx={{
            mb: 3,
            borderBottom: `2px solid ${COLORS.border}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: "auto",
              mb: "-1.5px",
              "& .MuiTabs-scrollButtons": {
                color: COLORS.textMuted,
                "&.Mui-disabled": { opacity: 0.3 },
              },
              "& .MuiTabs-indicator": {
                bgcolor: COLORS.blue,
                height: "1.5px",
                bottom: 0,
              },
              "& .MuiTab-root": {
                color: COLORS.white,
                textTransform: "none",
                fontSize: { xs: "12px", sm: "14px" },
                fontWeight: 500,
                minHeight: "auto",
                py: 1.5,
                px: 0,
                mr: { xs: 2, sm: 4 },
                "&.Mui-selected": {
                  color: COLORS.blue,
                },
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Programme Upload" />
            <Tab label="Activities & Lookahead" />
            <Tab label="Actions" />
            <Tab label="Weekly Control" />
            <Tab label="Closure & Export" />
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
              <RAGDonutChart data={project.ragDistribution} />
              <RecentCycleHistory cycleHistory={project.cycleHistory} />
            </Box>
          </>
        )}

        {activeTab === 1 && (
          <Box>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={handleInputChange}
              style={{ display: "none" }}
            />

            {!uploadedFile ? (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 6,
                  px: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "16px",
                    fontWeight: 400,
                    mb: 2,
                  }}
                >
                  No programme uploaded yet. Upload a PDF first.
                </Typography>
                <Button
                  onClick={handleBrowseClick}
                  sx={{
                    bgcolor: COLORS.blue,
                    color: "#fff",
                    textTransform: "none",
                    px: 3,
                    py: 1,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    "&:hover": {
                      bgcolor: COLORS.blueHover,
                    },
                  }}
                >
                  Go to Upload
                </Button>
              </Box>
            ) : (
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
                    mb: 2.5,
                  }}
                >
                  Upload Programs PDF
                </Typography>

                <Box
                  onClick={handleBrowseClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  sx={{
                    border: `1px dashed ${isDragOver ? COLORS.blue : COLORS.border}`,
                    borderRadius: "12px",
                    py: 6,
                    px: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    bgcolor: isDragOver ? `${COLORS.blue}08` : "transparent",
                    "&:hover": {
                      borderColor: COLORS.blue,
                      bgcolor: `${COLORS.blue}08`,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={uploadIcon}
                    sx={{
                      width: 60,
                      height: 60,
                      mb: 2,
                      opacity: 0.6,
                    }}
                  />
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 500,
                      mb: 0.5,
                    }}
                  >
                    Drop your PDF here or click to browse
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    PDF only, max 50MB
                  </Typography>
                </Box>

                <Box
                  sx={{
                    bgcolor: COLORS.bgTertiary,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "12px",
                    p: 2,
                    mt: 2.5,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: { xs: 2, sm: 0 },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "8px",
                        bgcolor: "#EF4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    <Box>
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {uploadedFile.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: COLORS.textMuted,
                          fontSize: "12px",
                          fontWeight: 400,
                        }}
                      >
                        {formatFileSize(uploadedFile.size)}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    sx={{
                      bgcolor: COLORS.blue,
                      color: "#fff",
                      textTransform: "none",
                      px: 2.5,
                      py: 1,
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 500,
                      width: { xs: "100%", sm: "auto" },
                      whiteSpace: "nowrap",
                      "&:hover": {
                        bgcolor: COLORS.blueHover,
                      },
                    }}
                  >
                    Upload & Process
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 2 && (
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
                  <Box
                    component="span"
                    sx={{
                      color: item.color,
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {item.week}
                  </Box>
                  <Box
                    component="span"
                    sx={{ color: "#8E9CB1", fontSize: "12px", fontWeight: 400 }}
                  >
                    {item.label}
                  </Box>
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

        {activeTab === 3 && (
          <Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(5, 1fr)",
                },
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Total
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.total}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Open
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.blue,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.open}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  In Progress
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.amber,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.inProgress}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Closed
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.green,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.closed}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Overdue Actions
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.red,
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {actionStats.overdue}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                overflow: "auto",
                mb: 3,
              }}
            >
              <Box sx={{ minWidth: "fit-content" }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "80px minmax(200px, 1fr) 120px 85px 140px 100px 75px 85px 70px",
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${COLORS.border}`,
                    minWidth: 1050,
                  }}
                >
                  {[
                    "ACTION ID",
                    "ACTION TITLE",
                    "LINKED ACTIVITY",
                    "TYPE",
                    "ASSIGNEE",
                    "DUE DATE",
                    "STATUS",
                    "PRIORITY",
                    "ACTIONS",
                  ].map((header) => (
                    <Typography
                      key={header}
                      sx={{
                        color: COLORS.textMuted,
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        textAlign: "center",
                      }}
                    >
                      {header}
                    </Typography>
                  ))}
                </Box>

                {actionsData.map((action, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "80px minmax(200px, 1fr) 120px 85px 140px 100px 75px 85px 70px",
                      gap: 1.5,
                      px: 2,
                      py: 2,
                      borderBottom:
                        index < actionsData.length - 1
                          ? `1px solid ${COLORS.border}`
                          : "none",
                      alignItems: "center",
                      minWidth: 1050,
                      "&:hover": {
                        bgcolor: COLORS.bgTertiary,
                      },
                    }}
                  >
                    <Box sx={{ textAlign: "center", minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: COLORS.blue,
                          fontSize: "12px",
                          fontWeight: 400,
                        }}
                      >
                        {action.id}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center", minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "13px",
                          fontWeight: 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {action.title}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        sx={{
                          color: COLORS.blue,
                          fontSize: "12px",
                          fontWeight: 400,
                        }}
                      >
                        {action.linkedActivity}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Box
                        sx={{
                          bgcolor: `${COLORS.red}25`,
                          color: COLORS.red,
                          px: 2,
                          py: 0.5,
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {action.type}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: "10px",
                          fontWeight: 600,
                          bgcolor: COLORS.blue,
                        }}
                      >
                        {action.assignee.initials}
                      </Avatar>
                      <Typography
                        sx={{
                          color: COLORS.border,
                          fontSize: "12px",
                          fontWeight: 400,
                        }}
                      >
                        {action.assignee.name}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        sx={{
                          color: COLORS.border,
                          fontSize: "12px",
                          fontWeight: 400,
                        }}
                      >
                        {action.dueDate}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Box
                        sx={{
                          bgcolor:
                            action.status === "Open"
                              ? `${COLORS.blue}25`
                              : action.status === "In Progress"
                                ? `${COLORS.amber}25`
                                : `${COLORS.green}25`,
                          color:
                            action.status === "Open"
                              ? COLORS.blue
                              : action.status === "In Progress"
                                ? COLORS.amber
                                : COLORS.green,
                          px: 2,
                          py: 0.5,
                          borderRadius: "5px",
                          fontSize: "12px",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {action.status}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Box
                        sx={{
                          bgcolor:
                            action.priority === "Required"
                              ? `${COLORS.red}20`
                              : action.priority === "Low"
                                ? `${COLORS.green}20`
                                : `${COLORS.amber}20`,
                          color:
                            action.priority === "Required"
                              ? COLORS.red
                              : action.priority === "Low"
                                ? COLORS.green
                                : COLORS.amber,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "5px",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {action.priority}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        component="img"
                        src={editIcon}
                        onClick={() => handleEditClick(action, index)}
                        sx={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                          opacity: 0.7,
                          "&:hover": { opacity: 1 },
                        }}
                      />
                      <Box
                        component="img"
                        src={viewIcon}
                        sx={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                          opacity: 0.7,
                          "&:hover": { opacity: 1 },
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 2.5,
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "12px",
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                How actions impact the cycle:
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                Closing all{" "}
                <Box
                  component="span"
                  sx={{ color: COLORS.red, fontWeight: 500 }}
                >
                  Required
                </Box>{" "}
                actions for{" "}
                <Box
                  component="span"
                  sx={{ color: COLORS.green, fontWeight: 500 }}
                >
                  Green
                </Box>{" "}
                activities triggers the transition to{" "}
                <Box
                  component="span"
                  sx={{
                    color: COLORS.blue,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Close-Out Eligible
                </Box>
                . Only then can exports be generated and the week closed.
              </Typography>
            </Box>
          </Box>
        )}

        {activeTab === 4 && (
          <Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(4, 1fr)",
                  md: "repeat(7, 1fr)",
                },
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Cycle Status
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {getCycleStatusText()}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  In Lookahead
                </Typography>
                <Typography
                  sx={{ color: COLORS.blue, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlStats.inLookahead}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Green
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.green,
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  {weeklyControlStats.green}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Blocked
                </Typography>
                <Typography
                  sx={{ color: COLORS.red, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlStats.blocked}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Open Actions
                </Typography>
                <Typography
                  sx={{ color: COLORS.blue, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlStats.openActions}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Overdue
                </Typography>
                <Typography
                  sx={{ color: COLORS.red, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlStats.overdue}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  py: 2,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Ready to Close
                </Typography>
                <Typography
                  sx={{ color: COLORS.red, fontSize: "20px", fontWeight: 700 }}
                >
                  {weeklyControlStats.readyToClose}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
                mb: 3,
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
                  RAG Distribution
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 200,
                  }}
                >
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    {(() => {
                      const data = [
                        { value: 5, color: "#22C55E" },
                        { value: 4, color: "#F59E0B" },
                        { value: 3, color: "#EF4444" },
                      ];
                      const total = data.reduce((sum, d) => sum + d.value, 0);
                      const strokeWidth = 28;
                      const radius = (180 - strokeWidth) / 2;
                      const center = 90;
                      let currentAngle = -90;

                      return data.map((segment, i) => {
                        const sweepAngle = (segment.value / total) * 360;
                        const startAngle = currentAngle;
                        const endAngle = startAngle + sweepAngle;
                        currentAngle = endAngle;

                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;
                        const x1 = center + radius * Math.cos(startRad);
                        const y1 = center + radius * Math.sin(startRad);
                        const x2 = center + radius * Math.cos(endRad);
                        const y2 = center + radius * Math.sin(endRad);
                        const largeArc = sweepAngle > 180 ? 1 : 0;

                        return (
                          <path
                            key={i}
                            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={strokeWidth}
                          />
                        );
                      });
                    })()}
                  </svg>
                </Box>
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
                  Actions by Status
                </Typography>
                <Box sx={{ display: "flex", height: 200 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      pr: 1,
                      pb: 2,
                    }}
                  >
                    {[12, 10, 8, 6, 4, 2, 0].map((val) => (
                      <Typography
                        key={val}
                        sx={{
                          color: COLORS.textMuted,
                          fontSize: "10px",
                          lineHeight: 1,
                          textAlign: "right",
                          minWidth: 16,
                        }}
                      >
                        {val}
                      </Typography>
                    ))}
                  </Box>
                  <Box
                    sx={{ flex: 1, display: "flex", flexDirection: "column" }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        position: "relative",
                        borderLeft: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: `${(i / 6) * 100}%`,
                            borderTop: `1px solid ${COLORS.border}`,
                            opacity: 0.3,
                          }}
                        />
                      ))}
                      <Box
                        sx={{
                          display: "flex",
                          height: "100%",
                          alignItems: "flex-end",
                          justifyContent: "space-around",
                          px: 2,
                        }}
                      >
                        {[
                          { label: "Open", value: 11, color: COLORS.blue },
                          {
                            label: "In Progress",
                            value: 0,
                            color: COLORS.amber,
                          },
                          { label: "Closed", value: 2, color: COLORS.green },
                          { label: "Overdue", value: 1, color: COLORS.red },
                        ].map((bar, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 60,
                              height:
                                bar.value > 0
                                  ? `${(bar.value / 12) * 100}%`
                                  : 0,
                              bgcolor: bar.color,
                              borderRadius: "4px 4px 0 0",
                              minHeight: bar.value > 0 ? 8 : 0,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-around",
                        pt: 1,
                        borderTop: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {["Open", "In Progress", "Closed", "Overdue"].map(
                        (label) => (
                          <Typography
                            key={label}
                            sx={{
                              color: COLORS.textMuted,
                              fontSize: "10px",
                              width: 60,
                              textAlign: "center",
                            }}
                          >
                            {label}
                          </Typography>
                        ),
                      )}
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
                overflow: "auto",
                mb: 3,
              }}
            >
              <Box sx={{ minWidth: "fit-content" }}>
                <Box
                  sx={{
                    pt: 2,
                    minWidth: 950,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      // gap: 4,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    {[
                      "Blocked / Risk Activities",
                      "Weekly Plan Preview",
                      "Planner To-Do",
                    ].map((tab, i) => (
                      <Typography
                        key={tab}
                        onClick={() => setWeeklyControlTab(i)}
                        sx={{
                          mx: 2,

                          color:
                            weeklyControlTab === i
                              ? COLORS.blue
                              : COLORS.textMuted,
                          fontSize: "13px",
                          fontWeight: 500,
                          pb: 1,
                          mb: "15px",
                          cursor: "pointer",
                          borderBottom:
                            weeklyControlTab === i
                              ? `2px solid ${COLORS.blue}`
                              : "none",
                          whiteSpace: "nowrap",
                          "&:hover": {
                            color:
                              weeklyControlTab === i
                                ? COLORS.blue
                                : COLORS.textSecondary,
                          },
                        }}
                      >
                        {tab}
                      </Typography>
                    ))}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "90px minmax(180px, 1fr) 80px 90px minmax(160px, 1fr) 110px 90px",
                    gap: 2,
                    px: 3,
                    py: 1.5,
                    borderBottom: `1px solid ${COLORS.border}`,
                    minWidth: 950,
                  }}
                >
                  {[
                    "ACTIVITY ID",
                    "ACTIVITY NAME",
                    "RAG",
                    "OWNER",
                    "BLOCKER",
                    "LINKED ACTION",
                    "STATUS",
                  ].map((header) => (
                    <Typography
                      key={header}
                      sx={{
                        color: COLORS.textMuted,
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        textAlign: "center",
                      }}
                    >
                      {header}
                    </Typography>
                  ))}
                </Box>

                {blockedActivities.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "90px minmax(180px, 1fr) 80px 90px minmax(160px, 1fr) 110px 90px",
                      gap: 2,
                      px: 3,
                      py: 2,
                      borderBottom:
                        index < blockedActivities.length - 1
                          ? `1px solid ${COLORS.border}`
                          : "none",
                      alignItems: "center",
                      minWidth: 950,
                      "&:hover": { bgcolor: COLORS.bgTertiary },
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.textMuted,
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                    >
                      {activity.id}
                    </Typography>
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        fontWeight: 400,
                        textAlign: "center",
                      }}
                    >
                      {activity.name}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Box
                        sx={{
                          bgcolor:
                            activity.rag === "Red"
                              ? `${COLORS.red}25`
                              : `${COLORS.amber}25`,
                          color:
                            activity.rag === "Red" ? COLORS.red : COLORS.amber,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 500,
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
                            bgcolor:
                              activity.rag === "Red"
                                ? COLORS.red
                                : COLORS.amber,
                          }}
                        />
                        {activity.rag}
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "14px",
                        fontWeight: 400,
                        textAlign: "center",
                      }}
                    >
                      {activity.owner}
                    </Typography>
                    <Typography
                      sx={{
                        color:
                          activity.rag === "Red" ? COLORS.red : COLORS.amber,
                        fontSize: "14px",
                        fontWeight: 400,
                        textAlign: "center",
                      }}
                    >
                      {activity.blocker}
                    </Typography>
                    <Typography
                      sx={{
                        color: COLORS.blue,
                        fontSize: "10px",
                        fotnQWeight: 400,
                        textAlign: "center",
                      }}
                    >
                      {activity.linkedAction}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Box
                        sx={{
                          bgcolor:
                            activity.status === "Overdue"
                              ? `${COLORS.red}20`
                              : `${COLORS.amber}15`,
                          border:
                            activity.status === "Overdue"
                              ? `1px solid ${COLORS.red}40`
                              : "none",
                          color:
                            activity.status === "Overdue"
                              ? COLORS.red
                              : COLORS.amber,
                          px: 2,
                          py: 0.5,
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {activity.status}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
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
                  mb: 0.5,
                }}
              >
                Cycle Control
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "13px",
                  fontWeight: 400,
                  mb: 2,
                }}
              >
                {cycleStage === "draft"
                  ? "Programme uploaded. Review activities and open the planning meeting."
                  : cycleStage === "meetingOpen"
                    ? "Meeting is open. Start execution when ready."
                    : "Execution in progress. Monitor activities and actions."}
              </Typography>
              {cycleStage === "execution" ? (
                <Box
                  sx={{
                    bgcolor: "#2D2A24",
                    border: `1px solid ${COLORS.amber}`,
                    borderRadius: "8px",
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle
                      cx="10"
                      cy="10"
                      r="8.5"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M10 5.5V10L13 12"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <Typography
                    sx={{
                      color: COLORS.amber,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Waiting for 4 required action(s) on green activities to
                    close...
                  </Typography>
                </Box>
              ) : (
                <Button
                  onClick={handleCycleAction}
                  sx={{
                    bgcolor: COLORS.blue,
                    color: "#fff",
                    textTransform: "none",
                    px: 2.5,
                    py: 1,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    "&:hover": { bgcolor: COLORS.blueHover },
                  }}
                >
                  {getCycleButtonText()}
                </Button>
              )}
            </Box>
          </Box>
        )}

        {activeTab === 5 && (
          <Box>
            {isWeekClosed ? (
              <Box
                sx={{
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  p: 5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  component="img"
                  src={lockIcon}
                  sx={{
                    width: 48,
                    height: 48,
                    mb: 2,
                    opacity: 0.7,
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
                  Closed by PM (Override) via PM Override
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  Week 24 — Closed & Locked
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.amber,
                    fontSize: "14px",
                  }}
                >
                  Override reason: {savedOverrideReason}
                </Typography>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    bgcolor: COLORS.bgSecondary,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "12px",
                    p: 3,
                    mb: 3,
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
                    Closure Readiness Checklist
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {[
                      {
                        key: "plannerReview",
                        label: "Planner review complete",
                        extra: null,
                      },
                      {
                        key: "todoGenerated",
                        label: "Planner to-do list generated",
                        extra: null,
                      },
                      {
                        key: "overdueAcknowledged",
                        label: "Overdue actions acknowledged",
                        extra: "(1 overdue)",
                        extraColor: COLORS.red,
                      },
                      {
                        key: "blockedAcknowledged",
                        label: "Blocked activities acknowledged",
                        extra: "(1 blocked)",
                        extraColor: COLORS.red,
                      },
                    ].map((item) => (
                      <Box
                        key={item.key}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setClosureChecklist((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof prev],
                          }))
                        }
                      >
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: closureChecklist[
                              item.key as keyof typeof closureChecklist
                            ]
                              ? "2px solid #fff"
                              : "2px solid #94A3B8",
                            bgcolor: closureChecklist[
                              item.key as keyof typeof closureChecklist
                            ]
                              ? COLORS.blue
                              : "transparent",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            fontWeight: 400,
                          }}
                        >
                          {item.label}
                          {item.extra && (
                            <Box
                              component="span"
                              sx={{ color: item.extraColor, ml: 0.5 }}
                            >
                              {item.extra}
                            </Box>
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 3,
                    mb: 3,
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
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        Weekly Plan
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "#2D2A3D",
                          color: COLORS.red,
                          width: 46,
                          height: 20,
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        Gated
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        mb: 0.5,
                      }}
                    >
                      Green activities with zero open required actions.
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "12px", mb: 2 }}
                    >
                      1 activity qualify
                    </Typography>
                    <Button
                      fullWidth
                      sx={{
                        bgcolor: COLORS.disabledBlue,
                        color: "#fff",
                        textTransform: "none",
                        py: 1.25,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      Download Weekly Plan
                    </Button>
                  </Box>

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
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        Planner To-Do
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "#2D2A3D",
                          color: COLORS.red,
                          width: 46,
                          height: 20,
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        Gated
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "12px",
                        mb: 0.5,
                      }}
                    >
                      Outstanding actions and planner follow-on items.
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "12px", mb: 2 }}
                    >
                      12 outstanding items
                    </Typography>
                    <Button
                      fullWidth
                      sx={{
                        bgcolor: COLORS.disabledBlue,
                        color: "#fff",
                        textTransform: "none",
                        py: 1.25,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      Download Planner To - Do
                    </Button>
                  </Box>
                </Box>

                <Box
                  sx={{
                    bgcolor: "#2D2A24",
                    border: `1px solid ${COLORS.amber}`,
                    borderRadius: "12px",
                    p: 2.5,
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.amber,
                      fontSize: "14px",
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    Exports are gated
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                  >
                    The WeekCycle must be in Close-Out Eligible state. Close all
                    required actions for green activities to unlock exports.
                  </Typography>
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
                    Close Week
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <Button
                      sx={{
                        bgcolor: "transparent",
                        border: `1px solid ${COLORS.green}`,
                        color: COLORS.green,
                        textTransform: "none",
                        px: 2.5,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": { bgcolor: `${COLORS.green}10` },
                      }}
                    >
                      Close Week
                    </Button>
                    <Button
                      onClick={() => setShowOverrideForm(!showOverrideForm)}
                      sx={{
                        bgcolor: COLORS.red,
                        color: "#fff",
                        textTransform: "none",
                        px: 2.5,
                        py: 1,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": { bgcolor: "#DC2626" },
                      }}
                    >
                      PM Override Close
                    </Button>
                  </Box>

                  {showOverrideForm && (
                    <Box
                      sx={{
                        bgcolor: "#2D2A24",
                        border: `1px solid ${COLORS.amber}`,
                        borderRadius: "12px",
                        p: 2.5,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.amber,
                          fontSize: "13px",
                          fontWeight: 500,
                          mb: 2,
                        }}
                      >
                        PM Override — Mandatory Justification
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Enter the reason for override closure (required)..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": {
                            bgcolor: COLORS.bgPrimary,
                            borderRadius: "8px",
                            "& fieldset": { borderColor: COLORS.border },
                            "&:hover fieldset": { borderColor: COLORS.border },
                            "&.Mui-focused fieldset": {
                              borderColor: COLORS.amber,
                              borderWidth: 1,
                            },
                          },
                          "& .MuiOutlinedInput-input": {
                            color: COLORS.textPrimary,
                            fontSize: "13px",
                            "&::placeholder": {
                              color: COLORS.textMuted,
                              opacity: 1,
                            },
                          },
                        }}
                      />
                      <Button
                        disabled={overrideReason.length < 10}
                        onClick={handleOverrideClose}
                        sx={{
                          bgcolor: COLORS.amber,
                          color: "#fff",
                          textTransform: "none",
                          px: 2.5,
                          py: 1,
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 500,
                          mb: 1,
                          "&:hover": { bgcolor: "#D97706" },
                          "&:disabled": { bgcolor: COLORS.amber, opacity: 0.5 },
                        }}
                      >
                        Confirm Override Close
                      </Button>
                      <Typography
                        sx={{ color: COLORS.textMuted, fontSize: "11px" }}
                      >
                        Minimum 10 characters required. This will be recorded in
                        the audit trail.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        )}

        <Dialog
          open={editModalOpen}
          onClose={handleEditClose}
          maxWidth="sm"
          fullWidth
          slotProps={{
            backdrop: {
              sx: {
                bgcolor: "rgba(0, 0, 0, 0.8)",
              },
            },
            paper: {
              sx: {
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                backgroundImage: "none",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                maxWidth: 500,
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 1,
              pt: 2,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                Edit Action
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                {editingAction?.id}
              </Typography>
            </Box>
            <IconButton
              onClick={handleEditClose}
              sx={{ color: COLORS.textMuted, p: 0.5 }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.75,
                    mt: 2,
                  }}
                >
                  Action Title
                </Typography>
                <TextField
                  fullWidth
                  value={editingAction?.title || ""}
                  onChange={(e) => handleEditChange("title", e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& fieldset": { borderColor: COLORS.border },
                      "&:hover fieldset": { borderColor: COLORS.border },
                      "&.Mui-focused fieldset": {
                        borderColor: COLORS.blue,
                        borderWidth: 1,
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      py: 1.25,
                    },
                  }}
                />
              </Box>

              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.75,
                    }}
                  >
                    Linked Activity
                  </Typography>
                  <TextField
                    fullWidth
                    value={editingAction?.linkedActivity || ""}
                    onChange={(e) =>
                      handleEditChange("linkedActivity", e.target.value)
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: COLORS.bgPrimary,
                        borderRadius: "8px",
                        "& fieldset": { borderColor: COLORS.border },
                        "&:hover fieldset": { borderColor: COLORS.border },
                        "&.Mui-focused fieldset": {
                          borderColor: COLORS.blue,
                          borderWidth: 1,
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        py: 1.25,
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.75,
                    }}
                  >
                    Type
                  </Typography>
                  <Select
                    fullWidth
                    value={editingAction?.type || ""}
                    onChange={(e) => handleEditChange("type", e.target.value)}
                    sx={{
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.blue,
                        borderWidth: 1,
                      },
                      "& .MuiSelect-select": {
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        py: 1.25,
                      },
                      "& .MuiSvgIcon-root": { color: COLORS.textSecondary },
                    }}
                    MenuProps={{
                      slotProps: {
                        paper: {
                          sx: {
                            bgcolor: COLORS.bgSecondary,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "8px",
                            "& .MuiMenuItem-root": {
                              color: COLORS.textPrimary,
                              fontSize: "14px",
                              "&:hover": { bgcolor: COLORS.bgTertiary },
                              "&.Mui-selected": {
                                bgcolor: COLORS.blueBgMedium,
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="Required">Required</MenuItem>
                    <MenuItem value="Optional">Optional</MenuItem>
                  </Select>
                </Box>
              </Box>

              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.75,
                    }}
                  >
                    Assignee
                  </Typography>
                  <TextField
                    fullWidth
                    value={editingAction?.assignee.name || ""}
                    onChange={(e) =>
                      handleEditChange("assignee", e.target.value)
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: COLORS.bgPrimary,
                        borderRadius: "8px",
                        "& fieldset": { borderColor: COLORS.border },
                        "&:hover fieldset": { borderColor: COLORS.border },
                        "&.Mui-focused fieldset": {
                          borderColor: COLORS.blue,
                          borderWidth: 1,
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        py: 1.25,
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.75,
                    }}
                  >
                    Due Date
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={editingAction?.dueDate || ""}
                    onChange={(e) =>
                      handleEditChange("dueDate", e.target.value)
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: COLORS.bgPrimary,
                        borderRadius: "8px",
                        "& fieldset": { borderColor: COLORS.border },
                        "&:hover fieldset": { borderColor: COLORS.border },
                        "&.Mui-focused fieldset": {
                          borderColor: COLORS.blue,
                          borderWidth: 1,
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        py: 1.25,
                        "&::-webkit-calendar-picker-indicator": {
                          filter: "invert(1)",
                          cursor: "pointer",
                          opacity: 0.6,
                        },
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.75,
                    }}
                  >
                    Status
                  </Typography>
                  <Select
                    fullWidth
                    value={editingAction?.status || ""}
                    onChange={(e) => handleEditChange("status", e.target.value)}
                    sx={{
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.blue,
                        borderWidth: 1,
                      },
                      "& .MuiSelect-select": {
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        py: 1.25,
                      },
                      "& .MuiSvgIcon-root": { color: COLORS.textSecondary },
                    }}
                    MenuProps={{
                      slotProps: {
                        paper: {
                          sx: {
                            bgcolor: COLORS.bgSecondary,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "8px",
                            "& .MuiMenuItem-root": {
                              color: COLORS.textPrimary,
                              fontSize: "14px",
                              "&:hover": { bgcolor: COLORS.bgTertiary },
                              "&.Mui-selected": {
                                bgcolor: COLORS.blueBgMedium,
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="Open">Open</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Closed">Closed</MenuItem>
                  </Select>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 500,
                      mb: 0.75,
                    }}
                  >
                    Priority
                  </Typography>
                  <Select
                    fullWidth
                    value={editingAction?.priority || ""}
                    onChange={(e) =>
                      handleEditChange("priority", e.target.value)
                    }
                    sx={{
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.border,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: COLORS.blue,
                        borderWidth: 1,
                      },
                      "& .MuiSelect-select": {
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        py: 1.25,
                      },
                      "& .MuiSvgIcon-root": { color: COLORS.textSecondary },
                    }}
                    MenuProps={{
                      slotProps: {
                        paper: {
                          sx: {
                            bgcolor: COLORS.bgSecondary,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "8px",
                            "& .MuiMenuItem-root": {
                              color: COLORS.textPrimary,
                              fontSize: "14px",
                              "&:hover": { bgcolor: COLORS.bgTertiary },
                              "&.Mui-selected": {
                                bgcolor: COLORS.blueBgMedium,
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="Required">Required</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: `1px solid ${COLORS.border}`,
              gap: 1.5,
            }}
          >
            <Button
              onClick={handleEditClose}
              sx={{
                color: COLORS.textSecondary,
                bgcolor: "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                textTransform: "none",
                px: 2.5,
                py: 1,
                fontSize: "14px",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: COLORS.bgTertiary,
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditUpdate}
              sx={{
                color: "#fff",
                bgcolor: COLORS.blue,
                borderRadius: "8px",
                textTransform: "none",
                px: 2.5,
                py: 1,
                fontSize: "14px",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: COLORS.blueHover,
                },
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PlannerLayout>
  );
};

export default PlannerProjectWorkspace;
