import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  PeopleOutlined as PeopleIcon,
  VerifiedUserOutlined as AdminIcon,
  CalendarTodayOutlined as PlannerIcon,
  PersonOutlined as UserIcon,
  BlockOutlined as BlockIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import editIcon from "../../assets/tabler_edit.png";

interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: "Admin" | "Planner" | "User";
  projectAccess: string;
  status: "Active" | "Inactive";
  lastLogin: string;
}

const initialUsers: User[] = [
  {
    id: "1",
    name: "James Whitfield",
    initials: "JW",
    email: "j.whitfield@plansure.io",
    role: "Admin",
    projectAccess: "All Projects",
    status: "Active",
    lastLogin: "25 Mar 2026, 08:12",
  },
  {
    id: "2",
    name: "Diana Chen",
    initials: "DC",
    email: "d.chen@plansure.io",
    role: "Admin",
    projectAccess: "All Projects",
    status: "Active",
    lastLogin: "24 Mar 2026, 17:45",
  },
  {
    id: "3",
    name: "Kamran Rashid",
    initials: "KR",
    email: "k.rashid@plansure.io",
    role: "Planner",
    projectAccess: "Crossrail Phase 2,",
    status: "Active",
    lastLogin: "25 Mar 2026, 09:30",
  },
  {
    id: "4",
    name: "Sarah Mitchell",
    initials: "SM",
    email: "s.mitchell@plansure.io",
    role: "Planner",
    projectAccess: "Crossrail Phase",
    status: "Active",
    lastLogin: "24 Mar 2026, 14:20",
  },
  {
    id: "5",
    name: "Emily Rodriguez",
    initials: "ER",
    email: "e.rodriguez@plansure.io",
    role: "User",
    projectAccess: "Crossrail Phase 2",
    status: "Active",
    lastLogin: "25 Mar 2026, 10:15",
  },
  {
    id: "6",
    name: "Rachel Nguyen",
    initials: "RN",
    email: "r.nguyen@plansure.io",
    role: "User",
    projectAccess: "Thames Tideway",
    status: "Inactive",
    lastLogin: "10 Feb 2026, 09:00",
  },
];

const roleColors = {
  Admin: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
  Planner: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
  User: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
};

const statusColors = {
  Active: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e", dot: "#22c55e" },
  Inactive: {
    bg: "rgba(107, 114, 128, 0.15)",
    color: "#6b7280",
    dot: "#6b7280",
  },
};

