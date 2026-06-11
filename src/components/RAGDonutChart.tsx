import { Box, Card, Typography, Tooltip } from "@mui/material";
import { COLORS } from "../constants/colors";

interface RAGDonutChartProps {
  data: { green: number; amber: number; red: number };
  title?: string;
}

const RAG_DESCRIPTIONS = {
  green: "Ready - Activities that are ready to proceed",
  amber: "At Risk - Activities that are at risk or overdue",
  red: "Blocked - Activities that are blocked",
};

const RAGDonutChart = ({ data, title = "RAG Distribution" }: RAGDonutChartProps) => {
  const total = data.green + data.amber + data.red;
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

  const segments = [
    { value: data.red, color: COLORS.red, key: "red" as const },
    { value: data.green, color: COLORS.green, key: "green" as const },
    { value: data.amber, color: COLORS.amber, key: "amber" as const },
  ];

  let currentAngle = 0;
  const arcs = segments.map((segment) => {
    const startAngle = currentAngle;
    const sweepAngle = (segment.value / total) * 360;
    const endAngle = startAngle + sweepAngle;
    currentAngle = endAngle;
    return { ...segment, path: createArc(startAngle, endAngle), description: RAG_DESCRIPTIONS[segment.key] };
  });

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
        <Box sx={{ position: "relative", width: size, height: size, mx: "auto" }}>
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            {arcs.map((arc, index) => (
              <Tooltip
                key={index}
                title={arc.description}
                placement="top"
                arrow
                slotProps={{
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
                  arrow: {
                    sx: {
                      color: COLORS.bgSecondary,
                    },
                  },
                }}
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
            gap: 4,
            mt: 4,
          }}
        >
          <Tooltip
            title={RAG_DESCRIPTIONS.green}
            placement="bottom"
            arrow
            slotProps={{
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
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: COLORS.green,
                }}
              />
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
                Green:&nbsp;&nbsp;{data.green}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip
            title={RAG_DESCRIPTIONS.amber}
            placement="bottom"
            arrow
            slotProps={{
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
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: COLORS.amber,
                }}
              />
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
                Amber:&nbsp;&nbsp;{data.amber}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip
            title={RAG_DESCRIPTIONS.red}
            placement="bottom"
            arrow
            slotProps={{
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
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: COLORS.red,
                }}
              />
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "14px" }}>
                Red:&nbsp;&nbsp;{data.red}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  );
};

export default RAGDonutChart;
