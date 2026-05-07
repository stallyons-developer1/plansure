import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { NotificationsActive as NotificationsIcon } from "@mui/icons-material";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { COLORS } from "../constants/colors";

interface PushNotificationPromptProps {
  open: boolean;
  onClose: () => void;
}

export const PushNotificationPrompt = ({
  open,
  onClose,
}: PushNotificationPromptProps) => {
  const { isSupported, isEnabled, permissionStatus, requestPermission } =
    usePushNotifications();

  const handleEnable = async () => {
    const success = await requestPermission();
    if (success) {
      onClose();
    }
  };

  if (!isSupported || isEnabled) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.7)" } },
        paper: {
          sx: {
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.borderDark}`,
            borderRadius: "12px",
            minWidth: 380,
            maxWidth: 440,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          color: COLORS.textPrimary,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pb: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "10px",
            bgcolor: COLORS.blueBgMedium,
          }}
        >
          <NotificationsIcon sx={{ color: COLORS.blue, fontSize: 22 }} />
        </Box>
        Enable Push Notifications
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography sx={{ color: COLORS.textSecondary, mb: 2, fontSize: 14 }}>
          Stay updated with real-time notifications for:
        </Typography>
        <Box
          component="ul"
          sx={{
            color: COLORS.textMuted,
            pl: 2.5,
            m: 0,
            fontSize: 14,
            "& li": {
              mb: 0.75,
            },
          }}
        >
          <li>New actions assigned to you</li>
          <li>Actions reassigned to you</li>
          <li>Actions marked as completed</li>
          <li>Project assignments</li>
        </Box>
        {permissionStatus === "denied" && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: "8px",
              bgcolor: COLORS.errorBg,
              border: `1px solid ${COLORS.errorBorder}`,
            }}
          >
            <Typography sx={{ color: COLORS.redLight, fontSize: 13 }}>
              Notifications are blocked in your browser. Please enable them in
              your browser settings to receive push notifications.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{
            color: COLORS.textSecondary,
            bgcolor: "transparent",
            border: `1px solid ${COLORS.borderDark}`,
            borderRadius: "8px",
            textTransform: "none",
            px: 2.5,
            "&:hover": {
              bgcolor: COLORS.whiteHover,
              borderColor: COLORS.borderLight,
            },
          }}
        >
          Not now
        </Button>
        <Button
          onClick={handleEnable}
          disabled={permissionStatus === "denied"}
          sx={{
            color: COLORS.white,
            bgcolor: COLORS.blue,
            borderRadius: "8px",
            textTransform: "none",
            px: 2.5,
            minWidth: 100,
            "&:hover": { bgcolor: COLORS.blueHover },
            "&:disabled": {
              bgcolor: COLORS.disabledBlue,
              color: COLORS.textMuted,
            },
          }}
        >
          Enable
        </Button>
      </DialogActions>
    </Dialog>
  );
};
