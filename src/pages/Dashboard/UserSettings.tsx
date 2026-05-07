import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  PersonOutlined as PersonIcon,
  LockOutlined as LockIcon,
} from "@mui/icons-material";
import DashboardLayout from "../../layouts/DashboardLayout";
import { COLORS } from "../../constants/colors";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface FormErrors {
  [key: string]: string;
}

const UserSettings = () => {
  const { user, updateUser } = useAuth();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileErrors, setProfileErrors] = useState<FormErrors>({});

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => ({ ...prev, [field]: "" }));
    setProfileSuccess("");
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
    setPasswordSuccess("");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileErrors({});
    setProfileSuccess("");

    try {
      const response = await authAPI.updateProfile({
        name: profileForm.name.trim(),
      });

      if (response.success) {
        setProfileSuccess("Profile updated successfully");
        if (response.user && updateUser) {
          updateUser(response.user);
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errors?: Array<{ field: string; message: string }> } } };
      if (err.response?.data?.errors) {
        const errors: FormErrors = {};
        err.response.data.errors.forEach((e: { field: string; message: string }) => {
          errors[e.field] = e.message;
        });
        setProfileErrors(errors);
      } else {
        setProfileErrors({ general: "Failed to update profile" });
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordErrors({});
    setPasswordSuccess("");

    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      if (response.success) {
        setPasswordSuccess("Password changed successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errors?: Array<{ field: string; message: string }> } } };
      if (err.response?.data?.errors) {
        const errors: FormErrors = {};
        err.response.data.errors.forEach((e: { field: string; message: string }) => {
          errors[e.field] = e.message;
        });
        setPasswordErrors(errors);
      } else {
        setPasswordErrors({ general: "Failed to change password" });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      bgcolor: COLORS.bgPrimary,
      "& fieldset": { borderColor: COLORS.border },
      "&:hover fieldset": { borderColor: COLORS.blue },
      "&.Mui-focused fieldset": { borderColor: COLORS.blue },
    },
    "& .MuiInputLabel-root": { color: COLORS.textSecondary },
    "& .MuiInputLabel-root.Mui-focused": { color: COLORS.blue },
    "& .MuiOutlinedInput-input": { color: COLORS.textPrimary },
    "& .MuiFormHelperText-root": { marginLeft: 0 },
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account settings">
      <Box sx={{ maxWidth: 700, mx: "auto" }}>
        {/* Profile Section */}
        <Paper
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 3,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: "rgba(59, 130, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PersonIcon sx={{ color: COLORS.blue }} />
            </Box>
            <Box>
              <Typography
                sx={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: "16px" }}
              >
                Profile Information
              </Typography>
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "13px" }}>
                Update your personal details
              </Typography>
            </Box>
          </Box>

          {profileSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {profileSuccess}
            </Alert>
          )}
          {profileErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {profileErrors.general}
            </Alert>
          )}

          <form onSubmit={handleProfileSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Full Name"
                value={profileForm.name}
                onChange={(e) => handleProfileChange("name", e.target.value)}
                error={!!profileErrors.name}
                helperText={profileErrors.name}
                fullWidth
                sx={inputStyles}
              />
              <TextField
                label="Email Address"
                type="email"
                value={profileForm.email}
                disabled
                fullWidth
                sx={{
                  ...inputStyles,
                  "& .MuiOutlinedInput-root.Mui-disabled": {
                    bgcolor: COLORS.bgPrimary,
                  },
                  "& .MuiOutlinedInput-input.Mui-disabled": {
                    color: COLORS.textSecondary,
                    WebkitTextFillColor: COLORS.textSecondary,
                  },
                }}
                helperText="Email cannot be changed"
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={profileLoading}
                  sx={{
                    bgcolor: COLORS.blue,
                    textTransform: "none",
                    px: 3,
                    py: 1,
                    "&:hover": { bgcolor: "#2563eb" },
                    "&.Mui-disabled": { bgcolor: COLORS.bgTertiary },
                  }}
                >
                  {profileLoading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>

        {/* Password Section */}
        <Paper
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: "rgba(251, 191, 36, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LockIcon sx={{ color: COLORS.amber }} />
            </Box>
            <Box>
              <Typography
                sx={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: "16px" }}
              >
                Change Password
              </Typography>
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "13px" }}>
                Update your password to keep your account secure
              </Typography>
            </Box>
          </Box>

          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}
          {passwordErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordErrors.general}
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Current Password"
                type={showPasswords.current ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                error={!!passwordErrors.currentPassword}
                helperText={passwordErrors.currentPassword}
                fullWidth
                sx={inputStyles}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              current: !prev.current,
                            }))
                          }
                          edge="end"
                          sx={{ color: COLORS.textMuted }}
                        >
                          {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Divider sx={{ borderColor: COLORS.border, my: 1 }} />

              <TextField
                label="New Password"
                type={showPasswords.new ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                error={!!passwordErrors.newPassword}
                helperText={passwordErrors.newPassword || "Must be at least 6 characters"}
                fullWidth
                sx={inputStyles}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                          edge="end"
                          sx={{ color: COLORS.textMuted }}
                        >
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Confirm New Password"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                error={!!passwordErrors.confirmPassword}
                helperText={passwordErrors.confirmPassword}
                fullWidth
                sx={inputStyles}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              confirm: !prev.confirm,
                            }))
                          }
                          edge="end"
                          sx={{ color: COLORS.textMuted }}
                        >
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={passwordLoading}
                  sx={{
                    bgcolor: COLORS.amber,
                    color: "#fff",
                    textTransform: "none",
                    px: 3,
                    py: 1,
                    "&:hover": { bgcolor: "#f59e0b" },
                    "&.Mui-disabled": { bgcolor: COLORS.bgTertiary },
                  }}
                >
                  {passwordLoading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default UserSettings;
