import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { COLORS } from "../constants/colors";
import { actionAPI } from "../services/api";

/*
 * Read-only view of a single action, in the same field order as the Edit
 * Action dialog. Shared by the Audit Logs event list and the Activities &
 * Lookahead table so both show the record identically.
 */

interface ActionDetail {
  _id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  overrideReason?: string;
  overriddenAt?: string;
  overriddenBy?: { name?: string };
  assignee?: { name?: string };
  linkedActivity?: { activityId?: string; activityName?: string };
  linkedActivityOwnerName?: string;
}

/* "Aug 19, 2026 03:00 PM" — matches the workspace dialogs. */
const formatStamp = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

/* A field rendered as an input-styled box but not editable, so the view reads
   like the Edit Action dialog without implying it can be changed. */
const ReadOnlyField = ({
  label,
  value,
  pairs,
  rows = 1,
  accent = false,
}: {
  label: string;
  value?: string;
  /* Label/value rows rendered inside the box. Used instead of `value` where
     the content is tabular — space-padding a proportional font will not line
     the columns up. */
  pairs?: Array<[string, string]>;
  rows?: number;
  accent?: boolean;
}) => (
  <Box>
    <Typography
      sx={{
        color: COLORS.textSecondary,
        fontSize: "12px",
        fontWeight: 500,
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Box
      sx={{
        bgcolor: COLORS.bgPrimary,
        borderRadius: "8px",
        border: `1px solid ${accent ? COLORS.amber : COLORS.border}`,
        px: 1.5,
        py: 1.2,
        minHeight: rows > 1 ? rows * 22 : undefined,
      }}
    >
      {pairs ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {pairs.map(([rowLabel, rowValue]) => (
            <Box key={rowLabel} sx={{ display: "flex", gap: 2 }}>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "14px",
                  minWidth: 110,
                  flexShrink: 0,
                }}
              >
                {rowLabel}
              </Typography>
              <Typography sx={{ color: COLORS.textPrimary, fontSize: "14px" }}>
                {rowValue}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography
          sx={{
            color: value ? COLORS.textPrimary : COLORS.textMuted,
            fontSize: "14px",
            whiteSpace: "pre-wrap",
          }}
        >
          {value || "-"}
        </Typography>
      )}
    </Box>
  </Box>
);

const ActionDetailsDialog = ({
  open,
  actionId,
  subtitle,
  onClose,
}: {
  open: boolean;
  actionId: string | null;
  /* Optional context line, e.g. the audit event that led here. */
  subtitle?: string;
  onClose: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [action, setAction] = useState<ActionDetail | null>(null);

  useEffect(() => {
    if (!open || !actionId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      setAction(null);
      try {
        const response = await actionAPI.getById(actionId);
        if (cancelled) return;
        if (response?.success) {
          setAction(response.action);
        } else {
          setError("This action could not be loaded.");
        }
      } catch {
        // Most often the action was deleted after the event was recorded.
        if (!cancelled) {
          setError("This action no longer exists.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    // Guards against a slow response landing after the dialog is reopened
    // for a different action.
    return () => {
      cancelled = true;
    };
  }, [open, actionId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: COLORS.bgSecondary,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundImage: "none",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          px: 3,
          pt: 2,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Action Details
          </Typography>
          {subtitle && (
            <Typography sx={{ color: COLORS.textSecondary, fontSize: "12px" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: COLORS.textMuted, p: 0.5 }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} sx={{ color: COLORS.blue }} />
          </Box>
        ) : error ? (
          <Box
            sx={{
              bgcolor: "rgba(245, 158, 11, 0.12)",
              border: `1px solid ${COLORS.amber}`,
              borderRadius: "8px",
              px: 2,
              py: 1.5,
              mt: 1,
            }}
          >
            <Typography sx={{ color: COLORS.amber, fontSize: "13px" }}>
              {error}
            </Typography>
          </Box>
        ) : action ? (
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <ReadOnlyField
              label="Linked Activity"
              value={action.linkedActivity?.activityName}
            />
            <ReadOnlyField label="Action Title" value={action.title} />
            <ReadOnlyField
              label="Description"
              value={action.description}
              rows={3}
            />

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <ReadOnlyField label="Type" value={action.type} />
              <ReadOnlyField label="Priority" value={action.priority} />
            </Box>

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <ReadOnlyField label="Assignee" value={action.assignee?.name} />
              <ReadOnlyField
                label="Due Date"
                value={
                  action.dueDate
                    ? new Date(action.dueDate).toLocaleDateString("en-GB")
                    : undefined
                }
              />
            </Box>

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <ReadOnlyField label="Status" value={action.status} />
              <ReadOnlyField
                label="Owner"
                value={action.linkedActivityOwnerName || "Unassigned"}
              />
            </Box>

            {/* Evidence only exists for a PM Override. */}
            {action.status === "PM Override" && (
              <ReadOnlyField
                label="Evidence / Correspondence"
                accent
                rows={3}
                value={`${
                  action.overrideReason || "No reason recorded."
                }\n\nForce-closed by ${
                  action.overriddenBy?.name || "Unknown"
                } on ${formatStamp(action.overriddenAt)}`}
              />
            )}

            <ReadOnlyField
              label="Update History"
              pairs={
                action.updatedAt && action.updatedAt !== action.createdAt
                  ? [
                      ["Created", formatStamp(action.createdAt)],
                      ["Last updated", formatStamp(action.updatedAt)],
                    ]
                  : [["Created", formatStamp(action.createdAt)]]
              }
            />
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ActionDetailsDialog;
