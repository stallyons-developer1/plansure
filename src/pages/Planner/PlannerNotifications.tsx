import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircleOutlined as CheckIcon,
  DeleteOutlined as DeleteIcon,
} from "@mui/icons-material";
import PlannerLayout from "../../layouts/PlannerLayout";
import { COLORS } from "../../constants/colors";
import { notificationAPI } from "../../services/api";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender?: { name: string };
  project?: { _id: string; name: string };
  programme?: {
    _id: string;
    name: string;
    project?: { _id: string; name: string };
  };
}

const PlannerNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationAPI.getAll(100, false);
      if (response.success) {
        setNotifications(response.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    const projectId =
      notification.project?._id || notification.programme?.project?._id;

    if (projectId) {
      navigate(`/planner/projects/${projectId}?tab=actions&t=${Date.now()}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(notifications.filter((n) => n._id !== id));
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(selectedIds.map((id) => notificationAPI.delete(id)));
      setNotifications(
        notifications.filter((n) => !selectedIds.includes(n._id)),
      );
      setSelectedIds([]);
    } catch (error) {
      console.error("Failed to delete notifications:", error);
    }
  };

  const handleToggleSelect = (id: string) => {
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
      setSelectedIds(notifications.map((n) => n._id));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "action_assigned":
        return COLORS.blue;
      case "action_reassigned":
        return COLORS.amber;
      case "action_completed":
        return COLORS.green;
      default:
        return COLORS.blue;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const groupedNotifications = notifications.reduce(
    (acc, notification) => {
      const date = getDateGroup(notification.createdAt);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(notification);
      return acc;
    },
    {} as Record<string, Notification[]>,
  );

  if (loading) {
    return (
      <PlannerLayout title="Notifications" subtitle="Loading...">
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      </PlannerLayout>
    );
  }

  return (
    <PlannerLayout
      title="Notifications"
      subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
    >
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        {/* Actions Bar */}
        {notifications.length > 0 && (
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
                checked={
                  selectedIds.length === notifications.length &&
                  notifications.length > 0
                }
                indeterminate={
                  selectedIds.length > 0 &&
                  selectedIds.length < notifications.length
                }
                onChange={handleSelectAll}
                sx={{
                  color: COLORS.border,
                  "&.Mui-checked, &.MuiCheckbox-indeterminate": {
                    color: COLORS.blue,
                  },
                }}
              />
              <Typography
                sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
              >
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
        )}

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
                  key={notification._id}
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    borderBottom:
                      index < items.length - 1
                        ? `1px solid ${COLORS.border}`
                        : "none",
                    bgcolor: notification.isRead
                      ? "transparent"
                      : "rgba(59, 130, 246, 0.05)",
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: COLORS.bgTertiary,
                    },
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Checkbox
                    checked={selectedIds.includes(notification._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(notification._id);
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
                          fontWeight: notification.isRead ? 400 : 600,
                          fontSize: "14px",
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          sx={{
                            color: COLORS.textMuted,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatTimeAgo(notification.createdAt)}
                        </Typography>
                        {!notification.isRead && (
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
                      handleDelete(notification._id);
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
    </PlannerLayout>
  );
};

export default PlannerNotifications;
