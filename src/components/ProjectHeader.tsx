import { Box, Card, Typography } from "@mui/material";
import { COLORS } from "../constants/colors";
import WorkflowStepper from "./WorkflowStepper";

interface ProjectHeaderProps {
  breadcrumb: {
    label: string;
    onClick?: () => void;
  };
  projectName: string;
  phase: string;
  week: string;
  weekDates: string;
  planner: string;
  currentStep: number;
  steps: string[];
  onStepClick?: (stepNumber: number) => void;
  onMeetingOpen?: () => void;
}

const ProjectHeader = ({
  breadcrumb,
  projectName,
  phase,
  week,
  weekDates,
  planner,
  currentStep,
  steps,
  onStepClick,
  onMeetingOpen,
}: ProjectHeaderProps) => {
  return (
    <Card
      sx={{
        bgcolor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 3,
        minHeight: { xs: "auto", md: 210 },
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: 3,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: { xs: 2.5, md: 0 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "flex-start" },
          gap: { xs: 1.5, md: 2 },
          mb: 0,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.75, flexWrap: "wrap" }}>
            <Typography
              component="span"
              sx={{
                color: COLORS.border,
                fontSize: { xs: "11px", sm: "12px" },
                fontWeight: 400,
                cursor: breadcrumb.onClick ? "pointer" : "default",
                "&:hover": breadcrumb.onClick ? { textDecoration: "underline" } : {},
              }}
              onClick={breadcrumb.onClick}
            >
              {breadcrumb.label}
            </Typography>
            <Typography
              component="span"
              sx={{
                color: COLORS.textLight,
                fontSize: { xs: "11px", sm: "12px" },
                fontWeight: 400,
              }}
            >
              &nbsp;/ {projectName}
            </Typography>
          </Box>
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: { xs: "20px", sm: "24px", md: "26px" },
              fontWeight: 700,
              mb: 0.5,
              lineHeight: 1.2,
            }}
          >
            {projectName}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              component="span"
              sx={{
                color: COLORS.border,
                fontSize: { xs: "12px", sm: "14px" },
                fontWeight: 400,
              }}
            >
              Phase:
            </Typography>
            <Typography
              component="span"
              sx={{
                color: COLORS.textLight,
                fontSize: { xs: "12px", sm: "14px" },
                fontWeight: 400,
              }}
            >
              &nbsp;{phase}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: { xs: 1.5, sm: 2 },
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Typography
              sx={{
                color: COLORS.border,
                fontSize: { xs: "11px", sm: "12px" },
                fontWeight: 400,
                whiteSpace: "nowrap",
              }}
            >
              {week} ({weekDates})
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "flex-start", md: "flex-end" },
              }}
            >
              <Typography
                component="span"
                sx={{
                  color: COLORS.border,
                  fontSize: { xs: "11px", sm: "12px" },
                  fontWeight: 400,
                }}
              >
                Planner:
              </Typography>
              <Typography
                component="span"
                sx={{
                  color: COLORS.textLight,
                  fontSize: { xs: "11px", sm: "12px" },
                  fontWeight: 400,
                }}
              >
                &nbsp;{planner}
              </Typography>
            </Box>
          </Box>
          {currentStep === 5 ? (
            <Box
              onClick={onMeetingOpen}
              sx={{
                bgcolor: COLORS.blueBgMedium,
                color: COLORS.blue,
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: "10px",
                fontSize: { xs: "11px", sm: "13px" },
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                cursor: "pointer",
                border: `1px solid ${COLORS.blue}`,
                "&:hover": {
                  bgcolor: `${COLORS.blue}30`,
                },
              }}
            >
              Meeting Open
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: COLORS.bgTertiary,
                color: COLORS.textSecondary,
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: "10px",
                fontSize: { xs: "11px", sm: "13px" },
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {steps[currentStep - 1]}
            </Box>
          )}
        </Box>
      </Box>

      <WorkflowStepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={onStepClick}
      />
    </Card>
  );
};

export default ProjectHeader;
