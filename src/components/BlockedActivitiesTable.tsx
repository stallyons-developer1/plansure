import { useState, Fragment } from "react";
import {
  Box,
  Typography,
  Button,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowRight,
  ChevronRight,
} from "@mui/icons-material";
import { COLORS } from "../constants/colors";

interface BlockedActivity {
  activityId: string;
  activityName: string;
  ragStatus: string;
  activityStatus: string;
  owner: string;
  blocker: string;
  isBlocked?: boolean;
  linkedAction: {
    actionId: string;
    title?: string;
    status: string;
  } | null;
  startDate?: string;
  finishDate?: string;
}

interface LinkedAction {
  _id?: string;
  actionId: string;
  title: string;
  status: string;
  priority?: string;
  assignee?: string;
  assigneeId?: string;
  dueDate?: string;
  isOverdue?: boolean;
}

interface WeeklyPlanActivity {
  activityId: string;
  activityName: string;
  weekZone: string;
  startDate: string;
  finishDate: string;
  duration: string;
  ragStatus: string;
  owner: string;
  activityStatus: string;
  actionsCount?: number;
  openActionsCount?: number;
  linkedActions?: LinkedAction[];
  notes?: string;
}

interface PlannerToDoItem {
  activityId: string;
  activityName: string;
  ragStatus: string;
  owner: string;
  todoItem: string;
  actionId?: string;
  actionStatus?: string;
  priority: string;
  dueDate: string;
}

interface BlockedActivitiesTableProps {
  activities?: BlockedActivity[];
  weeklyPlanPreview?: WeeklyPlanActivity[];
  plannerToDo?: PlannerToDoItem[];
  onAssignClick?: (activity: { activityId: string; activityName: string; startDate?: string; finishDate?: string }) => void;
  onUnblockClick?: (activityId: string) => void;
  onActionIdClick?: (actionId: string) => void;
  onReassignClick?: (action: { _id?: string; actionId: string; title: string; currentAssignee?: string }) => void;
  isProjectEnded?: boolean;
  cycleStatus?: string;
}

