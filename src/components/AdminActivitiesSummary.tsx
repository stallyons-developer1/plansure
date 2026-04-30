import { Box, Typography } from "@mui/material";
import { COLORS } from "../constants/colors";
import warningIcon from "../assets/warning.png";

interface AdminActivitiesSummaryProps {
  totalActivities: number;
  readyCount: number;
  atRiskCount: number;
  blockedCount: number;
  completeCount: number;
  lastUpdated: string;
}

const AdminActivitiesSummary = ({
  totalActivities,
  readyCount,
  atRiskCount,
  blockedCount,
  completeCount,
  lastUpdated,
}: AdminActivitiesSummaryProps) => {
  return (
    <Box
      sx={{
        bgcolor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        mt: 2,
        px: { xs: 2, sm: 3 },
        py: 1.5,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "flex-start", md: "center" },
        justifyContent: "space-between",
        gap: { xs: 2, md: 0 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2, sm: 4 },
          width: { xs: "100%", md: "auto" },
        }}
      >
        <Typography
          sx={{
            color: COLORS.textPrimary,
            fontSize: "14px",
            fontWeight: 600,
            pr: { xs: 0, sm: 3 },
            pb: { xs: 1, sm: 0 },
            borderRight: {
              xs: "none",
              sm: `1px solid ${COLORS.borderDark}`,
            },
            borderBottom: {
              xs: `1px solid ${COLORS.borderDark}`,
              sm: "none",
            },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          {totalActivities} Activities
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: COLORS.green,
              }}
            />
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
            >
              Ready:
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {readyCount}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: COLORS.amber,
              }}
            />
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
            >
              At Risk:
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {atRiskCount}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: COLORS.blue,
              }}
            />
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
            >
              Complete:
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {completeCount}
            </Typography>
          </Box>
          <Box
            sx={{
              width: "1px",
              height: 20,
              bgcolor: COLORS.borderDark,
              mx: 1,
              display: { xs: "none", sm: "block" },
            }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="img"
              src={warningIcon}
              sx={{
                width: 18,
                height: 18,
              }}
            />
            <Typography
              sx={{ color: COLORS.textSecondary, fontSize: "13px" }}
            >
              Blocked:
            </Typography>
            <Typography
              sx={{
                color: COLORS.red,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {blockedCount}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Typography
        sx={{
          color: COLORS.textSecondary,
          fontSize: "13px",
        }}
      >
        Last updated: {lastUpdated}
      </Typography>
    </Box>
  );
};

export default AdminActivitiesSummary;
