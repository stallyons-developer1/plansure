import {
  Box,
  Card,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  LinearProgress,
  Link,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { COLORS } from "../../constants/colors";
import { projectAPI } from "../../services/api";
import activitiesIcon from "../../assets/activities.png";
import openActionsIcon from "../../assets/sidebar/activitiesClipboard.png";
import governanceScoreIcon from "../../assets/governancescore.png";

interface Project {
  _id: string;
  name: string;
  status: string;
  phase: string;
  description?: string;
  startDate: string;
  endDate?: string;
  governanceScore?: number;
  createdAt: string;
}

const GovernanceScoreIcon = ({ color }: { color: string }) => {
  const getFilter = () => {
    if (color === COLORS.green) {
      return "brightness(0) saturate(100%) invert(65%) sepia(52%) saturate(535%) hue-rotate(93deg) brightness(92%) contrast(87%)";
    } else if (color === COLORS.amber) {
      return "brightness(0) saturate(100%) invert(67%) sepia(89%) saturate(430%) hue-rotate(2deg) brightness(103%) contrast(104%)";
    }
    return "none";
  };

  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: "8px",
        bgcolor: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        component="img"
        src={governanceScoreIcon}
        sx={{
          width: 18,
          height: 18,
          filter: getFilter(),
        }}
      />
    </Box>
  );
};

