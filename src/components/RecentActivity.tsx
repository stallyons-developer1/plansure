import { Box, Card, Typography, Link } from "@mui/material";
import {
  WarningAmberOutlined as WarningIcon,
  CheckOutlined as CheckIcon,
  GroupsOutlined as MeetingIcon,
  FileDownloadOutlined as ExportMuiIcon,
} from "@mui/icons-material";
import { COLORS } from "../constants/colors";
import uploadIcon from "../assets/sidebar/upload.png";
import actionIcon from "../assets/sidebar/action.png";

interface ActivityItem {
  id: number;
  icon: React.ReactNode;
  borderColor: string;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  timestamp: string;
  author: string;
}

const blueFilter =
  "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)";
const redFilter =
  "brightness(0) saturate(100%) invert(45%) sepia(78%) saturate(1846%) hue-rotate(331deg) brightness(99%) contrast(93%)";

const activities: ActivityItem[] = [
  {
    id: 1,
    icon: (
      <Box
        component="img"
        src={uploadIcon}
        sx={{ width: 20, height: 20, filter: blueFilter }}
      />
    ),
    borderColor: COLORS.blue,
    iconColor: COLORS.blue,
    bgColor: "rgba(59, 130, 246, 0.1)",
    title: "Programs PDF uploaded",
    description:
      "Crossrail_Phase2_W47_Rev3.pdf — 142 activities parsed successfully",
    timestamp: "Today at 09:42",
    author: "Kamran R.",
  },
  {
    id: 2,
    icon: <WarningIcon sx={{ fontSize: 20 }} />,
    borderColor: COLORS.amber,
    iconColor: COLORS.amber,
    bgColor: "rgba(245, 158, 11, 0.1)",
    title: "RAG assessment completed",
    description:
      "Week 47 lookahead scored — 8 activities flagged Red, 18 Amber",
    timestamp: "Today at 10:15",
    author: "System",
  },
  {
    id: 3,
    icon: (
      <Box
        component="img"
        src={actionIcon}
        sx={{ width: 18, height: 18, filter: redFilter }}
      />
    ),
    borderColor: COLORS.red,
    iconColor: COLORS.red,
    bgColor: "rgba(239, 68, 68, 0.1)",
    title: "3 new actions created",
    description:
      "Linked to Red activities: TBM Drive S2, Concrete Pour Bay 14, Signal Migration",
    timestamp: "Today at 10:18",
    author: "Kamran R.",
  },
  {
    id: 4,
    icon: <CheckIcon sx={{ fontSize: 20 }} />,
    borderColor: COLORS.green,
    iconColor: COLORS.green,
    bgColor: "rgba(34, 197, 94, 0.1)",
    title: "Week 46 cycle closed",
    description:
      "Final report generated and locked — 91% governance score achieved",
    timestamp: "Mon 24 Mar at 08:00",
    author: "System",
  },
  {
    id: 5,
    icon: <ExportMuiIcon sx={{ fontSize: 22 }} />,
    borderColor: COLORS.blue,
    iconColor: COLORS.blue,
    bgColor: "rgba(59, 130, 246, 0.1)",
    title: "Weekly governance report exported",
    description:
      "W46 PDF report sent to stakeholder distribution list (14 recipients)",
    timestamp: "Mon 24 Mar at 08:05",
    author: "System",
  },
  {
    id: 6,
    icon: <MeetingIcon sx={{ fontSize: 20 }} />,
    borderColor: COLORS.amber,
    iconColor: COLORS.amber,
    bgColor: "rgba(245, 158, 11, 0.1)",
    title: "Meeting review session held",
    description:
      "W46 review meeting — 6 attendees, 5 actions raised, 2 escalations noted",
    timestamp: "Thu 20 Mar at 14:30",
    author: "Sarah M.",
  },
];

interface RecentActivityProps {
  onViewAll?: () => void;
}

const RecentActivity = ({ onViewAll }: RecentActivityProps) => {
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
            Recent Activity
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
        {onViewAll && (
          <Link
            component="button"
            underline="none"
            onClick={onViewAll}
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
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {activities.map((activity, index) => (
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
                  border: `2px solid ${activity.borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: activity.iconColor,
                  bgcolor: activity.bgColor,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {activity.icon}
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
                {activity.timestamp} · {activity.author}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

export default RecentActivity;
