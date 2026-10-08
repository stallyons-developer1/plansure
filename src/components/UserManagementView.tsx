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
  VisibilityOutlined as ViewIcon,
} from "@mui/icons-material";
import { COLORS } from "../constants/colors";
import editIcon from "../assets/tabler_edit.png";
import { userAPI, projectAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

type Membership = { project: string; role: string };

/* The ladder, strongest first. Nobody hands out a rung above their own. Super
   Admin is not a place on a project — it reaches every one of them — so it is
   offered only where a whole account is being created, and choosing it puts
   the per-project rows aside. */
const ROLE_CHOICES: { value: string; label: string; level: number }[] = [
  { value: "SuperAdmin", label: "Super Admin", level: 4 },
  { value: "admin", label: "PM", level: 3 },
  { value: "planner", label: "Planner", level: 2 },
  { value: "user", label: "User", level: 1 },
];

/*
 * One row per project, each with its own role, because the same person can run
 * one programme and only watch another. A project already named is dropped
 * from the other rows' choices so it cannot be granted twice with two
 * different roles.
 */
/*
 * The menu for every dropdown here.
 *
 * Capped at three rows because a project list grows without limit and an
 * uncapped menu runs past the bottom of the modal. The background is set
 * outright — the default paper is translucent over a dark surface, so the form
 * behind it showed through the options.
 */
const MENU_ROW = 40;
const selectMenuProps = {
  slotProps: {
    paper: {
      sx: {
        maxHeight: MENU_ROW * 3 + 8,
        bgcolor: COLORS.bgSecondary,
        backgroundImage: "none",
        border: `1px solid ${COLORS.border}`,
        "& .MuiMenuItem-root": {
          color: COLORS.textPrimary,
          fontSize: "14px",
          minHeight: MENU_ROW,
          "&:hover": { bgcolor: COLORS.bgTertiary },
          "&.Mui-selected": {
            bgcolor: COLORS.bgTertiary,
            "&:hover": { bgcolor: COLORS.bgTertiary },
          },
        },
      },
    },
  },
};

const MembershipRows = ({
  projects,
  value,
  onChange,
  maxLevel,
  allowSuperAdmin = false,
}: {
  projects: { _id: string; name: string; myRole?: string }[];
  value: Membership[];
  onChange: (next: Membership[]) => void;
  /* The ceiling for an account that reaches every project regardless of what
     it is placed on — an owner. Everyone else is judged project by project. */
  maxLevel: number;
  /* Editing an account changes its places; it does not make it an owner. That
     is a decision taken when the account is created. */
  allowSuperAdmin?: boolean;
}) => {
  const taken = new Set(value.map((m) => m.project));

  /*
   * Nobody hands out more than they hold, and what they hold is not the same
   * everywhere: a PM on one project may only be a User on the next, and there
   * they can pass on nothing but User. So the choices come from the role held
   * on the project the row names, not from the account's own role, which is
   * only the strongest it holds anywhere.
   */
  const offered = ROLE_CHOICES.filter(
    (r) => r.value !== "SuperAdmin" || (allowSuperAdmin && maxLevel >= 4),
  );

  const rolesFor = (projectId: string) => {
    if (maxLevel >= 4) return offered;
    /* Before a project is named there is no role to read, and an empty
       dropdown reads as broken. The account's own level stands in until the
       project is chosen, at which point the choice is clamped to it. */
    if (!projectId) return offered.filter((r) => r.level <= maxLevel);
    const here = projects.find((p) => p._id === projectId)?.myRole;
    const ceiling = ROLE_CHOICES.find((r) => r.value === here)?.level ?? 0;
    return offered.filter((r) => r.level <= ceiling);
  };

  const fieldSx = {
    bgcolor: COLORS.bgPrimary,
    borderRadius: "8px",
    color: COLORS.textPrimary,
    fontSize: "14px",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.white },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: COLORS.textMuted,
    },
    "& .MuiSvgIcon-root": { color: COLORS.textMuted },
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {value.map((row, i) => (
        <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Select
            size="small"
            displayEmpty
            disabled={row.role === "SuperAdmin"}
            MenuProps={selectMenuProps}
            value={row.project}
            onChange={(e) => {
              const project = String(e.target.value);
              const allowed = rolesFor(project);
              const next = [...value];
              /* A role carried over from the project chosen before may be more
                 than can be granted on this one. */
              next[i] = {
                ...row,
                project,
                role: allowed.some((r) => r.value === row.role)
                  ? row.role
                  : allowed[allowed.length - 1]?.value || "user",
              };
              onChange(next);
            }}
            sx={{ ...fieldSx, flex: 2 }}
          >
            <MenuItem value="" disabled>
              Select project
            </MenuItem>
            {projects
              .filter((p) => p._id === row.project || !taken.has(p._id))
              .map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name}
                </MenuItem>
              ))}
          </Select>

          <Select
            size="small"
            MenuProps={selectMenuProps}
            value={row.role}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...row, role: String(e.target.value) };
              onChange(next);
            }}
            sx={{ ...fieldSx, flex: 1 }}
          >
            {rolesFor(row.project).map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </Select>

          <DeleteIcon
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            titleAccess="Remove this project"
            sx={{
              fontSize: 20,
              color: COLORS.textMuted,
              cursor: "pointer",
              opacity: 0.5,
              "&:hover": { opacity: 1, color: "#ef4444" },
            }}
          />
        </Box>
      ))}

      <Button
        onClick={() => onChange([...value, { project: "", role: "user" }])}
        disabled={taken.size >= projects.length}
        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
        sx={{
          alignSelf: "flex-start",
          color: COLORS.blue,
          textTransform: "none",
          fontSize: "13px",
          px: 1,
          "&.Mui-disabled": { color: COLORS.textMuted },
        }}
      >
        Assign a Project
      </Button>
    </Box>
  );
};

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
  /* What the account holds project by project. One person can run one
     programme as its PM and only watch another as a User. */
  memberships?: {
    project: string;
    projectName?: string;
    role: string;
    /* Each project is invited for separately, so each has its own state. */
    status?: "pending" | "active";
  }[];
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

