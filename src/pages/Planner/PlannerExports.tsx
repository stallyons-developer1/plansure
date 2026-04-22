import { Box, Typography, Button } from "@mui/material";
import {
  LockOutlined as LockIcon,
  CheckOutlined as CheckIcon,
} from "@mui/icons-material";
import PlannerLayout from "../../layouts/PlannerLayout";
import { COLORS } from "../../constants/colors";
import closeActionIcon from "../../assets/closeAction.png";
import activitiesIcon from "../../assets/activities.png";

interface ExportHistoryItem {
  date: string;
  type: "Weekly Plan" | "Planner To-Do";
  week: string;
  generatedBy: string;
  status: "Complete" | "Pending" | "Failed";
}

const exportHistoryData: ExportHistoryItem[] = [
  {
    date: "14 Mar 2026",
    type: "Weekly Plan",
    week: "W46",
    generatedBy: "Kamran R.",
    status: "Complete",
  },
  {
    date: "14 Mar 2026",
    type: "Planner To-Do",
    week: "W46",
    generatedBy: "Kamran R.",
    status: "Complete",
  },
  {
    date: "07 Mar 2026",
    type: "Weekly Plan",
    week: "W45",
    generatedBy: "Sarah M.",
    status: "Complete",
  },
  {
    date: "07 Mar 2026",
    type: "Planner To-Do",
    week: "W45",
    generatedBy: "Sarah M.",
    status: "Complete",
  },
  {
    date: "28 Feb 2026",
    type: "Weekly Plan",
    week: "W44",
    generatedBy: "Kamran R.",
    status: "Complete",
  },
  {
    date: "28 Feb 2026",
    type: "Planner To-Do",
    week: "W44",
    generatedBy: "David C.",
    status: "Complete",
  },
];

const PlannerExports = () => {
  const amberColor = "#F59E0B";
  const amberBg = "rgba(245, 158, 11, 0.15)";

  return (
    <PlannerLayout
      title="Exports"
      subtitle="Weekly Plan and Planner To-Do exports"
    >
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
            bgcolor: amberBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LockIcon sx={{ color: amberColor, fontSize: 24 }} />
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
                bgcolor: amberBg,
                color: amberColor,
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
                  bgcolor: amberColor,
                }}
              />
              Gated
            </Box>
          </Box>
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
            Exports are gated — WeekCycle must be in{" "}
            <Typography
              component="span"
              sx={{ color: COLORS.blue, fontSize: "14px" }}
            >
              Close-Out Eligible
            </Typography>{" "}
            state. Current cycle is in{" "}
            <Typography
              component="span"
              sx={{ color: COLORS.blue, fontSize: "14px" }}
            >
              Execution
            </Typography>
            .
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
                    bgcolor: amberBg,
                    color: amberColor,
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
                      bgcolor: amberColor,
                    }}
                  />
                  Gated
                </Box>
              </Box>
              <Typography
                sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
              >
                Green activities with zero open required actions. The definitive
                weekly delivery plan for field teams.
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
            startIcon={
              <Box
                component="img"
                src={closeActionIcon}
                sx={{ width: 12, height: 15 }}
              />
            }
            sx={{
              bgcolor: COLORS.bgTertiary,
              color: COLORS.textPrimary,
              textTransform: "none",
              py: 1.5,
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor: COLORS.border,
              },
            }}
          >
            Close Action
          </Button>
        </Box>

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
                    bgcolor: amberBg,
                    color: amberColor,
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
                      bgcolor: amberColor,
                    }}
                  />
                  Gated
                </Box>
              </Box>
              <Typography
                sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
              >
                Outstanding actions and planner follow-on items. A prioritised
                task list for the planning team.
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
            startIcon={
              <Box
                component="img"
                src={closeActionIcon}
                sx={{ width: 12, height: 15 }}
              />
            }
            sx={{
              bgcolor: COLORS.bgTertiary,
              color: COLORS.textPrimary,
              textTransform: "none",
              py: 1.5,
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor: COLORS.border,
              },
            }}
          >
            Export Gated
          </Button>
        </Box>
      </Box>

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
            Previously generated exports
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

            {exportHistoryData.map((item, index) => (
              <Box
                key={index}
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
                    border: `1px solid ${COLORS.green}`,
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
                      bgcolor: COLORS.green,
                    }}
                  />
                  <Typography
                    sx={{
                      color: COLORS.green,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {item.status}
                  </Typography>
                </Box>

                <Box
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
            ))}
          </Box>
        </Box>
      </Box>
    </PlannerLayout>
  );
};

export default PlannerExports;
