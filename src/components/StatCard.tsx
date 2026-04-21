import { Card, Typography } from "@mui/material";
import { COLORS } from "../constants/colors";

interface StatCardProps {
  label: string;
  value: number | string;
  subLabel?: string;
  valueColor?: string;
}

const StatCard = ({
  label,
  value,
  subLabel,
  valueColor = COLORS.textPrimary,
}: StatCardProps) => (
  <Card
    sx={{
      bgcolor: COLORS.bgSecondary,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 2,
      height: 80,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      p: 1.5,
    }}
  >
    <Typography
      sx={{
        color: COLORS.textSecondary,
        fontSize: "12px",
        fontWeight: 500,
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        color: valueColor,
        fontSize: "24px",
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {value}
    </Typography>
    {subLabel && (
      <Typography
        sx={{
          color: COLORS.textSecondary,
          fontSize: "12px",
          fontWeight: 500,
          mt: 0.25,
        }}
      >
        {subLabel}
      </Typography>
    )}
  </Card>
);

export default StatCard;
