import { Box, Card, Typography, Button } from "@mui/material";
import { CloudUploadOutlined as UploadIcon } from "@mui/icons-material";
import { COLORS } from "../constants/colors";

interface UploadPromptCardProps {
  title: string;
  description: string;
  buttonText?: string;
  onUpload?: () => void;
  icon?: React.ReactNode;
}

const UploadPromptCard = ({
  title,
  description,
  buttonText = "Upload File",
  onUpload,
  icon,
}: UploadPromptCardProps) => {
  return (
    <Card
      sx={{
        bgcolor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 2,
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: COLORS.blueBgMedium,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        {icon || <UploadIcon sx={{ fontSize: 32, color: COLORS.blue }} />}
      </Box>
      <Typography
        sx={{
          color: COLORS.textPrimary,
          fontSize: "16px",
          fontWeight: 600,
          mb: 1,
          textAlign: "center",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          color: COLORS.textSecondary,
          fontSize: "14px",
          fontWeight: 400,
          mb: 3,
          textAlign: "center",
          maxWidth: 300,
        }}
      >
        {description}
      </Typography>
      <Button
        variant="contained"
        onClick={onUpload}
        sx={{
          bgcolor: COLORS.blue,
          color: "#fff",
          textTransform: "none",
          px: 3,
          py: 1,
          borderRadius: "8px",
          fontWeight: 500,
          "&:hover": {
            bgcolor: COLORS.blueHover,
          },
        }}
      >
        {buttonText}
      </Button>
    </Card>
  );
};

export default UploadPromptCard;