const BlockedActivitiesTable = ({
  activities = [],
  weeklyPlanPreview = [],
  plannerToDo = [],
  onAssignClick,
  onUnblockClick,
  onActionIdClick,
  onReassignClick,
  isProjectEnded = false,
  cycleStatus = "",
}: BlockedActivitiesTableProps) => {
  const canUnblock = cycleStatus === "Execution" || cycleStatus === "Close-Out Eligible";
  const [activeTab, setActiveTab] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (activityId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const tabs = [
    "Blocked / Risk Activities",
    "Weekly Plan Preview",
    "Planner To-Do",
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const cleanDate = dateString.replace(/\s*[A*]$/, "").trim();
    const match = cleanDate.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);

    if (match) {
      return `${match[1]} ${match[2]}`;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return `${String(date.getDate()).padStart(2, "0")} ${monthNames[date.getMonth()]}`;
  };

  return (
    <Box
      sx={{
        bgcolor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        overflow: "auto",
      }}
    >
      <Box sx={{ minWidth: "fit-content" }}>
        <Box sx={{ pt: 2, minWidth: 950 }}>
          <Box
            sx={{
              display: "flex",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            {tabs.map((tab, i) => (
              <Typography
                key={tab}
                onClick={() => setActiveTab(i)}
                sx={{
                  mx: 2,
                  color: activeTab === i ? COLORS.blue : COLORS.textMuted,
                  fontSize: "13px",
                  fontWeight: 500,
                  pb: 1,
                  mb: "15px",
                  cursor: "pointer",
                  borderBottom:
                    activeTab === i ? `2px solid ${COLORS.blue}` : "none",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    color: activeTab === i ? COLORS.blue : COLORS.textSecondary,
                  },
                }}
              >
                {tab}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Blocked / Risk Activities Tab - Only At Risk or Blocked activities */}
        {activeTab === 0 && (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "90px minmax(180px, 1fr) 80px 100px minmax(140px, 1fr) 120px 90px 90px",
                gap: 2,
                px: 3,
                py: 1.5,
                borderBottom: `1px solid ${COLORS.border}`,
                minWidth: 1040,
              }}
            >
              {[
                "ACTIVITY ID",
                "ACTIVITY NAME",
                "RAG",
                "ASSIGNEE",
                "ISSUE/ACTION",
                "ACTION ID",
                "STATUS",
                "ACTION",
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

            {activities.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
                  No blocked or at-risk activities
                </Typography>
              </Box>
            ) : (
              activities.map((activity, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "90px minmax(180px, 1fr) 80px 100px minmax(140px, 1fr) 120px 90px 90px",
                    gap: 2,
                    px: 3,
                    py: 2,
                    borderBottom:
                      index < activities.length - 1
                        ? `1px solid ${COLORS.border}`
                        : "none",
                    alignItems: "center",
                    minWidth: 1040,
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
                    {activity.activityId}
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 400,
                      textAlign: "center",
                    }}
                  >
                    {activity.activityName}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor: "#2a2a3e",
                        border: `1px solid ${
                          activity.ragStatus === "Red"
                            ? COLORS.red
                            : activity.ragStatus === "Amber"
                              ? COLORS.amber
                              : COLORS.green
                        }40`,
                        color:
                          activity.ragStatus === "Red"
                            ? COLORS.red
                            : activity.ragStatus === "Amber"
                              ? COLORS.amber
                              : COLORS.green,
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
                            activity.ragStatus === "Red"
                              ? COLORS.red
                              : activity.ragStatus === "Amber"
                                ? COLORS.amber
                                : COLORS.green,
                        }}
                      />
                      {activity.ragStatus}
                    </Box>
                  </Box>
                  {/* ASSIGNEE - show name or Assign button (disabled if blocked) */}
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    {activity.owner && activity.owner !== "-" ? (
                      <Typography
                        sx={{
                          color: COLORS.textSecondary,
                          fontSize: "13px",
                          fontWeight: 400,
                        }}
                      >
                        {activity.owner}
                      </Typography>
                    ) : (
                      <Button
                        onClick={() =>
                          !isProjectEnded && !activity.isBlocked && onAssignClick?.({
                            activityId: activity.activityId,
                            activityName: activity.activityName,
                            startDate: activity.startDate,
                            finishDate: activity.finishDate,
                          })
                        }
                        disabled={isProjectEnded || activity.isBlocked}
                        title={
                          isProjectEnded
                            ? "Project has ended - read only"
                            : activity.isBlocked
                              ? "Unblock activity first to assign"
                              : "Assign action"
                        }
                        sx={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: (isProjectEnded || activity.isBlocked) ? COLORS.textMuted : COLORS.blue,
                          textTransform: "none",
                          bgcolor: (isProjectEnded || activity.isBlocked) ? "transparent" : COLORS.blueBgLight,
                          border: `1px solid ${(isProjectEnded || activity.isBlocked) ? COLORS.textMuted : COLORS.blue}50`,
                          borderRadius: "6px",
                          px: 1.5,
                          py: 0.3,
                          minWidth: "auto",
                          cursor: (isProjectEnded || activity.isBlocked) ? "not-allowed" : "pointer",
                          opacity: (isProjectEnded || activity.isBlocked) ? 0.5 : 1,
                          "&:hover": {
                            bgcolor: (isProjectEnded || activity.isBlocked) ? "transparent" : COLORS.blueBgMedium,
                          },
                        }}
                      >
                        {isProjectEnded ? "Ended" : "Assign"}
                      </Button>
                    )}
                  </Box>
                  {/* ISSUE/ACTION */}
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "13px",
                      fontWeight: 400,
                      textAlign: "center",
                    }}
                  >
                    {activity.blocker || "-"}
                  </Typography>
                  {/* ACTION ID - clickable or dash */}
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    {activity.linkedAction?.actionId ? (
                      <Typography
                        onClick={() => onActionIdClick?.(activity.linkedAction!.actionId)}
                        sx={{
                          color: COLORS.blue,
                          fontSize: "11px",
                          fontWeight: 500,
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {activity.linkedAction.actionId}
                      </Typography>
                    ) : (
                      <Typography
                        sx={{
                          color: COLORS.textMuted,
                          fontSize: "11px",
                        }}
                      >
                        -
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor:
                          activity.activityStatus === "Blocked"
                            ? `${COLORS.red}20`
                            : activity.linkedAction?.status === "Overdue"
                              ? `${COLORS.red}20`
                              : `${COLORS.amber}15`,
                        border:
                          activity.activityStatus === "Blocked" || activity.linkedAction?.status === "Overdue"
                            ? `1px solid ${COLORS.red}40`
                            : "none",
                        color:
                          activity.activityStatus === "Blocked" || activity.linkedAction?.status === "Overdue"
                            ? COLORS.red
                            : COLORS.amber,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {activity.activityStatus === "Blocked"
                        ? "Blocked"
                        : activity.linkedAction?.status || "At Risk"}
                    </Box>
                  </Box>
                  {/* ACTION - Unblock button for blocked activities */}
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    {activity.isBlocked ? (
                      <Tooltip
                        title={
                          isProjectEnded
                            ? "Project has ended - read only"
                            : !canUnblock
                              ? "Cycle Control must be in Execution to unblock activities"
                              : ""
                        }
                        arrow
                        placement="top"
                      >
                        <span>
                          <Button
                            onClick={() => canUnblock && !isProjectEnded && onUnblockClick?.(activity.activityId)}
                            disabled={isProjectEnded || !canUnblock}
                            sx={{
                              fontSize: "11px",
                              fontWeight: 500,
                              color: (isProjectEnded || !canUnblock) ? COLORS.textMuted : COLORS.green,
                              textTransform: "none",
                              bgcolor: (isProjectEnded || !canUnblock) ? "transparent" : `${COLORS.green}15`,
                              border: `1px solid ${(isProjectEnded || !canUnblock) ? COLORS.textMuted : COLORS.green}50`,
                              borderRadius: "6px",
                              px: 1.5,
                              py: 0.3,
                              minWidth: "auto",
                              cursor: (isProjectEnded || !canUnblock) ? "not-allowed" : "pointer",
                              opacity: (isProjectEnded || !canUnblock) ? 0.5 : 1,
                              "&:hover": {
                                bgcolor: (isProjectEnded || !canUnblock) ? "transparent" : `${COLORS.green}25`,
                              },
                            }}
                          >
                            Unblock
                          </Button>
                        </span>
                      </Tooltip>
                    ) : (
                      <Typography sx={{ color: COLORS.textMuted, fontSize: "11px" }}>
                        -
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))
            )}
          </>
        )}

        {/* Weekly Plan Preview Tab - Activities with assigned actions */}
        {activeTab === 1 && (
          <>
            {weeklyPlanPreview.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
                  No activities with assigned actions for these weeks
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "transparent" }}>
                      <TableCell sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, py: 1.5, pl: 2, letterSpacing: "0.05em" }}>
                        ACTIVITY ID
                      </TableCell>
                      <TableCell sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, py: 1.5, letterSpacing: "0.05em" }}>
                        ACTIVITY NAME
                      </TableCell>
                      <TableCell align="center" sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, py: 1.5, letterSpacing: "0.05em" }}>
                        START
                      </TableCell>
                      <TableCell align="center" sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, py: 1.5, letterSpacing: "0.05em" }}>
                        END
                      </TableCell>
                      <TableCell align="center" sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, py: 1.5, letterSpacing: "0.05em" }}>
                        DURATION
                      </TableCell>
                      <TableCell align="center" sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, py: 1.5, letterSpacing: "0.05em" }}>
                        ACTIONS
                      </TableCell>
                      <TableCell align="center" sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, py: 1.5, letterSpacing: "0.05em" }}>
                        RAG
                      </TableCell>
                      <TableCell align="center" sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, py: 1.5, letterSpacing: "0.05em" }}>
                        STATUS
                      </TableCell>
                      <TableCell align="center" sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, py: 1.5, letterSpacing: "0.05em" }}>
                        OWNER
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {weeklyPlanPreview.map((activity) => {
                      const isExpanded = expandedRows.has(activity.activityId);
                      const hasActions = (activity.linkedActions?.length || 0) > 0 || (activity.actionsCount || 0) > 0;
                      const ragColor = activity.ragStatus === "Green" ? COLORS.green : activity.ragStatus === "Amber" ? COLORS.amber : COLORS.red;
                      const statusColor = activity.activityStatus === "Ready" ? COLORS.green : activity.activityStatus === "Complete" ? COLORS.blue : COLORS.amber;

                      return (
                        <Fragment key={activity.activityId}>
                          <TableRow
                            key={activity.activityId}
                            sx={{
                              "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                              bgcolor: isExpanded ? "rgba(59, 130, 246, 0.05)" : "transparent",
                              cursor: hasActions ? "pointer" : "default",
                            }}
                            onClick={() => hasActions && toggleRow(activity.activityId)}
                          >
                            <TableCell sx={{ color: COLORS.blue, fontSize: "13px", fontWeight: 500, borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", py: 1.5, pl: 2 }}>
                              {activity.activityId}
                            </TableCell>
                            <TableCell sx={{ color: COLORS.textPrimary, fontSize: "13px", borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", py: 1.5 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {hasActions && (
                                  <IconButton size="small" sx={{ color: COLORS.textSecondary, p: 0.25 }}>
                                    {isExpanded ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
                                  </IconButton>
                                )}
                                {activity.activityName}
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ color: COLORS.textSecondary, fontSize: "13px", borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", py: 1.5 }}>
                              {formatDate(activity.startDate)}
                            </TableCell>
                            <TableCell align="center" sx={{ color: COLORS.textSecondary, fontSize: "13px", borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", py: 1.5 }}>
                              {formatDate(activity.finishDate)}
                            </TableCell>
                            <TableCell align="center" sx={{ color: COLORS.textSecondary, fontSize: "13px", borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", py: 1.5 }}>
                              {activity.duration || "-"}
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", py: 1.5 }}>
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  color: COLORS.blue,
                                  cursor: "pointer",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                              >
                                {activity.actionsCount || 0} action{(activity.actionsCount || 0) !== 1 ? "s" : ""}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", py: 1.5 }}>
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
                                }}
                              >
                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: ragColor }} />
                                {activity.ragStatus}
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", py: 1.5 }}>
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
                                }}
                              >
                                {activity.activityStatus || "Ready"}
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ color: COLORS.textSecondary, fontSize: "13px", borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", py: 1.5 }}>
                              {activity.owner || "-"}
                            </TableCell>
                          </TableRow>

                          {/* Expanded Section - Linked Actions */}
                          {activity.linkedActions && activity.linkedActions.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={9} sx={{ py: 0, px: 0, borderBottom: isExpanded ? `1px solid ${COLORS.border}` : "none", bgcolor: COLORS.bgPrimary }}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box sx={{ py: 2, px: 3, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                                    <Box>
                                      <Typography sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, mb: 1.5, letterSpacing: "0.05em" }}>
                                        LINKED ACTIONS
                                      </Typography>
                                      {activity.linkedActions.map((action, actionIndex) => (
                                        <Box key={actionIndex} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                                          <ChevronRight sx={{ color: COLORS.blue, fontSize: "1rem" }} />
                                          <Typography
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onActionIdClick?.(action.actionId);
                                            }}
                                            sx={{
                                              color: COLORS.textLight,
                                              fontSize: "13px",
                                              cursor: "pointer",
                                              "&:hover": { color: COLORS.blue, textDecoration: "underline" },
                                            }}
                                          >
                                            {action.title || action.actionId}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                    <Box>
                                      <Typography sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, mb: 1.5, letterSpacing: "0.05em" }}>
                                        REASSIGN
                                      </Typography>
                                      {activity.linkedActions.map((action, actionIndex) => (
                                        <Box key={actionIndex} sx={{ mb: 0.75 }}>
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onReassignClick?.({
                                                _id: action._id,
                                                actionId: action.actionId,
                                                title: action.title,
                                                currentAssignee: action.assigneeId,
                                              });
                                            }}
                                            disabled={isProjectEnded || action.status === "Completed"}
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
                                              "&:hover": { bgcolor: "rgba(245, 158, 11, 0.25)" },
                                              "&.Mui-disabled": { color: COLORS.textMuted, bgcolor: COLORS.bgTertiary, borderColor: COLORS.border },
                                            }}
                                          >
                                            Reassign
                                          </Button>
                                        </Box>
                                      ))}
                                    </Box>
                                    <Box>
                                      <Typography sx={{ color: COLORS.textMuted, fontSize: "11px", fontWeight: 600, mb: 1.5, letterSpacing: "0.05em" }}>
                                        NOTES
                                      </Typography>
                                      <Typography sx={{ color: COLORS.textLight, fontSize: "13px" }}>
                                        {activity.notes || "-"}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Planner To-Do Tab - Actual action details */}
        {activeTab === 2 && (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "80px minmax(160px, 1fr) 80px minmax(140px, 1fr) 90px 80px 80px 80px",
                gap: 2,
                px: 3,
                py: 1.5,
                borderBottom: `1px solid ${COLORS.border}`,
                minWidth: 950,
              }}
            >
              {[
                "ACTION ID",
                "ACTION TITLE",
                "ACTIVITY",
                "ASSIGNEE",
                "STATUS",
                "PRIORITY",
                "DUE DATE",
                "RAG",
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

            {plannerToDo.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
                  No open actions for these weeks
                </Typography>
              </Box>
            ) : (
              plannerToDo.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "80px minmax(160px, 1fr) 80px minmax(140px, 1fr) 90px 80px 80px 80px",
                    gap: 2,
                    px: 3,
                    py: 2,
                    borderBottom:
                      index < plannerToDo.length - 1
                        ? `1px solid ${COLORS.border}`
                        : "none",
                    alignItems: "center",
                    minWidth: 950,
                    "&:hover": { bgcolor: COLORS.bgTertiary },
                  }}
                >
                  {/* ACTION ID - clickable */}
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    {item.actionId ? (
                      <Typography
                        onClick={() => onActionIdClick?.(item.actionId || "")}
                        sx={{
                          color: COLORS.blue,
                          fontSize: "11px",
                          fontWeight: 500,
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {item.actionId}
                      </Typography>
                    ) : (
                      <Typography
                        sx={{
                          color: COLORS.textMuted,
                          fontSize: "11px",
                        }}
                      >
                        -
                      </Typography>
                    )}
                  </Box>
                  {/* ACTION TITLE */}
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "13px",
                      fontWeight: 400,
                      textAlign: "center",
                    }}
                  >
                    {item.todoItem}
                  </Typography>
                  {/* ACTIVITY ID */}
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "11px",
                      textAlign: "center",
                    }}
                  >
                    {item.activityId}
                  </Typography>
                  {/* ASSIGNEE - show name or Assign button */}
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    {item.owner && item.owner !== "-" ? (
                      <Typography
                        sx={{
                          color: COLORS.textSecondary,
                          fontSize: "13px",
                          fontWeight: 400,
                        }}
                      >
                        {item.owner}
                      </Typography>
                    ) : (
                      <Button
                        onClick={() =>
                          !isProjectEnded && (() => {
                            const wpActivity = weeklyPlanPreview.find(wp => wp.activityId === item.activityId);
                            onAssignClick?.({
                              activityId: item.activityId,
                              activityName: item.activityName,
                              startDate: wpActivity?.startDate,
                              finishDate: wpActivity?.finishDate,
                            });
                          })()
                        }
                        disabled={isProjectEnded}
                        title={isProjectEnded ? "Project has ended - read only" : "Assign action"}
                        sx={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: isProjectEnded ? COLORS.textMuted : COLORS.blue,
                          textTransform: "none",
                          bgcolor: isProjectEnded ? "transparent" : COLORS.blueBgLight,
                          border: `1px solid ${isProjectEnded ? COLORS.textMuted : COLORS.blue}50`,
                          borderRadius: "6px",
                          px: 1.5,
                          py: 0.3,
                          minWidth: "auto",
                          cursor: isProjectEnded ? "not-allowed" : "pointer",
                          opacity: isProjectEnded ? 0.5 : 1,
                          "&:hover": {
                            bgcolor: isProjectEnded ? "transparent" : COLORS.blueBgMedium,
                          },
                        }}
                      >
                        {isProjectEnded ? "Ended" : "Assign"}
                      </Button>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor:
                          item.actionStatus === "Overdue"
                            ? `${COLORS.red}20`
                            : item.actionStatus === "In Progress"
                              ? `${COLORS.blue}20`
                              : `${COLORS.amber}20`,
                        color:
                          item.actionStatus === "Overdue"
                            ? COLORS.red
                            : item.actionStatus === "In Progress"
                              ? COLORS.blue
                              : COLORS.amber,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontWeight: 500,
                      }}
                    >
                      {item.actionStatus || "Open"}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor:
                          item.priority === "High"
                            ? `${COLORS.red}20`
                            : item.priority === "Low"
                              ? `${COLORS.green}20`
                              : `${COLORS.amber}20`,
                        color:
                          item.priority === "High"
                            ? COLORS.red
                            : item.priority === "Low"
                              ? COLORS.green
                              : COLORS.amber,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontWeight: 500,
                      }}
                    >
                      {item.priority}
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      color: item.actionStatus === "Overdue" ? COLORS.red : COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: item.actionStatus === "Overdue" ? 500 : 400,
                      textAlign: "center",
                    }}
                  >
                    {item.dueDate}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor: "#2a2a3e",
                        border: `1px solid ${
                          item.ragStatus === "Red"
                            ? COLORS.red
                            : item.ragStatus === "Amber"
                              ? COLORS.amber
                              : COLORS.green
                        }40`,
                        color:
                          item.ragStatus === "Red"
                            ? COLORS.red
                            : item.ragStatus === "Amber"
                              ? COLORS.amber
                              : COLORS.green,
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
                            item.ragStatus === "Red"
                              ? COLORS.red
                              : item.ragStatus === "Amber"
                                ? COLORS.amber
                                : COLORS.green,
                        }}
                      />
                      {item.ragStatus}
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default BlockedActivitiesTable;
