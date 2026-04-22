import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  Lock as LockIcon,
  Description as DescriptionIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";

interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  actor: string;
  entityType: string;
  entityId: string;
  description: string;
}

const auditEvents: AuditEvent[] = [
  {
    id: "1",
    timestamp: "2026-04-22 09:30:15",
    eventType: "User Login",
    actor: "j.whitfield@plansure.io",
    entityType: "User",
    entityId: "USR-001",
    description: "Successful authentication",
  },
  {
    id: "2",
    timestamp: "2026-04-22 09:25:00",
    eventType: "Programme Upload",
    actor: "k.rashid@plansure.io",
    entityType: "Programme",
    entityId: "PRG-047",
    description: "Week 47 programme uploaded",
  },
  {
    id: "3",
    timestamp: "2026-04-22 09:15:30",
    eventType: "Activity Update",
    actor: "s.mitchell@plansure.io",
    entityType: "Activity",
    entityId: "ACT-1042",
    description: "RAG status changed: Amber → Green",
  },
  {
    id: "4",
    timestamp: "2026-04-22 09:00:00",
    eventType: "User Created",
    actor: "j.whitfield@plansure.io",
    entityType: "User",
    entityId: "USR-007",
    description: "New user: e.rodriguez@plansure.io",
  },
  {
    id: "5",
    timestamp: "2026-04-22 08:45:20",
    eventType: "Action Closed",
    actor: "d.chen@plansure.io",
    entityType: "Action",
    entityId: "ACN-0052",
    description: "Action marked as complete",
  },
  {
    id: "6",
    timestamp: "2026-04-22 08:30:00",
    eventType: "Settings Changed",
    actor: "j.whitfield@plansure.io",
    entityType: "Project",
    entityId: "PRJ-001",
    description: "Notification settings updated",
  },
  {
    id: "7",
    timestamp: "2026-04-22 08:15:45",
    eventType: "User Logout",
    actor: "r.nguyen@plansure.io",
    entityType: "User",
    entityId: "USR-006",
    description: "Session ended",
  },
  {
    id: "8",
    timestamp: "2026-04-21 17:30:00",
    eventType: "Week Closed",
    actor: "k.rashid@plansure.io",
    entityType: "Week",
    entityId: "WK-046",
    description: "Week 46 closed with PM Override",
  },
  {
    id: "9",
    timestamp: "2026-04-21 16:45:30",
    eventType: "Export Generated",
    actor: "s.mitchell@plansure.io",
    entityType: "Report",
    entityId: "RPT-089",
    description: "Governance PDF exported",
  },
  {
    id: "10",
    timestamp: "2026-04-21 15:00:00",
    eventType: "Role Changed",
    actor: "j.whitfield@plansure.io",
    entityType: "User",
    entityId: "USR-004",
    description: "Role updated: User → Planner",
  },
  {
    id: "11",
    timestamp: "2026-04-21 14:30:00",
    eventType: "Activity Created",
    actor: "k.rashid@plansure.io",
    entityType: "Activity",
    entityId: "ACT-1050",
    description: "New activity added to Week 47",
  },
  {
    id: "12",
    timestamp: "2026-04-21 13:15:00",
    eventType: "Action Created",
    actor: "d.chen@plansure.io",
    entityType: "Action",
    entityId: "ACN-0055",
    description: "New action assigned to J. Smith",
  },
  {
    id: "13",
    timestamp: "2026-04-21 12:00:00",
    eventType: "Project Updated",
    actor: "j.whitfield@plansure.io",
    entityType: "Project",
    entityId: "PRJ-002",
    description: "Project phase changed to Delivery",
  },
  {
    id: "14",
    timestamp: "2026-04-21 10:30:00",
    eventType: "User Login",
    actor: "e.rodriguez@plansure.io",
    entityType: "User",
    entityId: "USR-005",
    description: "Successful authentication",
  },
  {
    id: "15",
    timestamp: "2026-04-21 09:00:00",
    eventType: "System Backup",
    actor: "system",
    entityType: "System",
    entityId: "SYS-001",
    description: "Daily backup completed",
  },
];

const eventTypes = [
  "All Events",
  "User Login",
  "User Logout",
  "Programme Upload",
  "Activity Update",
  "Activity Created",
  "Action Created",
  "Action Closed",
  "User Created",
  "Role Changed",
  "Settings Changed",
  "Week Closed",
  "Export Generated",
  "Project Updated",
  "System Backup",
];
const users = [
  "All Users",
  "j.whitfield@plansure.io",
  "k.rashid@plansure.io",
  "s.mitchell@plansure.io",
  "d.chen@plansure.io",
  "r.nguyen@plansure.io",
  "e.rodriguez@plansure.io",
  "system",
];
const entityTypes = [
  "All entity",
  "User",
  "Programme",
  "Activity",
  "Action",
  "Project",
  "Week",
  "Report",
  "System",
];

