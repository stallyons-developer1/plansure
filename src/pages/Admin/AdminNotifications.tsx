import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Checkbox,
} from "@mui/material";
import {
  CheckCircleOutlined as CheckIcon,
  DeleteOutlined as DeleteIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  date: string;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "New project assigned",
    message: "You have been assigned to Project Alpha. Please review the project details and start planning.",
    time: "2 min ago",
    date: "Today",
    read: false,
    type: "info",
  },
  {
    id: 2,
    title: "Action overdue",
    message: "Action #1234 is overdue by 2 days. Please take immediate action to resolve this issue.",
    time: "1 hour ago",
    date: "Today",
    read: false,
    type: "warning",
  },
  {
    id: 3,
    title: "Weekly report ready",
    message: "Your weekly governance report is ready for review. Click to view the detailed analysis.",
    time: "3 hours ago",
    date: "Today",
    read: false,
    type: "success",
  },
  {
    id: 4,
    title: "RAG status changed",
    message: "Project Beta status changed from Green to Amber. Review the constraints that caused this change.",
    time: "5 hours ago",
    date: "Today",
    read: true,
    type: "warning",
  },
  {
    id: 5,
    title: "New user registered",
    message: "A new planner user 'john.doe@company.com' has registered and is awaiting approval.",
    time: "Yesterday",
    date: "Yesterday",
    read: true,
    type: "info",
  },
  {
    id: 6,
    title: "System maintenance scheduled",
    message: "System maintenance is scheduled for this weekend. Please save your work before Saturday 10 PM.",
    time: "2 days ago",
    date: "Apr 20, 2026",
    read: true,
    type: "info",
  },
  {
    id: 7,
    title: "Export completed",
    message: "Your requested data export has been completed. Download link is available for the next 24 hours.",
    time: "3 days ago",
    date: "Apr 19, 2026",
    read: true,
    type: "success",
  },
];

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const handleDeleteSelected = () => {
    setNotifications(
      notifications.filter((n) => !selectedIds.includes(n.id))
    );
    setSelectedIds([]);
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return COLORS.amber;
      case "success":
        return COLORS.green;
      case "error":
        return COLORS.red;
      default:
        return COLORS.blue;
    }
  };

  const groupedNotifications = notifications.reduce(
    (acc, notification) => {
      const date = notification.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(notification);
      return acc;
    },
    {} as Record<string, Notification[]>
  );

  return (
    <AdminLayout
      title="Notifications"
      subtitle={`${unreadCount} unread notifications`}
    >
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        {/* Actions Bar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Checkbox
              checked={selectedIds.length === notifications.length && notifications.length > 0}
              indeterminate={selectedIds.length > 0 && selectedIds.length < notifications.length}
              onChange={handleSelectAll}
              sx={{
                color: COLORS.border,
                "&.Mui-checked, &.MuiCheckbox-indeterminate": {
                  color: COLORS.blue,
                },
              }}
            />
            <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
              {selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : "Select all"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {selectedIds.length > 0 && (
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                sx={{
                  color: COLORS.red,
                  textTransform: "none",
                  fontSize: "13px",
                  "&:hover": {
                    bgcolor: "rgba(239, 68, 68, 0.1)",
                  },
                }}
              >
                Delete selected
              </Button>
            )}
            <Button
              startIcon={<CheckIcon />}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              sx={{
                color: COLORS.blue,
                textTransform: "none",
                fontSize: "13px",
                "&:hover": {
                  bgcolor: "rgba(59, 130, 246, 0.1)",
                },
                "&.Mui-disabled": {
                  color: COLORS.textMuted,
                },
              }}
            >
              Mark all read
            </Button>
          </Box>
        </Box>

        {/* Notifications List */}
        {Object.entries(groupedNotifications).map(([date, items]) => (
          <Box key={date} sx={{ mb: 3 }}>
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 1.5,
                px: 1,
              }}
            >
              {date}
            </Typography>
            <Paper
              sx={{
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {items.map((notification, index) => (
                <Box
                  key={notification.id}
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    borderBottom:
                      index < items.length - 1
                        ? `1px solid ${COLORS.border}`
                        : "none",
                    bgcolor: notification.read
                      ? "transparent"
                      : "rgba(59, 130, 246, 0.05)",
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: COLORS.bgTertiary,
                    },
                  }}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(notification.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(notification.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: COLORS.border,
                      "&.Mui-checked": {
                        color: COLORS.blue,
                      },
                      mt: -0.5,
                    }}
                  />
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      bgcolor: getTypeColor(notification.type),
                      mt: 1.5,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontWeight: notification.read ? 400 : 600,
                          fontSize: "14px",
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                          sx={{
                            color: COLORS.textMuted,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {notification.time}
                        </Typography>
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: COLORS.blue,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "13px",
                        lineHeight: 1.5,
                      }}
                    >
                      {notification.message}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    sx={{
                      color: COLORS.textMuted,
                      "&:hover": {
                        color: COLORS.red,
                        bgcolor: "rgba(239, 68, 68, 0.1)",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Paper>
          </Box>
        ))}

        {notifications.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              color: COLORS.textMuted,
            }}
          >
            <Typography sx={{ fontSize: "16px", mb: 1 }}>
              No notifications
            </Typography>
            <Typography sx={{ fontSize: "14px" }}>
              You're all caught up!
            </Typography>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
};

export default AdminNotifications;
