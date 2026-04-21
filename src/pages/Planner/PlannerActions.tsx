import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  Drawer,
} from "@mui/material";
import {
  Add as AddIcon,
  SearchOutlined as SearchIcon,
  AccessTime as ClockIcon,
  CheckCircleOutlined as CheckCircleIcon,
  WarningAmber as WarningIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import PlannerLayout from "../../layouts/PlannerLayout";
import { COLORS } from "../../constants/colors";
import actionIcon from "../../assets/sidebar/action.png";
import editIcon from "../../assets/tabler_edit.png";
import frameIcon from "../../assets/Frame.png";
import uploadIcon from "../../assets/sidebar/upload.png";

interface TimelineItem {
  title: string;
  date: string;
  user: string;
}

interface Action {
  id: string;
  title: string;
  description: string;
  linkedActivity: string;
  linkedActivityName: string;
  type: "Required" | "Optional";
  assignee: string;
  assigneeInitials: string;
  assigneeName: string;
  dueDate: string;
  status: "Open" | "Closed" | "Overdue";
  priority: "Required" | "High" | "Medium" | "Low";
  timeline: TimelineItem[];
}

const initialActionsData: Action[] = [
  {
    id: "ACN-001",
    title: "Obtain design approval for Section C",
    description:
      "Design approval is required from the lead architect before curtain wall fabrication can commence. Submit drawings through the portal and follow up with the design team.",
    linkedActivity: "ACT-005",
    linkedActivityName: "Curtain wall installation - South facade",
    type: "Required",
    assignee: "james",
    assigneeInitials: "JP",
    assigneeName: "James P.",
    dueDate: "2026-04-03",
    status: "Open",
    priority: "High",
    timeline: [
      { title: "Action created", date: "2026-03-20", user: "Sarah M." },
      {
        title: "Drawings submitted for review",
        date: "2026-03-22",
        user: "James P.",
      },
      {
        title: "Awaiting architect feedback",
        date: "2026-03-25",
        user: "James P.",
      },
    ],
  },
  {
    id: "ACN-004",
    title: "Complete safety induction for subco.",
    description:
      "Safety induction for all subcontractors on site before they can begin work.",
    linkedActivity: "ACT-003",
    linkedActivityName: "Mechanical rough-in - Zone C",
    type: "Required",
    assignee: "ahmed",
    assigneeInitials: "AB",
    assigneeName: "Ahmed B.",
    dueDate: "2026-03-29",
    status: "Open",
    priority: "Medium",
    timeline: [
      { title: "Action created", date: "2026-03-18", user: "Sarah M." },
      { title: "Induction scheduled", date: "2026-03-20", user: "Ahmed B." },
    ],
  },
  {
    id: "ACN-005",
    title: "Review and approve MEP coordinatio",
    description:
      "MEP coordination review meeting to resolve clashes and approve routing.",
    linkedActivity: "ACT-006",
    linkedActivityName: "Electrical first fix - Floors 3-5",
    type: "Required",
    assignee: "david",
    assigneeInitials: "DK",
    assigneeName: "David K.",
    dueDate: "2026-04-02",
    status: "Open",
    priority: "Medium",
    timeline: [
      { title: "Action created", date: "2026-03-19", user: "Sarah M." },
    ],
  },
  {
    id: "ACN-006",
    title: "Review and approve MEP coordinatio",
    description: "Follow-up MEP coordination for remaining sections.",
    linkedActivity: "ACT-006",
    linkedActivityName: "Electrical first fix - Floors 3-5",
    type: "Required",
    assignee: "david",
    assigneeInitials: "DK",
    assigneeName: "David K.",
    dueDate: "2026-04-02",
    status: "Open",
    priority: "Medium",
    timeline: [
      { title: "Action created", date: "2026-03-21", user: "Sarah M." },
    ],
  },
];

const assigneeOptions = [
  { value: "james", initials: "JP", name: "James P." },
  { value: "ahmed", initials: "AB", name: "Ahmed B." },
  { value: "david", initials: "DK", name: "David K." },
  { value: "sarah", initials: "SM", name: "Sarah M." },
  { value: "maria", initials: "ML", name: "Maria L." },
];

const PlannerActions = () => {
  const [actions, setActions] = useState<Action[]>(initialActionsData);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("due_date");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [viewingAction, setViewingAction] = useState<Action | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    linkedActivity: "",
    title: "",
    description: "",
    type: "Required",
    priority: "Medium",
    assignee: "",
    dueDate: "",
  });

  const filteredActions = actions.filter((action) => {
    const matchesStatus =
      statusFilter === "all" ||
      action.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType =
      typeFilter === "all" ||
      action.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleOpenCreateModal = () => {
    setEditingAction(null);
    setFormData({
      linkedActivity: "",
      title: "",
      description: "",
      type: "Required",
      priority: "Medium",
      assignee: "",
      dueDate: "",
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (action: Action) => {
    setEditingAction(action);
    setFormData({
      linkedActivity: action.linkedActivity,
      title: action.title,
      description: action.description,
      type: action.type,
      priority: action.priority,
      assignee: action.assignee,
      dueDate: action.dueDate,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAction(null);
    setFormData({
      linkedActivity: "",
      title: "",
      description: "",
      type: "Required",
      priority: "Medium",
      assignee: "",
      dueDate: "",
    });
  };

  const handleOpenDetailDrawer = (action: Action) => {
    setViewingAction(action);
    setDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setViewingAction(null);
  };

  const handleEditFromDrawer = () => {
    if (viewingAction) {
      handleCloseDetailDrawer();
      handleOpenEditModal(viewingAction);
    }
  };

  const handleCloseAction = () => {
    if (viewingAction) {
      setActions(
        actions.map((action) =>
          action.id === viewingAction.id
            ? { ...action, status: "Closed" as const }
            : action,
        ),
      );
      handleCloseDetailDrawer();
    }
  };

  const handleSaveAction = () => {
    const assigneeData = assigneeOptions.find(
      (a) => a.value === formData.assignee,
    );

    if (editingAction) {
      // Update existing action
      setActions(
        actions.map((action) =>
          action.id === editingAction.id
            ? {
                ...action,
                linkedActivity: formData.linkedActivity,
                title: formData.title,
                description: formData.description,
                type: formData.type as "Required" | "Optional",
                priority: formData.priority as
                  | "Required"
                  | "High"
                  | "Medium"
                  | "Low",
                assignee: formData.assignee,
                assigneeInitials:
                  assigneeData?.initials || action.assigneeInitials,
                assigneeName: assigneeData?.name || action.assigneeName,
                dueDate: formData.dueDate,
              }
            : action,
        ),
      );
    } else {
      // Create new action
      const activityNames: Record<string, string> = {
        "ACT-001": "Foundation pour - Block A",
        "ACT-002": "Steel erection - Level 2",
        "ACT-003": "Mechanical rough-in - Zone C",
        "ACT-005": "Curtain wall installation - South facade",
        "ACT-006": "Electrical first fix - Floors 3-5",
      };
      const newAction: Action = {
        id: `ACN-${String(actions.length + 1).padStart(3, "0")}`,
        title: formData.title,
        description: formData.description,
        linkedActivity: formData.linkedActivity,
        linkedActivityName:
          activityNames[formData.linkedActivity] || "Unknown activity",
        type: formData.type as "Required" | "Optional",
        assignee: formData.assignee,
        assigneeInitials: assigneeData?.initials || "??",
        assigneeName: assigneeData?.name || "Unknown",
        dueDate: formData.dueDate,
        status: "Open",
        priority: formData.priority as "Required" | "High" | "Medium" | "Low",
        timeline: [
          {
            title: "Action created",
            date: new Date().toISOString().split("T")[0],
            user: "Current User",
          },
        ],
      };
      setActions([...actions, newAction]);
    }
    handleCloseModal();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Required":
        return COLORS.red;
      case "High":
        return COLORS.red;
      case "Medium":
        return COLORS.amber;
      case "Low":
        return COLORS.green;
      default:
        return COLORS.textMuted;
    }
  };

  const blueFilter =
    "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)";

  return (
    <PlannerLayout
      title="Actions"
      subtitle="Readiness actions management"
      headerAction={
        <Button
          startIcon={<AddIcon />}
          onClick={handleOpenCreateModal}
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
          Create Action
        </Button>
      }
    >
      {/* Stats Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Active Projects */}
        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
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
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              3
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: COLORS.blueBgMedium,
              borderRadius: "8px",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src={actionIcon}
              sx={{
                width: 20,
                height: 20,
                filter: blueFilter,
              }}
            />
          </Box>
        </Box>

        {/* Open */}
        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 0.5,
              }}
            >
              Open
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              14
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: COLORS.blueBgMedium,
              borderRadius: "8px",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ClockIcon sx={{ color: COLORS.blue, fontSize: 20 }} />
          </Box>
        </Box>

        {/* Closed */}
        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 0.5,
              }}
            >
              Closed
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              28
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: "rgba(34, 197, 94, 0.15)",
              borderRadius: "8px",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleIcon sx={{ color: COLORS.green, fontSize: 20 }} />
          </Box>
        </Box>

        {/* Overdue */}
        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 0.5,
              }}
            >
              Overdue
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              3
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: "rgba(239, 68, 68, 0.15)",
              borderRadius: "8px",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WarningIcon sx={{ color: COLORS.red, fontSize: 20 }} />
          </Box>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          p: 2,
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "stretch", lg: "center" },
          gap: 2,
        }}
      >
        {/* Status Filters */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: COLORS.bgPrimary,
            borderRadius: "8px",
            p: 0.5,
          }}
        >
          {[
            { label: "All", value: "all" },
            { label: "Open", value: "open" },
            { label: "Closed", value: "closed" },
            { label: "Overdue", value: "overdue" },
          ].map((filter) => (
            <Box
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                bgcolor:
                  statusFilter === filter.value
                    ? COLORS.bgTertiary
                    : "transparent",
                color:
                  statusFilter === filter.value
                    ? COLORS.textPrimary
                    : COLORS.textSecondary,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor:
                    statusFilter === filter.value
                      ? COLORS.bgTertiary
                      : "rgba(255,255,255,0.05)",
                },
              }}
            >
              {filter.label}
            </Box>
          ))}
        </Box>

        {/* Type Filters */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: COLORS.bgPrimary,
            borderRadius: "8px",
            p: 0.5,
          }}
        >
          {[
            { label: "All Types", value: "all" },
            { label: "Required", value: "required" },
            { label: "Optional", value: "optional" },
          ].map((filter) => (
            <Box
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                bgcolor:
                  typeFilter === filter.value
                    ? COLORS.bgTertiary
                    : "transparent",
                color:
                  typeFilter === filter.value
                    ? COLORS.textPrimary
                    : COLORS.textSecondary,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor:
                    typeFilter === filter.value
                      ? COLORS.bgTertiary
                      : "rgba(255,255,255,0.05)",
                },
              }}
            >
              {filter.label}
            </Box>
          ))}
        </Box>

        {/* Search and Sort */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flex: 1,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <TextField
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              flex: 1,
              width: { xs: "100%", sm: "auto" },
              "& .MuiOutlinedInput-root": {
                bgcolor: COLORS.bgPrimary,
                borderRadius: "8px",
                "& fieldset": { borderColor: COLORS.border },
                "&:hover fieldset": { borderColor: COLORS.border },
                "&.Mui-focused fieldset": { borderColor: COLORS.blue },
              },
              "& .MuiInputBase-input": {
                color: COLORS.textPrimary,
                fontSize: "13px",
                "&::placeholder": { color: COLORS.textMuted },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: COLORS.textMuted, fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            sx={{
              bgcolor: COLORS.blue,
              color: COLORS.white,
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
              minWidth: { xs: "100%", sm: "auto" },
              "&:hover": {
                bgcolor: COLORS.blueHover,
              },
            }}
          >
            Search
          </Button>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              IconComponent={ArrowDownIcon}
              sx={{
                bgcolor: COLORS.bgPrimary,
                borderRadius: "8px",
                color: COLORS.textSecondary,
                fontSize: "13px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.border,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.border,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.blue,
                },
                "& .MuiSvgIcon-root": { color: COLORS.textMuted },
              }}
            >
              <MenuItem value="due_date">Sort by Due Date</MenuItem>
              <MenuItem value="priority">Sort by Priority</MenuItem>
              <MenuItem value="status">Sort by Status</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Actions Table */}
      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 1000 }}>
            {/* Table Header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "100px 1fr 130px 90px 120px 110px 80px 90px 80px",
                gap: 2,
                px: 3,
                py: 1.5,
                borderBottom: `1px solid ${COLORS.border}`,
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
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                  }}
                >
                  {header}
                </Typography>
              ))}
            </Box>

            {/* Table Rows */}
            {filteredActions.map((action, index) => (
              <Box
                key={`${action.id}-${index}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "100px 1fr 130px 90px 120px 110px 80px 90px 80px",
                  gap: 2,
                  px: 3,
                  py: 2,
                  borderBottom: `1px solid ${COLORS.border}`,
                  alignItems: "center",
                  "&:hover": { bgcolor: COLORS.bgTertiary },
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                {/* Action ID */}
                <Typography sx={{ color: COLORS.blue, fontSize: "13px" }}>
                  {action.id}
                </Typography>

                {/* Action Title */}
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "13px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {action.title}
                </Typography>

                {/* Linked Activity */}
                <Typography sx={{ color: COLORS.blue, fontSize: "13px" }}>
                  {action.linkedActivity}
                </Typography>

                {/* Type */}
                <Box
                  sx={{
                    bgcolor: "rgba(239, 68, 68, 0.15)",
                    color: COLORS.red,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    textAlign: "center",
                    width: "fit-content",
                  }}
                >
                  {action.type}
                </Box>

                {/* Assignee */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: "#1E3A5F",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.blue,
                        fontSize: "10px",
                        fontWeight: 600,
                      }}
                    >
                      {action.assigneeInitials}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                  >
                    {action.assigneeName}
                  </Typography>
                </Box>

                {/* Due Date */}
                <Typography
                  sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
                >
                  {action.dueDate}
                </Typography>

                {/* Status */}
                <Box
                  sx={{
                    bgcolor: COLORS.blueBgMedium,
                    color: COLORS.blue,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    textAlign: "center",
                    width: "fit-content",
                  }}
                >
                  {action.status}
                </Box>

                {/* Priority */}
                <Box
                  sx={{
                    bgcolor: `${getPriorityColor(action.priority)}20`,
                    color: getPriorityColor(action.priority),
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    textAlign: "center",
                    width: "fit-content",
                  }}
                >
                  {action.priority}
                </Box>

                {/* Actions */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    component="img"
                    src={editIcon}
                    onClick={() => handleOpenEditModal(action)}
                    sx={{
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                      opacity: 0.6,
                      "&:hover": { opacity: 1 },
                    }}
                  />
                  <Box
                    component="img"
                    src={frameIcon}
                    onClick={() => handleOpenDetailDrawer(action)}
                    sx={{
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                      opacity: 0.6,
                      "&:hover": { opacity: 1 },
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Create/Edit Action Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
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
              border: `1px solid ${COLORS.white}`,
              borderRadius: "12px",
              backgroundImage: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              maxWidth: 480,
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
            pt: 1,
            borderBottom: `1px solid ${COLORS.white}`,
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
              {editingAction ? "Edit Action" : "Create New Action"}
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              {/* {editingAction ? "Update action details" : "Create a new action to track"} */}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseModal}
            sx={{ color: COLORS.textMuted, mr: -1, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Linked Activity */}
            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                  mt: 2,
                }}
              >
                Linked Activity <span style={{ color: COLORS.red }}>*</span>
              </Typography>
              <Select
                fullWidth
                value={formData.linkedActivity}
                onChange={(e) =>
                  setFormData({ ...formData, linkedActivity: e.target.value })
                }
                displayEmpty
                IconComponent={ArrowDownIcon}
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                    borderWidth: 1,
                  },
                  "& .MuiSelect-select": {
                    color: formData.linkedActivity
                      ? COLORS.textPrimary
                      : COLORS.textMuted,
                    fontSize: "14px",
                    py: 1.2,
                  },
                  "& .MuiSvgIcon-root": {
                    color: COLORS.textSecondary,
                  },
                }}
                MenuProps={{
                  slotProps: {
                    paper: {
                      sx: {
                        bgcolor: COLORS.bgSecondary,
                        border: `1px solid ${COLORS.borderLight}`,
                        borderRadius: "8px",
                        mt: 0.5,
                        "& .MuiMenuItem-root": {
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          "&:hover": {
                            bgcolor: COLORS.bgTertiary,
                          },
                          "&.Mui-selected": {
                            bgcolor: COLORS.blueBgMedium,
                            "&:hover": {
                              bgcolor: COLORS.blueBgHover,
                            },
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select activity...
                </MenuItem>
                <MenuItem value="ACT-001">ACT-001 - Foundation pour</MenuItem>
                <MenuItem value="ACT-002">ACT-002 - Steel erection</MenuItem>
                <MenuItem value="ACT-003">
                  ACT-003 - Mechanical rough-in
                </MenuItem>
                <MenuItem value="ACT-005">ACT-005 - Curtain wall</MenuItem>
                <MenuItem value="ACT-006">
                  ACT-006 - Electrical first fix
                </MenuItem>
              </Select>
            </Box>

            {/* Title */}
            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                  mt: 2,
                }}
              >
                Title <span style={{ color: COLORS.red }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter action title..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    py: 1.2,
                    "&::placeholder": {
                      color: COLORS.textMuted,
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>

            {/* Description */}
            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                  mt: 2,
                }}
              >
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the action required..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    "&::placeholder": {
                      color: COLORS.textMuted,
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>

            {/* Type and Priority */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                    mt: 2,
                  }}
                >
                  Type <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <Select
                  fullWidth
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  IconComponent={ArrowDownIcon}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                    "& .MuiSelect-select": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      py: 1.2,
                    },
                    "& .MuiSvgIcon-root": {
                      color: COLORS.textSecondary,
                    },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: COLORS.bgSecondary,
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: "8px",
                          mt: 0.5,
                          "& .MuiMenuItem-root": {
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            "&:hover": {
                              bgcolor: COLORS.bgTertiary,
                            },
                            "&.Mui-selected": {
                              bgcolor: COLORS.blueBgMedium,
                              "&:hover": {
                                bgcolor: COLORS.blueBgHover,
                              },
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

              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                    mt: 2,
                  }}
                >
                  Priority <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <Select
                  fullWidth
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  IconComponent={ArrowDownIcon}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                    "& .MuiSelect-select": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      py: 1.2,
                    },
                    "& .MuiSvgIcon-root": {
                      color: COLORS.textSecondary,
                    },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: COLORS.bgSecondary,
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: "8px",
                          mt: 0.5,
                          "& .MuiMenuItem-root": {
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            "&:hover": {
                              bgcolor: COLORS.bgTertiary,
                            },
                            "&.Mui-selected": {
                              bgcolor: COLORS.blueBgMedium,
                              "&:hover": {
                                bgcolor: COLORS.blueBgHover,
                              },
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="Required">Required</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </Box>
            </Box>

            {/* Assignee and Due Date */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                    mt: 2,
                  }}
                >
                  Assignee <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <Select
                  fullWidth
                  value={formData.assignee}
                  onChange={(e) =>
                    setFormData({ ...formData, assignee: e.target.value })
                  }
                  displayEmpty
                  IconComponent={ArrowDownIcon}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                    "& .MuiSelect-select": {
                      color: formData.assignee
                        ? COLORS.textPrimary
                        : COLORS.textMuted,
                      fontSize: "14px",
                      py: 1.2,
                    },
                    "& .MuiSvgIcon-root": {
                      color: COLORS.textSecondary,
                    },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: COLORS.bgSecondary,
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: "8px",
                          mt: 0.5,
                          "& .MuiMenuItem-root": {
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            "&:hover": {
                              bgcolor: COLORS.bgTertiary,
                            },
                            "&.Mui-selected": {
                              bgcolor: COLORS.blueBgMedium,
                              "&:hover": {
                                bgcolor: COLORS.blueBgHover,
                              },
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    Select assignee...
                  </MenuItem>
                  {assigneeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                    mt: 2,
                  }}
                >
                  Due Date <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& fieldset": {
                        borderColor: COLORS.white,
                      },
                      "&:hover fieldset": {
                        borderColor: COLORS.white,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: COLORS.white,
                        borderWidth: 1,
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: formData.dueDate
                        ? COLORS.textPrimary
                        : COLORS.textMuted,
                      fontSize: "14px",
                      py: 1.2,
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
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${COLORS.white}`,
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleCloseModal}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.bgPrimary,
              border: `1px solid ${COLORS.white}`,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAction}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.blue,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor: COLORS.blueHover,
              },
            }}
          >
            {editingAction ? "Save Changes" : "Save Action"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Detail Drawer */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={handleCloseDetailDrawer}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 400 },
              bgcolor: COLORS.bgSecondary,
              borderLeft: `1px solid ${COLORS.border}`,
            },
          },
        }}
      >
        {viewingAction && (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {/* Header */}
            <Box
              sx={{
                pt: 2.5,
                px: 2.5,
                pb: 1,
                borderBottom: `1px solid ${COLORS.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  sx={{ color: COLORS.blue, fontSize: "14px", fontWeight: 500 }}
                >
                  {viewingAction.id}
                </Typography>
                <Box
                  sx={{
                    bgcolor: COLORS.blueBgMedium,
                    color: COLORS.blue,
                    px: 1.5,
                    py: 0.25,
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {viewingAction.status}
                </Box>
              </Box>
              <IconButton
                onClick={handleCloseDetailDrawer}
                sx={{ color: COLORS.textMuted, p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflowY: "auto", pb: 1, px: 2.5, pt: 1 }}>
              {/* Title */}
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "18px",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                {viewingAction.title}
              </Typography>

              {/* Type and Priority */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  mb: 1,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      mb: 1,
                    }}
                  >
                    TYPE
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: "rgba(239, 68, 68, 0.15)",
                      color: COLORS.red,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 500,
                      display: "inline-block",
                    }}
                  >
                    {viewingAction.type}
                  </Box>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      mb: 1,
                    }}
                  >
                    PRIORITY
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: `${getPriorityColor(viewingAction.priority)}20`,
                      color: getPriorityColor(viewingAction.priority),
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 500,
                      display: "inline-block",
                    }}
                  >
                    {viewingAction.priority}
                  </Box>
                </Box>
              </Box>

              {/* Assignee and Due Date */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      mb: 1,
                    }}
                  >
                    ASSIGNEE
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: COLORS.blue,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 600,
                        }}
                      >
                        {viewingAction.assigneeInitials}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                    >
                      {viewingAction.assigneeName}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      mb: 1,
                    }}
                  >
                    DUE DATE
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {viewingAction.dueDate}
                  </Typography>
                </Box>
              </Box>

              {/* Linked Activity */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 1,
                  }}
                >
                  LINKED ACTIVITY
                </Typography>
                <Box
                  sx={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: COLORS.bgPrimary,
                  }}
                >
                  <Typography
                    sx={{
                      color: COLORS.blue,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    ACT
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.blue,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    -{viewingAction.linkedActivity.replace("ACT-", "")}
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
                  >
                    {viewingAction.linkedActivityName}
                  </Typography>
                </Box>
              </Box>

              {/* Description */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 1,
                  }}
                >
                  DESCRIPTION
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  {viewingAction.description}
                </Typography>
              </Box>

              {/* Status Timeline */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 2,
                  }}
                >
                  STATUS TIMELINE
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {viewingAction.timeline.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            bgcolor: COLORS.blue,
                            flexShrink: 0,
                            my: 1,
                          }}
                        />
                        <Box
                          sx={{
                            width: "1px",
                            height: 30,
                            bgcolor: COLORS.bgTertiary,
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          minHeight: 50,
                        }}
                      >
                        <Typography
                          sx={{
                            color: COLORS.textPrimary,
                            fontSize: "16px",
                            fontWeight: 500,
                            lineHeight: 1.3,
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                        >
                          {item.date} · {item.user}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Evidence & Attachments */}
              <Box>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 1.5,
                  }}
                >
                  EVEDENCE & ATTACHMENTS
                </Typography>
                <Box
                  sx={{
                    border: `2px dashed ${COLORS.bgTertiary}`,
                    borderRadius: "12px",
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: COLORS.textMuted,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={uploadIcon}
                    sx={{
                      width: 32,
                      height: 32,
                      mb: 1.5,
                      opacity: 0.5,
                    }}
                  />
                  <Typography
                    sx={{
                      color: COLORS.white,
                      fontSize: "14px",
                      mb: 0.5,
                    }}
                  >
                    Drop files here or click to upload
                  </Typography>
                  <Typography sx={{ color: COLORS.white, fontSize: "12px" }}>
                    PDF, Images, Documents up to 10MB
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                p: 2.5,
                borderTop: `1px solid ${COLORS.border}`,
                display: "flex",
                gap: 1.5,
              }}
            >
              <Button
                startIcon={<TimeIcon />}
                onClick={handleCloseAction}
                sx={{
                  flex: 1,
                  bgcolor: COLORS.green,
                  color: COLORS.white,
                  textTransform: "none",
                  py: 1.5,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: "#16a34a",
                  },
                }}
              >
                Close Action
              </Button>
              <Button
                onClick={handleEditFromDrawer}
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  color: COLORS.textPrimary,
                  border: `1px solid ${COLORS.border}`,
                  textTransform: "none",
                  px: 3,
                  py: 1.5,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: COLORS.bgTertiary,
                  },
                }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </PlannerLayout>
  );
};

export default PlannerActions;