/* Named in place. Four values stacked in a card read as a list of unexplained
   words; what matters is which project is held at which role, and whether its
   invitation has been taken up. */
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
    <Typography
      sx={{
        color: COLORS.textMuted,
        fontSize: "13px",
        minWidth: 62,
        flexShrink: 0,
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

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
  const [projects, setProjects] = useState<
    { _id: string; name: string; myRole?: string }[]
  >([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  /* Projects granted at invite time. Only offered for the User role — the
     other roles are not scoped to projects this way. */
  const [inviteMemberships, setInviteMemberships] = useState<Membership[]>([]);
  const [inviteError, setInviteError] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "planner" | "user">(
    "user",
  );
  const [editStatus, setEditStatus] = useState<
    "active" | "blocked" | "pending"
  >("active");
  const [editMemberships, setEditMemberships] = useState<Membership[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [resendingUserId, setResendingUserId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  /* The role and project columns came off the table once a person could hold a
     different role on each project — one cell cannot say that. The detail sits
     behind this instead. */
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [resendMessage, setResendMessage] = useState("");
  const [resendSucceeded, setResendSucceeded] = useState(false);

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
    setInviteMemberships([]);
    setInviteError("");
  };

  /* The submit refused an incomplete form by quietly doing nothing, which
     reads as a broken button. The same test now holds the button instead. */
  const inviteIsComplete =
    inviteName.trim() !== "" &&
    inviteEmail.trim() !== "" &&
    (inviteMemberships.some((m) => m.role === "SuperAdmin") ||
      inviteMemberships.some((m) => m.project));

  const handleSendInvite = async () => {
    /* An owner reaches every project, so the rows beside it say nothing and
       are dropped. Picking it anywhere makes the whole invitation an owner's. */
    const asSuperAdmin = inviteMemberships.some((m) => m.role === "SuperAdmin");
    const rows = asSuperAdmin ? [] : inviteMemberships.filter((m) => m.project);

    /* Either an owner, or at least one project with a role on it — an account
       is what its projects make it, and there is nothing else to say here. */
    if (!inviteName || !inviteEmail || (!asSuperAdmin && rows.length === 0)) {
      return;
    }

    /* The server still records one headline role per account, so it can decide
       where a sign-in lands. It is the strongest of the rows held. */
    const RANK: Record<string, number> = { user: 1, planner: 2, admin: 3 };
    const headlineRole = asSuperAdmin
      ? "admin"
      : rows.reduce(
          (best, m) =>
            (RANK[m.role] ?? 0) > (RANK[best] ?? 0) ? m.role : best,
          "user",
        );

    setInviteLoading(true);
    setInviteError("");

    try {
      const response = await userAPI.invite({
        name: inviteName,
        email: inviteEmail,
        role: headlineRole,
        ...(asSuperAdmin ? { isSuperAdmin: true } : { memberships: rows }),
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
    /* Carried across as it stands. Collapsing anything that was not blocked
       into "active" quietly activated a pending account the moment someone
       corrected a name on it, before the invitation had been accepted. */
    setEditStatus(
      user.status === "blocked"
        ? "blocked"
        : user.status === "pending"
          ? "pending"
          : "active",
    );
    /* Falls back to the old shape — one role across the granted projects — for
       accounts that have not been given per-project rows yet. */
    setEditMemberships(
      user.memberships && user.memberships.length > 0
        ? user.memberships.map((m) => ({ project: m.project, role: m.role }))
        : (user.grantedProjectIds || []).map((id) => ({
            project: id,
            role: user.role,
          })),
    );
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("user");
    setEditStatus("active");
    setEditMemberships([]);
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
        memberships: editMemberships.filter((m) => m.project),
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

  const handleResendInvite = async (userId: string, role?: string) => {
    setResendingUserId(role ? `${userId}:${role}` : userId);
    setResendMessage("");
    try {
      /* The server answers 200 even when the mail itself was refused — it has
         still reissued the link — so the outcome has to come from the body.
         Reporting "resent" on the status code alone told people an email was
         on its way when none had left the building. */
      const res = await userAPI.resendInvite(userId, role);
      setResendSucceeded(res?.emailSent !== false);
      setResendMessage(
        res?.emailSent === false
          ? res?.message || "The invitation could not be emailed."
          : "Invitation resent.",
      );
    } catch (error) {
      console.error("Error resending invite:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setResendSucceeded(false);
      setResendMessage(
        err.response?.data?.message || "The invitation could not be resent.",
      );
    } finally {
      setResendingUserId(null);
    }
  };

  const closeViewingUser = () => {
    setViewingUser(null);
    setResendMessage("");
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
                      /* Three rows then scroll — the project list grows without
                         limit and an uncapped menu runs off the page. */
                      maxHeight: MENU_ROW * 3 + 8,
                      bgcolor: COLORS.bgSecondary,
                      backgroundImage: "none",
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
                gridTemplateColumns: "280px 1fr 165px 150px",
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
                    gridTemplateColumns: "280px 1fr 165px 150px",
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
                    <ViewIcon
                      onClick={() => setViewingUser(user)}
                      titleAccess="View access"
                      sx={{
                        fontSize: 20,
                        color: COLORS.textMuted,
                        cursor: "pointer",
                        opacity: 0.5,
                        "&:hover": { opacity: 1 },
                      }}
                    />
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

          {/* Kept while the per-project model settles.

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
          */}

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
            <MembershipRows
              projects={projects}
              value={inviteMemberships}
              onChange={setInviteMemberships}
              maxLevel={myLevel}
              allowSuperAdmin
            />
            <Typography
              sx={{ color: COLORS.textMuted, fontSize: "12px", mt: 0.5 }}
            >
              {inviteMemberships.some((m) => m.role === "SuperAdmin")
                ? "A Super Admin reaches every project, so no project is named here."
                : "At least one project is required. Add a row per project — each carries its own role."}
            </Typography>
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
            disabled={inviteLoading || !inviteIsComplete}
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
                color: COLORS.white,
                opacity: 0.4,
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
              Email Address
            </Typography>
            {/* The address identifies the account and the invitation is tied to
                it, so it is shown rather than edited — a new address means a
                new invitation. */}
            <Box
              component="input"
              type="email"
              readOnly
              value={editEmail}
              title="The email address cannot be changed. Invite the person again under a new address."
              sx={{
                width: "100%",
                padding: "12px 14px",
                background: COLORS.bgPrimary,
                border: `1px solid ${COLORS.white}`,
                borderRadius: "8px",
                color: COLORS.textMuted,
                cursor: "not-allowed",
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

          {/* A single role across the account no longer decides anything —
              the role is held per project in the rows below, so this picker
              was offering a choice the server does not read. Kept here while
              the per-project model settles.

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
          */}

          {/* An owner reaches every project, so there is nothing per-project
              to set for one. Everyone else gets a row per project. */}
          {!editingUser?.isSuperAdmin && (
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
              <MembershipRows
                projects={projects}
                value={editMemberships}
                onChange={setEditMemberships}
                maxLevel={myLevel}
              />
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
              {/* An account stays Pending until the person accepts; only they
                  can end that, so it is shown rather than offered. */}
              <Box
                onClick={() => {
                  if (editStatus === "pending") return;
                  setEditStatus("active");
                }}
                title={
                  editStatus === "pending"
                    ? "Waiting for the invitation to be accepted"
                    : undefined
                }
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  p: 1.5,
                  bgcolor: COLORS.bgPrimary,
                  border: `1px solid ${
                    editStatus === "pending"
                      ? COLORS.amber
                      : editStatus === "active"
                        ? COLORS.green
                        : COLORS.white
                  }`,
                  borderRadius: "8px",
                  cursor: editStatus === "pending" ? "default" : "pointer",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    borderColor:
                      editStatus === "pending"
                        ? COLORS.amber
                        : editStatus === "active"
                          ? COLORS.green
                          : COLORS.textMuted,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor:
                      editStatus === "pending" ? COLORS.amber : COLORS.green,
                  }}
                />
                <Typography
                  sx={{
                    color:
                      editStatus === "pending"
                        ? COLORS.amber
                        : editStatus === "active"
                          ? COLORS.green
                          : COLORS.textSecondary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {editStatus === "pending" ? "Pending" : "Active"}
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

      {/* Access detail — what the account holds, project by project. */}
      <Dialog
        open={viewingUser !== null}
        onClose={closeViewingUser}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.8)" } },
          paper: {
            sx: {
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              backgroundImage: "none",
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
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              {viewingUser?.name}
            </Typography>
            <Typography sx={{ color: COLORS.textMuted, fontSize: "13px" }}>
              {viewingUser?.email}
            </Typography>
          </Box>
          <IconButton
            onClick={closeViewingUser}
            sx={{ color: COLORS.textMuted, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {viewingUser?.isSuperAdmin ? (
            <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
              Super Admin — reaches every project.
            </Typography>
          ) : viewingUser?.memberships && viewingUser.memberships.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {viewingUser.memberships.map((m) => {
                const state = m.status === "pending" ? "pending" : "active";
                const busy = resendingUserId === `${viewingUser._id}:${m.role}`;

                return (
                  <Box
                    key={`${m.project}:${m.role}`}
                    sx={{
                      bgcolor: COLORS.bgPrimary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      px: 2,
                      py: 1.25,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.25,
                    }}
                  >
                    {/* Project and role on one line, the role against the
                        right edge where the eye goes to compare one row with
                        the next. */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Field label="Project:">
                        <Typography
                          sx={{ color: COLORS.textPrimary, fontSize: "14px" }}
                        >
                          {m.projectName || "Project"}
                        </Typography>
                      </Field>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Typography
                          sx={{ color: COLORS.textMuted, fontSize: "13px" }}
                        >
                          Role:
                        </Typography>
                        <Box
                          sx={{
                            bgcolor:
                              roleColors[m.role]?.bg ||
                              "rgba(107, 114, 128, 0.15)",
                            color: roleColors[m.role]?.color || "#6b7280",
                            px: 2,
                            py: 0.25,
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatRole(m.role)}
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                        minHeight: 30,
                      }}
                    >
                      <Field label="Status:">
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.75,
                          }}
                        >
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              bgcolor: statusColors[state].dot,
                            }}
                          />
                          <Typography
                            sx={{
                              color: statusColors[state].color,
                              fontSize: "13px",
                              fontWeight: 500,
                            }}
                          >
                            {formatStatus(state)}
                          </Typography>
                        </Box>
                      </Field>

                      {/* Only an invitation still waiting can be sent again. */}
                      {/* Paired with Role above, so each side of the card
                          carries two lines rather than leaving a hole beside
                          an accepted row. */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Typography
                          sx={{ color: COLORS.textMuted, fontSize: "13px" }}
                        >
                          Invite:
                        </Typography>
                        {state === "active" ? (
                          <Typography
                            sx={{
                              color: COLORS.textSecondary,
                              fontSize: "13px",
                            }}
                          >
                            Accepted
                          </Typography>
                        ) : (
                          /* Icon and label both stay put while it sends; the
                             spinner follows the text. A button whose contents
                             swap mid-click reads as a different button. */
                          <Button
                            onClick={() => {
                              if (blockedReason(viewingUser)) return;
                              handleResendInvite(viewingUser._id, m.role);
                            }}
                            disabled={
                              busy || blockedReason(viewingUser) !== null
                            }
                            startIcon={<SendIcon sx={{ fontSize: 15 }} />}
                            endIcon={
                              busy ? (
                                <CircularProgress
                                  size={14}
                                  sx={{ color: COLORS.blue }}
                                />
                              ) : undefined
                            }
                            title={
                              blockedReason(viewingUser) || "Resend Invite"
                            }
                            sx={{
                              color: COLORS.blue,
                              textTransform: "none",
                              fontSize: "12px",
                              fontWeight: 500,
                              minWidth: 0,
                              /* Pulled back by its own padding so the icon
                                 starts where the badge does on the line above;
                                 the button's padding and the row's gap were
                                 stacking into a hole after the label. */
                              px: 0.5,
                              ml: -0.5,
                              py: 0.25,
                              "& .MuiButton-startIcon": {
                                marginRight: "6px",
                                marginLeft: 0,
                              },
                              "& .MuiButton-endIcon": { marginLeft: "6px" },
                              "&:hover": {
                                bgcolor: "rgba(59, 130, 246, 0.08)",
                              },
                              "&.Mui-disabled": {
                                color: COLORS.blue,
                                opacity: 0.4,
                              },
                            }}
                          >
                            Resend
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
              No projects yet.
            </Typography>
          )}

          {resendMessage && (
            <Typography
              sx={{
                mt: 2,
                fontSize: "13px",
                color: resendSucceeded ? COLORS.green : COLORS.red,
              }}
            >
              {resendMessage}
            </Typography>
          )}
        </DialogContent>
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