const avatarStyles: Record<string, { bg: string; color: string }> = {
  JW: { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444" },
  DC: { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444" },
  KR: { bg: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" },
  SM: { bg: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" },
  ER: { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" },
  RN: { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" },
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"Admin" | "Planner" | "User">(
    "User",
  );
  const [editProjectAccess, setEditProjectAccess] = useState("");
  const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active");

  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
    setInviteName("");
    setInviteEmail("");
    setSelectedRole("");
    setSelectedProject("");
  };

  const handleSendInvite = () => {
    if (!inviteName || !inviteEmail || !selectedRole || !selectedProject) {
      return;
    }

    const getInitials = (name: string) => {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const newUser: User = {
      id: String(users.length + 1),
      name: inviteName,
      initials: getInitials(inviteName),
      email: inviteEmail,
      role: selectedRole as "Admin" | "Planner" | "User",
      projectAccess: selectedProject,
      status: "Active",
      lastLogin: "Pending invite",
    };

    setUsers([...users, newUser]);
    handleCloseInviteModal();
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditProjectAccess(user.projectAccess);
    setEditStatus(user.status);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("User");
    setEditProjectAccess("");
    setEditStatus("Active");
  };

  const handleSaveChanges = () => {
    if (!editingUser) return;

    const getInitials = (name: string) => {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const updatedUsers = users.map((user) =>
      user.id === editingUser.id
        ? {
            ...user,
            name: editName,
            initials: getInitials(editName),
            email: editEmail,
            role: editRole,
            projectAccess: editProjectAccess,
            status: editStatus,
          }
        : user,
    );

    setUsers(updatedUsers);
    handleCloseEditModal();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "Admin").length;
  const plannerCount = users.filter((u) => u.role === "Planner").length;
  const userCount = users.filter((u) => u.role === "User").length;

  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage users and roles"
      headerAction={
        <Button
          startIcon={<AddIcon />}
          onClick={() => setInviteModalOpen(true)}
          sx={{
            bgcolor: COLORS.blue,
            color: COLORS.white,
            textTransform: "none",
            px: 3,
            py: 1,
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            "&:hover": {
              bgcolor: COLORS.blueHover,
            },
          }}
        >
          Invite User
        </Button>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "14px", mb: 1 }}
            >
              Total Users
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "32px",
                fontWeight: 700,
              }}
            >
              {totalUsers}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${COLORS.blue}15`,
              borderRadius: "8px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PeopleIcon sx={{ color: COLORS.blue, fontSize: 24 }} />
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "14px", mb: 1 }}
            >
              admins
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "32px",
                fontWeight: 700,
              }}
            >
              {adminCount}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${COLORS.green}15`,
              borderRadius: "8px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AdminIcon sx={{ color: COLORS.green, fontSize: 24 }} />
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "14px", mb: 1 }}
            >
              Planners
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "32px",
                fontWeight: 700,
              }}
            >
              {plannerCount}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${COLORS.amber}15`,
              borderRadius: "8px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlannerIcon sx={{ color: COLORS.amber, fontSize: 24 }} />
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "14px", mb: 1 }}
            >
              Users
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "32px",
                fontWeight: 700,
              }}
            >
              {userCount}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${COLORS.green}15`,
              borderRadius: "8px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserIcon sx={{ color: COLORS.green, fontSize: 24 }} />
          </Box>
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
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: { xs: 2, md: 0 },
            p: 3,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              All Users
            </Typography>
            <Typography sx={{ color: COLORS.textMuted, fontSize: "13px" }}>
              Manage team members and their access levels
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: { xs: "100%", md: "auto" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: COLORS.bgPrimary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                px: 2,
                py: 1,
                flex: { xs: 1, md: "none" },
                minWidth: { xs: "auto", md: "320px" },
              }}
            >
              <SearchIcon sx={{ color: COLORS.textMuted, fontSize: 20 }} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: COLORS.textPrimary,
                  fontSize: "14px",
                  width: "100%",
                }}
              />
            </Box>
            <Button
              sx={{
                bgcolor: COLORS.blue,
                color: COLORS.white,
                textTransform: "none",
                px: 3,
                py: 1,
                borderRadius: "8px",
                fontSize: "14px",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: COLORS.blueHover,
                },
              }}
            >
              Search
            </Button>
          </Box>
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 900 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "1.5fr 1.5fr 0.8fr 1.2fr 0.8fr 1.2fr 0.8fr",
                gap: 2,
                px: 3,
                py: 2,
                borderBottom: `1px solid ${COLORS.border}`,
                bgcolor: COLORS.bgSecondary,
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                NAME
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                EMAIL
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                ROLE
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                PROJECT ACCESS
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                STATUS
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                LAST LOGIN
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                ACTIONS
              </Typography>
            </Box>

            {filteredUsers.map((user) => (
              <Box
                key={user.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.5fr 1.5fr 0.8fr 1.2fr 0.8fr 1.2fr 0.8fr",
                  gap: 2,
                  px: 3,
                  py: 2,
                  borderBottom: `1px solid ${COLORS.border}`,
                  alignItems: "center",
                  bgcolor: COLORS.bgSecondary,
                  "&:hover": {
                    bgcolor: "#1E293B",
                  },
                  "&:last-child": {
                    borderBottom: "none",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor:
                        avatarStyles[user.initials]?.bg ||
                        "rgba(59, 130, 246, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          avatarStyles[user.initials]?.color || COLORS.blue,
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {user.initials}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {user.name}
                  </Typography>
                </Box>

                <Typography
                  sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
                >
                  {user.email}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: roleColors[user.role].bg,
                      color: roleColors[user.role].color,
                      px: 2.5,
                      py: 0.75,
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 500,
                      minWidth: "70px",
                    }}
                  >
                    {user.role}
                  </Box>
                </Box>

                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    textAlign: "center",
                  }}
                >
                  {user.projectAccess}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      bgcolor: statusColors[user.status].bg,
                      px: 2,
                      py: 0.75,
                      borderRadius: "20px",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: statusColors[user.status].dot,
                      }}
                    />
                    <Typography
                      sx={{
                        color: statusColors[user.status].color,
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {user.status}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    textAlign: "center",
                  }}
                >
                  {user.lastLogin}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                  <Box
                    component="img"
                    src={editIcon}
                    onClick={() => handleOpenEditModal(user)}
                    sx={{
                      width: 20,
                      height: 20,
                      cursor: "pointer",
                      opacity: 0.5,
                      "&:hover": { opacity: 1 },
                    }}
                  />
                  <BlockIcon
                    sx={{
                      fontSize: 20,
                      color: COLORS.textMuted,
                      cursor: "pointer",
                      opacity: 0.5,
                      "&:hover": { opacity: 1 },
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={inviteModalOpen}
        onClose={handleCloseInviteModal}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.8)",
            },
          },
          paper: {
            sx: {
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.white}`,
              borderRadius: "12px",
              backgroundImage: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              maxWidth: 480,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            pt: 1,
            borderBottom: `1px solid ${COLORS.white}`,
          }}
        >
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Invite User
          </Typography>
          <IconButton
            onClick={handleCloseInviteModal}
            sx={{ color: COLORS.textMuted, mr: -1, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
                mt: 2,
              }}
            >
              Full Name <span style={{ color: COLORS.red }}>*</span>
            </Typography>
            <Box
              component="input"
              type="text"
              placeholder="e.g. John Smith"
              value={inviteName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteName(e.target.value)}
              sx={{
                width: "100%",
                padding: "12px 14px",
                background: COLORS.bgPrimary,
                border: `1px solid ${COLORS.white}`,
                borderRadius: "8px",
                color: COLORS.textPrimary,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                  WebkitBoxShadow: `0 0 0 1000px ${COLORS.bgPrimary} inset !important`,
                  WebkitTextFillColor: `${COLORS.textPrimary} !important`,
                  caretColor: COLORS.textPrimary,
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
                mt: 2,
              }}
            >
              Email Address <span style={{ color: COLORS.red }}>*</span>
            </Typography>
            <Box
              component="input"
              type="email"
              placeholder="e.g. john.smith@company.com"
              value={inviteEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
              sx={{
                width: "100%",
                padding: "12px 14px",
                background: COLORS.bgPrimary,
                border: `1px solid ${COLORS.white}`,
                borderRadius: "8px",
                color: COLORS.textPrimary,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                  WebkitBoxShadow: `0 0 0 1000px ${COLORS.bgPrimary} inset !important`,
                  WebkitTextFillColor: `${COLORS.textPrimary} !important`,
                  caretColor: COLORS.textPrimary,
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
                mt: 2,
              }}
            >
              Role <span style={{ color: COLORS.red }}>*</span>
            </Typography>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}
            >
              <Box
                onClick={() => setSelectedRole("Admin")}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${selectedRole === "Admin" ? COLORS.blue : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      selectedRole === "Admin" ? COLORS.blue : COLORS.textMuted,
                  },
                }}
              >
                <Box
                  sx={{
                    bgcolor: "rgba(239, 68, 68, 0.15)",
                    color: "#ef4444",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Admin
                </Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Full access — manage users, configure projects, override
                  transitions, and access audit logs.
                </Typography>
              </Box>

              <Box
                onClick={() => setSelectedRole("Planner")}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${selectedRole === "Planner" ? COLORS.blue : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      selectedRole === "Planner"
                        ? COLORS.blue
                        : COLORS.textMuted,
                  },
                }}
              >
                <Box
                  sx={{
                    bgcolor: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Planner
                </Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Upload programmes, manage activities, transition week cycles,
                  and generate exports.
                </Typography>
              </Box>

              <Box
                onClick={() => setSelectedRole("User")}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${selectedRole === "User" ? COLORS.blue : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      selectedRole === "User" ? COLORS.blue : COLORS.textMuted,
                  },
                }}
              >
                <Box
                  sx={{
                    bgcolor: "rgba(34, 197, 94, 0.15)",
                    color: "#22c55e",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  User
                </Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Read-only access — view dashboards, activities, and reports.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
                mt: 2,
              }}
            >
              Project Assignment <span style={{ color: COLORS.red }}>*</span>
            </Typography>
            <RadioGroup
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              sx={{ mt: 1 }}
            >
              {[
                "Crossrail Phase 2",
                "Thames Tideway Tunnel",
                "HS2 Northern Section",
              ].map((project) => (
                <Box
                  key={project}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    border: `1px solid ${selectedProject === project ? COLORS.blue : COLORS.white}`,
                    borderRadius: "8px",
                    mb: 1,
                    transition: "border-color 0.2s ease",
                    "&:hover": {
                      borderColor:
                        selectedProject === project
                          ? COLORS.blue
                          : COLORS.textMuted,
                    },
                  }}
                >
                  <FormControlLabel
                    value={project}
                    control={
                      <Radio
                        sx={{
                          color: COLORS.textMuted,
                          "&.Mui-checked": {
                            color: COLORS.blue,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                      >
                        {project}
                      </Typography>
                    }
                    sx={{ m: 0, p: 1.5, width: "100%" }}
                  />
                </Box>
              ))}
            </RadioGroup>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${COLORS.white}`,
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleCloseInviteModal}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.bgPrimary,
              border: `1px solid ${COLORS.white}`,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendInvite}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.blue,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor: COLORS.blueHover,
              },
            }}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.8)",
            },
          },
          paper: {
            sx: {
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.white}`,
              borderRadius: "12px",
              backgroundImage: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              maxWidth: 480,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            pt: 1,
            borderBottom: `1px solid ${COLORS.white}`,
          }}
        >
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Edit User
          </Typography>
          <IconButton
            onClick={handleCloseEditModal}
            sx={{ color: COLORS.textMuted, mr: -1, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
                mt: 2,
              }}
            >
              Full Name <span style={{ color: COLORS.red }}>*</span>
            </Typography>
            <Box
              component="input"
              type="text"
              placeholder="e.g. John Smith"
              value={editName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
              sx={{
                width: "100%",
                padding: "12px 14px",
                background: COLORS.bgPrimary,
                border: `1px solid ${COLORS.white}`,
                borderRadius: "8px",
                color: COLORS.textPrimary,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                  WebkitBoxShadow: `0 0 0 1000px ${COLORS.bgPrimary} inset !important`,
                  WebkitTextFillColor: `${COLORS.textPrimary} !important`,
                  caretColor: COLORS.textPrimary,
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
                mt: 2,
              }}
            >
              Email Address <span style={{ color: COLORS.red }}>*</span>
            </Typography>
            <Box
              component="input"
              type="email"
              placeholder="e.g. john.smith@company.com"
              value={editEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditEmail(e.target.value)}
              sx={{
                width: "100%",
                padding: "12px 14px",
                background: COLORS.bgPrimary,
                border: `1px solid ${COLORS.white}`,
                borderRadius: "8px",
                color: COLORS.textPrimary,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                  WebkitBoxShadow: `0 0 0 1000px ${COLORS.bgPrimary} inset !important`,
                  WebkitTextFillColor: `${COLORS.textPrimary} !important`,
                  caretColor: COLORS.textPrimary,
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
                mt: 2,
              }}
            >
              Role <span style={{ color: COLORS.red }}>*</span>
            </Typography>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}
            >
              <Box
                onClick={() => setEditRole("Admin")}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editRole === "Admin" ? COLORS.blue : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editRole === "Admin" ? COLORS.blue : COLORS.textMuted,
                  },
                }}
              >
                <Box
                  sx={{
                    bgcolor: "rgba(239, 68, 68, 0.15)",
                    color: "#ef4444",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Admin
                </Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Full access — manage users, configure projects, override
                  transitions, and access audit logs.
                </Typography>
              </Box>

              <Box
                onClick={() => setEditRole("Planner")}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editRole === "Planner" ? COLORS.blue : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editRole === "Planner" ? COLORS.blue : COLORS.textMuted,
                  },
                }}
              >
                <Box
                  sx={{
                    bgcolor: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Planner
                </Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Upload programmes, manage activities, transition week cycles,
                  and generate exports.
                </Typography>
              </Box>

              <Box
                onClick={() => setEditRole("User")}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editRole === "User" ? COLORS.blue : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editRole === "User" ? COLORS.blue : COLORS.textMuted,
                  },
                }}
              >
                <Box
                  sx={{
                    bgcolor: "rgba(34, 197, 94, 0.15)",
                    color: "#22c55e",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  User
                </Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Read-only access — view dashboards, activities, and reports.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
                mt: 2,
              }}
            >
              Project Access <span style={{ color: COLORS.red }}>*</span>
            </Typography>
            <RadioGroup
              value={editProjectAccess}
              onChange={(e) => setEditProjectAccess(e.target.value)}
              sx={{ mt: 1 }}
            >
              {[
                "All Projects",
                "Crossrail Phase 2",
                "Thames Tideway Tunnel",
                "HS2 Northern Section",
              ].map((project) => (
                <Box
                  key={project}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    border: `1px solid ${editProjectAccess === project ? COLORS.blue : COLORS.white}`,
                    borderRadius: "8px",
                    mb: 1,
                    transition: "border-color 0.2s ease",
                    "&:hover": {
                      borderColor:
                        editProjectAccess === project
                          ? COLORS.blue
                          : COLORS.textMuted,
                    },
                  }}
                >
                  <FormControlLabel
                    value={project}
                    control={
                      <Radio
                        sx={{
                          color: COLORS.textMuted,
                          "&.Mui-checked": {
                            color: COLORS.blue,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                      >
                        {project}
                      </Typography>
                    }
                    sx={{ m: 0, p: 1.5, width: "100%" }}
                  />
                </Box>
              ))}
            </RadioGroup>
          </Box>

          <Box>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: "12px",
                fontWeight: 500,
                mb: 0.5,
                mt: 2,
              }}
            >
              Status <span style={{ color: COLORS.red }}>*</span>
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
              <Box
                onClick={() => setEditStatus("Active")}
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  p: 1.5,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editStatus === "Active" ? COLORS.green : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editStatus === "Active" ? COLORS.green : COLORS.textMuted,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: COLORS.green,
                  }}
                />
                <Typography
                  sx={{
                    color:
                      editStatus === "Active"
                        ? COLORS.green
                        : COLORS.textSecondary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Active
                </Typography>
              </Box>
              <Box
                onClick={() => setEditStatus("Inactive")}
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  p: 1.5,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editStatus === "Inactive" ? "#6b7280" : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editStatus === "Inactive" ? "#6b7280" : COLORS.textMuted,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#6b7280",
                  }}
                />
                <Typography
                  sx={{
                    color:
                      editStatus === "Inactive"
                        ? "#6b7280"
                        : COLORS.textSecondary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Inactive
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${COLORS.white}`,
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleCloseEditModal}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.bgPrimary,
              border: `1px solid ${COLORS.white}`,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.blue,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor: COLORS.blueHover,
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
