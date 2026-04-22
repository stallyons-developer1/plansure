import { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  AccessTime as ClockIcon,
  Warning as WarningIcon,
  ArrowUpward as ArrowUpIcon,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";
import { COLORS } from "../constants/colors";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  badge?: {
    text: string;
    color: string;
  };
}

const ClosureOverridePanel = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "planner-review", label: "Planner Review Complete", checked: true },
    { id: "planner-todo", label: "Planner To-Do Generated", checked: false },
    {
      id: "overdue-actions",
      label: "Overdue Actions",
      checked: false,
      badge: { text: "3 remaining", color: COLORS.red },
    },
    {
      id: "blocked-activities",
      label: "Blocked Activities Acknowledged",
      checked: false,
    },
  ]);

  const handleCheckboxChange = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

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
            {checklist.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box
                  onClick={() => handleCheckboxChange(item.id)}
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "5px",
                    bgcolor: item.checked ? COLORS.green : "transparent",
                    border: item.checked
                      ? "none"
                      : `2px solid ${COLORS.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {item.checked && (
                    <Box
                      component="svg"
                      viewBox="0 0 24 24"
                      sx={{ width: 14, height: 14, color: COLORS.white }}
                    >
                      <path
                        fill="currentColor"
                        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                      />
                    </Box>
                  )}
                </Box>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                >
                  {item.label}
                </Typography>
                {item.badge && (
                  <Box
                    sx={{
                      bgcolor: `${item.badge.color}20`,
                      color: item.badge.color,
                      px: 1.5,
                      py: 0.25,
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {item.badge.text}
                  </Box>
                )}
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: COLORS.green,
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
              <ClockIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                Close Week
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: COLORS.green,
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
              <WarningIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                PM Override
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "transparent",
                border: `1px solid ${COLORS.red}`,
                color: COLORS.red,
                px: 3,
                py: 1.25,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: `${COLORS.red}10`,
                },
              }}
            >
              <ArrowUpIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                PM Override
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

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
        <LockOpenIcon sx={{ color: COLORS.amber, fontSize: 24 }} />
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
            Week 24 is still open for edits.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ClosureOverridePanel;
