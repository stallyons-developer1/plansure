import { useState, useEffect } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Collapse,
  InputAdornment,
  IconButton,
  Link,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CheckCircleOutlined,
  ErrorOutlined,
} from "@mui/icons-material";
import AuthShell, {
  authInputStyles,
  authButtonStyles,
} from "../../components/AuthShell";
import { authAPI } from "../../services/api";
import { COLORS } from "../../constants/colors";

interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
    };
  };
}

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

const ResetPassword = () => {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();

  /* The link is checked before the form is shown: an expired token should say
     so straight away rather than after the person has typed a new password. */
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await authAPI.verifyResetToken(token);
        if (response.success) {
          setTokenValid(true);
          setAccountEmail(response.email || "");
        }
      } catch {
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };
    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsLoading(true);

    try {
      const response = await authAPI.resetPassword(token, {
        password,
        confirmPassword,
      });
      if (response.success) {
        setDone(true);
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errors = apiError.response?.data?.errors;
      if (errors?.length) {
        const next: FieldErrors = {};
        errors.forEach((e) => {
          if (e.field === "password") next.password = e.message;
          if (e.field === "confirmPassword") next.confirmPassword = e.message;
          /* The token can expire while the form is open. */
          if (e.field === "token") {
            setTokenValid(false);
            setError(e.message);
          }
        });
        setFieldErrors(next);
      } else {
        setError(
          apiError.response?.data?.message ||
            "Something went wrong. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const visibilityToggle = (
    shown: boolean,
    toggle: React.Dispatch<React.SetStateAction<boolean>>,
  ) => (
    <InputAdornment position="end">
      <IconButton
        onClick={() => toggle((current) => !current)}
        edge="end"
        disabled={isLoading}
        aria-label={shown ? "Hide password" : "Show password"}
        sx={{ color: COLORS.textMuted }}
      >
        {shown ? (
          <VisibilityOff fontSize="small" />
        ) : (
          <Visibility fontSize="small" />
        )}
      </IconButton>
    </InputAdornment>
  );

  if (isVerifying) {
    return (
      <AuthShell title="Reset password" subtitle="Checking your link">
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      </AuthShell>
    );
  }

  if (!tokenValid) {
    return (
      <AuthShell title="Link no longer valid" subtitle="Request a new one">
        <Box sx={{ textAlign: "center" }}>
          <ErrorOutlined
            sx={{ fontSize: 48, color: COLORS.redLight, mb: 1.5 }}
          />
          <Typography
            sx={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.7 }}
          >
            This reset link has expired or has already been used. Reset links
            last one hour and work once.
          </Typography>
        </Box>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate("/forgot-password")}
          sx={{ ...authButtonStyles, mt: 3 }}
        >
          Request a new link
        </Button>
        <Box sx={{ textAlign: "center", mt: 2.5 }}>
          <Link
            component={RouterLink}
            to="/login"
            underline="none"
            sx={{
              color: COLORS.textSecondary,
              fontSize: 14,
              "&:hover": { color: COLORS.blue },
            }}
          >
            Back to sign in
          </Link>
        </Box>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can sign in again">
        <Box sx={{ textAlign: "center" }}>
          <CheckCircleOutlined
            sx={{ fontSize: 48, color: COLORS.green, mb: 1.5 }}
          />
          <Typography
            sx={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.7 }}
          >
            Your password has been changed. Any other devices signed into this
            account have been signed out.
          </Typography>
        </Box>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate("/login")}
          sx={{ ...authButtonStyles, mt: 3 }}
        >
          Go to sign in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle={accountEmail ? `for ${accountEmail}` : "Choose a new password"}
    >
      <Collapse in={!!error}>
        <Box
          sx={{
            mb: 2.5,
            p: 1.5,
            bgcolor: COLORS.errorBg,
            border: `1px solid ${COLORS.errorBorder}`,
            borderRadius: "8px",
          }}
        >
          <Typography
            sx={{ color: COLORS.redLight, fontSize: 14, textAlign: "center" }}
          >
            {error}
          </Typography>
        </Box>
      </Collapse>

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ mb: 1 }}>
          <TextField
            fullWidth
            label="New password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors({});
            }}
            required
            autoFocus
            disabled={isLoading}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password || "At least 6 characters"}
            slotProps={{
              input: {
                endAdornment: visibilityToggle(showPassword, setShowPassword),
              },
            }}
            sx={{
              ...authInputStyles,
              "& .MuiFormHelperText-root": {
                ...authInputStyles["& .MuiFormHelperText-root"],
                color: fieldErrors.password
                  ? COLORS.redLight
                  : COLORS.textMuted,
              },
            }}
          />
        </Box>

        <Box sx={{ mt: 2, mb: 1 }}>
          <TextField
            fullWidth
            label="Confirm new password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors({});
            }}
            required
            disabled={isLoading}
            error={!!fieldErrors.confirmPassword}
            helperText={fieldErrors.confirmPassword || " "}
            slotProps={{
              input: {
                endAdornment: visibilityToggle(
                  showConfirmPassword,
                  setShowConfirmPassword,
                ),
              },
            }}
            sx={authInputStyles}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading || !password || !confirmPassword}
          sx={authButtonStyles}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: COLORS.white }} />
          ) : (
            "Reset password"
          )}
        </Button>
      </Box>
    </AuthShell>
  );
};

export default ResetPassword;
