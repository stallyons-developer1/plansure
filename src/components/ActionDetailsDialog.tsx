import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Button,
  TextField,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { COLORS } from "../constants/colors";
import { actionAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

/*
 * View of a single action, in the same field order as the Edit Action dialog.
 * Shared by the Audit Logs event list and the Activities & Lookahead table so
 * both show the record identically.
 *
 * Pass allowComplete to let the owner close it from here. That is how a User
 * completes their own work: they have no Actions tab of their own, and the
 * server has always permitted the assignee to close an action whatever their
 * role — only the screens were missing the control.
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
  completionNote?: string;
  overrideReason?: string;
  overriddenAt?: string;
  overriddenBy?: { name?: string };
  assignee?: { _id?: string; name?: string };
  createdBy?: { _id?: string; name?: string };
  isFromClosedWeek?: boolean;
  linkedActivity?: { activityId?: string; activityName?: string };
  linkedActivityOwnerName?: string;
}

/* "Aug 19, 2026 03:00 PM" — matches the workspace dialogs. */
const formatStamp = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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
  allowComplete = false,
  onCompleted,
  onClose,
}: {
  open: boolean;
  actionId: string | null;
  /* Optional context line, e.g. the audit event that led here. */
  subtitle?: string;
  /* Off by default so the Audit Logs view stays a record, not a control. */
  allowComplete?: boolean;
  onCompleted?: () => void;
  onClose: () => void;
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [action, setAction] = useState<ActionDetail | null>(null);
  const [note, setNote] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");

  /* Mirrors the server's test — the person it was given to, or the person who
     raised it; an admin may close any action — so the button only appears when
     it will work. The server stays the authority: a closed week or a PM
     Override is refused there, and the reason is shown below. */
  const isOwner =
    !!user &&
    (action?.assignee?._id === user.id || action?.createdBy?._id === user.id);
  const canComplete =
    allowComplete &&
    !!action &&
    action.status !== "Completed" &&
    action.status !== "PM Override" &&
    !action.isFromClosedWeek &&
    (isOwner || user?.role === "admin");

  const handleComplete = async () => {
    if (!actionId) return;
    setCompleting(true);
    setCompleteError("");
    try {
      const response = await actionAPI.complete(actionId, note);
      if (response?.success) {
        onCompleted?.();
        onClose();
      } else {
        setCompleteError("This action could not be completed.");
      }
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "This action could not be completed.";
      setCompleteError(message);
    } finally {
      setCompleting(false);
    }
  };

  useEffect(() => {
    if (!open || !actionId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      setAction(null);
      setNote("");
      setCompleteError("");
      try {
        const response = await actionAPI.getById(actionId);
        if (cancelled) return;
        if (response?.success) {
          setAction(response.action);
        } else {
          setError("This action could not be loaded.");
        }
      } catch (err) {
        if (!cancelled) {
          /* A refused request is not a missing one. Saying "no longer exists"
             for a 403 sent people looking for a deleted record that was
             sitting right there in the list. */
          const status = (err as { response?: { status?: number } })?.response
            ?.status;
          setError(
            status === 403
              ? "You do not have access to this action."
              : "This action no longer exists.",
          );
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

            {/* Optional note captured when the action was completed. Shown
                always so its absence is explicit rather than ambiguous. */}
            <ReadOnlyField
              label="Completion Reason"
              value={action.completionNote}
              rows={2}
            />

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
            {canComplete && (
              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Completion Note
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What was done, and what evidence supports it?"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& fieldset": { borderColor: COLORS.white },
                      "&:hover fieldset": { borderColor: COLORS.textMuted },
                      "&.Mui-focused fieldset": { borderColor: COLORS.blue },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                    },
                  }}
                />
                {completeError && (
                  <Typography
                    sx={{ color: "#ef4444", fontSize: "13px", mt: 1 }}
                  >
                    {completeError}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>
      {canComplete && (
        <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
          <Button
            onClick={onClose}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.bgPrimary,
              border: `1px solid ${COLORS.white}`,
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 1,
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": { bgcolor: COLORS.bgTertiary },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={completing}
            sx={{
              color: COLORS.white,
              bgcolor: COLORS.green,
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 1,
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": { bgcolor: "#16a34a" },
              "&.Mui-disabled": { bgcolor: COLORS.green, opacity: 0.7 },
            }}
          >
            {completing ? (
              <CircularProgress size={20} sx={{ color: COLORS.white }} />
            ) : (
              "Mark as Complete"
            )}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ActionDetailsDialog;
