import { Box, Card, Typography } from "@mui/material";
import {
  WarningAmberOutlined as WarningIcon,
  CheckOutlined as CheckIcon,
  GroupsOutlined as MeetingIcon,
  FileDownloadOutlined as ExportMuiIcon,
  FolderOutlined as ProjectIcon,
} from "@mui/icons-material";
import { COLORS } from "../constants/colors";
import uploadIcon from "../assets/sidebar/upload.png";
import actionIcon from "../assets/sidebar/action.png";

const blueFilter =
  "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)";
const redFilter =
  "brightness(0) saturate(100%) invert(45%) sepia(78%) saturate(1846%) hue-rotate(331deg) brightness(99%) contrast(93%)";

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  author: string;
  color: "blue" | "amber" | "red" | "green";
  projectName?: string;
}

const getIconForType = (type: string, color: string) => {
  const colorMap: Record<string, { borderColor: string; iconColor: string; bgColor: string }> = {
    blue: {
      borderColor: COLORS.blue,
      iconColor: COLORS.blue,
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    amber: {
      borderColor: COLORS.amber,
      iconColor: COLORS.amber,
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
    red: {
      borderColor: COLORS.red,
      iconColor: COLORS.red,
      bgColor: "rgba(239, 68, 68, 0.1)",
    },
    green: {
      borderColor: COLORS.green,
      iconColor: COLORS.green,
      bgColor: "rgba(34, 197, 94, 0.1)",
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  const getIcon = () => {
    switch (type) {
      case "programme_upload":
        return (
          <Box
            component="img"
            src={uploadIcon}
            sx={{ width: 20, height: 20, filter: blueFilter }}
          />
        );
      case "action_created":
        return (
          <Box
            component="img"
            src={actionIcon}
            sx={{ width: 18, height: 18, filter: redFilter }}
          />
        );
      case "action_completed":
        return <CheckIcon sx={{ fontSize: 20 }} />;
      case "rag_assessment":
        return <WarningIcon sx={{ fontSize: 20 }} />;
      case "cycle_closed":
        return <CheckIcon sx={{ fontSize: 20 }} />;
      case "report_exported":
        return <ExportMuiIcon sx={{ fontSize: 22 }} />;
      case "meeting_held":
        return <MeetingIcon sx={{ fontSize: 20 }} />;
      case "project_created":
        return <ProjectIcon sx={{ fontSize: 20 }} />;
      default:
        return (
          <Box
            component="img"
            src={uploadIcon}
            sx={{ width: 20, height: 20, filter: blueFilter }}
          />
        );
    }
  };

  return { icon: getIcon(), ...colors };
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (diffDays === 0) {
    return `Today at ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return `${dayName} ${dayNum} ${month} at ${timeStr}`;
  } else {
    const dayNum = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return `${dayNum} ${month} at ${timeStr}`;
  }
};

interface RecentActivityProps {
  activities?: ActivityItem[];
  projectName?: string;
}

const RecentActivity = ({
  activities = [],
  projectName = "All Projects",
}: RecentActivityProps) => {
  return (
    <Card
      sx={{
        bgcolor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 3,
        p: 3,
        height: "100%",
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            color: COLORS.textLight,
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          Recent Activity
        </Typography>
        <Typography
          sx={{
            color: COLORS.textSecondary,
            fontSize: "12px",
            fontWeight: 400,
          }}
        >
          Latest events across {projectName}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "400px",
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: COLORS.bgTertiary,
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: COLORS.blue,
            borderRadius: "4px",
            "&:hover": {
              background: "#4A90D9",
            },
          },
        }}
      >
        {activities.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: "13px" }}>
              No recent activity
            </Typography>
          </Box>
        ) : (
          activities.map((activity, index) => {
            const { icon, borderColor, iconColor, bgColor } = getIconForType(
              activity.type,
              activity.color
            );

            return (
              <Box
                key={activity.id}
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: `2px solid ${borderColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: iconColor,
                      bgcolor: bgColor,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {icon}
                  </Box>
                  {index < activities.length - 1 && (
                    <Box
                      sx={{
                        width: 2,
                        height: 50,
                        bgcolor: COLORS.borderDark,
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontSize: "13px",
                      fontWeight: 600,
                      mb: 0.25,
                    }}
                  >
                    {activity.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: "12px",
                      fontWeight: 400,
                      mb: 0.5,
                      lineHeight: 1.4,
                    }}
                  >
                    {activity.description}
                  </Typography>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "11px",
                      fontWeight: 400,
                    }}
                  >
                    {formatTimestamp(activity.timestamp)} · {activity.author}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Card>
  );
};

export default RecentActivity;
