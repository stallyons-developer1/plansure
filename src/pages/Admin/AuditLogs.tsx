import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Pagination,
} from "@mui/material";
import {
  Lock as LockIcon,
  Description as DescriptionIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import { auditAPI, userAPI } from "../../services/api";

interface AuditLog {
  _id: string;
  action: string;
  category: string;
  performedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  performedByName?: string;
  performedByEmail?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  project?: {
    _id: string;
    name: string;
  };
  description: string;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

const formatAction = (action: string) => {
  return action
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).replace(",", "");
};

const getEntityId = (log: AuditLog) => {
  if (log.resourceId) {
    const id = log.resourceId.toString();
    const prefix = log.resourceType?.slice(0, 3).toUpperCase() || "ID";
    return `${prefix}-${id.slice(-4).toUpperCase()}`;
  }
  return "-";
};

const categories = [
  { value: "", label: "All Events" },
  { value: "AUTH", label: "Authentication" },
  { value: "USER", label: "User Management" },
  { value: "PROJECT", label: "Project Management" },
  { value: "PROGRAMME", label: "Programme Management" },
  { value: "ACTIVITY", label: "Activity Management" },
  { value: "ACTION", label: "Action Management" },
  { value: "WEEK", label: "Week Management" },
  { value: "EXPORT", label: "Exports" },
  { value: "SYSTEM", label: "System" },
];

const entityTypes = [
  "All entity",
  "User",
  "Project",
  "Programme",
  "Activity",
  "Action",
  "Week",
  "Export",
  "System",
];

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });

  const [categoryFilter, setCategoryFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("All entity");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        category?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
      } = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (categoryFilter) params.category = categoryFilter;
      if (userFilter) params.userId = userFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await auditAPI.getLogs(params);
      if (response.success) {
        let filteredLogs = response.logs;

        // Client-side filter for entity type since backend doesn't support it
        if (entityTypeFilter !== "All entity") {
          filteredLogs = filteredLogs.filter(
            (log: AuditLog) => log.resourceType === entityTypeFilter
          );
        }

        setLogs(filteredLogs);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      if (response.success) {
        setUsers(response.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, categoryFilter, userFilter, entityTypeFilter, startDate, endDate]);

  const handleClear = () => {
    setCategoryFilter("");
    setUserFilter("");
    setEntityTypeFilter("All entity");
    setStartDate("");
    setEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Event Type", "Actor", "Entity Type", "Entity ID", "Description"];
    const rows = logs.map((log) => [
      formatTimestamp(log.createdAt),
      formatAction(log.action),
      log.performedByEmail || log.performedByName || "System",
      log.resourceType || "-",
      getEntityId(log),
      log.description,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            onClick={handleExportCSV}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              displayEmpty
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
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
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
              displayEmpty
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
              <MenuItem value="">All Users</MenuItem>
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.email}
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
            {pagination.total} events
          </Typography>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress sx={{ color: COLORS.blue }} />
          </Box>
        ) : logs.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
              No audit logs found
            </Typography>
          </Box>
        ) : (
          <>
            <Box>
              <Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "14% 14% 18% 12% 12% 30%",
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
                      textAlign: "center",
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
                      textAlign: "center",
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
                      textAlign: "center",
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
                      textAlign: "center",
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
                      textAlign: "center",
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
                      textAlign: "center",
                    }}
                  >
                    DESCRIPTION
                  </Typography>
                </Box>

                {logs.map((log, index) => (
                  <Box
                    key={log._id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "14% 14% 18% 12% 12% 30%",
                      px: 3,
                      py: 2,
                      borderBottom:
                        index < logs.length - 1
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
                        textAlign: "center",
                      }}
                    >
                      {formatTimestamp(log.createdAt)}
                    </Typography>
                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      {formatAction(log.action)}
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "14px", textAlign: "center" }}
                    >
                      {log.performedByEmail || log.performedByName || "System"}
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "14px", textAlign: "center" }}
                    >
                      {log.resourceType || "-"}
                    </Typography>
                    <Typography
                      sx={{
                        color: COLORS.blue,
                        fontSize: "13px",
                        fontFamily: "monospace",
                        textAlign: "center",
                      }}
                    >
                      {getEntityId(log)}
                    </Typography>
                    <Typography
                      sx={{ color: COLORS.textSecondary, fontSize: "14px", textAlign: "center" }}
                    >
                      {log.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {pagination.pages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 3,
                  borderTop: `1px solid ${COLORS.borderDark}`,
                }}
              >
                <Pagination
                  count={pagination.pages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      color: COLORS.textSecondary,
                      "&.Mui-selected": {
                        bgcolor: COLORS.blue,
                        color: "white",
                        "&:hover": {
                          bgcolor: COLORS.blue,
                        },
                      },
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default AuditLogs;
