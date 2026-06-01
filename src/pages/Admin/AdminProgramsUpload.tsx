import { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  DescriptionOutlined as FileIcon,
  StorageOutlined as StorageIcon,
  LockOutlined as LockIcon,
  VisibilityOutlined as ViewIcon,
  Close as CloseIcon,
  CalendarToday as CalendarTodayIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { programmeAPI, projectAPI } from "../../services/api";
import uploadIcon from "../../assets/sidebar/upload.png";
import pdfIcon from "../../assets/pdf.png";

interface UploadedFile {
  _id: string;
  version: string;
  fileName: string;
  uploadedBy: string;
  date: string;
  status: string;
  activities: number;
  fileUrl?: string;
}

interface FieldErrors {
  name?: string;
  phase?: string;
  startDate?: string;
}

const AdminProgramsUpload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadedFile[]>([]);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Create Project Modal State
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [uploadedProgrammeId, setUploadedProgrammeId] = useState<string | null>(
    null,
  );
  const [uploadedProgrammeName, setUploadedProgrammeName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [phase, setPhase] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const getUserName = () => {
    if (user?.email) {
      const namePart = user.email.split("@")[0];
      const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      return capitalized;
    }
    return "Unknown";
  };

  // Fetch upload history on mount
  useEffect(() => {
    const fetchUploadHistory = async () => {
      try {
        const response = await programmeAPI.getAll();
        if (response.success && response.programmes) {
          const history: UploadedFile[] = response.programmes.map(
            (
              prog: {
                _id: string;
                name: string;
                originalFileName?: string;
                uploadedBy?: { name: string };
                createdAt: string;
                cycleStatus?: string;
                totalActivities?: number;
                fileUrl?: string;
              },
              index: number,
            ) => {
              const date = new Date(prog.createdAt);
              const dateStr = date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return {
                _id: prog._id,
                version: `v${response.programmes.length - index}`,
                fileName: prog.originalFileName || prog.name,
                uploadedBy: prog.uploadedBy?.name || "Admin",
                date: dateStr,
                status: prog.cycleStatus || "Processed",
                activities: prog.totalActivities || 0,
                fileUrl: prog.fileUrl,
              };
            },
          );
          setUploadHistory(history);
        }
      } catch (error) {
        console.error("Failed to fetch upload history:", error);
      }
    };

    fetchUploadHistory();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      handleFileUpload(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // Use the file name without extension as the programme name
      const programmeName = file.name.replace(/\.pdf$/i, "");

      // Upload the programme without linking to a project
      const response = await programmeAPI.upload(file, programmeName);

      if (response.success && response.programme) {
        const programme = response.programme;
        const versionNum = uploadHistory.length + 1;
        const today = new Date();
        const dateStr = today.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const newUpload: UploadedFile = {
          _id: programme._id,
          version: `v${versionNum}`,
          fileName: programme.originalFileName || file.name,
          uploadedBy: getUserName(),
          date: dateStr,
          status: "Processed",
          activities: programme.totalActivities || 0,
          fileUrl: URL.createObjectURL(file),
        };

        setUploadHistory((prev) => [newUpload, ...prev]);

        // Store the uploaded programme info and show the Create Project modal
        setUploadedProgrammeId(programme._id);
        setUploadedProgrammeName(programmeName);
        setCreateProjectModalOpen(true);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleViewPdf = (fileUrl: string | undefined) => {
    if (fileUrl) {
      setViewingPdf(fileUrl);
    }
  };

  const handleClosePdfViewer = () => {
    setViewingPdf(null);
  };

  const handleCloseCreateProjectModal = () => {
    setCreateProjectModalOpen(false);
    setUploadedProgrammeId(null);
    setUploadedProgrammeName("");
    setProjectName("");
    setPhase("");
    setDescription("");
    setStartDate("");
    setFieldErrors({});
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCreateProject = async () => {
    setFieldErrors({});
    setIsCreatingProject(true);

    try {
      // Create the project
      const response = await projectAPI.create({
        name: projectName,
        phase,
        startDate,
        description: description || undefined,
      });

      if (response.success && response.project) {
        // Link the programme to the newly created project
        if (uploadedProgrammeId) {
          await programmeAPI.linkToProject(
            uploadedProgrammeId,
            response.project._id,
          );
        }

        handleCloseCreateProjectModal();
      }
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: { errors?: { field: string; message: string }[] };
        };
      };
      if (err.response?.data?.errors) {
        const errors: FieldErrors = {};
        err.response.data.errors.forEach((e) => {
          if (e.field === "name") errors.name = e.message;
          if (e.field === "phase") errors.phase = e.message;
          if (e.field === "startDate") errors.startDate = e.message;
        });
        setFieldErrors(errors);
      }
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <AdminLayout title="Programs Upload" subtitle="Upload master schedule PDF">
      <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf"
          onChange={handleInputChange}
          style={{ display: "none" }}
        />

        {/* <Card
          sx={{
            bgcolor: "transparent",
            border: `1px solid ${COLORS.amber}`,
            borderRadius: "12px",
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "flex-start" },
            gap: { xs: 1.5, md: 2 },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: `${COLORS.amber}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <WarningIcon sx={{ color: COLORS.amber, fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                color: COLORS.amber,
                fontSize: { xs: "14px", sm: "15px" },
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Active Cycle in Progress
            </Typography>
            <Typography
              sx={{
                color: COLORS.textSecondary,
                fontSize: { xs: "12px", sm: "13px" },
                mb: 1.5,
                lineHeight: 1.5,
              }}
            >
              Week 24 cycle is currently open. Uploading a new programme will
              overwrite the current version for this cycle. To start a fresh
              cycle, close the current one first from the{" "}
              <Box
                component="span"
                sx={{ color: COLORS.amber, cursor: "pointer" }}
              >
                Weekly Dashboard
              </Box>
              .
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2.5 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <CalendarIcon sx={{ color: COLORS.textMuted, fontSize: 16 }} />
                <Typography sx={{ color: COLORS.textMuted, fontSize: "12px" }}>
                  Opened Mon 23 Mar
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <TimeIcon sx={{ color: COLORS.textMuted, fontSize: 16 }} />
                <Typography sx={{ color: COLORS.textMuted, fontSize: "12px" }}>
                  Opened Mon 23 Mar
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: `${COLORS.amber}20`,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: COLORS.amber,
                  }}
                />
                <Typography
                  sx={{
                    color: COLORS.amber,
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  In Progress
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card> */}

        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            p: { xs: 2, sm: 3 },
            mb: 3,
          }}
        >
          <Typography
            sx={{
              color: COLORS.textPrimary,
              fontSize: { xs: "14px", sm: "16px" },
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            Upload Programs PDF
          </Typography>
          <Typography
            sx={{
              color: COLORS.textMuted,
              fontSize: { xs: "12px", sm: "13px" },
              mb: 2.5,
            }}
          >
            Accepted format: PDF only · Maximum file size: 50 MB
          </Typography>

          <Box
            onClick={!isUploading ? handleBrowseClick : undefined}
            onDrop={!isUploading ? handleDrop : undefined}
            onDragOver={!isUploading ? handleDragOver : undefined}
            onDragLeave={handleDragLeave}
            sx={{
              border: `1px dashed ${isDragOver ? COLORS.blue : COLORS.border}`,
              borderRadius: "12px",
              py: { xs: 5, sm: 6 },
              px: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: isUploading ? "default" : "pointer",
              transition: "all 0.2s ease",
              bgcolor: isDragOver ? `${COLORS.blue}08` : "transparent",
              opacity: isUploading ? 0.7 : 1,
              "&:hover": !isUploading
                ? {
                    borderColor: COLORS.blue,
                    bgcolor: `${COLORS.blue}08`,
                  }
                : {},
            }}
          >
            {isUploading ? (
              <>
                <CircularProgress
                  size={48}
                  sx={{ color: COLORS.blue, mb: 2 }}
                />
                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: { xs: "14px", sm: "16px" },
                    fontWeight: 500,
                  }}
                >
                  Uploading and processing...
                </Typography>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: { xs: 56, sm: 72 },
                    height: { xs: 56, sm: 72 },
                    borderRadius: "16px",
                    bgcolor: COLORS.blueBgMedium,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Box
                    component="img"
                    src={uploadIcon}
                    sx={{
                      width: { xs: 28, sm: 36 },
                      height: { xs: 28, sm: 36 },
                      filter:
                        "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1752%) hue-rotate(199deg) brightness(101%) contrast(96%)",
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    color: COLORS.textPrimary,
                    fontSize: { xs: "14px", sm: "16px" },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Drop your PDF here
                </Typography>
                <Typography
                  sx={{
                    color: COLORS.textMuted,
                    fontSize: { xs: "12px", sm: "13px" },
                    mb: 2.5,
                  }}
                >
                  or{" "}
                  <Box component="span" sx={{ color: COLORS.blue }}>
                    Click to browse
                  </Box>
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: { xs: 2, sm: 3 },
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <FileIcon sx={{ color: COLORS.textMuted, fontSize: 16 }} />
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "12px" }}
                    >
                      PDF format
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <StorageIcon
                      sx={{ color: COLORS.textMuted, fontSize: 16 }}
                    />
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "12px" }}
                    >
                      Max 50 MB
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <LockIcon sx={{ color: COLORS.textMuted, fontSize: 16 }} />
                    <Typography
                      sx={{ color: COLORS.textMuted, fontSize: "12px" }}
                    >
                      Encrypted upload
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Card>

        <Card
          sx={{
            bgcolor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.textPrimary,
                  fontSize: { xs: "14px", sm: "16px" },
                  fontWeight: 600,
                  mb: 0.25,
                }}
              >
                Upload History
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: { xs: "11px", sm: "13px" },
                }}
              >
                Recent programme uploads and processing status
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: COLORS.darkBlack,
                px: 2,
                py: 0.75,
                borderRadius: "8px",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {uploadHistory.length} uploads
              </Typography>
            </Box>
          </Box>

          {uploadHistory.length === 0 ? (
            <Box
              sx={{
                py: 6,
                px: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              <Typography
                sx={{
                  color: COLORS.textMuted,
                  fontSize: "14px",
                }}
              >
                No uploads yet. Upload a PDF to get started.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 800 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "80px 1fr 120px 120px 100px 100px 80px",
                    gap: 2,
                    px: 3,
                    py: 1.5,
                    borderTop: `1px solid ${COLORS.border}`,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  {[
                    "VERSION",
                    "FILE NAME",
                    "UPLOADED BY",
                    "DATE",
                    "STATUS",
                    "ACTIVITIES",
                    "ACTIONS",
                  ].map((header) => (
                    <Typography
                      key={header}
                      sx={{
                        color: COLORS.textMuted,
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {header}
                    </Typography>
                  ))}
                </Box>

                {uploadHistory.map((item, index) => (
                  <Box
                    key={item._id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "80px 1fr 120px 120px 100px 100px 80px",
                      gap: 2,
                      px: 3,
                      py: 2,
                      borderBottom:
                        index < uploadHistory.length - 1
                          ? `1px solid ${COLORS.border}`
                          : "none",
                      alignItems: "center",
                      "&:hover": { bgcolor: COLORS.bgTertiary },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: COLORS.green,
                        }}
                      />
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {item.version}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        component="img"
                        src={pdfIcon}
                        sx={{
                          width: "9.33px",
                          height: "12px",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          color: COLORS.textPrimary,
                          fontSize: "13px",
                        }}
                      >
                        {item.fileName}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "13px",
                      }}
                    >
                      {item.uploadedBy}
                    </Typography>

                    <Typography
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: "13px",
                      }}
                    >
                      {item.date}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        bgcolor: `${COLORS.green}20`,
                        px: 1,
                        py: 0.5,
                        borderRadius: "20px",
                        width: "fit-content",
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: COLORS.green,
                        }}
                      />
                      <Typography
                        sx={{
                          color: COLORS.green,
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {item.status}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        color: COLORS.textPrimary,
                        fontSize: "13px",
                      }}
                    >
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {item.activities}
                      </Box>{" "}
                      extracted
                    </Typography>

                    <Button
                      startIcon={<ViewIcon sx={{ fontSize: 14 }} />}
                      onClick={() => handleViewPdf(item.fileUrl)}
                      sx={{
                        color: COLORS.blue,
                        fontSize: "12px",
                        fontWeight: 500,
                        textTransform: "none",
                        p: 0,
                        minWidth: "auto",
                        "&:hover": { bgcolor: "transparent" },
                      }}
                    >
                      View
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Card>

        {/* PDF Viewer Dialog */}
        <Dialog
          open={!!viewingPdf}
          onClose={handleClosePdfViewer}
          maxWidth="lg"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                bgcolor: COLORS.bgPrimary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                height: "90vh",
              },
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <Typography
              sx={{
                color: COLORS.textPrimary,
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              PDF Viewer
            </Typography>
            <IconButton
              onClick={handleClosePdfViewer}
              sx={{ color: COLORS.textSecondary }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, height: "calc(100% - 60px)" }}>
            {viewingPdf && (
              <iframe
                src={viewingPdf}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                title="PDF Viewer"
              />
            )}
          </Box>
        </Dialog>

        {/* Create Project Modal */}
        <Dialog
          open={createProjectModalOpen}
          onClose={handleCloseCreateProjectModal}
          maxWidth="sm"
          fullWidth
          slotProps={{
            backdrop: {
              sx: {
                bgcolor: "rgba(0, 0, 0, 0.8)",
              },
            },
            paper: {
              sx: {
                bgcolor: COLORS.bgSecondary,
                border: `1px solid ${COLORS.white}`,
                borderRadius: "12px",
                backgroundImage: "none",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                maxWidth: 480,
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 1,
              pt: 1,
              borderBottom: `1px solid ${COLORS.white}`,
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
                Create Project
              </Typography>
              <Typography
                sx={{
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontWeight: 400,
                }}
              >
                Link "{uploadedProgrammeName}" to a new project
              </Typography>
            </Box>
            <IconButton
              onClick={handleCloseCreateProjectModal}
              sx={{ color: COLORS.textMuted, mr: -1, p: 0.5 }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                    mt: 2,
                  }}
                >
                  Project Name <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. Crossrail Phase 3"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    clearFieldError("name");
                  }}
                  error={!!fieldErrors.name}
                  helperText={fieldErrors.name || "\u00A0"}
                  disabled={isCreatingProject}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& fieldset": {
                        borderColor: fieldErrors.name
                          ? COLORS.red
                          : COLORS.white,
                      },
                      "&:hover fieldset": {
                        borderColor: fieldErrors.name
                          ? COLORS.red
                          : COLORS.white,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: fieldErrors.name
                          ? COLORS.red
                          : COLORS.white,
                        borderWidth: 1,
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      py: 1.2,
                      "&::placeholder": {
                        color: COLORS.textMuted,
                        opacity: 1,
                      },
                    },
                    "& .MuiFormHelperText-root": {
                      color: COLORS.red,
                      marginLeft: 0,
                      marginTop: "4px",
                      fontSize: "12px",
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                    mt: 2,
                  }}
                >
                  Phase <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <Select
                  fullWidth
                  value={phase}
                  onChange={(e) => {
                    setPhase(e.target.value);
                    clearFieldError("phase");
                  }}
                  displayEmpty
                  error={!!fieldErrors.phase}
                  disabled={isCreatingProject}
                  sx={{
                    bgcolor: COLORS.bgPrimary,
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: fieldErrors.phase
                        ? COLORS.red
                        : COLORS.white,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: fieldErrors.phase
                        ? COLORS.red
                        : COLORS.white,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: fieldErrors.phase
                        ? COLORS.red
                        : COLORS.white,
                      borderWidth: 1,
                    },
                    "& .MuiSelect-select": {
                      color: phase ? COLORS.textPrimary : COLORS.textMuted,
                      fontSize: "14px",
                      py: 1.2,
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
                          border: `1px solid ${COLORS.borderLight}`,
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
                  <MenuItem value="" disabled>
                    Select phase
                  </MenuItem>
                  <MenuItem value="Planning">Planning</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Pre-Construction">Pre-Construction</MenuItem>
                  <MenuItem value="Construction">Construction</MenuItem>
                  <MenuItem value="Commissioning">Commissioning</MenuItem>
                  <MenuItem value="Handover">Handover</MenuItem>
                </Select>
                {fieldErrors.phase && (
                  <Typography
                    sx={{
                      color: COLORS.red,
                      fontSize: "12px",
                      mt: 0.5,
                    }}
                  >
                    {fieldErrors.phase}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                    mt: 2,
                  }}
                >
                  Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Brief description of the project scope and objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isCreatingProject}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& fieldset": {
                        borderColor: COLORS.white,
                      },
                      "&:hover fieldset": {
                        borderColor: COLORS.white,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: COLORS.white,
                        borderWidth: 1,
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: COLORS.textPrimary,
                      fontSize: "14px",
                      "&::placeholder": {
                        color: COLORS.textMuted,
                        opacity: 1,
                      },
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.border,
                    fontSize: "12px",
                    fontWeight: 500,
                    mb: 0.5,
                    mt: 2,
                  }}
                >
                  Start Date <span style={{ color: COLORS.red }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    clearFieldError("startDate");
                  }}
                  placeholder="mm/dd/yyyy"
                  error={!!fieldErrors.startDate}
                  helperText={fieldErrors.startDate || "\u00A0"}
                  disabled={isCreatingProject}
                  slotProps={{
                    htmlInput: {
                      min: new Date().toISOString().split("T")[0],
                    },
                    input: {
                      endAdornment: (
                        <InputAdornment
                          position="end"
                          sx={{ cursor: "pointer" }}
                          onClick={(e) => {
                            const input =
                              e.currentTarget.parentElement?.querySelector(
                                "input",
                              ) as HTMLInputElement;
                            if (input) {
                              input.showPicker?.();
                              input.focus();
                            }
                          }}
                        >
                          <CalendarTodayIcon
                            sx={{ color: COLORS.textSecondary, fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: COLORS.bgPrimary,
                      borderRadius: "8px",
                      "& fieldset": {
                        borderColor: fieldErrors.startDate
                          ? COLORS.red
                          : COLORS.border,
                      },
                      "&:hover fieldset": {
                        borderColor: fieldErrors.startDate
                          ? COLORS.red
                          : COLORS.border,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: fieldErrors.startDate
                          ? COLORS.red
                          : COLORS.border,
                        borderWidth: 1,
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: startDate ? COLORS.textPrimary : COLORS.textMuted,
                      fontSize: "14px",
                      py: 1.2,
                      clipPath: "inset(0 40px 0 0)",
                      "&::-webkit-date-and-time-value": {
                        textAlign: "left",
                      },
                      "&::-webkit-calendar-picker-indicator": {
                        display: "none",
                        WebkitAppearance: "none",
                      },
                      "&::-webkit-inner-spin-button": {
                        display: "none",
                      },
                      "&::-webkit-clear-button": {
                        display: "none",
                      },
                    },
                    "& .MuiFormHelperText-root": {
                      color: COLORS.red,
                      marginLeft: 0,
                      marginTop: "4px",
                      fontSize: "12px",
                    },
                  }}
                />
              </Box>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: `1px solid ${COLORS.white}`,
              gap: 1.5,
            }}
          >
            <Button
              onClick={handleCloseCreateProjectModal}
              disabled={isCreatingProject}
              sx={{
                color: COLORS.white,
                bgcolor: COLORS.bgPrimary,
                border: `1px solid ${COLORS.white}`,
                borderRadius: "8px",
                textTransform: "none",
                px: 2,
                py: 1,
                fontSize: "14px",
                fontWeight: 400,
                "&:hover": {
                  bgcolor: COLORS.bgTertiary,
                },
                "&.Mui-disabled": {
                  color: COLORS.textMuted,
                  borderColor: COLORS.border,
                },
              }}
            >
              Skip
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={isCreatingProject}
              sx={{
                color: COLORS.white,
                bgcolor: COLORS.blue,
                borderRadius: "8px",
                textTransform: "none",
                px: 2,
                py: 1,
                fontSize: "14px",
                fontWeight: 500,
                minWidth: 120,
                "&:hover": {
                  bgcolor: COLORS.blueHover,
                },
                "&.Mui-disabled": {
                  bgcolor: COLORS.blueDisabled,
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              {isCreatingProject ? (
                <CircularProgress size={20} sx={{ color: COLORS.white }} />
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default AdminProgramsUpload;