const ActivitiesIcon = () => (
  <Box
    sx={{
      width: 36,
      height: 36,
      borderRadius: "8px",
      bgcolor: `${COLORS.blue}20`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Box
      component="img"
      src={activitiesIcon}
      sx={{
        width: 14,
        height: 18,
      }}
    />
  </Box>
);

const OpenActionsIcon = () => (
  <Box
    sx={{
      width: 36,
      height: 36,
      borderRadius: "8px",
      bgcolor: `${COLORS.amber}20`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Box
      component="img"
      src={openActionsIcon}
      sx={{
        width: 16,
        height: 18,
        filter:
          "brightness(0) saturate(100%) invert(67%) sepia(89%) saturate(430%) hue-rotate(2deg) brightness(103%) contrast(104%)",
      }}
    />
  </Box>
);

const ProjectCard = ({
  project,
  onViewDashboard,
}: {
  project: Project;
  onViewDashboard: () => void;
}) => {
  const statusColor =
    project.status.toLowerCase() === "active" ? COLORS.green : COLORS.amber;
  const governanceScore = project.governanceScore || 0;
  const governanceColor = governanceScore >= 70 ? COLORS.green : COLORS.amber;
  const governanceStatus = governanceScore >= 70 ? "green" : "amber";

  return (
    <Card
      sx={{
        bgcolor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 2,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 0.5,
        }}
      >
        <Typography
          sx={{
            color: COLORS.textLight,
            fontWeight: 600,
            fontSize: "16px",
          }}
        >
          {project.name}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            bgcolor: `${statusColor}20`,
            px: 1.5,
            py: 0.5,
            borderRadius: "6px",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: statusColor,
            }}
          />
          <Typography
            sx={{
              color: statusColor,
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {project.status}
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          color: COLORS.textSecondary,
          fontSize: "12px",
          mb: 2,
        }}
      >
        {project.phase}
      </Typography>

      <Box
        sx={{
          bgcolor: COLORS.bgTertiary,
          borderRadius: 2,
          p: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <GovernanceScoreIcon color={governanceColor} />
        <Box>
          <Typography
            sx={{
              color: COLORS.textLight,
              fontWeight: 400,
              fontSize: "12px",
              mb: 0.25,
            }}
          >
            Governance Score
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                color: governanceColor,
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              {governanceScore}
            </Typography>
            <Box
              sx={{
                bgcolor: `${governanceColor}30`,
                color: governanceColor,
                px: 1.25,
                py: 0.25,
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {governanceStatus.toUpperCase()}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box
          sx={{
            bgcolor: COLORS.bgTertiary,
            borderRadius: 2,
            p: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ActivitiesIcon />
          <Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              0
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "10px",
                fontWeight: 400,
              }}
            >
              Activities
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            bgcolor: COLORS.bgTertiary,
            borderRadius: 2,
            p: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <OpenActionsIcon />
          <Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              0
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "10px",
                fontWeight: 400,
              }}
            >
              Open Actions
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.75,
          }}
        >
          <Typography
            sx={{
              color: COLORS.textLight,
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            Overall Progress
          </Typography>
          <Typography
            sx={{
              color: COLORS.textLight,
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            0%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={0}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: COLORS.bgTertiary,
            "& .MuiLinearProgress-bar": {
              bgcolor: governanceColor,
              borderRadius: 3,
            },
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pt: 2,
          borderTop: `1px solid ${COLORS.borderDark}`,
          mt: "auto",
        }}
      >
        <Link
          component="button"
          underline="none"
          onClick={onViewDashboard}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: COLORS.blue,
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            bgcolor: "transparent",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          <BarChartIcon sx={{ fontSize: 16 }} />
          View Dashboard
        </Link>
        <Link
          href="#"
          underline="none"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: COLORS.textSecondary,
            fontSize: "12px",
            fontWeight: 400,
            "&:hover": { color: COLORS.textPrimary },
          }}
        >
          <SettingsIcon sx={{ fontSize: 14 }} />
          Settings
        </Link>
      </Box>
    </Card>
  );
};

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectAPI.getAll();
      if (response.success) {
        setProjects(response.projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.phase.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      project.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="Projects" subtitle="Manage your projects">
      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          borderRadius: "12px",
          p: 2,
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "stretch",
          }}
        >
          <TextField
            placeholder="Search projects by name or phase..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                bgcolor: COLORS.bgPrimary,
                borderRadius: "8px",
                height: 38,
                "& fieldset": {
                  borderColor: COLORS.border,
                  borderWidth: 1,
                },
                "&:hover fieldset": {
                  borderColor: COLORS.border,
                },
                "&.Mui-focused fieldset": {
                  borderColor: COLORS.border,
                  borderWidth: 1,
                },
              },
              "& .MuiOutlinedInput-input": {
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 400,
                py: 0,
                "&::placeholder": {
                  color: COLORS.textMuted,
                  opacity: 1,
                  fontWeight: 400,
                },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#ffffff", fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              width: { xs: "100%", sm: 180 },
              bgcolor: COLORS.bgPrimary,
              borderRadius: "8px",
              height: 38,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: COLORS.border,
                borderWidth: 1,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: COLORS.border,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: COLORS.border,
                borderWidth: 1,
              },
              "& .MuiSelect-select": {
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 400,
                py: 0,
                display: "flex",
                alignItems: "center",
              },
              "& .MuiSvgIcon-root": {
                color: COLORS.textSecondary,
              },
            }}
            MenuProps={{
              slotProps: {
                paper: {
                  sx: {
                    bgcolor: COLORS.bgSecondary,
                    border: `1px solid ${COLORS.borderDark}`,
                    borderRadius: "8px",
                    mt: 0.5,
                    "& .MuiMenuItem-root": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      "&:hover": {
                        bgcolor: COLORS.bgTertiary,
                      },
                      "&.Mui-selected": {
                        bgcolor: COLORS.blueBgMedium,
                        "&:hover": {
                          bgcolor: COLORS.blueBgHover,
                        },
                      },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="on hold">On Hold</MenuItem>
          </Select>
        </Box>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <CircularProgress sx={{ color: COLORS.blue }} />
        </Box>
      ) : filteredProjects.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <Typography sx={{ color: COLORS.textMuted, fontSize: "14px" }}>
            No projects available
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onViewDashboard={() =>
                navigate(`/dashboard/projects/${project._id}`)
              }
            />
          ))}
        </Box>
      )}
    </DashboardLayout>
  );
};

export default Projects;
