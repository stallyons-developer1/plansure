import { Box, Card, Typography } from "@mui/material";
import { COLORS } from "../constants/colors";
import logo from "../assets/logo.png";

/* The signed-out pages — forgot password, reset password — share the login
   screen's frame. Kept here rather than copied into each so the three cannot
   drift apart. Login itself still carries its own copy; migrating it is a
   separate change and does not belong in this one. */

export const authInputStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: COLORS.bgSecondary,
    borderRadius: "8px",
    transition: "all 0.2s ease",
    "& fieldset": {
      borderColor: COLORS.borderDark,
      transition: "border-color 0.2s ease",
    },
    "&:hover fieldset": { borderColor: COLORS.borderLight },
    "&.Mui-focused fieldset": { borderColor: COLORS.blue },
    "&.Mui-error fieldset": { borderColor: COLORS.redLight },
    "&.Mui-error:hover fieldset": { borderColor: COLORS.redLight },
    "&.Mui-error.Mui-focused fieldset": { borderColor: COLORS.redLight },
  },
  "& .MuiInputLabel-root": {
    color: COLORS.textMuted,
    transition: "color 0.2s ease",
    "&.Mui-focused": { color: COLORS.textSecondary },
    "&.Mui-error": { color: COLORS.redLight },
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

export const authButtonStyles = {
  py: 1.5,
  bgcolor: COLORS.blue,
  borderRadius: "8px",
  textTransform: "none" as const,
  fontSize: 15,
  fontWeight: 500,
  boxShadow: "none",
  "&:hover": { bgcolor: COLORS.blueHover, boxShadow: "none" },
  "&.Mui-disabled": {
    bgcolor: COLORS.blueDisabled,
    color: "rgba(255, 255, 255, 0.5)",
  },
};

const AuthShell = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
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
          {title}
        </Typography>
        <Typography
          sx={{
            color: COLORS.textSecondary,
            textAlign: "center",
            mb: 3.5,
            fontSize: 14,
          }}
        >
          {subtitle}
        </Typography>

        {children}
      </Card>

      <Typography sx={{ mt: 4, color: COLORS.borderLight, fontSize: 13 }}>
        &copy; 2026 PlanSure. All rights reserved.
      </Typography>
    </Box>
  </Box>
);

export default AuthShell;
