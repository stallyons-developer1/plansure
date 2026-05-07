import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { COLORS } from "../constants/colors";

interface BlockedActivity {
  id: string;
  name: string;
  rag: "Red" | "Amber";
  owner: string;
  blocker: string;
  linkedAction: string;
  status: "Open" | "Overdue";
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
}

interface PlannerToDoItem {
  activityId: string;
  activityName: string;
  ragStatus: string;
  owner: string;
  todoItem: string;
  priority: string;
  dueDate: string;
}

interface BlockedActivitiesTableProps {
  activities?: BlockedActivity[];
  weeklyPlanPreview?: WeeklyPlanActivity[];
  plannerToDo?: PlannerToDoItem[];
}

const BlockedActivitiesTable = ({
  activities = [],
  weeklyPlanPreview = [],
  plannerToDo = [],
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

        {/* Blocked / Risk Activities Tab */}
        {activeTab === 0 && (
          <>
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
                      "90px minmax(180px, 1fr) 80px 90px minmax(160px, 1fr) 110px 90px",
                    gap: 2,
                    px: 3,
                    py: 2,
                    borderBottom:
                      index < activities.length - 1
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
                            activity.rag === "Red" ? COLORS.red : COLORS.amber,
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
                      color: activity.rag === "Red" ? COLORS.red : COLORS.amber,
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
                      fontWeight: 400,
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
              ))
            )}
          </>
        )}

        {/* Weekly Plan Preview Tab */}
        {activeTab === 1 && (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "90px minmax(180px, 1fr) 100px 90px 90px 80px 80px 90px",
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
                "WEEK ZONE",
                "START",
                "END",
                "DURATION",
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
                  No activities in weekly plan
                </Typography>
              </Box>
            ) : (
              weeklyPlanPreview.map((activity, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "90px minmax(180px, 1fr) 100px 90px 90px 80px 80px 90px",
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
                      color: COLORS.blue,
                      fontSize: "12px",
                      fontWeight: 500,
                      textAlign: "center",
                    }}
                  >
                    {activity.weekZone || "-"}
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

        {/* Planner To-Do Tab */}
        {activeTab === 2 && (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "90px minmax(180px, 1fr) 80px 90px minmax(150px, 1fr) 80px 90px",
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
                "TO-DO ITEM",
                "PRIORITY",
                "DUE DATE",
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
                  No to-do items
                </Typography>
              </Box>
            ) : (
              plannerToDo.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "90px minmax(180px, 1fr) 80px 90px minmax(150px, 1fr) 80px 90px",
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
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    {item.activityId}
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 400,
                      textAlign: "center",
                    }}
                  >
                    {item.activityName}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor:
                          item.ragStatus === "Red"
                            ? `${COLORS.red}25`
                            : item.ragStatus === "Amber"
                              ? `${COLORS.amber}25`
                              : `${COLORS.green}25`,
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
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "14px",
                      fontWeight: 400,
                      textAlign: "center",
                    }}
                  >
                    {item.owner || "-"}
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 400,
                      textAlign: "center",
                    }}
                  >
                    {item.todoItem}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        bgcolor:
                          item.priority === "High"
                            ? `${COLORS.red}20`
                            : `${COLORS.amber}20`,
                        color:
                          item.priority === "High" ? COLORS.red : COLORS.amber,
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
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    {formatDate(item.dueDate)}
                  </Typography>
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
