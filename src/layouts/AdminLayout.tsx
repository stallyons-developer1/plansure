import { useState } from "react";
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
} from "@mui/material";
import {
  HomeOutlined as DashboardIcon,
  NotificationsOutlined as NotificationsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  PeopleOutlined as UsersIcon,
  DescriptionOutlined as AuditIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/colors";
import logo from "../assets/logo.png";
import projectsIcon from "../assets/sidebar/projects.png";
import activitiesIcon from "../assets/sidebar/activitiesClipboard.png";
import actionIcon from "../assets/sidebar/action.png";
import uploadIcon from "../assets/sidebar/upload.png";
import weeklyDashboardIcon from "../assets/sidebar/dashboard.png";
import governanceIcon from "../assets/sidebar/governance.png";
import exportIcon from "../assets/sidebar/export.png";

const DRAWER_WIDTH = 240;

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

const AdminLayout = ({
  children,
  title,
  subtitle,
  headerAction,
}: AdminLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsLoggingOut(false);
      setLogoutModalOpen(false);
      logout();
      navigate("/login");
    }, 2000);
  };

  const handleLogoutCancel = () => {
    setLogoutModalOpen(false);
  };

  const mainMenuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/admin",
      isCustomIcon: false,
    },
    {
      text: "Projects",
      iconSrc: projectsIcon,
      path: "/admin/projects",
      isCustomIcon: true,
      iconSize: { width: 16, height: 16 },
    },
  ];

  const weeklyControlItems = [
    {
      text: "Programs Upload",
      iconSrc: uploadIcon,
      path: "/admin/programs-upload",
      isCustomIcon: true,
      iconSize: { width: 24, height: 24 },
    },
    {
      text: "Activities & Lookahead",
      iconSrc: activitiesIcon,
      path: "/admin/activities",
      isCustomIcon: true,
      iconSize: { width: 14, height: 18 },
    },
    {
      text: "Action",
      iconSrc: actionIcon,
      path: "/admin/action",
      isCustomIcon: true,
      iconSize: { width: 18, height: 18 },
    },
    {
      text: "Weekly Dashboard",
      iconSrc: weeklyDashboardIcon,
      path: "/admin/weekly-dashboard",
      isCustomIcon: true,
      iconSize: { width: 18, height: 18 },
    },
  ];

  const governanceItems = [
    {
      text: "Governance Dashboard",
      iconSrc: governanceIcon,
      path: "/admin/governance",
      isCustomIcon: true,
      iconSize: { width: 18, height: 18 },
    },
    {
      text: "Export",
      iconSrc: exportIcon,
      path: "/admin/export",
      isCustomIcon: true,
      iconSize: { width: 16, height: 20 },
    },
  ];

  const adminItems = [
    {
      text: "User Management",
      icon: <UsersIcon />,
      path: "/admin/users",
      isCustomIcon: false,
    },
    {
      text: "Audit Logs",
      icon: <AuditIcon />,
      path: "/admin/audit-logs",
      isCustomIcon: false,
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
    if (path === "/admin") {
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
        {renderMenuSection("ADMIN", adminItems)}

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
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {user?.email?.split("@")[0] || "Admin"}
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: "0.75rem",
                    textTransform: "capitalize",
                  }}
                >
                  {user?.role || "Admin"}
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
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: { xs: 2, sm: 0 },
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" }, color: COLORS.textSecondary }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontWeight: 600,
                  fontSize: { xs: "16px", sm: "18px" },
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: { xs: "100%", sm: "auto" },
              justifyContent: { xs: "space-between", sm: "flex-end" },
            }}
          >
            {headerAction}
            <IconButton sx={{ color: COLORS.textSecondary }}>
              <NotificationsIcon />
            </IconButton>
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

export default AdminLayout;
