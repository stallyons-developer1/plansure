import { Box, Typography, CircularProgress, TextField, Button } from "@mui/material";
import {
  AccessTime as ClockIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { COLORS } from "../constants/colors";

interface ClosureOverridePanelProps {
  cycleStatus?: string;
  overdueActions?: number;
  blockedActivities?: number;
  outstandingActions?: number;
  openRequiredActions?: number;
  weekNumber?: number;
  canClose?: boolean;
  canCloseReason?: string;
  isProjectEnded?: boolean;
  isWeekClosed?: boolean;
  isClosing?: boolean;
  onCloseWeek?: () => void;
  onPMOverride?: () => void;
  onGoToActions?: () => void;
  // Cycle action handlers
  onOpenMeeting?: () => void;
  onStartExecution?: () => void;
  // PM Override modal props
  showOverrideModal?: boolean;
  overrideReason?: string;
  onOverrideReasonChange?: (reason: string) => void;
  onConfirmOverride?: () => void;
  onCancelOverride?: () => void;
}

const ClosureOverridePanel = ({
  cycleStatus = "",
  overdueActions = 0,
  blockedActivities = 0,
  outstandingActions = 0,
  openRequiredActions = 0,
  weekNumber = 1,
  canClose = false,
  canCloseReason = "",
  isProjectEnded = false,
  isWeekClosed = false,
  isClosing = false,
  onCloseWeek,
  onPMOverride,
  onGoToActions,
  onOpenMeeting,
  onStartExecution,
  showOverrideModal = false,
  overrideReason = "",
  onOverrideReasonChange,
  onConfirmOverride,
  onCancelOverride,
}: ClosureOverridePanelProps) => {
  // Same logic as Closure & Export tab
  const closureChecklist = {
    // Planner review complete: checked at Meeting Open and remains checked in subsequent stages
    plannerReview: ["Meeting Open", "Execution", "Close-Out Eligible", "Closed"].includes(cycleStatus),
    // To-do list generated: checked when there are pending actions
    todoGenerated: outstandingActions > 0,
    // Overdue acknowledged: checked when no overdue actions
    overdueAcknowledged: overdueActions === 0,
    // Blocked acknowledged: checked when no blocked activities
    blockedAcknowledged: blockedActivities === 0,
  };

  const checklistItems = [
    {
      key: "plannerReview",
      label: "Planner review complete",
      extra: null,
      extraColor: null,
    },
    {
      key: "todoGenerated",
      label: "Planner to-do list generated",
      extra: null,
      extraColor: null,
    },
    {
      key: "overdueAcknowledged",
      label: "Overdue actions acknowledged",
      extra: overdueActions > 0 ? `(${overdueActions} overdue)` : null,
      extraColor: COLORS.red,
    },
    {
      key: "blockedAcknowledged",
      label: "Blocked activities acknowledged",
      extra: blockedActivities > 0 ? `(${blockedActivities} blocked)` : null,
      extraColor: COLORS.red,
    },
  ];

  // Determine if we're in execution mode (same logic as Weekly Control)
  const isExecution = cycleStatus === "Execution";
  const isCloseOutEligible = cycleStatus === "Close-Out Eligible";
  const isClosed = cycleStatus === "Closed" || isWeekClosed;
  const hasOpenRequiredActions = openRequiredActions > 0;

  // Show close button: in execution mode with no open required actions, or close-out eligible
  const showCloseButton = (isExecution && !hasOpenRequiredActions) || isCloseOutEligible;

  // Show PM Override: in execution mode with open required actions
  const showPMOverride = isExecution && hasOpenRequiredActions;

  return (
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
          fontSize: "16px",
          fontWeight: 600,
          mb: 3,
        }}
      >
        Closure & Override Panel
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 4, md: 8 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              color: COLORS.textMuted,
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              mb: 2,
            }}
          >
            CLOSURE READINESS CHECKLIST
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {checklistItems.map((item) => (
              <Box
                key={item.key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: closureChecklist[item.key as keyof typeof closureChecklist]
                      ? "2px solid #fff"
                      : "2px solid #94A3B8",
                    bgcolor: closureChecklist[item.key as keyof typeof closureChecklist]
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

        <Box>
          <Typography
            sx={{
              color: COLORS.textMuted,
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              mb: 2,
            }}
          >
            WEEK ACTIONS
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {/* Closed state - show locked message */}
            {isClosed ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "rgba(107, 114, 128, 0.1)",
                  border: `1px solid ${COLORS.textMuted}`,
                  color: COLORS.textMuted,
                  px: 3,
                  py: 1.25,
                  borderRadius: "8px",
                }}
              >
                <LockIcon sx={{ fontSize: 20 }} />
                <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                  Week Locked
                </Typography>
              </Box>
            ) : isProjectEnded ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "rgba(107, 114, 128, 0.1)",
                  border: `1px solid ${COLORS.textMuted}`,
                  color: COLORS.textMuted,
                  px: 3,
                  py: 1.25,
                  borderRadius: "8px",
                }}
              >
                <LockIcon sx={{ fontSize: 20 }} />
                <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                  Project Ended
                </Typography>
              </Box>
            ) : (
              <>
                {/* Close Week button - shown when ready to close */}
                {showCloseButton && (
                  <Box
                    onClick={() => !isClosing && onCloseWeek?.()}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      bgcolor: canClose ? COLORS.green : COLORS.bgTertiary,
                      color: canClose ? COLORS.white : COLORS.textMuted,
                      px: 3,
                      py: 1.25,
                      borderRadius: "8px",
                      cursor: canClose && !isClosing ? "pointer" : "not-allowed",
                      opacity: canClose && !isClosing ? 1 : 0.6,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        opacity: canClose && !isClosing ? 0.9 : 0.6,
                      },
                    }}
                  >
                    {isClosing ? (
                      <CircularProgress size={18} sx={{ color: "#fff" }} />
                    ) : (
                      <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                        Close Week
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Open required actions warning and buttons */}
                {showPMOverride && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Warning box with clock icon */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        bgcolor: "rgba(245, 158, 11, 0.1)",
                        border: `1px solid ${COLORS.amber}`,
                        borderRadius: "8px",
                        px: 2,
                        py: 1.5,
                      }}
                    >
                      <ClockIcon sx={{ color: COLORS.amber, fontSize: 20 }} />
                      <Typography sx={{ color: COLORS.amber, fontSize: "14px" }}>
                        {openRequiredActions} open required action(s) need to be completed before closing.
                      </Typography>
                    </Box>
                    {/* Buttons row */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box
                        onClick={() => onGoToActions?.()}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          bgcolor: COLORS.blue,
                          color: COLORS.white,
                          px: 3,
                          py: 1.25,
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            opacity: 0.9,
                          },
                        }}
                      >
                        <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                          Go to Actions
                        </Typography>
                      </Box>
                      <Box
                        onClick={() => onPMOverride?.()}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          bgcolor: "transparent",
                          border: `1px solid ${COLORS.amber}`,
                          color: COLORS.amber,
                          px: 3,
                          py: 1.25,
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: `${COLORS.amber}10`,
                          },
                        }}
                      >
                        <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                          PM Override
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Open Meeting button - shown when in Draft or Uploaded status */}
                {(cycleStatus === "Draft" || cycleStatus === "Uploaded") && (
                  <Box
                    onClick={() => onOpenMeeting?.()}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      bgcolor: COLORS.blue,
                      color: COLORS.white,
                      px: 3,
                      py: 1.25,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        opacity: 0.9,
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                      Open Meeting
                    </Typography>
                  </Box>
                )}

                {/* Start Execution button - shown when in Meeting Open status */}
                {cycleStatus === "Meeting Open" && (
                  <Box
                    onClick={() => onStartExecution?.()}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      bgcolor: COLORS.blue,
                      color: COLORS.white,
                      px: 3,
                      py: 1.25,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        opacity: 0.9,
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                      Start Execution
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Show reason why close is not available */}
          {!isClosed && !isProjectEnded && canCloseReason && !canClose && isExecution && (
            <Typography
              sx={{
                color: COLORS.red,
                fontSize: "11px",
                mt: 1.5,
              }}
            >
              {canCloseReason}
            </Typography>
          )}

                  </Box>
      </Box>

      {/* PM Override Form - shown when showOverrideModal is true */}
      {showOverrideModal && (
        <Box
          sx={{
            mt: 3,
            bgcolor: "#2D2A24",
            border: `1px solid ${COLORS.amber}`,
            borderRadius: "8px",
            p: 2,
          }}
        >
          <Typography
            sx={{
              color: COLORS.amber,
              fontSize: "14px",
              fontWeight: 600,
              mb: 1,
            }}
          >
            PM Override — Force Close Week {weekNumber}
          </Typography>
          <Typography
            sx={{
              color: COLORS.textSecondary,
              fontSize: "13px",
              mb: 2,
            }}
          >
            Enter a mandatory reason (min 10 characters) to close this week despite incomplete actions.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Enter justification for override..."
            value={overrideReason}
            onChange={(e) => onOverrideReasonChange?.(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                bgcolor: COLORS.bgSecondary,
                borderRadius: "8px",
                "& fieldset": { borderColor: COLORS.border },
                "&:hover fieldset": {
                  borderColor: COLORS.amber,
                },
                "&.Mui-focused fieldset": {
                  borderColor: COLORS.amber,
                },
              },
              "& .MuiInputBase-input": {
                color: COLORS.textPrimary,
                fontSize: "14px",
              },
            }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={onConfirmOverride}
              disabled={overrideReason.length < 10 || isClosing}
              sx={{
                bgcolor: COLORS.amber,
                color: "#fff",
                textTransform: "none",
                px: 3,
                py: 1,
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                "&:hover": { bgcolor: "#d97706" },
                "&.Mui-disabled": {
                  bgcolor: COLORS.bgTertiary,
                  color: COLORS.textMuted,
                },
              }}
            >
              {isClosing ? (
                <CircularProgress size={18} sx={{ color: "#fff" }} />
              ) : (
                "Force Close Week"
              )}
            </Button>
            <Button
              onClick={onCancelOverride}
              sx={{
                bgcolor: "transparent",
                color: COLORS.textSecondary,
                border: `1px solid ${COLORS.border}`,
                textTransform: "none",
                px: 3,
                py: 1,
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                "&:hover": { bgcolor: COLORS.bgTertiary },
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* Week status indicator */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: COLORS.bgTertiary,
          borderRadius: "8px",
          p: 2,
          mt: 3,
          maxWidth: { xs: "100%", md: "50%" },
        }}
      >
        {isClosed ? (
          <>
            <LockIcon sx={{ color: COLORS.green, fontSize: 24 }} />
            <Box>
              <Typography
                sx={{
                  color: COLORS.green,
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Week Closed
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "13px",
                }}
              >
                Week {weekNumber} is closed and locked.
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <ClockIcon sx={{ color: COLORS.amber, fontSize: 24 }} />
            <Box>
              <Typography
                sx={{
                  color: COLORS.amber,
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Week Unlocked
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "13px",
                }}
              >
                Week {weekNumber} is still open for edits.
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ClosureOverridePanel;
