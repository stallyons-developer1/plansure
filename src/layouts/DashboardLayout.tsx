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
} from "@mui/material";
import {
  HomeOutlined as DashboardIcon,
  NotificationsOutlined as NotificationsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/colors";
import logo from "../assets/logo.png";
import projectsIcon from "../assets/sidebar/projects.png";
import activitiesIcon from "../assets/sidebar/Activities&Lookahead.png";

const DRAWER_WIDTH = 240;

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const mainMenuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
      isCustomIcon: false,
    },
    {
      text: "Projects",
      iconSrc: projectsIcon,
      path: "/dashboard/projects",
      isCustomIcon: true,
      iconSize: { width: 16, height: 16 },
    },
  ];

  const viewMenuItems = [
    {
      text: "Activities & Lookahead",
      iconSrc: activitiesIcon,
      path: "/dashboard/activities",
      isCustomIcon: true,
      iconSize: { width: 16, height: 18 },
    },
  ];

  const renderIcon = (item: any) => {
    if (item.isCustomIcon) {
      return (
        <Box
          component="img"
          src={item.iconSrc}
          sx={{
            width: item.iconSize.width,
            height: item.iconSize.height,
            filter: isActive(item.path)
              ? "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)"
              : "none",
          }}
        />
      );
    }
    return item.icon;
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: COLORS.bgPrimary,
      }}
    >
      <Box sx={{ p: 2, pt: 3 }}>
        <Box
          component="img"
          src={logo}
          alt="PlanSure"
          sx={{ height: 40, width: "auto" }}
        />
      </Box>

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
          MAIN
        </Typography>
        <List disablePadding>
          {mainMenuItems.map((item) => (
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
                        fontWeight: isActive(item.path) ? 500 : 500,
                        color: isActive(item.path)
                          ? COLORS.blue
                          : COLORS.border,
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
          VIEW
        </Typography>
        <List disablePadding>
          {viewMenuItems.map((item) => (
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
                    minWidth: 25,
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
                        fontWeight: isActive(item.path) ? 500 : 500,
                        color: isActive(item.path)
                          ? COLORS.blue
                          : COLORS.border,
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
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </Avatar>
            <Box>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                {user?.email?.split("@")[0] || "User"}
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "0.75rem",
                  textTransform: "capitalize",
                }}
              >
                {user?.role || "User"}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleLogout}
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
          <IconButton sx={{ color: COLORS.textSecondary }}>
            <NotificationsIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, overflowY: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
