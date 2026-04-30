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
  CircularProgress,
  Collapse,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import logo from "../../assets/logo.png";

const baseInputStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: COLORS.bgSecondary,
    borderRadius: "8px",
    transition: "all 0.2s ease",
    "& fieldset": {
      borderColor: COLORS.borderDark,
      transition: "border-color 0.2s ease",
    },
    "&:hover fieldset": {
      borderColor: COLORS.borderLight,
    },
    "&.Mui-focused fieldset": {
      borderColor: COLORS.blue,
    },
    "&.Mui-error fieldset": {
      borderColor: COLORS.redLight,
    },
    "&.Mui-error:hover fieldset": {
      borderColor: COLORS.redLight,
    },
    "&.Mui-error.Mui-focused fieldset": {
      borderColor: COLORS.redLight,
    },
  },
  "& .MuiInputLabel-root": {
    color: COLORS.textMuted,
    transition: "color 0.2s ease",
    "&.Mui-focused": {
      color: COLORS.textSecondary,
    },
    "&.Mui-error": {
      color: COLORS.redLight,
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
  "& .MuiFormHelperText-root": {
    color: COLORS.redLight,
    marginLeft: 0,
    marginTop: "6px",
    fontSize: "12px",
    minHeight: "18px",
  },
};

interface FieldErrors {
  email?: string;
  password?: string;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const clearErrors = () => {
    if (error || fieldErrors.email || fieldErrors.password) {
      setError("");
      setFieldErrors({});
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    clearErrors();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    clearErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const result = await login(email, password);

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
      if (result.errors) {
        const errors: FieldErrors = {};
        result.errors.forEach((err) => {
          if (err.field === "email") {
            errors.email = err.message;
          } else if (err.field === "password") {
            errors.password = err.message;
          }
        });
        setFieldErrors(errors);
      } else if (result.error) {
        setError(result.error);
      }
    }
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
                sx={{
                  color: COLORS.redLight,
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                {error}
              </Typography>
            </Box>
          </Collapse>

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Email address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                disabled={isLoading}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email || "\u00A0"}
                sx={baseInputStyles}
              />
            </Box>

            <Box sx={{ mb: 1 }}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={isLoading}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password || "\u00A0"}
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
                sx={baseInputStyles}
              />
            </Box>

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