const AuditLogs = () => {
  const [eventTypeFilter, setEventTypeFilter] = useState("All Events");
  const [userFilter, setUserFilter] = useState("All Users");
  const [entityTypeFilter, setEntityTypeFilter] = useState("All entity");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleClear = () => {
    setEventTypeFilter("All Events");
    setUserFilter("All Users");
    setEntityTypeFilter("All entity");
    setStartDate("");
    setEndDate("");
  };

  return (
    <AdminLayout
      title="Audit Logs"
      subtitle="Immutable system event history"
      headerAction={
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: COLORS.blue,
              fontSize: "14px",
              bgcolor: COLORS.blueBgLight,
              borderRadius: "20px",
              height: "30px",
              px: 1,
            }}
          >
            <LockIcon sx={{ fontSize: 12 }} />
            <Typography sx={{ fontSize: "10px", fontWeight: 500 }}>
              Append-Only
            </Typography>
          </Box>
          <Button
            startIcon={<DescriptionIcon />}
            sx={{
              bgcolor: COLORS.bgSecondary,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            Export CSV
          </Button>
        </Box>
      }
    >
      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          p: 3,
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "2fr 1fr 1fr 1fr auto",
            },
            gap: { xs: 2, md: 3 },
            alignItems: "end",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                mb: 1,
              }}
            >
              DATE RANGE
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: { xs: "wrap", sm: "nowrap" },
              }}
            >
              <TextField
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="mm/dd/yyyy"
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: COLORS.border,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.border,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.blue,
                      borderWidth: 1,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: startDate ? COLORS.textPrimary : COLORS.textMuted,
                    fontSize: "14px",
                    py: 1.25,
                    px: 2,
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(0.5)",
                      cursor: "pointer",
                    },
                  },
                }}
              />
              <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
                to
              </Typography>
              <TextField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="mm/dd/yyyy"
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: COLORS.border,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.border,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.blue,
                      borderWidth: 1,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: endDate ? COLORS.textPrimary : COLORS.textMuted,
                    fontSize: "14px",
                    py: 1.25,
                    px: 2,
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(0.5)",
                      cursor: "pointer",
                    },
                  },
                }}
              />
            </Box>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                mb: 1,
              }}
            >
              EVENT TYPE
            </Typography>
            <Select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              IconComponent={ArrowDownIcon}
              sx={{
                width: "100%",
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
                  px: 2,
                },
                "& .MuiSvgIcon-root": {
                  color: COLORS.textMuted,
                },
              }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      bgcolor: COLORS.bgPrimary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      mt: 0.5,
                      maxHeight: 300,
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
              {eventTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                mb: 1,
              }}
            >
              USER
            </Typography>
            <Select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              IconComponent={ArrowDownIcon}
              sx={{
                width: "100%",
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
                  px: 2,
                },
                "& .MuiSvgIcon-root": {
                  color: COLORS.textMuted,
                },
              }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      bgcolor: COLORS.bgPrimary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      mt: 0.5,
                      maxHeight: 300,
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
              {users.map((user) => (
                <MenuItem key={user} value={user}>
                  {user}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                mb: 1,
              }}
            >
              ENTITY TYPE
            </Typography>
            <Select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              IconComponent={ArrowDownIcon}
              sx={{
                width: "100%",
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
                  px: 2,
                },
                "& .MuiSvgIcon-root": {
                  color: COLORS.textMuted,
                },
              }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      bgcolor: COLORS.bgPrimary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      mt: 0.5,
                      maxHeight: 300,
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
              {entityTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Button
            onClick={handleClear}
            sx={{
              bgcolor: COLORS.bgPrimary,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
              textTransform: "none",
              px: 3,
              py: 1.25,
              borderRadius: "8px",
              fontSize: "14px",
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.borderDark}`,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1.5, sm: 0 },
            p: 3,
            borderBottom: `1px solid ${COLORS.borderDark}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Event Log
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: `${COLORS.blue}15`,
                color: COLORS.blue,
                px: 1.5,
                py: 0.5,
                borderRadius: "10px",
                fontSize: "12px",
              }}
            >
              <LockIcon sx={{ fontSize: 14 }} />
              Immutable · Append-Only
            </Box>
          </Box>
          <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
            {auditEvents.length} events
          </Typography>
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 900 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "150px 140px 200px 110px 100px 1fr",
                gap: 2,
                px: 3,
                py: 2,
                borderBottom: `1px solid ${COLORS.borderDark}`,
                bgcolor: COLORS.bgTertiary,
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                TIMESTAMP
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                EVENT TYPE
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                ACTOR
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                ENTITY TYPE
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                ENTITY ID
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                DESCRIPTION
              </Typography>
            </Box>

            {auditEvents.map((event, index) => (
              <Box
                key={event.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "150px 140px 200px 110px 100px 1fr",
                  gap: 2,
                  px: 3,
                  py: 2,
                  borderBottom:
                    index < auditEvents.length - 1
                      ? `1px solid ${COLORS.borderDark}`
                      : "none",
                  alignItems: "center",
                  "&:hover": {
                    bgcolor: COLORS.bgTertiary,
                  },
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "13px",
                    fontFamily: "monospace",
                  }}
                >
                  {event.timestamp}
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {event.eventType}
                </Typography>
                <Typography
                  sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
                >
                  {event.actor}
                </Typography>
                <Typography
                  sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
                >
                  {event.entityType}
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.blue,
                    fontSize: "13px",
                    fontFamily: "monospace",
                  }}
                >
                  {event.entityId}
                </Typography>
                <Typography
                  sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
                >
                  {event.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default AuditLogs;
