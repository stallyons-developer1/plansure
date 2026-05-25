import { Box, Card, Typography, Chip, Tooltip } from "@mui/material";
import { COLORS } from "../constants/colors";

interface RagData {
  label: string;
  value: number;
  percentage: number;
  color: string;
  tooltip: string;
}

interface DonutChartProps {
  data: RagData[];
  onTrackPercentage: number;
}

const DonutChart = ({ data, onTrackPercentage }: DonutChartProps) => {
  const radius = 40;
  const strokeWidth = 12;
  const gapAngle = 1.5;

  const createArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);
    const x1 = 50 + radius * Math.cos(start);
    const y1 = 50 + radius * Math.sin(start);
    const x2 = 50 + radius * Math.cos(end);
    const y2 = 50 + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  let currentAngle = 0;
  const arcs: Array<typeof data[0] & { path: string }> = [];

  for (const item of data) {
    if (item.percentage > 0) {
      const startAngle = currentAngle + gapAngle / 2;
      const sweepAngle = (item.percentage / 100) * 360 - gapAngle;
      const endAngle = startAngle + sweepAngle;
      arcs.push({ ...item, path: createArc(startAngle, endAngle) });
    }
    currentAngle += (item.percentage / 100) * 360;
  }

  return (
    <Box>
      <Box sx={{ position: "relative", width: 240, height: 240, mx: "auto" }}>
        <svg viewBox="0 0 100 100">
          {arcs.map((item, index) => (
            <Tooltip
              key={index}
              title={item.tooltip}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: COLORS.bgSecondary,
                    color: COLORS.textPrimary,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: "12px",
                    px: 1.5,
                    py: 1,
                  },
                },
                arrow: {
                  sx: {
                    color: COLORS.bgSecondary,
                  },
                },
              }}
            >
              <path
                d={item.path}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                style={{ cursor: "pointer" }}
              />
            </Tooltip>
          ))}
        </svg>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: "1.6rem",
              fontWeight: 700,
            }}
          >
            {onTrackPercentage}%
          </Typography>
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.9rem" }}>
            On Track
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        {data.map((item, index) => (
          <Tooltip
            key={index}
            title={item.tooltip}
            placement="right"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: COLORS.bgSecondary,
                  color: COLORS.textPrimary,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: "12px",
                  px: 1.5,
                  py: 1,
                  maxWidth: 220,
                },
              },
              arrow: {
                sx: {
                  color: COLORS.bgSecondary,
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 1,
                cursor: "pointer",
                "&:hover": {
                  bgcolor: `${COLORS.bgPrimary}50`,
                  borderRadius: 1,
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: item.color,
                  }}
                />
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Typography
                  sx={{
                    color: COLORS.white,
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {item.value}
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  {item.percentage}%
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

interface WeeklyReadinessSnapshotProps {
  weekLabel?: string;
  totalActivities?: number;
  distribution?: {
    green: { count: number; percentage: number };
    amber: { count: number; percentage: number };
    red: { count: number; percentage: number };
  };
}

const WeeklyReadinessSnapshot = ({
  weekLabel = "Current Week",
  totalActivities = 0,
  distribution,
}: WeeklyReadinessSnapshotProps) => {
  const data: RagData[] = distribution
    ? [
        {
          label: "Green — On Track",
          value: distribution.green.count,
          percentage: distribution.green.percentage,
          color: COLORS.green,
          tooltip: "Green activities are progressing as planned with no issues or delays expected.",
        },
        {
          label: "Amber — At Risk",
          value: distribution.amber.count,
          percentage: distribution.amber.percentage,
          color: COLORS.amber,
          tooltip: "Amber activities have potential risks or minor delays that require monitoring.",
        },
        {
          label: "Red — Critical",
          value: distribution.red.count,
          percentage: distribution.red.percentage,
          color: COLORS.red,
          tooltip: "Red activities are behind schedule or have critical issues requiring immediate attention.",
        },
      ]
    : [
        { label: "Green — On Track", value: 0, percentage: 0, color: COLORS.green, tooltip: "Green activities are progressing as planned with no issues or delays expected." },
        { label: "Amber — At Risk", value: 0, percentage: 0, color: COLORS.amber, tooltip: "Amber activities have potential risks or minor delays that require monitoring." },
        { label: "Red — Critical", value: 0, percentage: 0, color: COLORS.red, tooltip: "Red activities are behind schedule or have critical issues requiring immediate attention." },
      ];

  const onTrackPercentage = distribution?.green.percentage || 0;

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
          alignItems: "center",
          mb: 1,
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
            Weekly Readiness Snapshot
          </Typography>
          <Typography
            sx={{
              color: COLORS.textSecondary,
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            {weekLabel} RAG distribution
          </Typography>
        </Box>
        <Chip
          label={`${totalActivities} activities`}
          size="small"
          sx={{
            bgcolor: COLORS.bgPrimary,
            color: COLORS.white,
            fontWeight: 500,
            fontSize: "10px",
            minWidth: 69,
            height: 22,
            borderRadius: "6px",
          }}
        />
      </Box>
      <DonutChart data={data} onTrackPercentage={onTrackPercentage} />
    </Card>
  );
};

export default WeeklyReadinessSnapshot;
