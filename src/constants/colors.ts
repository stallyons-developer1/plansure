// Primary Colors
export const COLORS = {
  // Background colors
  bgPrimary: "#0f172a",
  bgSecondary: "#1e293b",
  bgTertiary: "#334155",
  bgCard: "#1a2235",
  bgTableInner: "#1E283A",

  // Text colors
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  textLight: "#e2e8f0",

  // Accent colors - Blue
  blue: "#3b82f6",
  blueHover: "#2563eb",
  blueDisabled: "#1e40af",
  blueBgLight: "rgba(59, 130, 246, 0.08)",
  blueBgMedium: "rgba(59, 130, 246, 0.1)",
  blueBgHover: "rgba(59, 130, 246, 0.15)",

  // Status colors
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  redLight: "#f87171",

  // Error colors
  errorBg: "rgba(239, 68, 68, 0.1)",
  errorBorder: "rgba(239, 68, 68, 0.3)",

  // Border colors
  border: "#8E9CB1",
  borderDark: "#334155",
  borderLight: "#475569",

  // Other
  white: "#ffffff",
  divider: "#475569",
  whiteHover: "rgba(255, 255, 255, 0.05)",
  whiteHoverLight: "rgba(255, 255, 255, 0.03)",
};

// RAG Status colors
export const STATUS_COLORS = {
  green: COLORS.green,
  amber: COLORS.amber,
  red: COLORS.red,
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "green":
      return STATUS_COLORS.green;
    case "amber":
      return STATUS_COLORS.amber;
    case "red":
      return STATUS_COLORS.red;
    default:
      return COLORS.textMuted;
  }
};
