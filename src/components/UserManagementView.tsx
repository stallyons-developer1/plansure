import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Select,
  MenuItem,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  PeopleOutlined as PeopleIcon,
  VerifiedUserOutlined as AdminIcon,
  CalendarTodayOutlined as PlannerIcon,
  PersonOutlined as UserIcon,
  Send as SendIcon,
  DeleteOutlineOutlined as DeleteIcon,
} from "@mui/icons-material";
import { COLORS } from "../constants/colors";
import editIcon from "../assets/tabler_edit.png";
import { userAPI, projectAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface User {
  _id: string;
  name: string;
  initials: string;
  email: string;
  role: "admin" | "planner" | "user";
  /* Set on exactly one admin account — the owner. */
  isSuperAdmin?: boolean;
  /* Decided by the server: an admin manages everyone, a Planner or User only
     the accounts they invited themselves. */
  canManage?: boolean;
  projectAccess: string;
  projectIds?: string[];
  /* Only what an admin granted directly — projectIds also carries access
     derived from assigned actions, which must not be turned into a grant by
     saving the edit form. */
  grantedProjectIds?: string[];
  allProjects?: boolean;
  status: "active" | "pending" | "blocked";
  lastLogin: string | null;
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

/*
 * The whole User Management screen minus its chrome. Each role tree wraps it
 * in its own layout, so Admin, Planner and User share one implementation
 * rather than three copies that drift apart. What a person may do is decided
 * inside, from their own role.
 */
const UserManagementView = ({
  Layout,
}: {
  /* Mirrors AdminLayout / PlannerLayout / DashboardLayout, which all take the
     same props and all require a title. */
  Layout: React.ComponentType<{
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
  }>;
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  /* Projects granted at invite time. Only offered for the User role — the
     other roles are not scoped to projects this way. */
  const [inviteProjects, setInviteProjects] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "planner" | "user">(
    "user",
  );
  const [editStatus, setEditStatus] = useState<"active" | "blocked">("active");
  const [editProjects, setEditProjects] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [resendingUserId, setResendingUserId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          userAPI.getAll(listFilters),
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
    setInviteProjects([]);
    setInviteError("");
  };

  const handleSendInvite = async () => {
    if (!inviteName || !inviteEmail || !selectedRole) {
      return;
    }
    setInviteLoading(true);
    setInviteError("");

    try {
      const response = await userAPI.invite({
        name: inviteName,
        email: inviteEmail,
        role: selectedRole === "SuperAdmin" ? "admin" : selectedRole.toLowerCase(),
        ...(selectedRole === "SuperAdmin" ? { isSuperAdmin: true } : {}),
        /* Every scoped role picks its projects here. A Super Admin is the one
           exception — the account reaches every project, so there is nothing
           to choose. */
        ...(selectedRole === "User" ||
        selectedRole === "Planner" ||
        selectedRole === "Admin"
          ? { projectIds: inviteProjects }
          : {}),
      });

      if (response.success) {
        const usersRes = await userAPI.getAll(listFilters);
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
    /* Only the directly granted projects are editable here — access derived
       from assigned actions is computed on read and is not stored. */
    setEditProjects(user.grantedProjectIds || []);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("user");
    setEditStatus("active");
    setEditProjects([]);
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
        ...(editRole === "user" ||
        editRole === "planner" ||
        editRole === "admin"
          ? { projects: editProjects }
          : {}),
      });

      const usersRes = await userAPI.getAll(listFilters);
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

  /* Deletion is permanent and the account cannot be recovered, so it is kept
     behind the same confirmation step as blocking. The server refuses to delete
     the signed-in account or, for a PM, the Super Admin; the icon is hidden in
     those cases so nobody is offered an action that will be rejected. */
  /* Mirrors the server's invitation hierarchy: an account may create another
     at its own level or below, never above. */
  const myLevel = currentUser?.isSuperAdmin
    ? 4
    : currentUser?.role === "admin"
      ? 3
      : currentUser?.role === "planner"
        ? 2
        : 1;

  /* The screen asks for the accounts this person can see: the ones sharing a
     project with them, the ones not yet on any project, and the ones they
     invited. The server works out which of those apply, and ignores the flag
     entirely for the Super Admin, who sees everyone. */
  const listFilters = { managedOnly: true };

  /* Why a row's controls are closed, or null when they are open. canManage is
     the server's own answer — an admin manages everyone, anyone else only the
     accounts they invited — so the reason appears on hover rather than after a
     rejected request. */
  const blockedReason = (user: User): string | null => {
    if (user.canManage === false) {
      return "You can only manage the accounts you invited";
    }
    if (user.isSuperAdmin && !currentUser?.isSuperAdmin) {
      return "The Super Admin account cannot be changed from here";
    }
    return null;
  };

  const canDeleteUser = (user: User) =>
    blockedReason(user) === null && user._id !== currentUser?.id;

  const deleteReason = (user: User): string =>
    user._id === currentUser?.id
      ? "You cannot delete your own account"
      : (blockedReason(user) ?? "Delete User");

  const handleOpenDeleteModal = (user: User) => {
    setUserToDelete(user);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    setDeleteError("");
    try {
      await userAPI.delete(userToDelete._id);
      const usersRes = await userAPI.getAll(listFilters);
      setUsers(usersRes.users || []);
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Error deleting user:", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Could not delete this user. Please try again.";
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResendInvite = async (userId: string) => {
    setResendingUserId(userId);
    try {
      await userAPI.resendInvite(userId);
    } catch (error) {
      console.error("Error resending invite:", error);
    } finally {
      setResendingUserId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);

    // An admin reaches every project, so they stay listed whichever one is
    // picked rather than looking unassigned.
    const matchesProject =
      !projectFilter ||
      user.allProjects ||
      (user.projectIds || []).includes(projectFilter);

    return matchesSearch && matchesProject;
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const plannerCount = users.filter((u) => u.role === "planner").length;
  const userCount = users.filter((u) => u.role === "user").length;

  /* An "admin" account is a PM to the people using this. The Super Admin is
     the one account carrying the isSuperAdmin flag. */
  const formatRole = (role: string, isSuperAdmin?: boolean) => {
    if (role === "admin") return isSuperAdmin ? "Super Admin" : "PM";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
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
      <Layout title="User Management" subtitle="Manage users and roles">
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
      </Layout>
    );
  }

  return (
    <Layout
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
            <Select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              displayEmpty
              sx={{
                bgcolor: COLORS.bgPrimary,
                color: COLORS.textPrimary,
                borderRadius: "8px",
                fontSize: "14px",
                minWidth: { xs: "100%", md: "200px" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.border,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.textMuted,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.blue,
                },
                "& .MuiSelect-select": { py: 1, px: 2 },
                "& .MuiSvgIcon-root": { color: COLORS.textMuted },
              }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      bgcolor: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      mt: 0.5,
                      "& .MuiMenuItem-root": {
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">All Projects</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project._id} value={project._id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
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
                gridTemplateColumns: "280px 1fr 100px 140px 100px 165px 120px",
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
                      "280px 1fr 100px 140px 100px 165px 120px",
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
                        /* Without this the circle is squeezed into an oval
                           whenever the name beside it wraps to a second line. */
                        flexShrink: 0,
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
                        whiteSpace: "nowrap",
                        textAlign: "center",
                      }}
                    >
                      {formatRole(user.role, user.isSuperAdmin)}
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
                      /* Wrapping the timestamp made some rows taller than
                         others, so the action icons no longer lined up. */
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatLastLogin(user.lastLogin)}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 1.5,
                    }}
                  >
                    {user.status === "pending" &&
                      (resendingUserId === user._id ? (
                        <CircularProgress
                          size={18}
                          sx={{ color: COLORS.blue }}
                        />
                      ) : (
                        <SendIcon
                          onClick={() => {
                            if (blockedReason(user)) return;
                            handleResendInvite(user._id);
                          }}
                          sx={{
                            fontSize: 20,
                            color: COLORS.blue,
                            cursor: blockedReason(user)
                              ? "not-allowed"
                              : "pointer",
                            opacity: blockedReason(user) ? 0.25 : 0.5,
                            "&:hover": {
                              opacity: blockedReason(user) ? 0.25 : 1,
                            },
                          }}
                          titleAccess={
                            blockedReason(user) || "Resend Invite"
                          }
                        />
                      ))}
                    <Box
                      component="img"
                      src={editIcon}
                      onClick={() => {
                        if (blockedReason(user)) return;
                        handleOpenEditModal(user);
                      }}
                      title={blockedReason(user) || "Edit User"}
                      sx={{
                        width: 20,
                        height: 20,
                        cursor: blockedReason(user) ? "not-allowed" : "pointer",
                        opacity: blockedReason(user) ? 0.25 : 0.5,
                        "&:hover": {
                          opacity: blockedReason(user) ? 0.25 : 1,
                        },
                      }}
                    />
                    <DeleteIcon
                      onClick={() => {
                        if (!canDeleteUser(user)) return;
                        handleOpenDeleteModal(user);
                      }}
                      sx={{
                        fontSize: 20,
                        color: COLORS.textMuted,
                        cursor: canDeleteUser(user) ? "pointer" : "not-allowed",
                        opacity: canDeleteUser(user) ? 0.5 : 0.25,
                        "&:hover": canDeleteUser(user)
                          ? { opacity: 1, color: "#ef4444" }
                          : { opacity: 0.25 },
                      }}
                      titleAccess={deleteReason(user)}
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
              {myLevel >= 4 && (
                <Box
                  onClick={() => {
                    setSelectedRole("SuperAdmin");
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    p: 2,
                    bgcolor: COLORS.bgPrimary,
                    border: `1px solid ${selectedRole === "SuperAdmin" ? COLORS.blue : COLORS.white}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease",
                    "&:hover": {
                      borderColor:
                        selectedRole === "SuperAdmin"
                          ? COLORS.blue
                          : COLORS.textMuted,
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
                      whiteSpace: "nowrap",
                    }}
                  >
                    Super Admin
                  </Box>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "13px",
                      flex: 1,
                    }}
                  >
                    Everything a PM can do, across every project, and manages
                    the other admin accounts.
                  </Typography>
                </Box>
              )}
              {myLevel >= 3 && (
              <Box
                onClick={() => {
                  setSelectedRole("Admin");
                }}
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
                  PM
                </Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Runs the governance cycle — PM Override, mark a week Close-Out
                  Eligible, close and lock it, and move the project on.
                </Typography>
              </Box>
              )}

              {myLevel >= 2 && (
              <Box
                onClick={() => {
                  setSelectedRole("Planner");
                }}
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
              )}

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
                  Closes out the actions assigned to them, and views
                  dashboards, activities and reports.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Project access is scoped per user, so it is only asked for once
              the User role is chosen. Multiple projects can be granted. */}
          {(selectedRole === "User" ||
            selectedRole === "Planner" ||
            selectedRole === "Admin") && (
            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                Project Access
              </Typography>
              <Select
                multiple
                fullWidth
                displayEmpty
                value={inviteProjects}
                onChange={(e) =>
                  setInviteProjects(
                    typeof e.target.value === "string"
                      ? e.target.value.split(",")
                      : e.target.value,
                  )
                }
                renderValue={(selected) =>
                  selected.length === 0 ? (
                    <Box component="span" sx={{ color: COLORS.textMuted }}>
                      No projects
                    </Box>
                  ) : (
                    projects
                      .filter((p) => selected.includes(p._id))
                      .map((p) => p.name)
                      .join(", ")
                  )
                }
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  color: COLORS.textPrimary,
                  borderRadius: "8px",
                  fontSize: "14px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.textMuted,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.blue,
                  },
                  "& .MuiSelect-select": { py: 1.4, px: 1.75 },
                  "& .MuiSvgIcon-root": { color: COLORS.textMuted },
                }}
                MenuProps={{
                  slotProps: {
                    paper: {
                      sx: {
                        bgcolor: COLORS.bgSecondary,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "8px",
                        mt: 0.5,
                        maxHeight: 280,
                        "& .MuiMenuItem-root": {
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                        },
                      },
                    },
                  },
                }}
              >
                {projects.length === 0 ? (
                  <MenuItem disabled value="">
                    No projects available
                  </MenuItem>
                ) : (
                  projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      <Checkbox
                        checked={inviteProjects.includes(project._id)}
                        sx={{
                          color: COLORS.textMuted,
                          p: 0.5,
                          mr: 1,
                          "&.Mui-checked": { color: COLORS.blue },
                        }}
                      />
                      {project.name}
                    </MenuItem>
                  ))
                )}
              </Select>
              <Typography
                sx={{ color: COLORS.textMuted, fontSize: "12px", mt: 0.5 }}
              >
                Optional — projects can be granted later.
              </Typography>
            </Box>
          )}
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
            disabled={inviteLoading}
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
                  PM
                </Box>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Runs the governance cycle — PM Override, mark a week Close-Out
                  Eligible, close and lock it, and move the project on.
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
                  Closes out the actions assigned to them, and views
                  dashboards, activities and reports.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Same project scoping as the invite dialog, so access can be
              corrected after the fact. */}
          {(editRole === "user" ||
            editRole === "planner" ||
            editRole === "admin") && (
            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                Project Access
              </Typography>
              <Select
                multiple
                fullWidth
                displayEmpty
                value={editProjects}
                onChange={(e) =>
                  setEditProjects(
                    typeof e.target.value === "string"
                      ? e.target.value.split(",")
                      : e.target.value,
                  )
                }
                renderValue={(selected) =>
                  selected.length === 0 ? (
                    <Box component="span" sx={{ color: COLORS.textMuted }}>
                      No projects
                    </Box>
                  ) : (
                    projects
                      .filter((p) => selected.includes(p._id))
                      .map((p) => p.name)
                      .join(", ")
                  )
                }
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  color: COLORS.textPrimary,
                  borderRadius: "8px",
                  fontSize: "14px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.textMuted,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.blue,
                  },
                  "& .MuiSelect-select": { py: 1.4, px: 1.75 },
                  "& .MuiSvgIcon-root": { color: COLORS.textMuted },
                }}
                MenuProps={{
                  slotProps: {
                    paper: {
                      sx: {
                        bgcolor: COLORS.bgSecondary,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "8px",
                        mt: 0.5,
                        maxHeight: 280,
                        "& .MuiMenuItem-root": {
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                        },
                      },
                    },
                  },
                }}
              >
                {projects.length === 0 ? (
                  <MenuItem disabled value="">
                    No projects available
                  </MenuItem>
                ) : (
                  projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      <Checkbox
                        checked={editProjects.includes(project._id)}
                        sx={{
                          color: COLORS.textMuted,
                          p: 0.5,
                          mr: 1,
                          "&.Mui-checked": { color: COLORS.blue },
                        }}
                      />
                      {project.name}
                    </MenuItem>
                  ))
                )}
              </Select>
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
                onClick={() => {
                  if (!editingUser || !canDeleteUser(editingUser)) return;
                  /* Closing the edit modal clears editingUser, so hold on to
                     the account before handing it to the confirmation. */
                  const target = editingUser;
                  handleCloseEditModal();
                  handleOpenDeleteModal(target);
                }}
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  p: 1.5,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${COLORS.white}`,
                  borderRadius: "8px",
                  cursor:
                    editingUser && canDeleteUser(editingUser)
                      ? "pointer"
                      : "not-allowed",
                  opacity: editingUser && canDeleteUser(editingUser) ? 1 : 0.4,
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editingUser && canDeleteUser(editingUser)
                        ? "#ef4444"
                        : COLORS.white,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#ef4444",
                  }}
                />
                <Typography
                  sx={{
                    color: "#ef4444",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Delete
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
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
            Delete User
          </Typography>
          <IconButton
            onClick={handleCloseDeleteModal}
            sx={{ color: COLORS.textMuted, mr: -1, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: COLORS.textPrimary }}>
              {userToDelete?.name}
            </strong>
            ?
          </Typography>
          <Typography sx={{ color: COLORS.textMuted, fontSize: "13px", mt: 1 }}>
            This removes the account permanently and cannot be undone. Their
            project access ends immediately, and they will need a fresh
            invitation to return.
          </Typography>
          {deleteError && (
            <Typography
              sx={{
                color: "#ef4444",
                fontSize: "13px",
                mt: 2,
              }}
            >
              {deleteError}
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
            onClick={handleCloseDeleteModal}
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
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
            sx={{
              color: COLORS.white,
              bgcolor: "#ef4444",
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor: "#dc2626",
              },
              "&.Mui-disabled": {
                bgcolor: "#ef4444",
                opacity: 0.7,
              },
            }}
          >
            {deleteLoading ? (
              <CircularProgress size={20} sx={{ color: COLORS.white }} />
            ) : (
              "Yes, Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default UserManagementView;
