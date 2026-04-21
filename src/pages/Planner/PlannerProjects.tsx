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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlannerLayout from "../../layouts/PlannerLayout";
import { COLORS } from "../../constants/colors";
import activitiesIcon from "../../assets/activities.png";
import openActionsIcon from "../../assets/sidebar/activitiesClipboard.png";
import governanceScoreIcon from "../../assets/governancescore.png";

interface Project {
  id: number;
  name: string;
  status: string;
  phase: string;
  governanceScore: number;
  governanceStatus: string;
  activities: number;
  openActions: number;
  progress: number;
}

const initialProjectsData: Project[] = [
  {
    id: 1,
    name: "Crossrail Phase 2",
    status: "Active",
    phase: "Construction phase-Week 24",
    governanceScore: 78,
    governanceStatus: "green",
    activities: 50,
    openActions: 14,
    progress: 62,
  },
  {
    id: 2,
    name: "HS2 Northern Section",
    status: "On Hold",
    phase: "Design phase-Week 12",
    governanceScore: 78,
    governanceStatus: "amber",
    activities: 50,
    openActions: 14,
    progress: 62,
  },
  {
    id: 3,
    name: "Thames Tideway",
    status: "Active",
    phase: "Pre-construction phase-Week 8",
    governanceScore: 78,
    governanceStatus: "green",
    activities: 50,
    openActions: 14,
    progress: 62,
  },
];

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
  const statusColor = project.status === "Active" ? COLORS.green : COLORS.amber;
  const governanceColor =
    project.governanceStatus === "green" ? COLORS.green : COLORS.amber;

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
              {project.governanceScore}
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
              {project.governanceStatus.toUpperCase()}
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
              {project.activities}
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
              {project.openActions}
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
            {project.progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={project.progress}
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

const PlannerProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(initialProjectsData);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [phase, setPhase] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.phase.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      project.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = () => {
    setNewProjectModalOpen(true);
  };

  const handleCloseModal = () => {
    setNewProjectModalOpen(false);
    setProjectName("");
    setPhase("");
    setDescription("");
    setStartDate("");
  };

  const handleCreateProject = () => {
    if (!projectName || !phase || !startDate) return;

    const newProject: Project = {
      id: projects.length + 1,
      name: projectName,
      status: "Active",
      phase: `${phase.charAt(0).toUpperCase() + phase.slice(1)} phase-Week 1`,
      governanceScore: 0,
      governanceStatus: "green",
      activities: 0,
      openActions: 0,
      progress: 0,
    };

    setProjects([...projects, newProject]);
    handleCloseModal();
  };

  const newProjectButton = (
    <Button
      startIcon={<AddIcon />}
      onClick={handleOpenModal}
      sx={{
        bgcolor: COLORS.blue,
        color: COLORS.white,
        textTransform: "none",
        px: 2,
        py: 1,
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 500,
        "&:hover": {
          bgcolor: COLORS.blueHover,
        },
      }}
    >
      New Project
    </Button>
  );

  return (
    <PlannerLayout
      title="Projects"
      subtitle="Manage your projects"
      headerAction={newProjectButton}
    >
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
            key={project.id}
            project={project}
            onViewDashboard={() => navigate(`/planner/projects/${project.id}`)}
          />
        ))}
      </Box>

      <Dialog
        open={newProjectModalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.8)",
            },
          },
          paper: {
            sx: {
              bgcolor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.white}`,
              borderRadius: "12px",
              backgroundImage: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              maxWidth: 480,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            pt: 1,
            borderBottom: `1px solid ${COLORS.white}`,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              New Project
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              Create a new project to track
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseModal}
            sx={{ color: COLORS.textMuted, mr: -1, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                  mt: 2,
                }}
              >
                Project Name <span style={{ color: COLORS.red }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g. Crossrail Phase 3"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    py: 1.2,
                    "&::placeholder": {
                      color: COLORS.textMuted,
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                  mt: 2,
                }}
              >
                Phase <span style={{ color: COLORS.red }}>*</span>
              </Typography>
              <Select
                fullWidth
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                displayEmpty
                sx={{
                  bgcolor: COLORS.bgPrimary,
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.white,
                    borderWidth: 1,
                  },
                  "& .MuiSelect-select": {
                    color: phase ? COLORS.textPrimary : COLORS.textMuted,
                    fontSize: "14px",
                    py: 1.2,
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
                        border: `1px solid ${COLORS.borderLight}`,
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
                <MenuItem value="" disabled>
                  Select phase
                </MenuItem>
                <MenuItem value="pre-construction">Pre-construction</MenuItem>
                <MenuItem value="design">Design</MenuItem>
                <MenuItem value="construction">Construction</MenuItem>
                <MenuItem value="commissioning">Commissioning</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                  mt: 2,
                }}
              >
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Brief description of the project scope and objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    "&::placeholder": {
                      color: COLORS.textMuted,
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  color: COLORS.border,
                  fontSize: "12px",
                  fontWeight: 500,
                  mb: 0.5,
                  mt: 2,
                }}
              >
                Start Date <span style={{ color: COLORS.red }}>*</span>
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="mm/dd/yyyy"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.white,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.white,
                      borderWidth: 1,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: startDate ? COLORS.textPrimary : COLORS.textMuted,
                    fontSize: "14px",
                    py: 1.2,
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                      opacity: 0.6,
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${COLORS.white}`,
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleCloseModal}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.bgPrimary,
              border: `1px solid ${COLORS.white}`,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": {
                bgcolor: COLORS.bgTertiary,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.blue,
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                bgcolor: COLORS.blueHover,
              },
            }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </PlannerLayout>
  );
};

export default PlannerProjects;
