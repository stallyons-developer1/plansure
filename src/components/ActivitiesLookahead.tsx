import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { COLORS } from "../constants/colors";
import ActivitiesTable from "./ActivitiesTable";
import type { Activity } from "./ActivitiesTable";
import ActivitiesSummary from "./ActivitiesSummary";

interface WeekData {
  week: number;
  dateRange: string;
  color: "green" | "amber" | "red";
  isCurrent: boolean;
}

interface ActivitiesLookaheadProps {
  activities: Activity[];
  weeks: WeekData[];
  lastUpdated: string;
  onAssignClick?: (activity: Activity) => void;
  onActionClick?: () => void;
}

const ActivitiesLookahead = ({
  activities,
  weeks,
  lastUpdated,
  onAssignClick,
  onActionClick,
}: ActivitiesLookaheadProps) => {
  const [ragFilter, setRagFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [weekFilter, setWeekFilter] = useState<number | null>(null); // null = all weeks, 1-6 = specific week
  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 20;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [ragFilter, statusFilter, searchQuery, weekFilter]);

  // Helper to parse date string (handles YYYY-MM-DD format)
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Use TODAY as the starting point for 6-week lookahead (not Monday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // End of 6th week (6 weeks from today = 42 days)
  const sixWeekEnd = new Date(today);
  sixWeekEnd.setDate(today.getDate() + 42);

  // Helper to get which week an activity falls into (1-6) based on today
  const getActivityWeek = (startDate: string): number | null => {
    const activityStart = parseDate(startDate);
    if (!activityStart) return null;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysFromToday = Math.floor((activityStart.getTime() - today.getTime()) / msPerDay);
    if (daysFromToday < 0) return null; // Before today = don't assign to any week filter
    const weekNum = Math.floor(daysFromToday / 7) + 1;
    if (weekNum > 6) return null; // Beyond 6 weeks
    return weekNum;
  };

  // Check if activity matches the selected week filter
  // Activities before today or beyond 6 weeks won't match any specific week
  const activityMatchesWeek = (activity: Activity, weekNum: number): boolean => {
    const activityWeek = getActivityWeek(activity.startDate);
    if (activityWeek === null) return false; // Activity is before today or beyond 6 weeks
    return activityWeek === weekNum;
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesRag = ragFilter === "all" || activity.ragColor === ragFilter;

    // Status filter logic:
    // - "on track" = Ready activities (respects week filter - All weeks or specific week)
    // - "completed" = Complete/Completed activities
    // - "at risk" = At Risk activities
    // - "blocked" = Blocked activities
    let matchesStatus = false;
    const activityStatus = activity.status.toLowerCase();

    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "on track") {
      // On Track = Ready activities (week filter is applied separately below)
      matchesStatus = activityStatus === "ready" || activityStatus === "on track";
    } else if (statusFilter === "completed") {
      matchesStatus = activityStatus === "complete" || activityStatus === "completed";
    } else if (statusFilter === "at risk") {
      matchesStatus = activityStatus === "at risk";
    } else if (statusFilter === "blocked") {
      matchesStatus = activityStatus === "blocked";
    }

    const matchesSearch =
      searchQuery === "" ||
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply 6-week lookahead filter: only show activities from TODAY to 6 weeks ahead
    const activityStart = parseDate(activity.startDate);
    // Must be >= today AND < sixWeekEnd
    const withinLookahead = !activityStart || (activityStart >= today && activityStart < sixWeekEnd);

    // Week filter - if a specific week is selected, filter by that week
    const matchesWeek = weekFilter === null || activityMatchesWeek(activity, weekFilter);

    return matchesRag && matchesStatus && matchesSearch && withinLookahead && matchesWeek;
  });

  // Calculate counts from filtered activities (dynamic based on filters)
  const greenCount = filteredActivities.filter((a) => a.ragColor === "green").length;
  const amberCount = filteredActivities.filter((a) => a.ragColor === "amber").length;
  const redCount = filteredActivities.filter((a) => a.ragColor === "red").length;
  const blockedCount = filteredActivities.filter((a) => a.status === "Blocked").length;

  const getColorValue = (color: string) => {
    switch (color) {
      case "green":
        return COLORS.green;
      case "amber":
        return COLORS.amber;
      case "red":
        return COLORS.red;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <Box>
      <Box
        sx={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          p: { xs: 1, sm: 1.5 },
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 2 },
          mb: 3,
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            order: { xs: 1, md: 0 },
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "flex-start", sm: "flex-start" },
          }}
        >
          {[
            { label: "All", value: "all", color: null },
            { label: "Green", value: "green", color: COLORS.green },
            { label: "Amber", value: "amber", color: COLORS.amber },
            { label: "Red", value: "red", color: COLORS.red },
          ].map((filter) => (
            <Box
              key={filter.value}
              onClick={() => setRagFilter(filter.value)}
              sx={{
                px: { xs: 1.5, sm: 2 },
                py: 0.75,
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 },
                bgcolor:
                  ragFilter === filter.value
                    ? COLORS.bgTertiary
                    : "transparent",
                color: "#E2E8F0",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: COLORS.bgTertiary,
                },
              }}
            >
              {filter.color && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: filter.color,
                  }}
                />
              )}
              {filter.label}
            </Box>
          ))}
        </Box>

        <TextField
          placeholder="Search activities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            minWidth: 0,
            order: { xs: 2, md: 0 },
            "& .MuiOutlinedInput-root": {
              bgcolor: "transparent",
              borderRadius: "8px",
              height: 38,
              "& fieldset": {
                borderColor: COLORS.border,
                borderWidth: 1,
              },
              "&:hover fieldset": {
                borderColor: COLORS.border,
              },
              "&.Mui-focused fieldset": {
                borderColor: COLORS.border,
                borderWidth: 1,
              },
            },
            "& .MuiOutlinedInput-input": {
              color: COLORS.textPrimary,
              fontSize: "14px",
              fontWeight: 400,
              py: 0,
              "&::placeholder": {
                color: "#5A6679",
                opacity: 1,
                fontWeight: 400,
              },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#ffffff", fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{
            width: { xs: "100%", sm: 130 },
            bgcolor: "transparent",
            borderRadius: "8px",
            height: 38,
            order: { xs: 3, md: 0 },
            flexShrink: 0,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: COLORS.border,
              borderWidth: 1,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: COLORS.border,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: COLORS.border,
              borderWidth: 1,
            },
            "& .MuiSelect-select": {
              color: COLORS.textPrimary,
              fontSize: "14px",
              fontWeight: 400,
              py: 0,
              display: "flex",
              alignItems: "center",
            },
            "& .MuiSvgIcon-root": {
              color: COLORS.textSecondary,
            },
          }}
          MenuProps={{
            slotProps: {
              paper: {
                sx: {
                  bgcolor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.borderDark}`,
                  borderRadius: "8px",
                  mt: 0.5,
                  "& .MuiMenuItem-root": {
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    "&:hover": {
                      bgcolor: COLORS.bgTertiary,
                    },
                    "&.Mui-selected": {
                      bgcolor: COLORS.blueBgMedium,
                      "&:hover": {
                        bgcolor: COLORS.blueBgHover,
                      },
                    },
                  },
                },
              },
            },
          }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="on track">On Track</MenuItem>
          <MenuItem value="at risk">At Risk</MenuItem>
          <MenuItem value="blocked">Blocked</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
        </Select>
      </Box>

      <Box
        sx={{
          bgcolor: COLORS.bgSecondary,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          p: 2.5,
          mb: 3,
        }}
      >
        <Typography
          sx={{
            color: COLORS.textPrimary,
            fontSize: "16px",
            fontWeight: 600,
            mb: 2,
          }}
        >
          6-Week Lookahead Timeline
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {/* All Weeks Button */}
          <Box
            onClick={() => setWeekFilter(null)}
            sx={{
              minWidth: 70,
              height: 87,
              bgcolor: weekFilter === null ? COLORS.blueBgMedium : COLORS.bgPrimary,
              border: `2px solid ${weekFilter === null ? COLORS.blue : COLORS.border}`,
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: COLORS.blue,
                bgcolor: COLORS.blueBgLight,
              },
            }}
          >
            <Typography
              sx={{
                color: weekFilter === null ? COLORS.blue : COLORS.textSecondary,
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              All
            </Typography>
          </Box>
          {weeks.map((week) => {
            const isSelected = weekFilter === week.week;
            const weekColor = getColorValue(week.color);
            return (
              <Box
                key={week.week}
                onClick={() => setWeekFilter(week.week)}
                sx={{
                  flex: 1,
                  minWidth: 150,
                  height: 87,
                  bgcolor: isSelected
                    ? `${weekColor}20`
                    : week.isCurrent
                      ? COLORS.blueBgLight
                      : COLORS.bgPrimary,
                  border: isSelected
                    ? `2px solid ${weekColor}`
                    : week.isCurrent
                      ? `2px solid ${COLORS.blue}`
                      : `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.1,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? `0 0 0 2px ${weekColor}40` : "none",
                  "&:hover": {
                    bgcolor: `${weekColor}15`,
                    borderColor: weekColor,
                  },
                }}
              >
                <Typography
                  sx={{
                    color: isSelected ? weekColor : week.isCurrent ? COLORS.blue : COLORS.textPrimary,
                    fontSize: "12px",
                    fontWeight: isSelected ? 700 : 600,
                  }}
                >
                  Week {week.week}
                </Typography>
                <Typography
                  sx={{
                    color: isSelected ? weekColor : week.isCurrent ? COLORS.blue : COLORS.textSecondary,
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  {week.dateRange}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.25,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: weekColor,
                    }}
                  />
                  {week.isCurrent && !isSelected && (
                    <Typography
                      sx={{
                        color: COLORS.blue,
                        fontSize: "12px",
                        fontWeight: 400,
                        textTransform: "uppercase",
                      }}
                    >
                      Current
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {filteredActivities.length === 0 ? (
        <Box
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: 4,
            textAlign: "center",
            mb: 3,
          }}
        >
          <Typography
            sx={{
              color: COLORS.textSecondary,
              fontSize: "14px",
            }}
          >
            No activities found for the selected filters
          </Typography>
        </Box>
      ) : (
        (() => {
          const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);
          const paginatedActivities = filteredActivities.slice(
            (currentPage - 1) * activitiesPerPage,
            currentPage * activitiesPerPage
          );

          return (
            <ActivitiesTable
              activities={paginatedActivities}
              onAssignClick={onAssignClick}
              onActionClick={onActionClick}
              currentPage={currentPage}
              totalPages={totalPages}
              totalActivities={filteredActivities.length}
              onPageChange={setCurrentPage}
              activitiesPerPage={activitiesPerPage}
            />
          );
        })()
      )}

      <ActivitiesSummary
        totalActivities={filteredActivities.length}
        greenCount={greenCount}
        amberCount={amberCount}
        redCount={redCount}
        blockedCount={blockedCount}
        lastUpdated={lastUpdated}
      />
    </Box>
  );
};

export default ActivitiesLookahead;
