import { useNavigate } from "react-router-dom";
import { Box, Card, Typography, Button } from "@mui/material";
import {
  CalendarTodayOutlined as CalendarIcon,
  GroupsOutlined as MeetingIcon,
  FileDownloadOutlined as ExportIcon,
} from "@mui/icons-material";
import PlannerLayout from "../../layouts/PlannerLayout";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import uploadIcon from "../../assets/sidebar/upload.png";
import dashboardIcon from "../../assets/sidebar/dashboard.png";
import activitiesIcon from "../../assets/sidebar/activitiesClipboard.png";
import actionIcon from "../../assets/sidebar/action.png";
import projectsIcon from "../../assets/sidebar/projects.png";
import activitiesPngIcon from "../../assets/activities.png";
import WeeklyReadinessSnapshot from "../../components/WeeklyReadinessSnapshot";
import RecentActivity from "../../components/RecentActivity";

const blueFilter =
  "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)";
const greenFilter =
  "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(632%) hue-rotate(93deg) brightness(92%) contrast(87%)";

const PlannerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.email?.split("@")[0] || "Planner";

  return (
    <PlannerLayout
      title="Dashboard"
      subtitle="Planner overview and quick actions"
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
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", lg: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontWeight: 700,
                mb: 1,
                fontSize: "20px",
              }}
            >
              Welcome back,{" "}
              {userName.charAt(0).toUpperCase() + userName.slice(1)}
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: COLORS.bgTertiary,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: COLORS.amber,
                  }}
                />
                <Typography
                  sx={{
                    color: COLORS.amber,
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  In Progress
                </Typography>
              </Box>
            </Box>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Cycle opened Mon 24 Mar · Review meeting scheduled Thu 27 Mar
              14:00
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Button
              onClick={() => navigate("/planner/programs-upload")}
              startIcon={
                <Box
                  component="img"
                  src={uploadIcon}
                  sx={{
                    width: 18,
                    height: 18,
                    filter: "brightness(0) invert(1)",
                  }}
                />
              }
              sx={{
                bgcolor: COLORS.blue,
                color: COLORS.white,
                textTransform: "none",
                px: 2.5,
                py: 1,
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: COLORS.blueHover,
                },
              }}
            >
              Upload Programme
            </Button>
            <Button
              onClick={() => navigate("/planner/weekly-dashboard")}
              startIcon={
                <Box
                  component="img"
                  src={dashboardIcon}
                  sx={{
                    width: 16,
                    height: 16,
                    filter: "brightness(0) invert(1)",
                  }}
                />
              }
              sx={{
                bgcolor: "transparent",
                color: COLORS.textPrimary,
                textTransform: "none",
                px: 2.5,
                py: 1,
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                border: `1px solid ${COLORS.border}`,
                "&:hover": {
                  bgcolor: COLORS.bgTertiary,
                },
              }}
            >
              Weekly Dashboard
            </Button>
          </Box>
        </Box>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 0.5,
                }}
              >
                Active Projects
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "32px",
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                3
              </Typography>
              <Typography
                sx={{
                  color: COLORS.white,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                2 in delivery, 1 pre-construction
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: COLORS.blueBgMedium,
                borderRadius: "4px",
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={projectsIcon}
                sx={{
                  width: 20,
                  height: 20,
                  filter: blueFilter,
                }}
              />
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 0.5,
                }}
              >
                Current Week Cycle
              </Typography>
              <Typography
                sx={{
                  color: COLORS.amber,
                  fontSize: "32px",
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                W47
              </Typography>
              <Typography
                sx={{
                  color: COLORS.white,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                Day 2 of 5 · 3 days remaining
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: "rgba(245, 158, 11, 0.1)",
                borderRadius: "4px",
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarIcon sx={{ color: COLORS.amber, fontSize: 20 }} />
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                Total Activities
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: "32px",
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                50
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "12px",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.green,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  24 on track
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                >
                  ·
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.amber,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  18 at risk
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                >
                  ·
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.red, fontSize: "12px", fontWeight: 400 }}
                >
                  8 critical
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                bgcolor: "rgba(34, 197, 94, 0.15)",
                borderRadius: "4px",
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={activitiesPngIcon}
                sx={{
                  width: 18,
                  height: 22,
                  filter: greenFilter,
                }}
              />
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 0.5,
                }}
              >
                Open Actions
              </Typography>
              <Typography
                sx={{
                  color: COLORS.red,
                  fontSize: "32px",
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                12
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "12px",
                }}
              >
                <Typography
                  component="span"
                  sx={{ color: COLORS.red, fontSize: "12px", fontWeight: 400 }}
                >
                  4 overdue
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: COLORS.textSecondary, fontSize: "12px" }}
                >
                  ·
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  8 pending
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                bgcolor: "rgba(239, 68, 68, 0.15)",
                borderRadius: "4px",
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={actionIcon}
                sx={{
                  width: 18,
                  height: 18,
                  filter:
                    "brightness(0) saturate(100%) invert(45%) sepia(78%) saturate(1846%) hue-rotate(331deg) brightness(99%) contrast(93%)",
                }}
              />
            </Box>
          </Box>
        </Card>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "400px 1fr" },
          gap: 3,
          mb: 3,
        }}
      >
        <WeeklyReadinessSnapshot />
        <RecentActivity onViewAll={() => {}} />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            color: COLORS.textPrimary,
            fontSize: "14px",
            fontWeight: 600,
            mb: 2,
          }}
        >
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          <Card
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 2.5,
              cursor: "pointer",
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "4px",
                bgcolor: "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <Box
                component="img"
                src={uploadIcon}
                sx={{ width: 18, height: 18, filter: blueFilter }}
              />
            </Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Upload Programme
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Import a new PDF programme schedule for parsing and analysis
            </Typography>
          </Card>

          <Card
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 2.5,
              cursor: "pointer",
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "4px",
                bgcolor: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <MeetingIcon sx={{ color: COLORS.amber, fontSize: 20 }} />
            </Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Open Meeting
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Start or join a weekly review meeting and record actions
            </Typography>
          </Card>

          <Card
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 2.5,
              cursor: "pointer",
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "4px",
                bgcolor: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <Box
                component="img"
                src={activitiesIcon}
                sx={{ width: 14, height: 18, filter: greenFilter }}
              />
            </Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              View Lookahead
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Review the 4-week lookahead with RAG status and activity details
            </Typography>
          </Card>

          <Card
            sx={{
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 2.5,
              cursor: "pointer",
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "4px",
                bgcolor: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <ExportIcon sx={{ color: COLORS.red, fontSize: 20 }} />
            </Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Generate Export
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Create PDF or Excel governance reports for stakeholder
              distribution
            </Typography>
          </Card>
        </Box>
      </Box>
    </PlannerLayout>
  );
};

export default PlannerDashboard;
