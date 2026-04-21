import { Box, Typography } from "@mui/material";
import { COLORS } from "../constants/colors";

interface WorkflowStepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
}

const StepIndicator = ({
  number,
  label,
  isActive,
  isCompleted,
  onClick,
}: {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: onClick ? "pointer" : "default",
      minWidth: { xs: 70, sm: 90, md: "auto" },
    }}
    onClick={onClick}
  >
    <Box
      sx={{
        width: { xs: 32, sm: 36, md: 38 },
        height: { xs: 32, sm: 36, md: 38 },
        borderRadius: "50%",
        bgcolor: isActive || isCompleted ? COLORS.blue : "transparent",
        border: isActive || isCompleted ? "none" : `2px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isActive || isCompleted ? "#fff" : COLORS.border,
        fontWeight: 500,
        fontSize: { xs: "13px", sm: "14px", md: "15px" },
        transition: "all 0.2s ease",
        "&:hover": {
          opacity: onClick ? 0.8 : 1,
        },
      }}
    >
      {number}
    </Box>
    <Typography
      sx={{
        color: isActive || isCompleted ? COLORS.textPrimary : COLORS.border,
        fontSize: { xs: "11px", sm: "12px", md: "14px" },
        fontWeight: 400,
        mt: { xs: 0.5, sm: 0.75, md: 1 },
        mb: 0,
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Typography>
  </Box>
);

const WorkflowStepper = ({ steps, currentStep, onStepClick }: WorkflowStepperProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: { xs: "flex-start", lg: "center" },
        maxWidth: "100%",
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        pb: 1,
        px: { xs: 1, sm: 0 },
        "&::-webkit-scrollbar": { display: "none" },
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {steps.map((step, index) => (
        <Box
          key={step}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            minWidth: "fit-content",
          }}
        >
          <StepIndicator
            number={index + 1}
            label={step}
            isActive={index + 1 === currentStep}
            isCompleted={index + 1 < currentStep}
            onClick={onStepClick ? () => onStepClick(index + 1) : undefined}
          />
          {index < steps.length - 1 && (
            <Box
              sx={{
                width: { xs: 40, sm: 55, md: 75 },
                height: 2,
                bgcolor: index + 1 < currentStep ? COLORS.blue : COLORS.border,
                mx: { xs: "16px", sm: "28px", md: "46px" },
                mt: { xs: "15px", sm: "17px", md: "19px" },
                transition: "all 0.2s ease",
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default WorkflowStepper;
