import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Popover,
  Badge,
} from "@mui/material";
import {
  HomeOutlined as DashboardIcon,
  NotificationsOutlined as NotificationsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/colors";
import { notificationAPI } from "../services/api";
import { usePushNotifications } from "../hooks/usePushNotifications";
import logo from "../assets/logo.png";
import projectsIcon from "../assets/sidebar/projects.png";
import activitiesIcon from "../assets/sidebar/activitiesClipboard.png";
import actionIcon from "../assets/sidebar/action.png";
import uploadIcon from "../assets/sidebar/upload.png";
import weeklyDashboardIcon from "../assets/sidebar/dashboard.png";
import governanceIcon from "../assets/sidebar/governance.png";
import exportIcon from "../assets/sidebar/export.png";

const DRAWER_WIDTH = 240;

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

interface PlannerLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

const PlannerLayout = ({
  children,
  title,
  subtitle,
  headerAction,
}: PlannerLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationAnchor, setNotificationAnchor] =
    useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  usePushNotifications();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationAPI.getAll(20, false);
      if (response.success) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
    fetchNotifications();
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleViewAll = () => {
    handleNotificationClose();
    navigate("/planner/notifications");
  };

  const handleNotificationItemClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification._id);
        setNotifications(
          notifications.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    const projectId =
      notification.project?._id || notification.programme?.project?._id;

    if (projectId) {
      handleNotificationClose();
      navigate(`/planner/projects/${projectId}?tab=actions&t=${Date.now()}`);
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

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setLogoutModalOpen(false);
      navigate("/login");
    }
  };

  const handleLogoutCancel = () => {
    setLogoutModalOpen(false);
  };

  const mainMenuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/planner",
      isCustomIcon: false,
    },
    {
      text: "Projects",
      iconSrc: projectsIcon,
      path: "/planner/projects",
      isCustomIcon: true,
      iconSize: { width: 16, height: 16 },
    },
  ];

  const weeklyControlItems = [
    {
      text: "Programs Upload",
      iconSrc: uploadIcon,
      path: "/planner/programs-upload",
      isCustomIcon: true,
      iconSize: { width: 24, height: 24 },
    },
    {
      text: "Activities & Lookahead",
      iconSrc: activitiesIcon,
      path: "/planner/activities",
      isCustomIcon: true,
      iconSize: { width: 14, height: 18 },
    },
    {
      text: "Action",
      iconSrc: actionIcon,
      path: "/planner/action",
      isCustomIcon: true,
      iconSize: { width: 18, height: 18 },
    },
    {
      text: "Weekly Dashboard",
      iconSrc: weeklyDashboardIcon,
      path: "/planner/weekly-dashboard",
      isCustomIcon: true,
      iconSize: { width: 18, height: 18 },
    },
  ];

  const governanceItems = [
    {
      text: "Governance Dashboard",
      iconSrc: governanceIcon,
      path: "/planner/governance",
      isCustomIcon: true,
      iconSize: { width: 18, height: 18 },
    },
    {
      text: "Export",
      iconSrc: exportIcon,
      path: "/planner/export",
      isCustomIcon: true,
      iconSize: { width: 16, height: 20 },
    },
  ];

  const renderIcon = (item: {
    isCustomIcon: boolean;
    icon?: React.ReactNode;
    iconSrc?: string;
    iconSize?: { width: number; height: number };
    path: string;
  }) => {
    if (item.isCustomIcon && item.iconSrc) {
      return (
        <Box
          component="img"
          src={item.iconSrc}
          sx={{
            width: item.iconSize?.width || 16,
            height: item.iconSize?.height || 16,
            filter: isActive(item.path)
              ? "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)"
              : "brightness(0) saturate(100%) invert(60%) sepia(10%) saturate(500%) hue-rotate(180deg) brightness(95%) contrast(90%)",
          }}
        />
      );
    }
    return item.icon;
  };

  const isActive = (path: string) => {
    if (path === "/planner") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const renderMenuSection = (title: string, items: typeof mainMenuItems) => (
    <Box sx={{ px: 2, pt: 3 }}>
      <Typography
        sx={{
          color: COLORS.border,
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.1em",
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <List disablePadding>
        {items.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                bgcolor: isActive(item.path)
                  ? COLORS.blueBgMedium
                  : "transparent",
                "&:hover": {
                  bgcolor: isActive(item.path)
                    ? COLORS.blueBgHover
                    : COLORS.whiteHover,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 30,
                  color: isActive(item.path) ? COLORS.blue : COLORS.textMuted,
                }}
              >
                {renderIcon(item)}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "14px",
                      fontWeight: 500,
                      color: isActive(item.path) ? COLORS.blue : COLORS.border,
                      whiteSpace: "nowrap",
                    },
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: COLORS.bgPrimary,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.94,
          borderBottom: `1px solid ${COLORS.border}`,
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="PlanSure"
          sx={{ height: 40, width: "auto" }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {renderMenuSection("MAIN", mainMenuItems)}
        {renderMenuSection("WEEKLY CONTROL", weeklyControlItems)}
        {renderMenuSection("GOVERNANCE", governanceItems)}

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ p: 2 }}>
          <Divider sx={{ borderColor: COLORS.border, mb: 2 }} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: COLORS.blue,
                  fontSize: "0.875rem",
                }}
              >
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "P"}
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {user?.name || user?.email?.split("@")[0] || "Planner"}
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "0.75rem",
                    textTransform: "capitalize",
                  }}
                >
                  {user?.role || "Planner"}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleLogoutClick}
              sx={{
                color: COLORS.textMuted,
                "&:hover": { color: COLORS.redLight },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: COLORS.bgPrimary,
        overflow: "hidden",
      }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            bgcolor: COLORS.bgPrimary,
            borderRight: `1px solid ${COLORS.border}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            bgcolor: COLORS.bgPrimary,
            borderRight: `1px solid ${COLORS.border}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" }, color: COLORS.textSecondary }}
            >
              <MenuIcon />
            </IconButton>
            <Box>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontWeight: 600,
                  fontSize: "18px",
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {headerAction}
            <IconButton
              onClick={handleNotificationClick}
              sx={{ color: COLORS.textSecondary }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: COLORS.red,
                    color: COLORS.white,
                    fontSize: "10px",
                    minWidth: "18px",
                    height: "18px",
                  },
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Popover
              open={Boolean(notificationAnchor)}
              anchorEl={notificationAnchor}
              onClose={handleNotificationClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: "#0F172A",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "12px",
                    width: 360,
                    maxHeight: 480,
                    mt: 1,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  },
                },
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${COLORS.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Box
                    sx={{
                      bgcolor: COLORS.red,
                      color: COLORS.white,
                      fontSize: "12px",
                      fontWeight: 500,
                      px: 1.5,
                      py: 0.25,
                      borderRadius: "12px",
                    }}
                  >
                    {unreadCount} new
                  </Box>
                )}
              </Box>
              <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "14px" }}
                    >
                      No notifications
                    </Typography>
                  </Box>
                ) : (
                  notifications.map((notification) => (
                    <Box
                      key={notification._id}
                      onClick={() => handleNotificationItemClick(notification)}
                      sx={{
                        p: 2,
                        borderBottom: `1px solid ${COLORS.border}`,
                        cursor: "pointer",
                        bgcolor: notification.isRead
                          ? "transparent"
                          : "rgba(59, 130, 246, 0.05)",
                        "&:hover": {
                          bgcolor: COLORS.bgTertiary,
                        },
                      }}
                    >
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
                        {!notification.isRead && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: COLORS.blue,
                              flexShrink: 0,
                              mt: 0.5,
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        sx={{
                          color: COLORS.textMuted,
                          fontSize: "13px",
                          mb: 0.5,
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        sx={{
                          color: COLORS.textMuted,
                          fontSize: "12px",
                        }}
                      >
                        {formatTimeAgo(notification.createdAt)}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
              {notifications.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: `1px solid ${COLORS.border}`,
                  }}
                >
                  <Button
                    onClick={handleMarkAllRead}
                    sx={{
                      color: COLORS.textSecondary,
                      textTransform: "none",
                      fontSize: "13px",
                      "&:hover": {
                        bgcolor: "transparent",
                        color: COLORS.textPrimary,
                      },
                    }}
                  >
                    Mark all read
                  </Button>
                  <Button
                    onClick={handleViewAll}
                    sx={{
                      color: COLORS.blue,
                      textTransform: "none",
                      fontSize: "13px",
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: "transparent",
                        color: COLORS.blueHover,
                      },
                    }}
                  >
                    View all
                  </Button>
                </Box>
              )}
            </Popover>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, overflowY: "auto" }}>
          {children}
        </Box>
      </Box>

      <Dialog
        open={logoutModalOpen}
        onClose={handleLogoutCancel}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.7)",
            },
          },
          paper: {
            sx: {
              bgcolor: "#0F172A",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              minWidth: 320,
              backgroundImage: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            },
          },
        }}
      >
        {isLoggingOut ? (
          <DialogContent
            sx={{
              bgcolor: "#0F172A",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress size={40} sx={{ color: COLORS.blue }} />
          </DialogContent>
        ) : (
          <>
            <DialogTitle
              sx={{
                color: COLORS.textPrimary,
                fontSize: "18px",
                fontWeight: 600,
                pb: 1,
                bgcolor: "#0F172A",
              }}
            >
              Logout
            </DialogTitle>
            <DialogContent sx={{ bgcolor: "#0F172A" }}>
              <Typography
                sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
              >
                Are you sure you want to logout?
              </Typography>
            </DialogContent>
          </>
        )}
        {!isLoggingOut && (
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, bgcolor: "#0F172A" }}>
            <Button
              onClick={handleLogoutCancel}
              sx={{
                color: COLORS.textSecondary,
                bgcolor: "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                textTransform: "none",
                px: 3,
                "&:hover": {
                  bgcolor: COLORS.bgTertiary,
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogoutConfirm}
              sx={{
                color: COLORS.white,
                bgcolor: COLORS.red,
                borderRadius: "8px",
                textTransform: "none",
                px: 3,
                "&:hover": {
                  bgcolor: COLORS.redLight,
                },
              }}
            >
              Logout
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default PlannerLayout;
