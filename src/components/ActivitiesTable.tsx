import { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Avatar,
  Typography,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowRight,
  ChevronRight,
} from "@mui/icons-material";
import { COLORS, getStatusColor } from "../constants/colors";

export interface Activity {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: string;
  ragZone: string;
  ragColor: string;
  actions: number;
  status: string;
  statusType: string;
  owner: { initials: string; name: string; color: string };
  linkedActions?: string[];
  dependencies?: string;
  notes?: string;
}

export const activitiesData: Activity[] = [
  {
    id: "ACT-001",
    name: "Foundation pour - Block A",
    startDate: "2026-03-25",
    endDate: "2026-04-03",
    duration: "10d",
    ragZone: "Weeks 1-2",
    ragColor: "green",
    actions: 3,
    status: "Ready",
    statusType: "green",
    owner: { initials: "JP", name: "James P.", color: "#22C55E" },
    linkedActions: [
      "Confirm concrete delivery",
      "Safety briefing completed",
      "Formwork inspection sign-off",
    ],
    dependencies: "ACT-012 (Complete)",
    notes: "Concrete mix approved. Pour scheduled for early morning.",
  },
  {
    id: "ACT-002",
    name: "Steel erection - Level 2",
    startDate: "2026-03-27",
    endDate: "2026-04-05",
    duration: "8d",
    ragZone: "Weeks 1-2",
    ragColor: "green",
    actions: 2,
    status: "Ready",
    statusType: "green",
    owner: { initials: "SM", name: "Sarah M.", color: "#F59E0B" },
  },
  {
    id: "ACT-003",
    name: "Mechanical rough-in - Zone C",
    startDate: "2026-03-30",
    endDate: "2026-04-07",
    duration: "7d",
    ragZone: "Weeks 1-2",
    ragColor: "green",
    actions: 4,
    status: "Ready",
    statusType: "green",
    owner: { initials: "DK", name: "David K.", color: "#3B82F6" },
  },
  {
    id: "ACT-004",
    name: "Waterproofing - Basement 1",
    startDate: "2026-04-01",
    endDate: "2026-04-08",
    duration: "6d",
    ragZone: "Weeks 1-2",
    ragColor: "green",
    actions: 1,
    status: "Blocked",
    statusType: "red",
    owner: { initials: "ML", name: "Maria L.", color: "#EC4899" },
  },
  {
    id: "ACT-005",
    name: "Curtain wall installation",
    startDate: "2026-04-06",
    endDate: "2026-04-17",
    duration: "12d",
    ragZone: "Weeks 3-4",
    ragColor: "amber",
    actions: 5,
    status: "At Risk",
    statusType: "amber",
    owner: { initials: "TR", name: "Tom R.", color: "#8B5CF6" },
  },
  {
    id: "ACT-006",
    name: "Electrical first fix - Floors 3-5",
    startDate: "2026-04-08",
    endDate: "2026-04-18",
    duration: "9d",
    ragZone: "Weeks 3-4",
    ragColor: "amber",
    actions: 2,
    status: "Ready",
    statusType: "green",
    owner: { initials: "AB", name: "Ahmed B.", color: "#F97316" },
  },
  {
    id: "ACT-007",
    name: "Roof steel - Phase 2",
    startDate: "2026-04-13",
    endDate: "2026-04-22",
    duration: "8d",
    ragZone: "Weeks 3-4",
    ragColor: "amber",
    actions: 3,
    status: "Ready",
    statusType: "green",
    owner: { initials: "JP", name: "James P.", color: "#22C55E" },
  },
  {
    id: "ACT-008",
    name: "Fire stopping - Levels 1-3",
    startDate: "2026-04-15",
    endDate: "2026-04-24",
    duration: "8d",
    ragZone: "Weeks 3-4",
    ragColor: "amber",
    actions: 2,
    status: "Blocked",
    statusType: "red",
    owner: { initials: "JP", name: "Lisa W.", color: "#06B6D4" },
  },
  {
    id: "ACT-009",
    name: "External cladding",
    startDate: "2026-04-20",
    endDate: "2026-05-01",
    duration: "10d",
    ragZone: "Weeks 5-6",
    ragColor: "red",
    actions: 4,
    status: "At Risk",
    statusType: "amber",
    owner: { initials: "JP", name: "Tom R.", color: "#8B5CF6" },
  },
  {
    id: "ACT-010",
    name: "Lift installation - Core B",
    startDate: "2026-04-22",
    endDate: "2026-05-03",
    duration: "10d",
    ragZone: "Weeks 5-6",
    ragColor: "red",
    actions: 3,
    status: "Ready",
    statusType: "green",
    owner: { initials: "DK", name: "David K.", color: "#3B82F6" },
  },
  {
    id: "ACT-011",
    name: "Lift installation - Core B",
    startDate: "2026-04-22",
    endDate: "2026-05-03",
    duration: "10d",
    ragZone: "Weeks 5-6",
    ragColor: "red",
    actions: 2,
    status: "Blocked",
    statusType: "red",
    owner: { initials: "ML", name: "Maria L.", color: "#EC4899" },
  },
  {
    id: "ACT-012",
    name: "Commissioning - HVAC Zone A",
    startDate: "2026-04-29",
    endDate: "2026-05-08",
    duration: "8d",
    ragZone: "Weeks 5-6",
    ragColor: "red",
    actions: 3,
    status: "Ready",
    statusType: "green",
    owner: { initials: "AB", name: "Ahmed B.", color: "#F97316" },
  },
];

