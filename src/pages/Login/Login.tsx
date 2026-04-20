import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import logo from "../../assets/logo.png";

const inputStyles = {
  "& .MuiInputLabel-root": {
    color: COLORS.textMuted,
    "&.Mui-focused": {
      color: COLORS.textSecondary,
    },
  },
  "& .MuiOutlinedInput-root": {
    bgcolor: COLORS.bgSecondary,
    borderRadius: "8px",
    "& fieldset": {
      borderColor: COLORS.borderDark,
    },
    "&:hover fieldset": {
      borderColor: COLORS.borderLight,
    },
    "&.Mui-focused fieldset": {
      borderColor: COLORS.blue,
    },
  },
  "& .MuiOutlinedInput-input": {
    color: COLORS.textPrimary,
    py: 1.75,
    "&:-webkit-autofill": {
      WebkitBoxShadow: `0 0 0 100px ${COLORS.bgSecondary} inset`,
      WebkitTextFillColor: COLORS.textPrimary,
      caretColor: COLORS.textPrimary,
      borderRadius: "inherit",
    },
    "&:-webkit-autofill:hover": {
      WebkitBoxShadow: `0 0 0 100px ${COLORS.bgSecondary} inset`,
    },
    "&:-webkit-autofill:focus": {
      WebkitBoxShadow: `0 0 0 100px ${COLORS.bgSecondary} inset`,
    },
  },
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = login(email, password);

    if (result.success) {
      const user = JSON.parse(localStorage.getItem("plansure_user") || "{}");
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "planner":
          navigate("/planner");
          break;
        case "user":
          navigate("/dashboard");
          break;
        default:
          navigate("/dashboard");
      }
    } else {
      setError(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: COLORS.bgPrimary,
        backgroundImage:
          "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
        backgroundSize: "50px 50px",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              display: "inline-block",
              borderRadius: "8px",
              px: 2,
              py: 1,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="PlanSure"
              sx={{ height: 80, width: "auto", display: "block" }}
            />
          </Box>
        </Box>

        <Card
          sx={{
            width: "100%",
            bgcolor: COLORS.bgCard,
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "16px",
            p: { xs: 3, sm: 4 },
            boxShadow: "none",
          }}
        >
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.textPrimary,
              textAlign: "center",
              mb: 0.5,
            }}
          >
            Welcome back
          </Typography>
          <Typography
            sx={{
              color: COLORS.textSecondary,
              textAlign: "center",
              mb: 3.5,
              fontSize: 14,
            }}
          >
            Sign in to your account
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                bgcolor: COLORS.errorBg,
                border: `1px solid ${COLORS.errorBorder}`,
                color: COLORS.redLight,
                "& .MuiAlert-icon": { color: COLORS.redLight },
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              sx={{ mb: 2, ...inputStyles }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: COLORS.textMuted }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 1.5, ...inputStyles }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  size="small"
                  sx={{
                    color: COLORS.borderLight,
                    "&.Mui-checked": {
                      color: COLORS.blue,
                    },
                  }}
                />
              }
              label="Remember me"
              sx={{
                mb: 2,
                "& .MuiFormControlLabel-label": {
                  fontSize: 14,
                  color: COLORS.textSecondary,
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                py: 1.5,
                bgcolor: COLORS.blue,
                borderRadius: "8px",
                textTransform: "none",
                fontSize: 15,
                fontWeight: 500,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: COLORS.blueHover,
                  boxShadow: "none",
                },
                "&.Mui-disabled": {
                  bgcolor: COLORS.blueDisabled,
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: COLORS.white }} />
              ) : (
                "Sign in"
              )}
            </Button>
          </Box>
        </Card>

        <Typography
          sx={{
            mt: 4,
            color: COLORS.borderLight,
            fontSize: 13,
          }}
        >
          &copy; 2026 PlanSure. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
