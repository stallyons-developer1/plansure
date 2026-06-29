import { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Avatar,
  Typography,
  Button,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowRight,
  ChevronRight,
} from "@mui/icons-material";
import { COLORS, getStatusColor } from "../constants/colors";

// Format date from various formats to YYYY-MM-DD
const formatDate = (dateStr: string): string => {
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

  // Clean suffix like " A" or " *" (indicates actual/completed)
  const cleanDate = dateStr.replace(/\s*[A*]$/, "").trim();

  // Handle DD-MMM-YY format (e.g., "25-Oct-21")
  const match = cleanDate.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = months[match[2]];
    let year = parseInt(match[3]);
    year = year < 50 ? 2000 + year : 1900 + year;
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Already in YYYY-MM-DD format (exact match)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return cleanDate;
  }

  // Handle ISO datetime format (e.g., "2026-03-25T00:00:00.000Z")
  const isoMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Fallback: try native Date parsing with UTC methods to avoid timezone shift
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "-";
};

export interface ActivityAction {
  _id: string;
  title: string;
  status: string;
  dueDate?: string;
  assignee?: { _id?: string; name?: string };
}

export interface Activity {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: string;
  ragZone: string;
  ragColor: string;
  actions: number;
  status: string;
  statusType: string;
  owner: { initials: string; name: string; color: string };
  linkedActions?: string[];
  linkedActionsData?: ActivityAction[];
  dependencies?: string;
  notes?: string;
}

export const activitiesData: Activity[] = [
  {
    id: "ACT-001",
    name: "Foundation pour - Block A",
    startDate: "2026-03-25",
    endDate: "2026-04-03",
    duration: "10d",
    ragZone: "Weeks 1-2",
    ragColor: "green",
    actions: 3,
    status: "Ready",
    statusType: "green",
    owner: { initials: "JP", name: "James P.", color: "#22C55E" },
    linkedActions: [
      "Confirm concrete delivery",
      "Safety briefing completed",
      "Formwork inspection sign-off",
    ],
    dependencies: "ACT-012 (Complete)",
    notes: "Concrete mix approved. Pour scheduled for early morning.",
  },
  {
    id: "ACT-002",
    name: "Steel erection - Level 2",
    startDate: "2026-03-27",
    endDate: "2026-04-05",
    duration: "8d",
    ragZone: "Weeks 1-2",
    ragColor: "green",
    actions: 2,
    status: "Ready",
    statusType: "green",
    owner: { initials: "SM", name: "Sarah M.", color: "#F59E0B" },
  },
  {
    id: "ACT-003",
    name: "Mechanical rough-in - Zone C",
    startDate: "2026-03-30",
    endDate: "2026-04-07",
    duration: "7d",
    ragZone: "Weeks 1-2",
    ragColor: "green",
    actions: 4,
    status: "Ready",
    statusType: "green",
    owner: { initials: "DK", name: "David K.", color: "#3B82F6" },
  },
  {
    id: "ACT-004",
    name: "Waterproofing - Basement 1",
    startDate: "2026-04-01",
    endDate: "2026-04-08",
    duration: "6d",
    ragZone: "Weeks 1-2",
    ragColor: "green",
    actions: 1,
    status: "Blocked",
    statusType: "red",
    owner: { initials: "ML", name: "Maria L.", color: "#EC4899" },
  },
  {
    id: "ACT-005",
    name: "Curtain wall installation",
    startDate: "2026-04-06",
    endDate: "2026-04-17",
    duration: "12d",
    ragZone: "Weeks 3-4",
    ragColor: "amber",
    actions: 5,
    status: "At Risk",
    statusType: "amber",
    owner: { initials: "TR", name: "Tom R.", color: "#8B5CF6" },
  },
  {
    id: "ACT-006",
    name: "Electrical first fix - Floors 3-5",
    startDate: "2026-04-08",
    endDate: "2026-04-18",
    duration: "9d",
    ragZone: "Weeks 3-4",
    ragColor: "amber",
    actions: 2,
    status: "Ready",
    statusType: "green",
    owner: { initials: "AB", name: "Ahmed B.", color: "#F97316" },
  },
  {
    id: "ACT-007",
    name: "Roof steel - Phase 2",
    startDate: "2026-04-13",
    endDate: "2026-04-22",
    duration: "8d",
    ragZone: "Weeks 3-4",
    ragColor: "amber",
    actions: 3,
    status: "Ready",
    statusType: "green",
    owner: { initials: "JP", name: "James P.", color: "#22C55E" },
  },
  {
    id: "ACT-008",
    name: "Fire stopping - Levels 1-3",
    startDate: "2026-04-15",
    endDate: "2026-04-24",
    duration: "8d",
    ragZone: "Weeks 3-4",
    ragColor: "amber",
    actions: 2,
    status: "Blocked",
    statusType: "red",
    owner: { initials: "JP", name: "Lisa W.", color: "#06B6D4" },
  },
  {
    id: "ACT-009",
    name: "External cladding",
    startDate: "2026-04-20",
    endDate: "2026-05-01",
    duration: "10d",
    ragZone: "Weeks 5-6",
    ragColor: "red",
    actions: 4,
    status: "At Risk",
    statusType: "amber",
    owner: { initials: "JP", name: "Tom R.", color: "#8B5CF6" },
  },
  {
    id: "ACT-010",
    name: "Lift installation - Core B",
    startDate: "2026-04-22",
    endDate: "2026-05-03",
    duration: "10d",
    ragZone: "Weeks 5-6",
    ragColor: "red",
    actions: 3,
    status: "Ready",
    statusType: "green",
    owner: { initials: "DK", name: "David K.", color: "#3B82F6" },
  },
  {
    id: "ACT-011",
    name: "Lift installation - Core B",
    startDate: "2026-04-22",
    endDate: "2026-05-03",
    duration: "10d",
    ragZone: "Weeks 5-6",
    ragColor: "red",
    actions: 2,
    status: "Blocked",
    statusType: "red",
    owner: { initials: "ML", name: "Maria L.", color: "#EC4899" },
  },
  {
    id: "ACT-012",
    name: "Commissioning - HVAC Zone A",
    startDate: "2026-04-29",
    endDate: "2026-05-08",
    duration: "8d",
    ragZone: "Weeks 5-6",
    ragColor: "red",
    actions: 3,
    status: "Ready",
    statusType: "green",
    owner: { initials: "AB", name: "Ahmed B.", color: "#F97316" },
  },
];