const ActivityRow = ({
  activity,
  isFirst,
}: {
  activity: Activity;
  isFirst?: boolean;
}) => {
  const [open, setOpen] = useState(isFirst);
  const ragColor = getStatusColor(activity.ragColor);
  const statusColor =
    activity.statusType === "green"
      ? COLORS.green
      : activity.statusType === "amber"
        ? COLORS.amber
        : COLORS.red;

  return (
    <>
      <TableRow
        sx={{
          position: "relative",
          "&:hover": { bgcolor: COLORS.whiteHoverLight },
          bgcolor: open ? COLORS.blueBgLight : "transparent",
        }}
      >
        <TableCell
          sx={{
            color: COLORS.blue,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            position: "relative",
            pl: 3,
            fontSize: "13px",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 1,
              bottom: 1,
              width: "4px",
              bgcolor: ragColor,
            }}
          />
          {activity.id}
        </TableCell>
        <TableCell
          sx={{
            color: COLORS.textPrimary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {activity.linkedActions && (
              <IconButton
                size="small"
                onClick={() => setOpen(!open)}
                sx={{ color: COLORS.textSecondary, p: 0.25, mr: 0.5 }}
              >
                {open ? (
                  <KeyboardArrowDown fontSize="small" />
                ) : (
                  <KeyboardArrowRight fontSize="small" />
                )}
              </IconButton>
            )}
            {activity.name}
          </Box>
        </TableCell>
        <TableCell
          sx={{
            color: COLORS.textSecondary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
          }}
        >
          {activity.startDate}
        </TableCell>
        <TableCell
          sx={{
            color: COLORS.textSecondary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
          }}
        >
          {activity.endDate}
        </TableCell>
        <TableCell
          align="center"
          sx={{
            color: COLORS.textSecondary,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
          }}
        >
          {activity.duration}
        </TableCell>
        <TableCell
          sx={{
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
          }}
        >
          <Box
            sx={{
              bgcolor: `${ragColor}20`,
              color: ragColor,
              px: 1.5,
              py: 0.5,
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              minWidth: 85,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: ragColor,
              }}
            />
            {activity.ragZone}
          </Box>
        </TableCell>
        <TableCell
          sx={{
            color: COLORS.blue,
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
            fontSize: "13px",
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {activity.actions} actions
        </TableCell>
        <TableCell
          sx={{
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
          }}
        >
          <Box
            sx={{
              bgcolor: `${statusColor}20`,
              color: statusColor,
              px: 1.5,
              py: 0.5,
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              display: "inline-block",
              textAlign: "center",
              minWidth: 70,
            }}
          >
            {activity.status}
          </Box>
        </TableCell>
        <TableCell
          sx={{
            borderBottom: open ? `1px solid ${COLORS.border}` : "none",
            py: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: "#1E3A5F",
                color: COLORS.blue,
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {activity.owner.initials}
            </Avatar>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "13px",
              }}
            >
              {activity.owner.name}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>

      {activity.linkedActions && (
        <TableRow>
          <TableCell
            colSpan={9}
            sx={{
              py: 0,
              px: 0,
              borderBottom: open ? `1px solid ${COLORS.border}` : "none",
              bgcolor: COLORS.bgPrimary,
            }}
          >
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  py: 2,
                  px: 3,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1.5fr",
                  gap: 4,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "11px",
                      fontWeight: 600,
                      mb: 1.5,
                      letterSpacing: "0.05em",
                    }}
                  >
                    LINKED ACTIONS
                  </Typography>
                  {activity.linkedActions.map((action, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <ChevronRight
                        sx={{ color: COLORS.blue, fontSize: "1rem" }}
                      />
                      <Typography
                        sx={{ color: COLORS.textLight, fontSize: "13px" }}
                      >
                        {action}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "11px",
                      fontWeight: 600,
                      mb: 1.5,
                      letterSpacing: "0.05em",
                    }}
                  >
                    DEPENDENCIES
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textLight, fontSize: "13px" }}
                  >
                    {activity.dependencies}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.textMuted,
                      fontSize: "11px",
                      fontWeight: 600,
                      mb: 1.5,
                      letterSpacing: "0.05em",
                    }}
                  >
                    NOTES
                  </Typography>
                  <Typography
                    sx={{ color: COLORS.textLight, fontSize: "13px" }}
                  >
                    {activity.notes || "-"}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

interface ActivitiesTableProps {
  activities: Activity[];
}

const ActivitiesTable = ({ activities }: ActivitiesTableProps) => {
  return (
    <Box
      sx={{
        bgcolor: COLORS.bgTableInner,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <TableContainer
        sx={{
          maxHeight: 600,
          overflowY: "auto",
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "transparent" }}>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  pl: 3,
                  letterSpacing: "0.05em",
                }}
              >
                ACTIVITY ID
              </TableCell>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                ACTIVITY NAME
              </TableCell>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                STARTDATE
              </TableCell>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                END DATE
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                DURATION
              </TableCell>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                RAG ZONE
              </TableCell>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                ACTIONS
              </TableCell>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                STATUS
              </TableCell>
              <TableCell
                sx={{
                  color: COLORS.border,
                  fontSize: "11px",
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.border}`,
                  py: 1.5,
                  letterSpacing: "0.05em",
                }}
              >
                OWNER
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.map((activity, index) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                isFirst={index === 0}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ActivitiesTable;
