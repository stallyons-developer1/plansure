import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { COLORS } from "../constants/colors";

interface BlockedActivity {
  id: string;
  name: string;
  rag: "Red" | "Amber";
  owner: string;
  blocker: string;
  linkedAction: string;
  status: "Open" | "Overdue";
}

const defaultBlockedActivities: BlockedActivity[] = [
  {
    id: "ACT-1042",
    name: "Platform slab pour – Zone B",
    rag: "Red",
    owner: "Civil",
    blocker: "Concrete supply delay",
    linkedAction: "ACN-0087",
    status: "Open",
  },
  {
    id: "ACT-1058",
    name: "Tunnel ventilation duct install",
    rag: "Red",
    owner: "MEP",
    blocker: "Design approval pending",
    linkedAction: "ACN-0091",
    status: "Open",
  },
  {
    id: "ACT-1063",
    name: "Signal cable routing – Shaft 3",
    rag: "Amber",
    owner: "Signalling",
    blocker: "Access restriction until Wed",
    linkedAction: "ACN-0094",
    status: "Open",
  },
  {
    id: "ACT-1071",
    name: "Steelwork erection – Bay 7",
    rag: "Red",
    owner: "Structural",
    blocker: "Crane unavailable (breakdown)",
    linkedAction: "ACN-0096",
    status: "Overdue",
  },
  {
    id: "ACT-1079",
    name: "Fire stopping – Level 2 east",
    rag: "Amber",
    owner: "MEP",
    blocker: "Material on-site delayed to Thu",
    linkedAction: "ACN-0098",
    status: "Open",
  },
  {
    id: "ACT-1085",
    name: "Track slab alignment – Platform 3",
    rag: "Red",
    owner: "Civil",
    blocker: "Survey data incomplete",
    linkedAction: "ACN-0101",
    status: "Overdue",
  },
];

interface BlockedActivitiesTableProps {
  activities?: BlockedActivity[];
}

const BlockedActivitiesTable = ({
  activities = defaultBlockedActivities,
}: BlockedActivitiesTableProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    "Blocked / Risk Activities",
    "Weekly Plan Preview",
    "Planner To-Do",
  ];

  return (
    <Box
      sx={{
        bgcolor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        overflow: "auto",
      }}
    >
      <Box sx={{ minWidth: "fit-content" }}>
        <Box sx={{ pt: 2, minWidth: 950 }}>
          <Box
            sx={{
              display: "flex",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            {tabs.map((tab, i) => (
              <Typography
                key={tab}
                onClick={() => setActiveTab(i)}
                sx={{
                  mx: 2,
                  color: activeTab === i ? COLORS.blue : COLORS.textMuted,
                  fontSize: "13px",
                  fontWeight: 500,
                  pb: 1,
                  mb: "15px",
                  cursor: "pointer",
                  borderBottom:
                    activeTab === i ? `2px solid ${COLORS.blue}` : "none",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    color: activeTab === i ? COLORS.blue : COLORS.textSecondary,
                  },
                }}
              >
                {tab}
              </Typography>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "90px minmax(180px, 1fr) 80px 90px minmax(160px, 1fr) 110px 90px",
            gap: 2,
            px: 3,
            py: 1.5,
            borderBottom: `1px solid ${COLORS.border}`,
            minWidth: 950,
          }}
        >
          {[
            "ACTIVITY ID",
            "ACTIVITY NAME",
            "RAG",
            "OWNER",
            "BLOCKER",
            "LINKED ACTION",
            "STATUS",
          ].map((header) => (
            <Typography
              key={header}
              sx={{
                color: COLORS.textMuted,
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              {header}
            </Typography>
          ))}
        </Box>

        {activities.map((activity, index) => (
          <Box
            key={index}
            sx={{
              display: "grid",
              gridTemplateColumns:
                "90px minmax(180px, 1fr) 80px 90px minmax(160px, 1fr) 110px 90px",
              gap: 2,
              px: 3,
              py: 2,
              borderBottom:
                index < activities.length - 1
                  ? `1px solid ${COLORS.border}`
                  : "none",
              alignItems: "center",
              minWidth: 950,
              "&:hover": { bgcolor: COLORS.bgTertiary },
            }}
          >
            <Typography
              sx={{
                color: COLORS.textMuted,
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              {activity.id}
            </Typography>
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 400,
                textAlign: "center",
              }}
            >
              {activity.name}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  bgcolor:
                    activity.rag === "Red"
                      ? `${COLORS.red}25`
                      : `${COLORS.amber}25`,
                  color: activity.rag === "Red" ? COLORS.red : COLORS.amber,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: activity.rag === "Red" ? COLORS.red : COLORS.amber,
                  }}
                />
                {activity.rag}
              </Box>
            </Box>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: "14px",
                fontWeight: 400,
                textAlign: "center",
              }}
            >
              {activity.owner}
            </Typography>
            <Typography
              sx={{
                color: activity.rag === "Red" ? COLORS.red : COLORS.amber,
                fontSize: "14px",
                fontWeight: 400,
                textAlign: "center",
              }}
            >
              {activity.blocker}
            </Typography>
            <Typography
              sx={{
                color: COLORS.blue,
                fontSize: "10px",
                fontWeight: 400,
                textAlign: "center",
              }}
            >
              {activity.linkedAction}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  bgcolor:
                    activity.status === "Overdue"
                      ? `${COLORS.red}20`
                      : `${COLORS.amber}15`,
                  border:
                    activity.status === "Overdue"
                      ? `1px solid ${COLORS.red}40`
                      : "none",
                  color:
                    activity.status === "Overdue" ? COLORS.red : COLORS.amber,
                  px: 2,
                  py: 0.5,
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {activity.status}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default BlockedActivitiesTable;
