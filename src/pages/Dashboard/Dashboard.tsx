import {
  Box,
  Card,
  Typography,
  Chip,
  Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import ActivitiesTable, { activitiesData } from "../../components/ActivitiesTable";
import WeeklyReadinessSnapshot from "../../components/WeeklyReadinessSnapshot";


const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.email?.split("@")[0] || "User";

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Project overview and quick actions"
    >
      <Card
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 3,
          p: 3,
          mb: 3,
        }}
      >
        <Typography
          sx={{
            color: COLORS.textPrimary,
            fontWeight: 700,
            mb: 1,
            fontSize: "20px",
          }}
        >
          Welcome back, {userName.charAt(0).toUpperCase() + userName.slice(1)}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{ color: COLORS.blue, fontWeight: 600, fontSize: "14px" }}
            >
              Crossrail Phase 2
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontWeight: 400,
                fontSize: "14px",
              }}
            >
              — Week 47 cycle is currently
            </Typography>
          </Box>
          <Chip
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: COLORS.amber,
                  ml: 1,
                }}
              />
            }
            label="In Progress"
            size="small"
            sx={{
              bgcolor: COLORS.bgTertiary,
              color: COLORS.amber,
              fontWeight: 600,
              fontSize: "0.875rem",
              height: 32,
              px: 1,
              borderRadius: "20px",
              "& .MuiChip-icon": {
                marginLeft: "8px",
                marginRight: "-4px",
              },
            }}
          />
        </Box>
        <Typography
          sx={{
            color: COLORS.textSecondary,
            fontSize: "12px",
            fontWeight: 400,
          }}
        >
          Cycle opened Mon 24 Mar - Review meeting scheduled Thu 27 Mar 14:00
        </Typography>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "400px 1fr" },
          gap: 3,
        }}
      >
        <WeeklyReadinessSnapshot />

        <Card
          sx={{
            bgcolor: COLORS.bgPrimary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 3,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textLight,
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Recent Tasks
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                Latest events across Crossrail Phase 2
              </Typography>
            </Box>
            <Link
              component="button"
              underline="none"
              onClick={() => navigate("/dashboard/activities")}
              sx={{
                color: COLORS.blue,
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                bgcolor: "transparent",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              View all
            </Link>
          </Box>

          <Box
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <Box sx={{ minWidth: 1200 }}>
              <ActivitiesTable activities={activitiesData} />
            </Box>
          </Box>
        </Card>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;
