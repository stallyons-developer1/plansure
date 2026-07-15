import { Box, Card, Typography, Tooltip } from "@mui/material";
import { COLORS } from "../constants/colors";

interface RAGDonutChartProps {
  data: {
    green: number;
    amber: number;
    red: number;
    blue?: number;
    grey?: number;
  };
  title?: string;
}

type SegmentKey = "red" | "amber" | "green" | "blue" | "grey";

const SEGMENT_META: Record<
  SegmentKey,
  { color: string; label: string; description: string }
> = {
  green: {
    color: COLORS.green,
    label: "Green",
    description: "Ready - No action required",
  },
  amber: {
    color: COLORS.amber,
    label: "Amber",
    description: "At Risk - An action has been assigned",
  },
  blue: {
    color: COLORS.blue,
    label: "Blue",
    description: "Completed - All assigned actions are complete",
  },
  red: {
    color: COLORS.red,
    label: "Red",
    description: "Blocked - Action still open after the 6-week cycle",
  },
  grey: {
    color: COLORS.textMuted,
    label: "Grey",
    description: "Unassigned - Not yet assigned",
  },
};

const tooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: COLORS.bgSecondary,
      color: COLORS.textPrimary,
      border: `1px solid ${COLORS.border}`,
      fontSize: "12px",
      maxWidth: 250,
      p: 1,
    },
  },
  arrow: { sx: { color: COLORS.bgSecondary } },
};

const RAGDonutChart = ({
  data,
  title = "RAG Distribution",
}: RAGDonutChartProps) => {
  const values: Record<SegmentKey, number> = {
    red: data.red || 0,
    amber: data.amber || 0,
    green: data.green || 0,
    blue: data.blue || 0,
    grey: data.grey || 0,
  };

  const total =
    values.red + values.amber + values.green + values.blue + values.grey;
  const size = 240;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const createArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Arc order (only non-zero segments get an arc).
  const arcOrder: SegmentKey[] = ["red", "amber", "green", "blue", "grey"];
  let currentAngle = 0;
  const arcs = arcOrder
    .filter((key) => values[key] > 0)
    .map((key) => {
      const startAngle = currentAngle;
      const sweepAngle = total > 0 ? (values[key] / total) * 360 : 0;
      const endAngle = startAngle + sweepAngle;
      currentAngle = endAngle;
      return {
        key,
        color: SEGMENT_META[key].color,
        description: SEGMENT_META[key].description,
        path: createArc(startAngle, endAngle),
      };
    });

  // Legend order (Green, Amber, Blue, Red, then Grey if present).
  const legendOrder: SegmentKey[] = ["green", "amber", "blue", "red", "grey"];
  const legend = legendOrder.filter(
    (key) => key !== "grey" || values.grey > 0,
  );

  return (
    <Card
      sx={{
        bgcolor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 2,
        p: 3,
      }}
    >
      <Typography
        sx={{
          color: COLORS.textPrimary,
          fontSize: "15px",
          fontWeight: 600,
          mb: 3,
        }}
      >
        {title}
      </Typography>
      <Box>
        <Box
          sx={{ position: "relative", width: size, height: size, mx: "auto" }}
        >
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            {arcs.map((arc, index) => (
              <Tooltip
                key={index}
                title={arc.description}
                placement="top"
                arrow
                slotProps={tooltipSlotProps}
              >
                <path
                  d={arc.path}
                  fill="transparent"
                  stroke={arc.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                  style={{ cursor: "pointer" }}
                />
              </Tooltip>
            ))}
          </svg>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 3,
            mt: 4,
          }}
        >
          {legend.map((key) => (
            <Tooltip
              key={key}
              title={SEGMENT_META[key].description}
              placement="bottom"
              arrow
              slotProps={tooltipSlotProps}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: SEGMENT_META[key].color,
                  }}
                />
                <Typography
                  sx={{ color: COLORS.textSecondary, fontSize: "14px" }}
                >
                  {SEGMENT_META[key].label}:&nbsp;&nbsp;{values[key]}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Card>
  );
};

export default RAGDonutChart;
