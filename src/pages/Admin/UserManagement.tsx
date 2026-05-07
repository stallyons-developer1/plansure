import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  CircularProgress,
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
  FolderOutlined as FolderIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import editIcon from "../../assets/tabler_edit.png";
import { userAPI, projectAPI } from "../../services/api";

interface User {
  _id: string;
  name: string;
  initials: string;
  email: string;
  role: "admin" | "planner" | "user";
  projectAccess: string;
  status: "active" | "pending" | "blocked";
  lastLogin: string | null;
}

interface Project {
  _id: string;
  name: string;
}

const roleColors: Record<string, { bg: string; color: string }> = {
  admin: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
  planner: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
  user: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
};

const statusColors: Record<string, { bg: string; color: string; dot: string }> =
  {
    active: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e", dot: "#22c55e" },
    pending: {
      bg: "rgba(245, 158, 11, 0.15)",
      color: "#f59e0b",
      dot: "#f59e0b",
    },
    blocked: {
      bg: "rgba(107, 114, 128, 0.15)",
      color: "#6b7280",
      dot: "#6b7280",
    },
  };

const getAvatarStyle = (role: string) => {
  switch (role) {
    case "admin":
      return { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444" };
    case "planner":
      return { bg: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" };
    default:
      return { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" };
  }
};

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "planner" | "user">(
    "user",
  );
  const [editStatus, setEditStatus] = useState<"active" | "blocked">("active");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          userAPI.getAll(),
          projectAPI.getAll(),
        ]);
        setUsers(usersRes.users || []);
        setProjects(projectsRes.projects || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
    setInviteName("");
    setInviteEmail("");
    setSelectedRole("");
    setSelectedProject("");
    setInviteError("");
  };

  const handleSendInvite = async () => {
    if (!inviteName || !inviteEmail || !selectedRole || !selectedProject) {
      return;
    }

    setInviteLoading(true);
    setInviteError("");

    try {
      const response = await userAPI.invite({
        name: inviteName,
        email: inviteEmail,
        role: selectedRole.toLowerCase(),
        projectId: selectedProject,
      });

      if (response.success) {
        const usersRes = await userAPI.getAll();
        setUsers(usersRes.users || []);
        handleCloseInviteModal();
      }
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: { errors?: { message: string }[]; message?: string };
        };
      };
      if (err.response?.data?.errors) {
        setInviteError(
          err.response.data.errors.map((e) => e.message).join(", "),
        );
      } else if (err.response?.data?.message) {
        setInviteError(err.response.data.message);
      } else {
        setInviteError("Failed to send invite. Please try again.");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditStatus(user.status === "blocked" ? "blocked" : "active");
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("user");
    setEditStatus("active");
    setEditError("");
  };

  const handleSaveChanges = async () => {
    if (!editingUser || !editName.trim()) return;

    setEditLoading(true);
    setEditError("");

    try {
      await userAPI.update(editingUser._id, {
        name: editName,
        role: editRole,
        status: editStatus,
      });

      const usersRes = await userAPI.getAll();
      setUsers(usersRes.users || []);
      handleCloseEditModal();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setEditError(
        err.response?.data?.message ||
          "Failed to update user. Please try again.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenBlockModal = (user: User) => {
    setUserToBlock(user);
    setBlockModalOpen(true);
  };

  const handleCloseBlockModal = () => {
    setBlockModalOpen(false);
    setUserToBlock(null);
  };

  const handleConfirmBlock = async () => {
    if (!userToBlock) return;

    setBlockLoading(true);
    try {
      await userAPI.block(userToBlock._id);
      const usersRes = await userAPI.getAll();
      setUsers(usersRes.users || []);
      handleCloseBlockModal();
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
    } finally {
      setBlockLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const plannerCount = users.filter((u) => u.role === "planner").length;
  const userCount = users.filter((u) => u.role === "user").length;

  const formatRole = (role: string) =>
    role.charAt(0).toUpperCase() + role.slice(1);
  const formatStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);
  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return "Never";
    return new Date(lastLogin).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <AdminLayout title="User Management" subtitle="Manage users and roles">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      </AdminLayout>
    );
  }

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

        <Box
          sx={{
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: 6,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: COLORS.border,
              borderRadius: 3,
            },
          }}
        >
          <Box
            sx={{
              minWidth: 1100,
              bgcolor: COLORS.bgSecondary,
              borderRadius: "0 0 12px 12px",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 100px 140px 100px 130px 100px",
                gap: 2,
                px: 3,
                py: 2,
                borderBottom: `1px solid ${COLORS.border}`,
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

            {filteredUsers.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 8,
                }}
              >
                <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
                  No users available
                </Typography>
              </Box>
            ) : (
              filteredUsers.map((user) => (
                <Box
                  key={user._id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "140px 1fr 100px 140px 100px 130px 100px",
                    gap: 2,
                    px: 3,
                    py: 2,
                    borderBottom: `1px solid ${COLORS.border}`,
                    alignItems: "center",
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
                        bgcolor: getAvatarStyle(user.role).bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          color: getAvatarStyle(user.role).color,
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
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  >
                    {user.email}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor:
                          roleColors[user.role]?.bg ||
                          "rgba(107, 114, 128, 0.15)",
                        color: roleColors[user.role]?.color || "#6b7280",
                        px: 2.5,
                        py: 0.75,
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 500,
                        minWidth: "70px",
                      }}
                    >
                      {formatRole(user.role)}
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
                        bgcolor:
                          statusColors[user.status]?.bg ||
                          "rgba(107, 114, 128, 0.15)",
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
                          bgcolor: statusColors[user.status]?.dot || "#6b7280",
                        }}
                      />
                      <Typography
                        sx={{
                          color: statusColors[user.status]?.color || "#6b7280",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        {formatStatus(user.status)}
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
                    {formatLastLogin(user.lastLogin)}
                  </Typography>

                  <Box
                    sx={{ display: "flex", justifyContent: "center", gap: 2 }}
                  >
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
                      onClick={() => handleOpenBlockModal(user)}
                      sx={{
                        fontSize: 20,
                        color:
                          user.status === "blocked"
                            ? "#ef4444"
                            : COLORS.textMuted,
                        cursor: "pointer",
                        opacity: 0.5,
                        "&:hover": { opacity: 1 },
                      }}
                    />
                  </Box>
                </Box>
              ))
            )}
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
          {inviteError && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                mt: 1,
              }}
            >
              <Typography sx={{ color: "#ef4444", fontSize: "14px" }}>
                {inviteError}
              </Typography>
            </Box>
          )}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInviteName(e.target.value)
              }
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
                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus":
                  {
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInviteEmail(e.target.value)
              }
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
                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus":
                  {
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
            {projects.length === 0 ? (
              <Box
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  p: 3,
                  mt: 1,
                  textAlign: "center",
                }}
              >
                <FolderIcon
                  sx={{ fontSize: 40, color: COLORS.textMuted, mb: 1 }}
                />
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    mb: 2,
                  }}
                >
                  No projects available. Create a project first to assign users.
                </Typography>
                <Button
                  onClick={() => {
                    handleCloseInviteModal();
                    navigate("/admin/projects");
                  }}
                  sx={{
                    bgcolor: COLORS.blue,
                    color: COLORS.white,
                    textTransform: "none",
                    px: 3,
                    py: 1,
                    borderRadius: "8px",
                    fontSize: "14px",
                    "&:hover": {
                      bgcolor: COLORS.blueHover,
                    },
                  }}
                >
                  Create Project
                </Button>
              </Box>
            ) : (
              <RadioGroup
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                sx={{ mt: 1 }}
              >
                {projects.map((project) => (
                  <Box
                    key={project._id}
                    sx={{
                      bgcolor: COLORS.bgPrimary,
                      border: `1px solid ${selectedProject === project._id ? COLORS.blue : COLORS.white}`,
                      borderRadius: "8px",
                      mb: 1,
                      transition: "border-color 0.2s ease",
                      "&:hover": {
                        borderColor:
                          selectedProject === project._id
                            ? COLORS.blue
                            : COLORS.textMuted,
                      },
                    }}
                  >
                    <FormControlLabel
                      value={project._id}
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
                          {project.name}
                        </Typography>
                      }
                      sx={{ m: 0, p: 1.5, width: "100%" }}
                    />
                  </Box>
                ))}
              </RadioGroup>
            )}
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
            disabled={inviteLoading || projects.length === 0}
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
              "&.Mui-disabled": {
                bgcolor: COLORS.blue,
                opacity: 0.7,
              },
            }}
          >
            {inviteLoading ? (
              <CircularProgress size={20} sx={{ color: COLORS.white }} />
            ) : (
              "Send Invite"
            )}
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
          {editError && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                mt: 1,
              }}
            >
              <Typography sx={{ color: "#ef4444", fontSize: "14px" }}>
                {editError}
              </Typography>
            </Box>
          )}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditName(e.target.value)
              }
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
                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus":
                  {
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditEmail(e.target.value)
              }
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
                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus":
                  {
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
                onClick={() => setEditRole("admin")}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editRole === "admin" ? COLORS.blue : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editRole === "admin" ? COLORS.blue : COLORS.textMuted,
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
                onClick={() => setEditRole("planner")}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editRole === "planner" ? COLORS.blue : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editRole === "planner" ? COLORS.blue : COLORS.textMuted,
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
                onClick={() => setEditRole("user")}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editRole === "user" ? COLORS.blue : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editRole === "user" ? COLORS.blue : COLORS.textMuted,
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
              Status <span style={{ color: COLORS.red }}>*</span>
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
              <Box
                onClick={() => setEditStatus("active")}
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  p: 1.5,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editStatus === "active" ? COLORS.green : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editStatus === "active" ? COLORS.green : COLORS.textMuted,
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
                      editStatus === "active"
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
                onClick={() => setEditStatus("blocked")}
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  p: 1.5,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${editStatus === "blocked" ? "#6b7280" : COLORS.white}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editStatus === "blocked" ? "#6b7280" : COLORS.textMuted,
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
                      editStatus === "blocked"
                        ? "#6b7280"
                        : COLORS.textSecondary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Blocked
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
            disabled={editLoading}
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
              "&.Mui-disabled": {
                bgcolor: COLORS.blue,
                opacity: 0.7,
              },
            }}
          >
            {editLoading ? (
              <CircularProgress size={20} sx={{ color: COLORS.white }} />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block/Unblock Confirmation Modal */}
      <Dialog
        open={blockModalOpen}
        onClose={handleCloseBlockModal}
        maxWidth="xs"
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
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              backgroundImage: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
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
            pt: 2,
          }}
        >
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            {userToBlock?.status === "blocked" ? "Unblock User" : "Block User"}
          </Typography>
          <IconButton
            onClick={handleCloseBlockModal}
            sx={{ color: COLORS.textMuted, mr: -1, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
            Are you sure you want to{" "}
            {userToBlock?.status === "blocked" ? "unblock" : "block"}{" "}
            <strong style={{ color: COLORS.textPrimary }}>
              {userToBlock?.name}
            </strong>
            ?
          </Typography>
          {userToBlock?.status !== "blocked" && (
            <Typography
              sx={{ color: COLORS.textMuted, fontSize: "13px", mt: 1 }}
            >
              This user will not be able to access the system until unblocked.
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleCloseBlockModal}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.bgPrimary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
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
            onClick={handleConfirmBlock}
            disabled={blockLoading}
            sx={{
              color: COLORS.white,
              bgcolor:
                userToBlock?.status === "blocked" ? COLORS.green : "#ef4444",
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor:
                  userToBlock?.status === "blocked" ? "#16a34a" : "#dc2626",
              },
              "&.Mui-disabled": {
                bgcolor:
                  userToBlock?.status === "blocked" ? COLORS.green : "#ef4444",
                opacity: 0.7,
              },
            }}
          >
            {blockLoading ? (
              <CircularProgress size={20} sx={{ color: COLORS.white }} />
            ) : userToBlock?.status === "blocked" ? (
              "Yes, Unblock"
            ) : (
              "Yes, Block"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
