import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Collapse,
  Link,
} from "@mui/material";
import { ArrowBack, MarkEmailReadOutlined } from "@mui/icons-material";
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

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldError("");
    setIsLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      if (response.success) {
        setSent(true);
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errors = apiError.response?.data?.errors;
      const emailError = errors?.find((e) => e.field === "email");
      if (emailError) {
        setFieldError(emailError.message);
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

  const backToLogin = (
    <Box sx={{ textAlign: "center", mt: 2.5 }}>
      <Link
        component={RouterLink}
        to="/login"
        underline="none"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: COLORS.textSecondary,
          fontSize: 14,
          "&:hover": { color: COLORS.blue },
        }}
      >
        <ArrowBack sx={{ fontSize: 16 }} />
        Back to sign in
      </Link>
    </Box>
  );

  /* Only reached once the API has confirmed the account and sent the mail —
     an unknown, pending or blocked address fails on the form instead. */
  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="Your reset link is on its way"
      >
        <Box sx={{ textAlign: "center" }}>
          <MarkEmailReadOutlined
            sx={{ fontSize: 48, color: COLORS.blue, mb: 1.5 }}
          />
          <Typography
            sx={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.7 }}
          >
            We've sent a link to <strong>{email}</strong> to reset your
            password. It expires in one hour.
          </Typography>
          <Typography sx={{ color: COLORS.textMuted, fontSize: 13, mt: 2 }}>
            Nothing arrived? Check your spam folder, or{" "}
            <Link
              component="button"
              type="button"
              onClick={() => setSent(false)}
              underline="none"
              sx={{ color: COLORS.blue, fontSize: 13 }}
            >
              try a different address
            </Link>
            .
          </Typography>
        </Box>
        {backToLogin}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
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
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
              setFieldError("");
            }}
            required
            autoFocus
            disabled={isLoading}
            error={!!fieldError}
            helperText={fieldError || " "}
            sx={authInputStyles}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading || !email}
          sx={authButtonStyles}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: COLORS.white }} />
          ) : (
            "Send reset link"
          )}
        </Button>
      </Box>

      {backToLogin}
    </AuthShell>
  );
};

export default ForgotPassword;