const ActivityRow = ({
  activity,
  isFirst,
  onAssignClick,
  onActionClick,
  onReassignClick,
  isProjectEnded = false,
}: {
  activity: Activity;
  isFirst?: boolean;
  onAssignClick?: (activity: Activity) => void;
  onActionClick?: () => void;
  onReassignClick?: (action: { _id: string; title: string; currentAssignee?: string }) => void;
  isProjectEnded?: boolean;
}) => {
  const [open, setOpen] = useState(isFirst);
  const ragColor = getStatusColor(activity.ragColor);
  const statusColor =
    activity.statusType === "blue"
      ? COLORS.blue
      : activity.statusType === "green"
        ? COLORS.green
        : activity.statusType === "amber"
          ? COLORS.amber
          : COLORS.red;

  // Start of today (midnight) - actions are only overdue after due date has fully passed
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Activity status says an action exists, but the current user can't see it
  // (e.g. a User role only receives actions assigned to them). Show a hint
  // instead of a bare "-" so they know the activity is being handled.
  const hasHiddenAction =
    (!activity.linkedActionsData || activity.linkedActionsData.length === 0) &&
    (activity.status === "Action Open" || activity.status === "Action Overdue");

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
            py: 1.5,
            position: "relative",
            fontSize: "13px",
            pl: 2,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 1,
              bottom: 1,
              width: "4px",
              bgcolor: ragColor,
            }}
          />
          {activity.id}
        </TableCell>
        <TableCell
          sx={{
            color: COLORS.textPrimary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {(activity.linkedActions || (activity.linkedActionsData && activity.linkedActionsData.length > 0)) && (
              <IconButton
                size="small"
                onClick={() => setOpen(!open)}
                sx={{ color: COLORS.textSecondary, p: 0.25 }}
              >
                {open ? (
                  <KeyboardArrowDown fontSize="small" />
                ) : (
                  <KeyboardArrowRight fontSize="small" />
                )}
              </IconButton>
            )}
            {activity.name}
          </Box>
        </TableCell>
        <TableCell
          align="center"
          sx={{
            color: COLORS.textSecondary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
          }}
        >
          {formatDate(activity.startDate)}
        </TableCell>
        <TableCell
          align="center"
          sx={{
            color: COLORS.textSecondary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
          }}
        >
          {formatDate(activity.endDate)}
        </TableCell>
        <TableCell
          align="center"
          sx={{
            color: COLORS.textSecondary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
          }}
        >
          {activity.duration || "-"}
        </TableCell>
        <TableCell
          align="center"
          sx={{
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
          }}
        >
          <Box
            sx={{
              bgcolor: `${ragColor}20`,
              color: ragColor,
              px: 1.5,
              py: 0.5,
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              minWidth: 85,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: ragColor,
              }}
            />
            {activity.ragZone}
          </Box>
        </TableCell>
        <TableCell
          align="center"
          sx={{
            color: COLORS.textMuted,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
          }}
        >
          {activity.linkedActionsData && activity.linkedActionsData.length > 0 ? (
            (() => {
              const count = activity.linkedActionsData.length;
              const allClosed = activity.linkedActionsData.every(
                (a) => a.status === "Completed"
              );
              const anyOverdue = activity.linkedActionsData.some(
                (a) =>
                  a.status !== "Completed" &&
                  a.dueDate &&
                  new Date(a.dueDate) < startOfToday
              );
              const actionLabel = allClosed
                ? "Closed"
                : `${count} action${count !== 1 ? "s" : ""}`;
              const actionLabelColor = allClosed
                ? COLORS.green
                : anyOverdue
                  ? COLORS.red
                  : COLORS.blue;
              return (
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: actionLabelColor,
                    cursor: "pointer",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                  onClick={() => setOpen(!open)}
                >
                  {actionLabel}
                </Typography>
              );
            })()
          ) : hasHiddenAction ? (
            <Typography
              title="An action has been raised for this activity and assigned to another member"
              sx={{ fontSize: "12px", color: COLORS.textMuted }}
            >
              Assigned
            </Typography>
          ) : (
            <Typography sx={{ fontSize: "12px", color: COLORS.textSecondary }}>
              -
            </Typography>
          )}
        </TableCell>
        <TableCell
          align="center"
          sx={{
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
          }}
        >
          <Box
            sx={{
              bgcolor: `${statusColor}20`,
              color: statusColor,
              px: 1.5,
              py: 0.5,
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              display: "inline-block",
              textAlign: "center",
              minWidth: 70,
            }}
          >
            {activity.status}
          </Box>
        </TableCell>
        <TableCell
          align="center"
          sx={{
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
          }}
        >
          {activity.linkedActionsData && activity.linkedActionsData.length > 0 ? (
            (() => {
              const latestAction = activity.linkedActionsData[0];
              const assigneeName = latestAction.assignee?.name || "Assigned";
              const assigneeInitials = assigneeName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <Box
                  onClick={() => setOpen(!open)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    px: 1,
                    py: 0.5,
                    borderRadius: "6px",
                    "&:hover": {
                      bgcolor: COLORS.whiteHoverLight,
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      fontSize: "9px",
                      fontWeight: 600,
                      bgcolor: COLORS.green,
                    }}
                  >
                    {assigneeInitials}
                  </Avatar>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: COLORS.textPrimary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "60px",
                    }}
                  >
                    {assigneeName.split(" ")[0]}
                  </Typography>
                </Box>
              );
            })()
          ) : onAssignClick ? (
            (() => {
              // Allow assignment for activities within 6 weeks (Weeks 1-2, 3-4, 5-6 or In Progress)
              const isWithin6Weeks =
                activity.ragZone === "Weeks 1-2" ||
                activity.ragZone === "Weeks 3-4" ||
                activity.ragZone === "Weeks 5-6" ||
                activity.ragZone === "In Progress";
              const canAssign = isWithin6Weeks && !isProjectEnded;

              return (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canAssign) {
                      onAssignClick(activity);
                    }
                  }}
                  disabled={!canAssign}
                  title={
                    !canAssign
                      ? isProjectEnded
                        ? "Project has ended - read only"
                        : "Only activities within 6 weeks can be assigned"
                      : "Assign action"
                  }
                  sx={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: canAssign ? COLORS.blue : COLORS.textMuted,
                    textTransform: "none",
                    bgcolor: canAssign ? COLORS.blueBgLight : "transparent",
                    border: `1px solid ${canAssign ? COLORS.blue : COLORS.textMuted}30`,
                    borderRadius: "6px",
                    px: 1.5,
                    py: 0.4,
                    minWidth: "auto",
                    cursor: canAssign ? "pointer" : "not-allowed",
                    opacity: canAssign ? 1 : 0.5,
                    "&:hover": {
                      bgcolor: canAssign ? COLORS.blueBgMedium : "transparent",
                    },
                    "&.Mui-disabled": {
                      color: COLORS.textMuted,
                    },
                  }}
                >
                  Assign
                </Button>
              );
            })()
          ) : hasHiddenAction ? (
            <Typography
              title="Assigned to another team member"
              sx={{ color: COLORS.textMuted, fontSize: "12px" }}
            >
              Assigned
            </Typography>
          ) : (
            <Typography sx={{ color: COLORS.textMuted, fontSize: "13px" }}>
              -
            </Typography>
          )}
        </TableCell>
        <TableCell
          align="center"
          sx={{
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: "#1E3A5F",
                color: COLORS.blue,
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {activity.owner.initials}
            </Avatar>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "13px",
              }}
            >
              {activity.owner.name}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>

      {activity.linkedActionsData && activity.linkedActionsData.length > 0 && (
        <TableRow>
          <TableCell
            colSpan={10}
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
                  px: 3,
                  display: "grid",
                  gridTemplateColumns: onReassignClick ? "1fr 1fr 1fr" : "1fr 1fr",
                  gap: 4,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "11px",
                      fontWeight: 600,
                      mb: 1.5,
                      letterSpacing: "0.05em",
                    }}
                  >
                    LINKED ACTIONS
                  </Typography>
                  {activity.linkedActionsData.map((action) => {
                    const isOverdue = action.status !== "Completed" && action.dueDate && new Date(action.dueDate) < startOfToday;
                    return (
                      <Box
                        key={action._id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.75,
                        }}
                      >
                        <ChevronRight
                          sx={{ color: COLORS.blue, fontSize: "1rem" }}
                        />
                        <Typography
                          onClick={() => onActionClick?.()}
                          sx={{
                            color: COLORS.textLight,
                            fontSize: "13px",
                            cursor: "pointer",
                            "&:hover": {
                              color: COLORS.blue,
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {action.title}
                        </Typography>
                        {isOverdue && (
                          <Box
                            sx={{
                              bgcolor: `${COLORS.red}20`,
                              color: COLORS.red,
                              px: 1,
                              py: 0.25,
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 500,
                            }}
                          >
                            Overdue
                          </Box>
                        )}
                        {action.status === "Completed" && (
                          <Box
                            sx={{
                              bgcolor: `${COLORS.green}20`,
                              color: COLORS.green,
                              px: 1,
                              py: 0.25,
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 500,
                            }}
                          >
                            Complete
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
                {onReassignClick && (
                  <Box>
                    <Typography
                      sx={{
                        color: COLORS.textMuted,
                        fontSize: "11px",
                        fontWeight: 600,
                        mb: 1.5,
                        letterSpacing: "0.05em",
                      }}
                    >
                      REASSIGN
                    </Typography>
                    {activity.linkedActionsData.map((action) => (
                      <Box key={action._id} sx={{ mb: 0.75 }}>
                        <Button
                          disabled={action.status === "Completed"}
                          onClick={() =>
                            onReassignClick?.({
                              _id: action._id,
                              title: action.title,
                              currentAssignee: action.assignee?._id,
                            })
                          }
                          sx={{
                            fontSize: "10px",
                            fontWeight: 500,
                            color: COLORS.amber,
                            textTransform: "none",
                            bgcolor: "rgba(245, 158, 11, 0.15)",
                            border: `1px solid ${COLORS.amber}30`,
                            borderRadius: "6px",
                            px: 1.5,
                            py: 0.3,
                            minWidth: "auto",
                            "&:hover": {
                              bgcolor: "rgba(245, 158, 11, 0.25)",
                            },
                            "&.Mui-disabled": {
                              color: COLORS.textMuted,
                              bgcolor: COLORS.bgTertiary,
                              borderColor: COLORS.border,
                            },
                          }}
                        >
                          Reassign
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "11px",
                      fontWeight: 600,
                      mb: 1.5,
                      letterSpacing: "0.05em",
                    }}
                  >
                    NOTES
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textLight, fontSize: "13px" }}
                  >
                    {activity.notes || "-"}
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

interface ActivitiesTableProps {
  activities: Activity[];
  onAssignClick?: (activity: Activity) => void;
  onActionClick?: () => void;
  onReassignClick?: (action: { _id: string; title: string; currentAssignee?: string }) => void;
  currentPage?: number;
  totalPages?: number;
  totalActivities?: number;
  onPageChange?: (page: number) => void;
  activitiesPerPage?: number;
  isProjectEnded?: boolean;
}

const ActivitiesTable = ({
  activities,
  onAssignClick,
  onActionClick,
  onReassignClick,
  currentPage = 1,
  totalPages = 1,
  totalActivities = 0,
  onPageChange,
  activitiesPerPage = 20,
  isProjectEnded = false,
}: ActivitiesTableProps) => {
  const startIndex = (currentPage - 1) * activitiesPerPage + 1;
  const endIndex = Math.min(currentPage * activitiesPerPage, totalActivities);

  return (
    <Box
      sx={{
        bgcolor: COLORS.bgTableInner,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "transparent" }}>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  pl: 2,
                  letterSpacing: "0.05em",
                }}
              >
                ACTIVITY ID
              </TableCell>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                ACTIVITY NAME
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                START DATE
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
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
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                DURATION
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                RAG ZONE
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                ACTIONS
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                STATUS
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                ASSIGNEE
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                OWNER
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.map((activity, index) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                isFirst={index === 0}
                onAssignClick={onAssignClick}
                onActionClick={onActionClick}
                onReassignClick={onReassignClick}
                isProjectEnded={isProjectEnded}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Pagination Footer */}
      {totalPages > 1 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            py: 1.5,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
            Showing {startIndex}-{endIndex} of {totalActivities} activities
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              sx={{
                minWidth: "auto",
                px: 2,
                py: 0.75,
                fontSize: "13px",
                flexShrink: 0,
                color: currentPage === 1 ? COLORS.textMuted : COLORS.textPrimary,
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                textTransform: "none",
                "&:hover": { bgcolor: COLORS.whiteHoverLight },
                "&.Mui-disabled": {
                  bgcolor: COLORS.bgSecondary,
                  color: COLORS.textMuted,
                },
              }}
            >
              Previous
            </Button>
            {Array.from(
              { length: Math.min(5, totalPages) },
              (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    sx={{
                      minWidth: 36,
                      px: 1,
                      py: 0.75,
                      fontSize: "13px",
                      color:
                        currentPage === pageNum
                          ? COLORS.blue
                          : COLORS.textPrimary,
                      bgcolor:
                        currentPage === pageNum
                          ? COLORS.blueBgMedium
                          : COLORS.bgSecondary,
                      border: `1px solid ${currentPage === pageNum ? COLORS.blue : COLORS.border}`,
                      borderRadius: "8px",
                      textTransform: "none",
                      "&:hover": {
                        bgcolor:
                          currentPage === pageNum
                            ? COLORS.blueBgMedium
                            : COLORS.whiteHoverLight,
                      },
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              },
            )}
            <Button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              sx={{
                minWidth: "auto",
                px: 2,
                py: 0.75,
                fontSize: "13px",
                flexShrink: 0,
                color:
                  currentPage === totalPages
                    ? COLORS.textMuted
                    : COLORS.textPrimary,
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                textTransform: "none",
                "&:hover": { bgcolor: COLORS.whiteHoverLight },
                "&.Mui-disabled": {
                  bgcolor: COLORS.bgSecondary,
                  color: COLORS.textMuted,
                },
              }}
            >
              Next
            </Button>
          </Box>
        </Box>
      ) : totalActivities > 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${COLORS.border}` }}>
          <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
            Showing {totalActivities} activities
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
};

export default ActivitiesTable;
