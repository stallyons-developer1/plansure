import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  LockOutlined as LockIcon,
  LockOpenOutlined as UnlockIcon,
  CheckOutlined as CheckIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import PlannerLayout from "../../layouts/PlannerLayout";
import { COLORS } from "../../constants/colors";
import { exportAPI, projectAPI, programmeAPI } from "../../services/api";
import closeActionIcon from "../../assets/closeAction.png";
import activitiesIcon from "../../assets/activities.png";

interface Project {
  _id: string;
  name: string;
  phase: string;
  status: string;
}

interface ExportHistoryItem {
  _id: string;
  date: string;
  type: "Weekly Plan" | "Planner To-Do";
  week: string;
  generatedBy: string;
  status: "Complete" | "Pending" | "Failed";
  fileName?: string;
}

interface GatingStatus {
  isGated: boolean;
  cycleStatus: string;
  currentWeek: string;
}

interface ExportCounts {
  weeklyPlanTotal: number;
  outstandingActions: number;
  overdueActions: number;
  blockedActivities: number;
  greenActivities: number;
}

interface WeeklyActionStats {
  openRequired: number;
  total: number;
}

const PlannerExports = () => {
  // Project selection state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [programmeId, setProgrammeId] = useState<string>("");
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Gating and export state
  const [gatingStatus, setGatingStatus] = useState<GatingStatus>({
    isGated: true,
    cycleStatus: "",
    currentWeek: "N/A",
  });
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [exporting, setExporting] = useState<"weekly" | "todo" | null>(null);

  // Export counts and action stats (like Closure & Export tab)
  const [exportCounts, setExportCounts] = useState<ExportCounts>({
    weeklyPlanTotal: 0,
    outstandingActions: 0,
    overdueActions: 0,
    blockedActivities: 0,
    greenActivities: 0,
  });
  const [weeklyActionStats, setWeeklyActionStats] = useState<WeeklyActionStats>({
    openRequired: 0,
    total: 0,
  });

  const amberColor = "#F59E0B";
  const amberBg = "rgba(245, 158, 11, 0.15)";
  const greenColor = COLORS.green;
  const greenBg = "rgba(34, 197, 94, 0.15)";

  // Unlock exports when cycle reaches "Execution" or "Close-Out Eligible"
  const isExportAllowed = ["Execution", "Close-Out Eligible", "Approved", "Closed"].includes(gatingStatus.cycleStatus);
  const statusColor = isExportAllowed ? greenColor : amberColor;
  const statusBg = isExportAllowed ? greenBg : amberBg;

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const res = await projectAPI.getAll();
        if (res.success) {
          const projectsList = res.projects || [];
          setProjects(projectsList);
          // Select first project by default
          if (projectsList.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projectsList[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch programme when project changes
  useEffect(() => {
    const fetchProgramme = async () => {
      if (!selectedProjectId) {
        setProgrammeId("");
        setGatingStatus({
          isGated: true,
          cycleStatus: "",
          currentWeek: "N/A",
        });
        setExportHistory([]);
        return;
      }

      try {
        setLoadingData(true);
        const response = await programmeAPI.getByProject(selectedProjectId);
        if (response.success && response.programme) {
          setProgrammeId(response.programme._id);

          // Get cycle status from programme
          const cycleStatus = response.programme.cycleStatus || "Draft";

          // Get current week from weeks status
          let currentWeek = "W1";
          try {
            const weeksRes = await programmeAPI.getWeeksStatus(response.programme._id);
            if (weeksRes.success && weeksRes.weeks) {
              const firstOpenWeek = weeksRes.weeks.find((w: { status: string; weekNumber: number }) => w.status === "open");
              if (firstOpenWeek) {
                currentWeek = `W${firstOpenWeek.weekNumber}`;
              } else {
                const maxClosedWeek = Math.max(
                  ...weeksRes.weeks
                    .filter((w: { status: string }) => w.status === "closed")
                    .map((w: { weekNumber: number }) => w.weekNumber),
                  0
                );
                currentWeek = `W${maxClosedWeek + 1}`;
              }
            }
          } catch (e) {
            console.error("Error fetching weeks status:", e);
          }

          setGatingStatus({
            isGated: !["Execution", "Close-Out Eligible", "Approved", "Closed"].includes(cycleStatus),
            cycleStatus,
            currentWeek,
          });

          // Fetch weekly control data for export counts
          try {
            const wcRes = await programmeAPI.getWeeklyControl(response.programme._id);

            // Calculate export counts - access response directly (not through .weeklyControl)
            const greenActivities = wcRes.ragDistribution?.green || 0;
            const blockedActivities = wcRes.ragDistribution?.red || 0;

            // Outstanding actions for Planner To-Do = open + inProgress + overdue (from CURRENT 2 WEEKS only)
            // Use weeklyActionsByStatus which is filtered to current week's actions
            const outstandingActions =
              (wcRes.weeklyActionsByStatus?.open || 0) +
              (wcRes.weeklyActionsByStatus?.inProgress || 0) +
              (wcRes.weeklyActionsByStatus?.overdue || 0);

            const overdueActions = wcRes.actionsByStatus?.overdue || 0;
            const weeklyPlanTotal = greenActivities + (wcRes.weeklyPlanPreview?.length || 0);

            setExportCounts({
              weeklyPlanTotal,
              outstandingActions,
              overdueActions,
              blockedActivities,
              greenActivities,
            });

            // Calculate weekly action stats
            const openRequired = (wcRes.requiredActionsByStatus?.open || 0) + (wcRes.requiredActionsByStatus?.inProgress || 0);
            setWeeklyActionStats({
              openRequired,
              total: outstandingActions,
            });
          } catch (e) {
            console.error("Error fetching weekly control data:", e);
          }

          // Fetch export history for this programme/project
          await fetchExportHistory(response.programme._id);
        } else {
          setProgrammeId("");
          setGatingStatus({
            isGated: true,
            cycleStatus: "",
            currentWeek: "N/A",
          });
          setExportHistory([]);
        }
      } catch (error) {
        console.error("Error fetching programme:", error);
        setProgrammeId("");
        setGatingStatus({
          isGated: true,
          cycleStatus: "",
          currentWeek: "N/A",
        });
        setExportHistory([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchProgramme();
  }, [selectedProjectId]);

  const fetchExportHistory = async (progId: string) => {
    try {
      const historyRes = await exportAPI.getHistory(progId);
      if (historyRes.success) {
        setExportHistory(
          historyRes.exports.map((exp: ExportHistoryItem) => ({
            ...exp,
            date: new Date(exp.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching export history:", error);
      setExportHistory([]);
    }
  };

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProjectId(event.target.value);
  };

  const handleExportWeeklyPlan = async () => {
    if (!isExportAllowed || !programmeId) return;

    try {
      setExporting("weekly");
      const response = await exportAPI.generateWeeklyPlan(programmeId);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Weekly_Plan_${gatingStatus.currentWeek}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      // Refresh history after export
      await fetchExportHistory(programmeId);
    } catch (error) {
      console.error("Error exporting weekly plan:", error);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPlannerTodo = async () => {
    if (!isExportAllowed || !programmeId) return;

    try {
      setExporting("todo");
      const response = await exportAPI.generatePlannerTodo(programmeId);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Planner_ToDo_${gatingStatus.currentWeek}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      // Refresh history after export
      await fetchExportHistory(programmeId);
    } catch (error) {
      console.error("Error exporting planner todo:", error);
    } finally {
      setExporting(null);
    }
  };

  const handleDownload = async (id: string, fileName?: string) => {
    try {
      const response = await exportAPI.download(id);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "export.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading export:", error);
    }
  };

  // Project dropdown component
  const projectDropdown = (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <Select
        value={selectedProjectId}
        onChange={handleProjectChange}
        displayEmpty
        IconComponent={ArrowDownIcon}
        sx={{
          bgcolor: COLORS.bgSecondary,
          color: COLORS.textPrimary,
          borderRadius: "8px",
          border: `1px solid ${COLORS.border}`,
          fontSize: "14px",
          fontWeight: 500,
          "& .MuiOutlinedInput-notchedOutline": {
            border: "none",
          },
          "& .MuiSelect-icon": {
            color: COLORS.textSecondary,
          },
          "&:hover": {
            bgcolor: COLORS.bgTertiary,
          },
        }}
        MenuProps={{
          slotProps: {
            paper: {
              sx: {
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                mt: 1,
                "& .MuiMenuItem-root": {
                  color: COLORS.textPrimary,
                  fontSize: "14px",
                  "&:hover": {
                    bgcolor: COLORS.bgTertiary,
                  },
                  "&.Mui-selected": {
                    bgcolor: COLORS.blueBgMedium,
                    "&:hover": {
                      bgcolor: COLORS.blueBgMedium,
                    },
                  },
                },
              },
            },
          },
        }}
      >
        {projects.length === 0 ? (
          <MenuItem value="" disabled>
            No projects available
          </MenuItem>
        ) : (
          projects.map((project) => (
            <MenuItem key={project._id} value={project._id}>
              {project.name}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );

  if (loadingProjects) {
    return (
      <PlannerLayout title="Exports" subtitle="Weekly Plan and Planner To-Do exports">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      </PlannerLayout>
    );
  }

  return (
    <PlannerLayout
      title="Exports"
      subtitle="Weekly Plan and Planner To-Do exports"
      headerAction={projectDropdown}
    >
      {loadingData ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      ) : projects.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
            gap: 2,
          }}
        >
          <Typography sx={{ color: COLORS.textMuted, fontSize: "16px" }}>
            No projects found. Create a project first.
          </Typography>
        </Box>
      ) : !programmeId && selectedProjectId ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
            gap: 2,
          }}
        >
          <Typography sx={{ color: COLORS.textMuted, fontSize: "16px" }}>
            No programme uploaded for this project yet.
          </Typography>
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
            Upload a programme PDF to enable exports.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Export Gating Status */}
          <Box
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              p: 3,
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "8px",
                bgcolor: statusBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isExportAllowed ? (
                <UnlockIcon sx={{ color: statusColor, fontSize: 24 }} />
              ) : (
                <LockIcon sx={{ color: statusColor, fontSize: 24 }} />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
              >
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  Export Gating Status
                </Typography>
                <Box
                  sx={{
                    bgcolor: statusBg,
                    color: statusColor,
                    px: 1.5,
                    py: 0.25,
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: statusColor,
                    }}
                  />
                  {isExportAllowed ? "Unlocked" : "Gated"}
                </Box>
              </Box>
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
                {isExportAllowed ? (
                  <>
                    Exports are unlocked — Cycle is in{" "}
                    <Typography
                      component="span"
                      sx={{ color: COLORS.green, fontSize: "14px" }}
                    >
                      {gatingStatus.cycleStatus}
                    </Typography>{" "}
                    state. Ready to export.
                  </>
                ) : (
                  <>
                    Exports are gated — WeekCycle must be in{" "}
                    <Typography
                      component="span"
                      sx={{ color: COLORS.blue, fontSize: "14px" }}
                    >
                      Execution
                    </Typography>{" "}
                    or higher state. Current cycle is in{" "}
                    <Typography
                      component="span"
                      sx={{ color: COLORS.blue, fontSize: "14px" }}
                    >
                      {gatingStatus.cycleStatus || "N/A"}
                    </Typography>
                    .
                  </>
                )}
              </Typography>
            </Box>
          </Box>

          {/* Export Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              mb: 3,
            }}
          >
            {/* Weekly Plan Card */}
            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 3,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "8px",
                    bgcolor: "rgba(34, 197, 94, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={activitiesIcon}
                    sx={{
                      width: 20,
                      height: 26,
                      filter:
                        "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(531%) hue-rotate(93deg) brightness(92%) contrast(87%)",
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      Weekly Plan
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: !isExportAllowed
                          ? "rgba(239, 68, 68, 0.15)"
                          : weeklyActionStats.openRequired > 0
                            ? amberBg
                            : greenBg,
                        color: !isExportAllowed
                          ? COLORS.red
                          : weeklyActionStats.openRequired > 0
                            ? amberColor
                            : greenColor,
                        px: 1.5,
                        py: 0.25,
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        ml: "auto",
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: !isExportAllowed
                            ? COLORS.red
                            : weeklyActionStats.openRequired > 0
                              ? amberColor
                              : greenColor,
                        }}
                      />
                      {!isExportAllowed ? "Gated" : weeklyActionStats.openRequired > 0 ? "Pending" : "Ready"}
                    </Box>
                  </Box>
                  <Typography
                    sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
                  >
                    Actions + Activities (Completed/Blocked)
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textMuted, fontSize: "12px", mt: 0.5 }}
                  >
                    {exportCounts.weeklyPlanTotal} {exportCounts.weeklyPlanTotal === 1 ? "item" : "items"} to export
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  p: 2,
                  mb: 3,
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 1.5,
                  }}
                >
                  WHAT'S INCLUDE
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon sx={{ color: COLORS.green, fontSize: 18 }} />
                    <Typography
                      sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                    >
                      Green activities only
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon sx={{ color: COLORS.green, fontSize: 18 }} />
                    <Typography
                      sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                    >
                      All required actions closed
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Button
                onClick={handleExportWeeklyPlan}
                disabled={!isExportAllowed || weeklyActionStats.openRequired > 0 || exporting === "weekly"}
                startIcon={
                  exporting === "weekly" ? (
                    <CircularProgress size={14} sx={{ color: "inherit" }} />
                  ) : (
                    <Box
                      component="img"
                      src={closeActionIcon}
                      sx={{ width: 12, height: 15 }}
                    />
                  )
                }
                sx={{
                  bgcolor: isExportAllowed && weeklyActionStats.openRequired === 0 ? COLORS.green : COLORS.bgTertiary,
                  color: isExportAllowed && weeklyActionStats.openRequired === 0 ? COLORS.white : COLORS.textPrimary,
                  textTransform: "none",
                  py: 1.5,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: isExportAllowed && weeklyActionStats.openRequired === 0 ? "#16a34a" : COLORS.border,
                  },
                  "&:disabled": {
                    bgcolor: COLORS.bgTertiary,
                    color: COLORS.textMuted,
                  },
                }}
              >
                {!isExportAllowed
                  ? "Export Gated"
                  : weeklyActionStats.openRequired > 0
                    ? `${weeklyActionStats.openRequired} Required Actions Pending`
                    : exporting === "weekly"
                      ? "Exporting..."
                      : "Download Weekly Plan"}
              </Button>
            </Box>

            {/* Planner To-Do Card */}
            <Box
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                p: 3,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "8px",
                    bgcolor: "rgba(34, 197, 94, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={activitiesIcon}
                    sx={{
                      width: 20,
                      height: 26,
                      filter:
                        "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(531%) hue-rotate(93deg) brightness(92%) contrast(87%)",
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      Planner To-Do
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: !isExportAllowed
                          ? "rgba(239, 68, 68, 0.15)"
                          : exportCounts.outstandingActions === 0
                            ? "rgba(107, 114, 128, 0.15)"
                            : greenBg,
                        color: !isExportAllowed
                          ? COLORS.red
                          : exportCounts.outstandingActions === 0
                            ? COLORS.textMuted
                            : greenColor,
                        px: 1.5,
                        py: 0.25,
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        ml: "auto",
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: !isExportAllowed
                            ? COLORS.red
                            : exportCounts.outstandingActions === 0
                              ? COLORS.textMuted
                              : greenColor,
                        }}
                      />
                      {!isExportAllowed ? "Gated" : exportCounts.outstandingActions === 0 ? "Empty" : "Ready"}
                    </Box>
                  </Box>
                  <Typography
                    sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
                  >
                    Outstanding actions and planner follow-on items. A prioritised
                    task list for the planning team.
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textMuted, fontSize: "12px", mt: 0.5 }}
                  >
                    {exportCounts.outstandingActions} outstanding {exportCounts.outstandingActions === 1 ? "item" : "items"}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  p: 2,
                  mb: 3,
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    mb: 1.5,
                  }}
                >
                  WHAT'S INCLUDE
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon sx={{ color: COLORS.green, fontSize: 18 }} />
                    <Typography
                      sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                    >
                      All outstanding actions
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon sx={{ color: COLORS.green, fontSize: 18 }} />
                    <Typography
                      sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                    >
                      Overdue items
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon sx={{ color: COLORS.green, fontSize: 18 }} />
                    <Typography
                      sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                    >
                      Escalations
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Button
                onClick={handleExportPlannerTodo}
                disabled={!isExportAllowed || exportCounts.outstandingActions === 0 || exporting === "todo"}
                startIcon={
                  exporting === "todo" ? (
                    <CircularProgress size={14} sx={{ color: "inherit" }} />
                  ) : (
                    <Box
                      component="img"
                      src={closeActionIcon}
                      sx={{ width: 12, height: 15 }}
                    />
                  )
                }
                sx={{
                  bgcolor: isExportAllowed && exportCounts.outstandingActions > 0 ? COLORS.blue : COLORS.bgTertiary,
                  color: isExportAllowed && exportCounts.outstandingActions > 0 ? COLORS.white : COLORS.textMuted,
                  textTransform: "none",
                  py: 1.5,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: isExportAllowed && exportCounts.outstandingActions > 0 ? "#2563eb" : COLORS.bgTertiary,
                  },
                  "&:disabled": {
                    bgcolor: COLORS.bgTertiary,
                    color: COLORS.textMuted,
                  },
                }}
              >
                {!isExportAllowed
                  ? "Export Gated"
                  : exportCounts.outstandingActions === 0
                    ? "No Items to Export"
                    : exporting === "todo"
                      ? "Exporting..."
                      : "Export Planner To-Do"}
              </Button>
            </Box>
          </Box>

          {/* Export History */}
          <Box
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 3, py: 1, borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography
                sx={{
                  color: COLORS.blue,
                  fontSize: "16px",
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                Export History
              </Typography>
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
                Previously generated exports for this project
              </Typography>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 800 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
                    gap: 2,
                    px: 3,
                    py: 1.5,
                    borderBottom: `1px solid ${COLORS.border}`,
                    textAlign: "center",
                  }}
                >
                  {[
                    "DATE",
                    "TYPE",
                    "WEEK",
                    "GENERATED BY",
                    "STATUS",
                    "DOWNLOAD",
                  ].map((header) => (
                    <Typography
                      key={header}
                      sx={{
                        color: COLORS.textMuted,
                        fontSize: "12px",
                        fontWeight: 600,
                        textAlign: header === "DATE" ? "left" : "center",
                      }}
                    >
                      {header}
                    </Typography>
                  ))}
                </Box>

                {exportHistory.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
                      No exports yet. Generate your first export above.
                    </Typography>
                  </Box>
                ) : (
                  exportHistory.map((item) => (
                    <Box
                      key={item._id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
                        gap: 2,
                        px: 3,
                        py: 1,
                        borderBottom: `1px solid ${COLORS.border}`,
                        alignItems: "center",
                        justifyItems: "center",
                        "&:hover": { bgcolor: COLORS.bgTertiary },
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          justifySelf: "start",
                        }}
                      >
                        {item.date}
                      </Typography>

                      <Box
                        sx={{
                          border: `1px solid ${item.type === "Weekly Plan" ? COLORS.green : COLORS.blue}`,
                          color:
                            item.type === "Weekly Plan" ? COLORS.green : COLORS.blue,
                          px: 2,
                          py: 0.75,
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: 500,
                          width: "fit-content",
                          bgcolor: COLORS.bgTertiary,
                        }}
                      >
                        {item.type}
                      </Box>

                      <Typography
                        sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                      >
                        {item.week}
                      </Typography>

                      <Typography
                        sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
                      >
                        {item.generatedBy}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          border: `1px solid ${item.status === "Complete" ? COLORS.green : item.status === "Failed" ? COLORS.red : amberColor}`,
                          borderRadius: "20px",
                          px: 2,
                          py: 0.75,
                          width: "fit-content",
                          bgcolor: COLORS.bgTertiary,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: item.status === "Complete" ? COLORS.green : item.status === "Failed" ? COLORS.red : amberColor,
                          }}
                        />
                        <Typography
                          sx={{
                            color: item.status === "Complete" ? COLORS.green : item.status === "Failed" ? COLORS.red : amberColor,
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {item.status}
                        </Typography>
                      </Box>

                      <Box
                        onClick={() => handleDownload(item._id, item.fileName)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          cursor: "pointer",
                          color: COLORS.blue,
                          "&:hover": { opacity: 0.8 },
                        }}
                      >
                        <Box
                          component="img"
                          src={closeActionIcon}
                          sx={{
                            width: 12,
                            height: 15,
                            filter:
                              "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)",
                          }}
                        />
                        <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                          Download
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </>
      )}
    </PlannerLayout>
  );
};

export default PlannerExports;
