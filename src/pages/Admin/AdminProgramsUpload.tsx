import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Dialog,
  IconButton,
} from "@mui/material";
import {
  WarningAmberOutlined as WarningIcon,
  CalendarTodayOutlined as CalendarIcon,
  AccessTimeOutlined as TimeIcon,
  DescriptionOutlined as FileIcon,
  StorageOutlined as StorageIcon,
  LockOutlined as LockIcon,
  VisibilityOutlined as ViewIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import AdminLayout from "../../layouts/AdminLayout";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import uploadIcon from "../../assets/sidebar/upload.png";
import pdfIcon from "../../assets/pdf.png";

interface UploadedFile {
  version: string;
  fileName: string;
  uploadedBy: string;
  date: string;
  status: string;
  activities: number;
  fileUrl: string;
}

const AdminProgramsUpload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadedFile[]>([]);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const getUserName = () => {
    if (user?.email) {
      const namePart = user.email.split("@")[0];
      const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      return capitalized;
    }
    return "Unknown";
  };

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

  const handleFileUpload = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const versionNum = uploadHistory.length + 1;
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newUpload: UploadedFile = {
      version: `v${versionNum}`,
      fileName: file.name,
      uploadedBy: getUserName(),
      date: dateStr,
      status: "Processed",
      activities: Math.floor(Math.random() * 20) + 40,
      fileUrl: fileUrl,
    };

    setUploadHistory((prev) => [newUpload, ...prev]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleViewPdf = (fileUrl: string) => {
    setViewingPdf(fileUrl);
  };

  const handleClosePdfViewer = () => {
    setViewingPdf(null);
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

        <Card
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
        </Card>

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
            onClick={handleBrowseClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
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
              cursor: "pointer",
              transition: "all 0.2s ease",
              bgcolor: isDragOver ? `${COLORS.blue}08` : "transparent",
              "&:hover": {
                borderColor: COLORS.blue,
                bgcolor: `${COLORS.blue}08`,
              },
            }}
          >
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <FileIcon sx={{ color: COLORS.textMuted, fontSize: 16 }} />
                <Typography sx={{ color: COLORS.textMuted, fontSize: "12px" }}>
                  PDF formate
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <StorageIcon sx={{ color: COLORS.textMuted, fontSize: 16 }} />
                <Typography sx={{ color: COLORS.textMuted, fontSize: "12px" }}>
                  Max 50 MB
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <LockIcon sx={{ color: COLORS.textMuted, fontSize: 16 }} />
                <Typography sx={{ color: COLORS.textMuted, fontSize: "12px" }}>
                  Encrypted upload
                </Typography>
              </Box>
            </Box>
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
                    key={index}
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
      </Box>
    </AdminLayout>
  );
};

export default AdminProgramsUpload;
