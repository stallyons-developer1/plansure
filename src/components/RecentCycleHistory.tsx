import { Box, Card, Typography } from "@mui/material";
import { COLORS } from "../constants/colors";

interface CycleHistoryItem {
  week: string;
  dates: string;
  status: string;
  statusType: "green" | "amber";
  score: number;
}

interface RecentCycleHistoryProps {
  cycleHistory: CycleHistoryItem[];
  title?: string;
}

const RecentCycleHistory = ({
  cycleHistory,
  title = "Recent Cycle History",
}: RecentCycleHistoryProps) => {
  return (
    <Card
      sx={{
        bgcolor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 2,
        p: { xs: 2, sm: 3 },
      }}
    >
      <Typography
        sx={{
          color: COLORS.textPrimary,
          fontSize: "16px",
          fontWeight: 600,
          mb: 3,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {cycleHistory.map((cycle, index) => (
          <Box
            key={index}
            sx={{
              bgcolor: "#161F32",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "7px",
              minHeight: 57,
              px: { xs: 1.5, sm: 2.5 },
              py: { xs: 1.5, sm: 0 },
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              alignItems: "center",
              gap: { xs: 1.5, sm: 0 },
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 500,
                  mb: 0,
                  lineHeight: 1.2,
                }}
              >
                {cycle.week}
              </Typography>
              <Typography
                sx={{
                  color: "#94A3B8",
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                {cycle.dates}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-start", sm: "center" },
              }}
            >
              <Box
                sx={{
                  bgcolor:
                    cycle.statusType === "green"
                      ? `${COLORS.green}15`
                      : `${COLORS.amber}15`,
                  border: `1px solid ${
                    cycle.statusType === "green" ? COLORS.green : COLORS.amber
                  }`,
                  color:
                    cycle.statusType === "green" ? COLORS.green : COLORS.amber,
                  px: { xs: 1.5, sm: 2.5 },
                  py: 0.75,
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {cycle.status}
              </Box>
            </Box>
            <Typography
              sx={{
                color: "#94A3B8",
                fontSize: "12px",
                fontWeight: 400,
                textAlign: { xs: "left", sm: "right" },
              }}
            >
              Score: {cycle.score}/100
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

export default RecentCycleHistory;
