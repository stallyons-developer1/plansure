import { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
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
  onAssignClick?: (activity: { activityId: string; activityName: string }) => void;
  onUnblockClick?: (activityId: string) => void;
  onActionClick?: () => void;
  isProjectEnded?: boolean;
}

const BlockedActivitiesTable = ({
  activities = [],
  weeklyPlanPreview = [],
  plannerToDo = [],
  onAssignClick,
  onUnblockClick,
  onActionClick,
  isProjectEnded = false,
}: BlockedActivitiesTableProps) => {
  const [activeTab, setActiveTab] = useState(0);

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
                        onClick={() => onActionClick?.()}
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
                      <Button
                        onClick={() => !isProjectEnded && onUnblockClick?.(activity.activityId)}
                        disabled={isProjectEnded}
                        title={isProjectEnded ? "Project has ended - read only" : "Unblock activity"}
                        sx={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: isProjectEnded ? COLORS.textMuted : COLORS.green,
                          textTransform: "none",
                          bgcolor: isProjectEnded ? "transparent" : `${COLORS.green}15`,
                          border: `1px solid ${isProjectEnded ? COLORS.textMuted : COLORS.green}50`,
                          borderRadius: "6px",
                          px: 1.5,
                          py: 0.3,
                          minWidth: "auto",
                          cursor: isProjectEnded ? "not-allowed" : "pointer",
                          opacity: isProjectEnded ? 0.5 : 1,
                          "&:hover": {
                            bgcolor: isProjectEnded ? "transparent" : `${COLORS.green}25`,
                          },
                        }}
                      >
                        Unblock
                      </Button>
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "90px minmax(180px, 1fr) 90px 90px 80px 80px 90px 90px",
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
                "START",
                "END",
                "DURATION",
                "ACTIONS",
                "RAG",
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

            {weeklyPlanPreview.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
                  No activities with assigned actions for these weeks
                </Typography>
              </Box>
            ) : (
              weeklyPlanPreview.map((activity, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "90px minmax(180px, 1fr) 90px 90px 80px 80px 90px 90px",
                    gap: 2,
                    px: 3,
                    py: 2,
                    borderBottom:
                      index < weeklyPlanPreview.length - 1
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
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    {formatDate(activity.startDate)}
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    {formatDate(activity.finishDate)}
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    {activity.duration || "-"}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor: (activity.openActionsCount || 0) > 0 ? `${COLORS.amber}20` : `${COLORS.green}20`,
                        color: (activity.openActionsCount || 0) > 0 ? COLORS.amber : COLORS.green,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {activity.openActionsCount || 0}/{activity.actionsCount || 0}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor: "#2a2a3e",
                        border: `1px solid ${
                          activity.ragStatus === "Green"
                            ? COLORS.green
                            : activity.ragStatus === "Amber"
                              ? COLORS.amber
                              : COLORS.red
                        }40`,
                        color:
                          activity.ragStatus === "Green"
                            ? COLORS.green
                            : activity.ragStatus === "Amber"
                              ? COLORS.amber
                              : COLORS.red,
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
                            activity.ragStatus === "Green"
                              ? COLORS.green
                              : activity.ragStatus === "Amber"
                                ? COLORS.amber
                                : COLORS.red,
                        }}
                      />
                      {activity.ragStatus}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor:
                          activity.activityStatus === "Complete"
                            ? `${COLORS.blue}20`
                            : activity.activityStatus === "Ready"
                              ? `${COLORS.green}20`
                              : activity.activityStatus === "At Risk"
                                ? `${COLORS.amber}20`
                                : `${COLORS.red}20`,
                        color:
                          activity.activityStatus === "Complete"
                            ? COLORS.blue
                            : activity.activityStatus === "Ready"
                              ? COLORS.green
                              : activity.activityStatus === "At Risk"
                                ? COLORS.amber
                                : COLORS.red,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontWeight: 500,
                      }}
                    >
                      {activity.activityStatus || "Ready"}
                    </Box>
                  </Box>
                </Box>
              ))
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
                        onClick={() => onActionClick?.()}
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
                          !isProjectEnded && onAssignClick?.({
                            activityId: item.activityId,
                            activityName: item.activityName,
                          })
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
